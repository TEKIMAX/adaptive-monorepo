"use node";
import { v } from "convex/values";
import { action, internalAction, ActionCtx } from "./_generated/server";
import { Type } from "@google/genai";
import { api, internal, components } from "./_generated/api";

import { callOllama, callOllamaInternal } from "./ollamaService";



export const chat = action({
    args: {
        prompt: v.union(v.string(), v.array(v.any())),
        systemInstruction: v.optional(v.string()),
        responseMimeType: v.optional(v.string()),
        responseSchema: v.optional(v.any()),
        tools: v.optional(v.any()),
        modelName: v.optional(v.string()),
        provider: v.optional(v.string()),
        ollamaApiKey: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const modelName = args.modelName || "gemini-3-flash-preview";
        const systemInstruction = args.systemInstruction || SYSTEM_INSTRUCTION;

        return await callAI(
            ctx,
            args.prompt,
            systemInstruction,
            args.responseMimeType,
            args.responseSchema,
            0,
            args.tools || [],
            modelName,
            args.ollamaApiKey
        );
    }
});

export const getModelPricing = action({
    args: {
        provider: v.optional(v.string()),
        query: v.optional(v.string()),
        limit: v.optional(v.number()),
        offset: v.optional(v.number()),
        requires_image_input: v.optional(v.boolean()),
        requires_tool_call: v.optional(v.boolean())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        try {
            const response = await fetch('https://api.tekimax.com/api/adaptive/model-pricing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: args.provider,
                    query: args.query,
                    limit: args.limit || 60,
                    offset: args.offset || 0,
                    requires_image_input: args.requires_image_input,
                    requires_tool_call: args.requires_tool_call
                })
            });

            if (!response.ok) {
                throw new Error(`API returned ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error: any) {
            console.error("Model Pricing API Error:", error);
            throw new Error(`Failed to fetch model pricing: ${error.message}`);
        }
    }
});

const SYSTEM_INSTRUCTION = `You are an expert startup consultant and venture capitalist. 
Your goal is to help founders refine their business models using the Lean Canvas framework and create compelling pitch decks.
Be concise, punchy, and professional. Always use Markdown for formatting (bullet points, bold text, etc.) to ensure readability.`;

// Helper to construct adaptive system instruction
const getSystemInstructionWithContext = async (ctx: ActionCtx, baseInstruction: string) => {
    try {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return baseInstruction;

        // Fetch Profile from Component
        const profile = await ctx.runQuery(components.adaptive_learning.public.getProfile, {
            userId: identity.subject
        });

        if (!profile) return baseInstruction;

        // 1. Governance Check: If adaptive mode is APPROVED and enabled, use the override.
        if (profile.isAdaptiveEnabled && profile.adaptiveSystemInstruction) {
            return profile.adaptiveSystemInstruction;
        }

        // 2. Otherwise, fall back to "Platform Context Injection" (Level 1 Adaptability)
        let adaptiveContext = "";

        adaptiveContext += `\n\n[ADAPTIVE CONTEXT - FOUNDER PROFILE]\n`;
        if (profile.riskTolerance) adaptiveContext += `- Risk Tolerance: ${profile.riskTolerance}\n`;
        if (profile.communicationStyle) adaptiveContext += `- Communication Style: ${profile.communicationStyle}\n`;
        if (profile.learningStyle) adaptiveContext += `- Learning Style: ${profile.learningStyle}\n`;

        // Inject Feedback Loop Corrections (Fetch from Component)
        const negativeFeedback = await ctx.runQuery(components.adaptive_learning.public.getNegativeFeedback, {
            userId: identity.subject,
            limit: 5
        });

        if (negativeFeedback && negativeFeedback.length > 0) {
            adaptiveContext += `\n[CRITICAL FEEDBACK HISTORY - AVOID THESE MISTAKES]\n`;
            negativeFeedback.forEach((fb: any) => {
                if (fb.comment && fb.rating <= 3) {
                    adaptiveContext += `- User gave ${fb.rating}/5 stars on '${fb.targetType}'. Reason: "${fb.comment}". AVOID repeating this.\n`;
                }
            });
        }

        // Return combined instruction
        if (adaptiveContext) {
            return `${baseInstruction}${adaptiveContext}\n[INSTRUCTION]\nAdapt your response style based on the founder profile above.`;
        }

        return baseInstruction;
    } catch (e) {
        console.error("Failed to inject context:", e);
        return baseInstruction;
    }
};

// Helper for delay
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));



const callAI = async (
    ctx: ActionCtx,
    prompt: string | { role: string, parts: any[] }[],
    systemInstruction: string,
    responseMimeType?: string,
    responseSchema?: any,
    retryCount = 0,
    tools: any[] = [],
    modelName: string = "gemini-3-flash-preview", // Updated default
    ollamaApiKey?: string
): Promise<string> => {
    try {
        // 1. Check Limits
        const limit = await ctx.runQuery(api.usage.checkLimit, {});
        if (!limit.allowed) {
            throw new Error(limit.reason);
        }

        // All calls route through Ollama Service / Tekimax Proxy
        try {
            // Determine format
            // If responseSchema is provided, use it (Structured Outputs)
            // Otherwise if responseMimeType is json, pass "json"
            const format = responseSchema ? responseSchema : ((responseMimeType?.includes('json')) ? "json" : undefined);

            const responseText = await callOllamaInternal(
                modelName,
                prompt,
                systemInstruction,
                format,
                ollamaApiKey,
                tools
            );

            // Track usage (mock tokens for now)
            await ctx.runMutation(api.usage.trackUsage, {
                model: modelName,
                tokens: 0
            }).catch(err => console.error("Failed to track usage:", err));

            return responseText;
        } catch (error) {
            console.error("Cloud AI Call Failed:", error);
            throw error;
        }
    } catch (error: any) {
        const errorCode = error.status || error.code || error?.error?.code;
        const errorMessage = error.message || JSON.stringify(error);

        const isRetryable =
            errorCode === 429 ||
            errorCode === 503 ||
            errorCode === 'RESOURCE_EXHAUSTED' ||
            errorCode === 'UNAVAILABLE' ||
            errorMessage.includes('429') ||
            errorMessage.includes('503') ||
            errorMessage.includes('quota') ||
            errorMessage.includes('overloaded') ||
            errorMessage.includes('RESOURCE_EXHAUSTED') ||
            errorMessage.includes('UNAVAILABLE');

        if (isRetryable && retryCount < 3) {
            const delay = Math.pow(2, retryCount + 1) * 1000 + Math.random() * 1000;
            console.warn(`AI Error (${errorCode}). Retrying in ${Math.round(delay)}ms...`);
            await wait(delay);
            return callAI(ctx, prompt, systemInstruction, responseMimeType, responseSchema, retryCount + 1, tools, modelName);
        }

        console.error("AI Service Error:", error);
        throw error;
    }
};

export const suggestCanvasSection = action({
    args: {
        section: v.string(),
        startupName: v.string(),
        hypothesis: v.string(),
        canvasContext: v.string(), // JSON string of canvas
        modelName: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const prompt = `
        Based on the startup idea below, provide 3-4 professional bullet points for the "${args.section}" section of a Lean Canvas.
        
        Startup Name: ${args.startupName}
        Initial Hypothesis/Idea: ${args.hypothesis}
        
        Context from other sections (if available):
        ${args.canvasContext}
        
        IMPORTANT:
        - Return the content in clean Markdown format.
        - Use bullet points (*) for lists.
        - Do NOT include any introductory or concluding text.
        - Return ONLY the generated content.
        `;

        // Use the requested model or default to the standard working model
        return callAI(ctx, prompt, SYSTEM_INSTRUCTION, undefined, undefined, 0, [], args.modelName || "gemini-3-flash-preview");
    }
});

export const generatePitchDeck = action({
    args: {
        startupData: v.any(), // Passing full object for simplicity, or we can pass JSON string
        modelName: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const data = args.startupData;

        // Include financial data in the prompt context
        const financialContext = `
            Financial Model:
            - Type: ${data.revenueModel.businessModelType}
            - Revenue Streams: ${data.revenueModel.revenueStreams.map((s: any) => s.name + " ($" + s.price + ")").join(", ")}
            - Cost Structure: ${data.revenueModel.costStructure.map((c: any) => c.name + " ($" + c.amount + ")").join(", ")}
            - Key Metrics: Growth ${data.revenueModel.monthlyGrowthRate}%, Churn ${data.revenueModel.churnRate}%, CAC $${data.revenueModel.cac}
        `;

        // Include Market Data
        const marketContext = `
            Market Research:
            - TAM (Total Addressable Market): ${data.market.tam}
            - SAM (Serviceable Available Market): ${data.market.sam}
            - SOM (Serviceable Obtainable Market): ${data.market.som}
        `;

        // Include Competitor Data
        const competitorContext = `
            Competitor Analysis:
            - Competitors: ${data.competitorAnalysis.competitors.map((c: any) => c.name).join(', ')}
            - Differentiation/Summary: ${data.competitorAnalysis.analysisSummary}
        `;

        const prompt = `
            Create a professional 10-slide pitch deck for the following startup.
            Use all provided context to make it specific and data-driven.
        
            Startup Name: ${data.name}
            Hypothesis: ${data.hypothesis}
            
            DATA SOURCES:
            Lean Canvas: ${JSON.stringify(data.canvas)}
            ${financialContext}
            ${marketContext}
            ${competitorContext}
            
            Return a valid JSON array of objects. Each object should have:
            - id: string (unique)
            - title: string (slide headline)
            - content: string (bullet points or main text, formatted with Markdown)
            - notes: string (speaker notes)
            - imagePrompt: string (a description of a visual to accompany this slide)
            
            SLIDE STRUCTURE:
            1. Title Slide
            2. Problem (Use Canvas data)
            3. Solution (Use Canvas data)
            4. Market Size (Use TAM/SAM/SOM from Market Research)
            5. Competition (Use Competitor Analysis)
            6. Business Model (Use Financial/Revenue data)
            7. Go-To-Market (Use Channels from Canvas)
            8. Traction/Roadmap
            9. Team (Placeholder)
            10. The Ask / Financial Projections
        
            IMPORTANT: The response MUST be a raw JSON array. Do not wrap in markdown code blocks.
        `;

        try {
            const text = await callAI(ctx, prompt, SYSTEM_INSTRUCTION, "application/json",
                {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            title: { type: Type.STRING },
                            content: { type: Type.STRING },
                            notes: { type: Type.STRING },
                            imagePrompt: { type: Type.STRING },
                        },
                        required: ["id", "title", "content", "notes"],
                    },
                },
                0, [], args.modelName
            );

            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanText);
        } catch (error) {
            console.error("Error generating deck:", error);
            return [];
        }
    }
});

export const analyzeRevenueModel = action({
    args: {
        startupData: v.any(),
        modelName: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const data = args.startupData;
        const prompt = `
          Analyze the financial projections for this startup.
          
          Startup: ${data.name}
          Business Model: ${data.revenueModel.businessModelType}
          Revenue Streams: ${JSON.stringify(data.revenueModel.revenueStreams)}
          Cost Structure: ${JSON.stringify(data.revenueModel.costStructure)}
          Metrics: Growth ${data.revenueModel.monthlyGrowthRate}%, Churn ${data.revenueModel.churnRate}%, CAC $${data.revenueModel.cac}.
          
          Provide a 2-sentence summary of the financial health and 1 key recommendation.
          Focus on when they might become profitable or if the burn rate is sustainable.

          CRITICAL: Wrap all key metrics (dollar amounts like $1000, percentages like 15%, and terms like "growth" or "churn" when they refer to rates) in **bold markdown** so they can be highlighted in the UI.

          At the very beginning of your response, include a status tag in brackets based on the analysis:
          - Use [STATUS: CRITICAL] if the burn is extremely high and they will never reach profitability with current metrics.
          - Use [STATUS: AT RISK] if they are losing money but could reach profitability with minor adjustments.
          - Use [STATUS: STABLE] if they are already profitable or will be very soon.
        `;

        return callAI(ctx, prompt, SYSTEM_INSTRUCTION, undefined, undefined, 0, [], args.modelName);
    }
});


export const generateMarketResearch = action({
    args: {
        startupData: v.any(),
        attachedFiles: v.optional(v.array(v.object({
            name: v.string(),
            data: v.string(),
            mimeType: v.string()
        }))),
        keywords: v.optional(v.array(v.string())),
        modelName: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");


        const data = args.startupData;
        const attachedFiles = args.attachedFiles || [];
        const keywords = args.keywords || [];

        // Market Research is hard-coded to use the Cloud AI model from environment
        const safeModelName = "cloud";


        const textPrompt = `
            Conduct a deep market research analysis for the following startup.
            
            Startup Name: ${data.name}
            Hypothesis: ${data.hypothesis}
            Problem: ${data.canvas['Problem'] || 'Not specified'}
            Customer Segments: ${data.canvas['Customer Segments'] || 'Not specified'}
            Solution: ${data.canvas['Solution'] || 'Not specified'}
            
            ${keywords.length > 0 ? `FOCUS KEYWORDS: ${keywords.join(', ')}. Ensure the research specifically targets these topics in your analysis.` : ""}
    
            ${attachedFiles.length > 0 ? `IMPORTANT - ATTACHED FILE CONTEXT: You have access to ${attachedFiles.length} uploaded files (PDF/TXT). You MUST read and summarize key details from these files.` : ""}
    
            TASK:
            1. Use your knowledge to estimate the latest 2024/2026 market data.
            2. If files are attached, extract specific market numbers, quotes, or trends and cite them.
            3. Generate a "White Paper" style market research report in clean Markdown.
            4. **IMPORTANT: Include at least one Markdown table** comparing market segments, competitors, or growth trends.
            5. Estimate TAM, SAM, SOM in USD (integers).
            6. **SOURCES & REFERENCES**: Include a dedicated section at the end. Provide clickable links [Source Name](url) for all data points. If the exact URL is unknown, provide a high-quality placeholder link or the official report name.

            FORMAT YOUR RESPONSE AS FOLLOWS:
            
            [Start with the Markdown Report]
            # Market Research Intelligence Report: [Startup Name]
            ... content including tables ...

            [At the very end, output the numbers in this exact JSON block]
            \`\`\`json
            {
                "tam": 1000000000,
                "sam": 500000000,
                "som": 10000000
            }
            \`\`\`
        `;

        // Construct request parts (Text + optional Files for multimodal)
        let parts: any[] = [{ text: textPrompt }];

        if (attachedFiles.length > 0) {
            attachedFiles.forEach((file: any) => {
                parts.push({
                    inlineData: {
                        mimeType: file.mimeType,
                        data: file.data
                    }
                });
            });
        }

        const geminiContents = [{ role: 'user', parts: parts }];

        try {
            // Call AI requesting TEXT response (since we want Markdown + JSON block)
            const text = await callAI(
                ctx,
                geminiContents,
                "You are a top-tier market researcher with extensive knowledge of industry trends and market sizing.",
                "text/plain", // Changed from application/json to text
                undefined,
                0,
                [],
                safeModelName
            );

            // Extract JSON block for numbers
            let parsedTam = 0;
            let parsedSam = 0;
            let parsedSom = 0;
            let finalReport = text;

            const jsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);

            if (jsonMatch) {
                try {
                    const jsonBlock = jsonMatch[1];
                    const parsed = JSON.parse(jsonBlock);

                    // Handle numbers that might be strings or numbers
                    const parseNum = (val: any) => {
                        if (typeof val === 'number') return val;
                        if (typeof val === 'string') {
                            return parseFloat(val.replace(/,/g, '').replace(/\$/g, '')) || 0;
                        }
                        return 0;
                    };

                    parsedTam = parseNum(parsed.tam);
                    parsedSam = parseNum(parsed.sam);
                    parsedSom = parseNum(parsed.som);

                    // Remove the JSON block from the report text to keep it clean
                    finalReport = text.replace(jsonMatch[0], '').trim();

                } catch (e) {

                }
            } else {
                // Fallback: Try to find JSON without code blocks if AI forgot them
                const rawJsonMatch = text.match(/\{[\s\S]*"tam"[\s\S]*\}/);
                if (rawJsonMatch) {
                    try {
                        const parsed = JSON.parse(rawJsonMatch[0]);
                        parsedTam = parsed.tam || 0;
                        parsedSam = parsed.sam || 0;
                        parsedSom = parsed.som || 0;
                        // Remove JSON from report
                        finalReport = text.replace(rawJsonMatch[0], '').trim();
                    } catch (e) { }
                }
            }

            // Fallback extraction if JSON parsing failed or returned empty values
            const extractNumber = (pattern: RegExp): number => {
                const match = text.match(pattern);
                if (match) {
                    const numStr = match[1].replace(/,/g, '').replace(/\s/g, '');
                    if (numStr.includes('trillion')) return parseFloat(numStr) * 1000000000000;
                    if (numStr.includes('billion')) return parseFloat(numStr) * 1000000000;
                    if (numStr.includes('million')) return parseFloat(numStr) * 1000000;
                    return parseFloat(numStr);
                }
                return 0;
            };

            // Use parsed values or fallback to regex extraction
            const tam = parsedTam || extractNumber(/TAM[:\s]*\$?\s*([0-9.,]+\s*(?:trillion|billion|million)?)/i) ||
                extractNumber(/Total Addressable Market[:\s]*\$?\s*([0-9.,]+\s*(?:trillion|billion|million)?)/i) ||
                404000000000;

            const sam = parsedSam || extractNumber(/SAM[:\s]*\$?\s*([0-9.,]+\s*(?:trillion|billion|million)?)/i) ||
                extractNumber(/Serviceable Available Market[:\s]*\$?\s*([0-9.,]+\s*(?:trillion|billion|million)?)/i) ||
                7820000000;

            const som = parsedSom || extractNumber(/SOM[:\s]*\$?\s*([0-9.,]+\s*(?:trillion|billion|million)?)/i) ||
                extractNumber(/Serviceable Obtainable Market[:\s]*\$?\s*([0-9.,]+\s*(?:trillion|billion|million)?)/i) ||
                391000000;

            return {
                report: finalReport,
                tam: tam,
                sam: sam,
                som: som
            };
        } catch (error) {
            console.error("Error generating market research:", error);
            return {
                report: "Error generating report. Please try again.",
                tam: 0,
                sam: 0,
                som: 0
            };
        }
    }
});

export const generateCompetitorAnalysis = action({
    args: {
        startupData: v.any(),
        modelName: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const data = args.startupData;

        // Check if user has already defined columns/competitors
        const existingAttributes = data.competitorAnalysis.attributes;
        const existingCompetitors = data.competitorAnalysis.competitors;

        const prompt = `
            Perform a comprehensive competitive analysis for this startup.
            
            Startup: ${data.name}
            Hypothesis: ${data.hypothesis}
            Problem: ${data.canvas['Problem']}
            Solution: ${data.canvas['Solution']}
            Unique Value Prop: ${data.canvas['Unique Value Proposition']}
            
            MARKET CONTEXT:
            - TAM: ${data.market.tam}
            - SAM: ${data.market.sam}
            - SOM: ${data.market.som}
            
            BUSINESS MODEL:
            - Type: ${data.revenueModel.businessModelType}
            - Revenue Streams: ${JSON.stringify(data.revenueModel.revenueStreams)}
    
            INSTRUCTIONS:
            1. Identify up to 10 REAL current competitors.
            2. Organize the data into 2 distinct tabs:

            TAB 1: "Competitors"
            - Focus on product and market positioning.
            - Attributes: "Description" (1-2 sentence overview), "Focus", "Technology", "Differentiation", "Match Probability" (e.g. "95%" - Estimate how close of a competitor they are based on Problem/Solution overlap).

            TAB 2: "Funding & Financials"
            - Focus on financial data and backing for the SAME companies identified in Tab 1.
            - Attributes: "Total Raised", "Latest Stage", "Lead Investors", "Last Financing Date".
            - If exact numbers aren't public, estimate based on stage (e.g. "Est. $2-4M Seed") or state "Undisclosed".

            3. Write a comprehensive STRATEGIC ANALYSIS in Markdown format structured as follows:
               
               **FORMAT FOR analysisSummary (use Markdown):**
               
               ### 🎯 Market Position
               [1-2 sentences on where the startup sits relative to competitors]
               
               ### ⚠️ Competitive Threats
               - **[Competitor Name]**: [Why they're a threat]
               - **[Competitor Name]**: [Why they're a threat]
               
               ### 💡 Strategic Opportunities  
               - [Gap in the market or advantage to exploit]
               - [Another opportunity]
               
               ### 🚀 Recommended Actions
               1. **[Action]**: [Brief explanation]
               2. **[Action]**: [Brief explanation]
               
               Be specific, data-driven, and actionable. Write at a VC/founder level.
    
            Return JSON format:
            {
              "subTabs": [
                {
                    "id": "tab_competitors",
                    "name": "Competitors",
                    "attributes": ["Description", "Focus", "Technology", "Differentiation", "Match Probability"],
                    "competitors": [ { "name": "Comp A", "Description": "...", "Focus": "...", "Technology": "...", "Differentiation": "...", "Match Probability": "90%" }, ... ]
                },
                {
                    "id": "tab_funding",
                    "name": "Funding & Investors",
                    "attributes": ["Total Raised", "Latest Stage", "Lead Investors", "Last Financing Date"],
                    "competitors": [ { "name": "Comp A", "Total Raised": "...", "Latest Stage": "...", "Lead Investors": "...", "Last Financing Date": "..." }, ... ]
                }
              ],
              "analysisSummary": "### 🎯 Market Position\\n...full markdown content..."
            }
        `;

        try {
            // Enable Google Search for grounding - Normalize for proxy deserialization
            const tools = [{ type: "google_search", google_search: {} }];
            // Schema for Structured Output
            const schema = {
                type: "object",
                properties: {
                    subTabs: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                id: { type: "string" },
                                name: { type: "string" },
                                attributes: { type: "array", items: { type: "string" } },
                                competitors: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        // We use additionalProperties: true to allow dynamic attribute keys
                                        // But Ollama schema needs specific props usually. 
                                        // For dynamic keys, we might need a looser schema or map structure.
                                        // Given the prompt asks for specific columns, we can try to be flexible.
                                        // However, Pydantic/Zod schemas usually require known keys.
                                        // Let's use a list of key-value pairs for attributes to be safe?
                                        // No, the UI expects dynamic keys.
                                        // Let's rely on the model handling "additionalProperties" or just define core fields and let it add others.
                                        // Or better, define the schema as return a list of objects where each object has "name" and "attributesData" as a dictionary?
                                        // The current UI expects direct keys on the object.
                                        // Let's try to define the expected attributes in the schema if possible, or just strict typing.
                                        // Actually, "Description", "Focus", "Technology", "Differentiation" are known for Tab 1.
                                        properties: {
                                            name: { type: "string" },
                                            Description: { type: "string" },
                                            Focus: { type: "string" },
                                            Technology: { type: "string" },
                                            Differentiation: { type: "string" },
                                            "Match Probability": { type: "string" },
                                            // Tab 2 keys
                                            "Total Raised": { type: "string" },
                                            "Latest Stage": { type: "string" },
                                            "Lead Investors": { type: "string" },
                                            "Last Financing Date": { type: "string" }
                                        },
                                        required: ["name"]
                                    }
                                }
                            },
                            required: ["id", "name", "attributes", "competitors"]
                        }
                    },
                    analysisSummary: { type: "string" }
                },
                required: ["subTabs", "analysisSummary"]
            };

            const text = await callAI(
                ctx,
                prompt,
                "You are a strategic analyst. You must use real-world data found via Google Search. In the 'analysisSummary' field, use markdown formatting and wrap key metrics (amounts, %, growth, churn) in **bold** to highlight them.",
                undefined,
                schema, // Pass Structured Output schema
                0,
                tools,
                "gemini-3-flash-preview"
            );

            // Clean markdown if present (Structured Outputs should avoid this, but safety first for some models)
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

            let result;
            try {
                result = JSON.parse(cleanText);
            } catch (parseError) {
                console.error("JSON parse error:", parseError);
                console.error("Failed to parse text (first 2000 chars):", cleanText.substring(0, 2000));
                throw parseError;
            }

            // Post-process to ensure IDs
            if (result.subTabs && Array.isArray(result.subTabs)) {
                result.subTabs.forEach((tab: any) => {
                    if (tab.competitors && Array.isArray(tab.competitors)) {
                        tab.competitors = tab.competitors.map((c: any) => ({
                            ...c,
                            id: c.id || Date.now() + Math.random().toString()
                        }));
                    } else {
                        tab.competitors = [];
                    }
                });
            } else {
                // Fallback if subTabs is missing
                result.subTabs = [];
            }

            // Map the first tab to the legacy fields for backward compatibility if needed, 
            // or just return the new structure. The frontend will need to handle subTabs.
            // We'll populate legacy fields with the "General" tab data for safety.
            const generalTab = result.subTabs.find((t: any) => t.name.includes("General")) || result.subTabs[0];

            return {
                attributes: generalTab ? generalTab.attributes : ["Price", "Features"],
                competitors: generalTab ? generalTab.competitors : [],
                analysisSummary: result.analysisSummary || "Analysis generated.",
                subTabs: result.subTabs
            };

        } catch (error) {
            console.error("Error generating competitor analysis:", error);
            return {
                attributes: existingAttributes.length > 0 ? existingAttributes : ["Price", "Features"],
                competitors: existingCompetitors,
                analysisSummary: "Error generating analysis. Check API limits.",
                subTabs: []
            };
        }
    }
});

// Fill empty cells in existing competitors when AI times out or partial data exists
export const fillEmptyCompetitorCells = action({
    args: {
        startupData: v.any(),
        competitors: v.array(v.any()),
        attributes: v.array(v.string()),
        modelName: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const data = args.startupData;
        const competitors = args.competitors;
        const attributes = args.attributes;

        // Find competitors with empty cells
        const competitorsWithEmptyCells: { name: string; emptyAttributes: string[] }[] = [];

        competitors.forEach((comp: any) => {
            try {
                const attrData = typeof comp.attributesData === 'string'
                    ? JSON.parse(comp.attributesData)
                    : comp.attributesData || {};

                const emptyAttrs = attributes.filter(attr =>
                    !attrData[attr] || attrData[attr] === '' || attrData[attr] === 'Empty'
                );

                if (emptyAttrs.length > 0) {
                    competitorsWithEmptyCells.push({
                        name: comp.name,
                        emptyAttributes: emptyAttrs
                    });
                }
            } catch (e) {
                // If parsing fails, all attributes are empty
                competitorsWithEmptyCells.push({
                    name: comp.name,
                    emptyAttributes: attributes
                });
            }
        });

        if (competitorsWithEmptyCells.length === 0) {
            return { competitors, message: "No empty cells to fill" };
        }

        const prompt = `
            You are completing a competitive analysis. Some cells are empty and need data.
            
            Startup Context:
            - Name: ${data.name}
            - Hypothesis: ${data.hypothesis}
            
            LEAN CANVAS DATA:
            ${JSON.stringify(data.canvas, null, 2)}
            
            TASK: Fill in the missing data for these competitors:
            ${competitorsWithEmptyCells.map(c =>
            `- ${c.name}: Need data for [${c.emptyAttributes.join(', ')}]`
        ).join('\n')}
            
            Attributes to fill: ${attributes.join(', ')}
            
            INSTRUCTIONS:
            1. Use Google Search to find real data.
            2. Infer "Match Probability" if missing (Problem/Solution overlap % with Startup).
            3. Return JSON with ONLY the missing data.
            
            Return JSON with ONLY the missing data:
            {
                "updates": [
                    { "name": "Competitor Name", "data": { "AttributeName": "Value", ... } },
                    ...
                ]
            }
            
            IMPORTANT: Return ONLY the JSON, no markdown code blocks.
        `;

        try {
            const tools = [{ googleSearch: {} }];

            // Schema for Structured Output
            const schema = {
                type: "object",
                properties: {
                    updates: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                data: {
                                    type: "object",
                                    properties: {
                                        Description: { type: "string" },
                                        Focus: { type: "string" },
                                        Technology: { type: "string" },
                                        Differentiation: { type: "string" },
                                        "Match Probability": { type: "string" },
                                        "Total Raised": { type: "string" },
                                        "Latest Stage": { type: "string" },
                                        "Lead Investors": { type: "string" },
                                        "Last Financing Date": { type: "string" }
                                    },
                                    // Use additionalProperties for dynamic attribute keys
                                    additionalProperties: { type: "string" }
                                }
                            },
                            required: ["name", "data"]
                        }
                    }
                },
                required: ["updates"]
            };

            const text = await callAI(ctx, prompt, "You are a strategic analyst filling in missing competitive data. Use Google Search for real data. Return ONLY valid JSON.", undefined, undefined, 0, tools, args.modelName);

            // Robust JSON Extraction
            let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const jsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/) || text.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                cleanText = jsonMatch[1] || jsonMatch[0];
            }

            let result;
            try {
                result = JSON.parse(cleanText);
            } catch (e) {
                console.error("JSON Parse Error in fillEmptyCompetitorCells:", e);
                throw new Error("Failed to parse AI response.");
            }

            // Merge updates into existing competitors
            const updatedCompetitors = competitors.map((comp: any) => {
                const update = result.updates?.find((u: any) =>
                    u.name.toLowerCase() === comp.name.toLowerCase()
                );

                if (update) {
                    let attrData: any = {};
                    try {
                        attrData = typeof comp.attributesData === 'string'
                            ? JSON.parse(comp.attributesData)
                            : comp.attributesData || {};
                    } catch (e) {
                        attrData = {};
                    }

                    // Merge new data
                    Object.keys(update.data).forEach(key => {
                        if (!attrData[key] || attrData[key] === '' || attrData[key] === 'Empty') {
                            attrData[key] = update.data[key];
                        }
                    });

                    return {
                        ...comp,
                        attributesData: JSON.stringify(attrData)
                    };
                }
                return comp;
            });

            return {
                competitors: updatedCompetitors,
                message: `Filled data for ${result.updates?.length || 0} competitors`
            };

        } catch (error) {
            console.error("Error filling competitor cells:", error);
            return { competitors, message: "Error filling cells. Try again." };
        }
    }
});

export const analyzeCustomerFeedback = action({
    args: {
        interview: v.any(),
        modelName: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const interview = args.interview;
        const prompt = `
            Analyze this customer interview/feedback notes.
            
            Data: ${JSON.stringify(interview)}
            
            1. Determine sentiment (Positive, Neutral, Negative).
            2. Extract a 1-sentence insight or persona summary.
            3. Extract 2-3 key tags.
            
            Return JSON: { "sentiment": "...", "aiAnalysis": "Summary... [Tag1, Tag2]" }
        `;

        try {
            const text = await callAI(ctx, prompt, "You are a UX researcher.", "application/json",
                {
                    type: Type.OBJECT,
                    properties: {
                        sentiment: { type: Type.STRING, enum: ["Positive", "Neutral", "Negative"] },
                        aiAnalysis: { type: Type.STRING }
                    },
                    required: ["sentiment", "aiAnalysis"]
                },
                0, [], args.modelName
            );
            return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
        } catch (e) {
            return { sentiment: 'Neutral', aiAnalysis: 'Analysis failed.' };
        }
    }
});

export const generateProjectReport = action({
    args: {
        startupData: v.any(),
        modelName: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const data = args.startupData;
        const prompt = `
            Generate a comprehensive White Paper report for this startup.
            The report should look like a professional business document (using Markdown).
            
            Startup Name: ${data.name}
            Original Idea: ${data.hypothesis}
            
            DATA TO ANALYZE:
            1. Canvas Evolution (Pivots):
               They have saved ${data.canvasVersions.length} versions of their business model.
               Summarize the evolution if possible.
               Current Canvas State: ${JSON.stringify(data.canvas)}
               
            2. Customer Discovery:
               They have conducted ${data.customerInterviews.length} interviews.
               Interview Data: ${JSON.stringify(data.customerInterviews.slice(0, 10))}
               Synthesize the findings. What pain points were validated?
               
            STRUCTURE OF THE REPORT:
            - Executive Summary
            - The Journey (Detailing the pivots and evolution of the business model)
            - Customer Insights (Findings from the "Get out of the building" phase)
            - Strategic Outlook (Based on the current canvas and financial model)
            
            Tone: Professional, narrative, and insightful.
            Format: Markdown.
        `;

        return callAI(ctx, prompt, "You are a Chief Strategy Officer writing a report for stakeholders.", undefined, undefined, 0, [], args.modelName);
    }
});

export const generateBusinessPlan = action({
    args: {
        startupData: v.any(),
        modelName: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const data = args.startupData;
        const prompt = `
            Generate a formal, comprehensive Business Plan for this startup based on all available data.
            
            Startup Name: ${data.name}
            Hypothesis: ${data.hypothesis}
            
            DATA SOURCES:
            1. Lean Canvas: ${JSON.stringify(data.canvas)}
            2. Market Research: TAM ${data.market.tam}, SAM ${data.market.sam}, SOM ${data.market.som}.
            3. Financials: 
               - Business Model: ${data.revenueModel.businessModelType}
               - Description: ${data.revenueModel.modelDescription}
               - Projections: Growth ${data.revenueModel.monthlyGrowthRate}%, Churn ${data.revenueModel.churnRate}%
            4. Customer Discovery: ${data.customerInterviews.length} interviews conducted.
            5. Roadmap: ${JSON.stringify(data.features)}
            6. Competitors: ${JSON.stringify(data.competitorAnalysis.competitors.map((c: any) => c.name).join(', '))}
            
            REQUIRED STRUCTURE:
            1. Executive Summary
            2. Company Overview (Mission, Vision, Value Proposition)
            3. Market Analysis (Industry Trends, Target Market, Competition)
            4. Products & Services (Solution Description, Development Roadmap)
            5. Operational Plan (Go-to-Market Strategy)
            6. Financial Plan (Revenue Model, Unit Economics, Projections)
            7. Conclusion
            
            Format: Markdown. Tone: Professional, Investment-grade, Formal.
        `;

        return callAI(ctx, prompt, "You are a senior business consultant and venture capitalist writing a formal business plan for potential investors.", undefined, undefined, 0, [], args.modelName);
    }
});

export const generateBottomUpSizing = action({
    args: {
        data: v.any(),
        model: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { data, model } = args;
        const traceLogs: Array<{
            id: string;
            timestamp: string;
            type: 'request' | 'response' | 'error' | 'thinking';
            source: string;
            title: string;
            data: any;
            duration?: number;
        }> = [];

        const addLog = (type: 'request' | 'response' | 'error' | 'thinking', source: string, title: string, logData: any, duration?: number) => {
            traceLogs.push({
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date().toISOString(),
                type,
                source,
                title,
                data: logData,
                duration
            });
        };

        // 1. Calculate ARPU from Revenue Model
        let arpu = 0;
        if (data.revenueModel && data.revenueModel.revenueStreams) {
            data.revenueModel.revenueStreams.forEach((stream: any) => {
                const price = typeof stream.price === 'string' ? parseFloat(stream.price) || 0 : stream.price || 0;
                // Annualize: Monthly * 12, One-time * 1
                arpu += (stream.frequency === 'Monthly' ? price * 12 : price);
            });
        }
        // Default ARPU if 0 to ensure non-zero math (fallback to $1000 placeholder)
        if (arpu === 0) arpu = 1000;

        // 2. Prepare Payload for Adaptive Sizing Calculator
        const config = data.marketConfig || {};
        const payload = {
            entity_type: config.selectedSegments?.join(", ") || data.canvas?.customerSegments || "Startup",
            naics_code: config.naicsCode || data.market?.naicsCode,
            geography: config.geography || "US",
            arpu: arpu,
            sam_percentage: config.samPercentage || 30.0,
            som_percentage: config.somPercentage || 5.0
        };

        let calculatorResult = {
            total_establishments: 0,
            tam: { raw: 0, formatted: "$0" },
            sam: { raw: 0, formatted: "$0" },
            som: { raw: 0, formatted: "$0" },
            metadata: { source: "Estimate", naics_code_used: null }
        };

        // 3. Call The Calculator Endpoint
        const calcStartTime = Date.now();
        addLog('request', 'Adaptive API', 'Sizing Calculator Request', {
            endpoint: 'https://api.tekimax.com/api/adaptive/sizing-calculator',
            method: 'POST',
            payload
        });

        try {
            const response = await fetch("https://api.tekimax.com/api/adaptive/sizing-calculator", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const calcDuration = Date.now() - calcStartTime;

            if (response.ok) {
                calculatorResult = await response.json();
                addLog('response', 'Adaptive API', 'Sizing Calculator Response', {
                    status: response.status,
                    total_establishments: calculatorResult.total_establishments,
                    tam: calculatorResult.tam,
                    sam: calculatorResult.sam,
                    som: calculatorResult.som,
                    metadata: calculatorResult.metadata
                }, calcDuration);
            } else {
                const errorText = await response.text();
                console.warn("Calculator returned error:", response.status);
                addLog('error', 'Adaptive API', 'Sizing Calculator Error', {
                    status: response.status,
                    error: errorText
                }, calcDuration);
            }
        } catch (err: any) {
            const calcDuration = Date.now() - calcStartTime;
            console.error("Calculator API failed:", err);
            addLog('error', 'Adaptive API', 'Sizing Calculator Failed', {
                error: err.message || 'Unknown error'
            }, calcDuration);
        }

        const censusCount = calculatorResult.total_establishments;
        const sourceCredit = calculatorResult.metadata.source;

        // 4. Generate AI Report (Narrative Only)
        // We feed the VERIFIED numbers to the AI so it doesn't hallucinate math.
        const systemPrompt = `You are a strategic market analyst specializing in "Bottom-Up Market Sizing".
Your goal is to write a professional explanation of the TAM/SAM/SOM market size.

DATA SOURCE:
We have already calculated the exact market size using verified ${sourceCredit} data.
- TAM: ${calculatorResult.tam.formatted} (${calculatorResult.total_establishments.toLocaleString()} establishments × $${arpu.toLocaleString()} ARPU)
- SAM: ${calculatorResult.sam.formatted} (Estimated 30% segment capture)
- SOM: ${calculatorResult.som.formatted} (Targeting 5% initial share)

INSTRUCTIONS:
- Do NOT recalculate the numbers. Use the provided values.
- Explain the logic: "Based on ${calculatorResult.total_establishments.toLocaleString()} potential entities identifying as '${payload.entity_type}'..."
- Provide a brief strategy on how to capture the SOM.
- Be concise (2-3 paragraphs max).
- **FORMATTING**: Use Markdown headers (e.g. ### Market Strategy) and **bold** key metrics.

REQUIRED:
Include a "References & Data Sources" section at the end citing:
1. ${sourceCredit} (For establishment counts and industry baseline)
2. Customer Discovery Interviews (For ARPU validation and willingness to pay)
3. Lean Canvas (For target segment definition: ${payload.entity_type})
4. Internal Revenue Model (For unit economics: $${arpu.toLocaleString()} annualized)
`;

        const userPrompt = `Project: ${data.name}
Description: ${data.hypothesis}
Customer Segments: ${data.canvas?.customerSegments}
Generate the market sizing narrative.`;

        const aiStartTime = Date.now();
        addLog('request', 'AI Model', 'Narrative Generation Request', {
            model: model || 'gemini-3-flash-preview',
            systemPromptLength: systemPrompt.length,
            userPromptPreview: userPrompt.substring(0, 200) + '...'
        });

        try {
            const aiText = await ctx.runAction(api.ollamaService.callOllama, {
                model: model || "gemini-3-flash-preview",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                // We ask for plain text for the report part, we already have the JSON numbers
                jsonMode: false
            });

            const aiDuration = Date.now() - aiStartTime;
            addLog('response', 'AI Model', 'Narrative Generation Response', {
                model: model || 'gemini-3-flash-preview',
                responseLength: aiText.length,
                preview: aiText.substring(0, 300) + '...'
            }, aiDuration);

            // Add thinking log if present in response
            addLog('thinking', 'AI Model', 'Generation Complete', {
                totalEstablishments: calculatorResult.total_establishments,
                calculatedARPU: arpu,
                dataSource: sourceCredit
            });

            return {
                tam: calculatorResult.tam.raw,
                sam: calculatorResult.sam.raw,
                som: calculatorResult.som.raw,
                report: aiText,
                // Pass back the NAICS code for sticky state
                naicsCode: calculatorResult.metadata.naics_code_used,
                // Return trace logs
                traceLogs
            };

        } catch (error: any) {
            const aiDuration = Date.now() - aiStartTime;
            console.error("AI Narrative failed:", error);
            addLog('error', 'AI Model', 'Narrative Generation Failed', {
                error: error.message || 'Unknown error'
            }, aiDuration);

            // Fallback: Return the numbers even if the report fails
            return {
                tam: calculatorResult.tam.raw,
                sam: calculatorResult.sam.raw,
                som: calculatorResult.som.raw,
                report: "Report generation failed, but market data was calculated successfully.",
                naicsCode: calculatorResult.metadata.naics_code_used,
                traceLogs
            };
        }
    }
});


export const generateOKRs = action({
    args: {
        startupData: v.any(),
        modelName: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const data = args.startupData;
        // Gather context from all modules
        const marketGap = data.market.tam === 0;
        const revenueGap = data.revenueModel.revenueStreams.length === 0;
        const canvasGap = Object.values(data.canvas).some(v => !v);

        // Find potential customers
        const potentialCustomers = data.customerInterviews.filter((c: any) => c.customerStatus === 'Potential Fit');

        const prompt = `
            Generate 3-5 strategic OKRs (Objectives and Key Results) for this startup for the next quarter.
            Review all available data to identify gaps and opportunities.
            
            Startup Name: ${data.name}
            Hypothesis: ${data.hypothesis}
            
            CURRENT STATUS:
            - Market Research: ${marketGap ? "Missing TAM/SAM/SOM" : `TAM $${data.market.tam}`}
            - Revenue Model: ${revenueGap ? "Missing Revenue Streams" : `Defined`}
            - Canvas: ${canvasGap ? "Incomplete" : "Complete"}
            - Customer Pipeline: ${potentialCustomers.length} Potential Fits identified.
            - Build: ${data.features.length} features in roadmap.
            
            INSTRUCTIONS:
            1. If Market/Revenue/Canvas data is missing, prioritize goals to complete them.
            2. If 'Potential Fit' customers exist, create a goal to convert them (e.g., "Close 3 Potential Fits").
            3. Include a Product goal based on the roadmap.
            4. Include a Growth goal based on customer discovery.
            
            Return RAW JSON array of objects:
            [
                {
                    "title": "Objective Title",
                    "type": "Strategic",
                    "timeframe": "Quarterly",
                    "status": "Upcoming",
                    "keyResults": [
                        { "description": "Achieve 100 signups", "target": 100, "unit": "users" },
                        { "description": "Launch MVP", "target": 1, "unit": "launch" }
                    ]
                }
            ]
        `;

        try {
            const text = await callAI(ctx, prompt, "You are a product manager setting OKRs.", "application/json",
                {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ['Strategic', 'Objective'] },
                            timeframe: { type: Type.STRING, enum: ['Weekly', 'Monthly', 'Quarterly'] },
                            status: { type: Type.STRING, enum: ['Upcoming', 'In Progress', 'Completed'] },
                            keyResults: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        description: { type: Type.STRING },
                                        target: { type: Type.NUMBER },
                                        unit: { type: Type.STRING }
                                    },
                                    required: ['description', 'target', 'unit']
                                }
                            }
                        },
                        required: ['title', 'type', 'timeframe', 'status', 'keyResults']
                    }
                },
                0, [], args.modelName
            );

            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const rawGoals = JSON.parse(cleanText);

            // Add IDs and defaults
            return rawGoals.map((g: any) => ({
                id: Date.now().toString() + Math.random(),
                title: g.title,
                type: g.type,
                timeframe: g.timeframe,
                status: g.status || 'Upcoming',
                linkedCustomerIds: [], // Default empty
                keyResults: g.keyResults.map((kr: any) => ({
                    id: Date.now().toString() + Math.random(),
                    description: kr.description,
                    target: kr.target,
                    current: 0,
                    unit: kr.unit
                }))
            }));

        } catch (e) {
            console.error(e);
            return [];
        }
    }
});

export const generateStartupJourneyStory = action({
    args: {
        startupData: v.any(),
        modelName: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const data = args.startupData;
        const prompt = `
            Write a compelling, narrative "Startup Journey Story" for this venture.
            This story should dramatize the timeline of events, pivots, and milestones.

            Startup Name: ${data.name}
            Mission: ${data.hypothesis}
            
            TIMELINE MILESTONES:
            ${data.milestones.map((m: any) =>
            `- ${new Date(m.date).toLocaleDateString()}: ${m.title} (${m.type}) - ${m.description} [${m.tractionType || 'Normal'}]`
        ).join('\n')}

            INSTRUCTIONS:
            1. Write in a journalistic or biographical style (e.g., "It all started in 2024 when...").
            2. Highlight the "Moments of Truth" (Pivots, Funding, Big Launches).
            3. Use the "Year Themes" if available to structure the narrative.
            4. Be inspiring but grounded in the data provided.
            5. Structure with Markdown headers (use # for Main Title, ## for Chapters).
            6. Use bullet points (* or -) for lists.

            Format: Markdown (Strict compatibility with TipTap/ProseMirror).
        `;

        try {
            const story = await callAI(ctx, prompt, "You are a tech journalist profiling a startup.", undefined, undefined, 0, [], args.modelName);

            // Persist the story
            if (data.id) {
                await ctx.runMutation(api.projects.update, {
                    id: data.id,
                    updates: {
                        journeyStoryContent: story
                    }
                });
            }

            return story;
        } catch (e) {
            console.error("Error generating story:", e);
            return "Could not generate story.";
        }
    }
});
export const explainScenario = action({
    args: {
        scenario: v.any(),
        style: v.string(), // "Analogy", "Simplify", "Professional"
        modelName: v.optional(v.string()),
        useOllama: v.optional(v.boolean())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const { scenario, style } = args;

        let styleInstruction = "";
        switch (style) {
            case "Analogy":
                styleInstruction = "Use a creative analogy (like slicing a pizza, sharing a harvest, or building a house) to explain the concepts. Keep it fun but accurate.";
                break;
            case "Simplify":
                styleInstruction = "Explain it like I'm 5 years old. Use simple language, short sentences, and avoid jargon.";
                break;
            case "Professional":
            default:
                styleInstruction = "Use professional venture capital terminology. Focus on the financial implications, dilution, and cap table impact.";
                break;
        }

        const systemInstruction = "You are a helpful startup advisor.";

        // MODE 1: TERMS ANALYSIS
        if (scenario.type === 'terms') {
            const prompt = `
                Analyze these fundraising investment terms for a founder.
                
                TERMS:
                - Valuation Cap: $${scenario.valuationCap.toLocaleString()}
                - Discount Rate: ${scenario.discountRate}%
                - Target Raise: $${scenario.amountRaising.toLocaleString()}
                - Type: ${scenario.postMoney ? 'Post-Money' : 'Pre-Money'}
                
                INSTRUCTIONS:
                1. ${styleInstruction}
                2. Analyze if these terms are "founder friendly", "investor friendly", or "market standard".
                3. Explain the relationship between the Cap and the Discount.
                4. Highlight any major dilution risks.
                5. Keep it under 200 words.
                
                Format: Markdown.
            `;
            return callAI(ctx, prompt, systemInstruction, undefined, undefined, 0, [], args.modelName);
        }

        // MODE 2: VESTING ANALYSIS
        if (scenario.type === 'vesting') {
            const { recipient, shares, period, cliff } = scenario.vestingDetails;
            const prompt = `
                Analyze this Vesting Schedule for ${recipient}.
                
                DETAILS:
                - Shares: ${shares.toLocaleString()}
                - Total Period: ${period} months
                - Cliff: ${cliff} months
                
                INSTRUCTIONS:
                1. ${styleInstruction}
                2. Explain the "Cliff" concept and what happens if they leave before ${cliff} months.
                3. Is this a standard "4-year/1-year cliff" schedule? (Compare to standard).
                4. Advice on why vesting is important for company stability.
                5. Keep it under 200 words.
                
                Format: Markdown.
            `;
            return callAI(ctx, prompt, systemInstruction, undefined, undefined, 0, [], args.modelName);
        }

        // MODE 3: CAP TABLE ANALYSIS
        if (scenario.type === 'captable') {
            const prompt = `
                Analyze this Pro-Forma Cap Table summary.
                
                CONTEXT:
                - Valuation Cap: $${scenario.valuationCap.toLocaleString()}
                - Amount Raising: $${scenario.amountRaising.toLocaleString()}
                - Projected Post-Money Ownership balance.
                
                INSTRUCTIONS:
                1. ${styleInstruction}
                2. Explain the impact of the SAFE conversion on the existing cap table.
                3. Are the founders retaining enough equity (usually >80% after Seed)?
                4. Explain "Post-Money" vs "Pre-Money" dilution in this specific context.
                5. Keep it under 200 words.
                
                Format: Markdown.
            `;
            return callAI(ctx, prompt, systemInstruction, undefined, undefined, 0, [], args.modelName);
        }

        // MODE 4: MULTI-SCENARIO SIMULATION
        if (scenario.type === 'simulation') {
            const scenariosStr = scenario.scenarios.map((s: any) => `- ${s.name}: $${s.amountRaising.toLocaleString()} at $${s.valuationCap.toLocaleString()} Cap`).join("\n");
            const prompt = `
                Analyze these fundraising scenarios and their strategic impact.
                
                SCENARIOS:
                ${scenariosStr}
                
                EXIT VALUE: $${scenario.exitValuation.toLocaleString()}
                
                INSTRUCTIONS:
                1. ${styleInstruction}
                2. Compare the scenarios. Which one offers the best balance of capital vs dilution?
                3. Explain the "Waterfall" impact at a $${scenario.exitValuation.toLocaleString()} exit.
                4. Which term (Cap or Raise) has the biggest impact on the founder's final payout?
                5. Keep it under 200 words.
                
                Format: Markdown.
            `;
            return callAI(ctx, prompt, systemInstruction, undefined, undefined, 0, [], args.modelName);
        }

        // MODE 5: DEFAULT / EXIT SCENARIO
        const prompt = `
            Explain this fundraising scenario to a founder.
            
            SCENARIO DETAILS:
            - Amount Raising: $${scenario.amountRaising.toLocaleString()}
            - Valuation Cap: $${scenario.valuationCap.toLocaleString()}
            - Projected Exit Valuation: $${scenario.exitValuation.toLocaleString()}
            
            RESULTS:
            - Investor Ownership: ${scenario.investorOwnership?.toFixed(2)}%
            - Founder Ownership: ${scenario.founderOwnership?.toFixed(2)}%
            - Investor Payout: $${scenario.investorPayout?.toLocaleString()}
            - Founder Payout: $${scenario.founderPayout?.toLocaleString()}
            - Dilution: ${scenario.dilution?.toFixed(2)}%
            
            INSTRUCTIONS:
            1. ${styleInstruction}
            2. Explain what this means for the founder's control and financial outcome.
            3. Highlight if this is a "good" or "bad" deal based on market norms.
            4. Keep the explanation under 200 words.
            
            Format: Markdown.
        `;

        // Use Ollama if requested
        if (args.useOllama) {
            try {
                return await callOllamaInternal("", prompt, systemInstruction);
            } catch (error: any) {
                console.error("Ollama Cloud Error:", error);
                throw new Error("Ollama analysis failed: " + (error.message || "Unknown error"));
            }
        }

        return callAI(ctx, prompt, systemInstruction, undefined, undefined, 0, [], args.modelName);
    }
});

// ============================================
// Adaptive Learning Actions
// ============================================

export const explainAdaptiveStatus = action({
    args: {
        topic: v.string(),
        metrics: v.any(),
        modelName: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const prompt = `
            You are the "Core Intelligence" of an advanced AI Operating System for startups.
            Your job is to explain the current system status to the founder in a professional, slightly futuristic, but highly functional tone.
            
            ${args.topic === 'Overview' ? `MISSION CONTEXT: 
            In the Age of AI, a startup's competitive advantage isn't just its current product, but its "Adaptive Velocity"—the speed at which it learns from users and adjusts its internal model. 
            This page provides "Observability" into that learning process. It bridges the gap between raw data (Feedback/Memories) and system behavior (Adaptive Logic).` : ""}

            TOPIC: ${args.topic}
            CURRENT METRICS: ${JSON.stringify(args.metrics, null, 2)}
            
            INSTRUCTIONS:
            1. Analyze the metrics provided.
            2. Explain what is happening under the hood (e.g., "Knowledge Graph is optimizing connections...").
            3. If the topic is 'Overview', explain the purpose of this page: transforming feedback and memory into a persistent "Organizational Intelligence" that helps the AI advisor become a true co-founder.
            4. If there are issues (e.g. negative feedback), suggest a strategic fix.
            5. Keep it concise (under 200 words).
            6. Use Markdown formatting (bold for key terms).
            7. Tone: "System Active. Analyzing parameters. Optimal performance." (e.g. Jarvis meets McKinsey).
        `;

        return callAI(ctx, prompt, "You are an advanced AI System Monitor.", undefined, undefined, 0, [], args.modelName);
    }
});

// ============================================
// Document AI Actions (for TiptapEditor)
// ============================================

export const fixDocumentGrammar = action({
    args: {
        text: v.string(),
        modelName: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const prompt = `Fix the grammar and improve the flow of the following text, keeping the same meaning and tone. Return ONLY the corrected text, no explanations:

"${args.text}"`;

        const systemInstruction = "You are a professional editor. Fix grammar, spelling, and improve readability while preserving the original meaning and tone.";

        return callAI(ctx, prompt, systemInstruction, undefined, undefined, 0, [], args.modelName || "gemini-3-flash-preview");
    }
});

export const documentAIChat = action({
    args: {
        message: v.string(),
        documentContext: v.string(),
        history: v.optional(v.array(v.object({
            role: v.string(),
            text: v.string()
        }))),
        modelName: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const systemInstruction = `You are a helpful and intelligent writing assistant embedded in a document editor.

Here is the current content of the document the user is working on:
---
${args.documentContext}
---

Answer the user's questions based on this context and your general knowledge. Keep answers concise, helpful, and formatted with Markdown where appropriate.`;

        // Build conversation history for the AI
        const historyParts = args.history?.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        })) || [];

        // Add the new user message
        const contents = [
            ...historyParts,
            { role: 'user', parts: [{ text: args.message }] }
        ];

        return callAI(ctx, contents, systemInstruction, undefined, undefined, 0, [], args.modelName || "gemini-3-flash-preview");
    }
});

// ============================================
// Financial Analysis with Ollama Support
// ============================================

export const analyzeFinancialModel = action({
    args: {
        startupData: v.any(),
        useOllama: v.optional(v.boolean()),
        ollamaModelName: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const data = args.startupData;

        const prompt = `
            Analyze the financial projections for this startup.
            
            Startup: ${data.name}
            Business Model: ${data.revenueModel.businessModelType}
            Revenue Streams: ${JSON.stringify(data.revenueModel.revenueStreams)}
            Cost Structure: ${JSON.stringify(data.revenueModel.costStructure)}
            Metrics: Growth ${data.revenueModel.monthlyGrowthRate}%, Churn ${data.revenueModel.churnRate}%, CAC $${data.revenueModel.cac}.
            
            Provide a 2-sentence summary of the financial health and 1 key recommendation.
            Focus on when they might become profitable or if the burn rate is sustainable.
        `;

        const systemInstruction = "You are an expert startup consultant and venture capitalist. Be concise and professional. IMPORTANT: Always wrap key financial metrics like dollar amounts ($1,000), percentages (15%), 'Churn', 'CAC', and 'Growth' in **bold** (e.g., **$5,000** or **12% churn**) so the UI can render them as badges.";



        // If Ollama is requested, use Ollama Cloud service
        if (args.useOllama) {

            // Let ollamaService use the OLLAMA_MODEL env variable
            try {
                const response = await callOllamaInternal("", prompt, systemInstruction);
                return response;
            } catch (error: any) {
                console.error("Ollama Cloud Error:", error);
                throw new Error("Ollama Cloud analysis failed: " + (error.message || "Unknown error"));
            }
        }


        // Default: Use Gemini via callAI
        return callAI(ctx, prompt, systemInstruction, undefined, undefined, 0, [], "gemini-3-flash-preview");
    }
});
export const chatWithAIAnalyst = action({
    args: {
        startupData: v.any(),
        module: v.string(), // 'competitors' | 'revenue'
        history: v.array(v.object({
            role: v.string(), // 'user' | 'assistant'
            content: v.string()
        })),
        userQuestion: v.string(),
        modelName: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const data = args.startupData;

        let context = "";
        if (args.module === 'competitors') {
            context = `
                Startup: ${data.name}
                Competitor Analysis Context:
                - Existing Summary: ${data.competitorAnalysis.analysisSummary}
                - Competitors: ${JSON.stringify(data.competitorAnalysis.competitors.map((c: any) => ({ name: c.name, ...c.attributesData })))}
            `;
        } else {
            context = `
                Startup: ${data.name}
                Financial Model Context:
                - Business Model: ${data.revenueModel.businessModelType}
                - Revenue Streams: ${JSON.stringify(data.revenueModel.revenueStreams)}
                - Cost Structure: ${JSON.stringify(data.revenueModel.costStructure)}
                - Metrics: Growth ${data.revenueModel.monthlyGrowthRate}%, Churn ${data.revenueModel.churnRate}%, CAC $${data.revenueModel.cac}.
            `;
        }

        const systemInstruction = `
            You are an AI Analyst for a startup called "${data.name}".
            Your goal is to answer follow-up questions about the ${args.module === 'competitors' ? 'Competitive Matrix' : 'Financial Forecast'}.
            
            CONTEXT:
            ${context}
            
            GUIDELINES:
            1. Be concise, professional, and data-driven.
            2. If the user asks for new comparisons or projections, use the provided context to infer reasonable answers.
            3. Always wrap key financial metrics like dollar amounts ($1,000), percentages (15%), 'Churn', 'CAC', and 'Growth' in **bold** so the UI can render them as badges.
            4. If a question is unrelated to the startup or the analysis, politely bring them back to the topic.
        `;

        // Format history for Gemini
        const contents = args.history.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        // Append current question
        contents.push({
            role: 'user',
            parts: [{ text: args.userQuestion }]
        });

        return callAI(ctx, contents, systemInstruction, undefined, undefined, 0, [], args.modelName || "gemini-3-flash-preview");
    }
});

const analyzeConversationDeprecated = action({
    args: {
        chatId: v.id("chats"),
        projectId: v.optional(v.id("projects")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        // 1. Fetch messages
        // We use internal query to fetch messages securely
        const messages = await ctx.runQuery(internal.aiChat.getMessagesInternal, {
            chatId: args.chatId
        });

        if (!messages || messages.length < 5) return; // Only analyze substantial convos

        // 2. Format transcript
        const transcript = messages.map((m: any) => `${m.role}: ${m.content}`).join("\n");

        // 3. AI Analysis
        const prompt = `
            Analyze this conversation between a Founder and an AI Advisor.
            Extract "Key Facts" or "Decisions" that should be remembered for future context.
            Focus on:
            - Strategic decisions (e.g., "Pivot to B2B")
            - Constraints (e.g., "Budget is $5k")
            - Preferences (e.g., "Dislikes playful tone")
            
            Return ONLY a valid JSON array of objects with the following structure:
            [
                { 
                    "fact": "User decided to target Enterprise market", 
                    "category": "Decision", 
                    "confidence": 0.9 
                }
            ]
            
            Transcript:
            ${transcript}
        `;

        try {
            const response = await callAI(ctx, prompt, "You are a memory consolidation engine.", "application/json", undefined, 0, [], "gemini-3-flash-preview");

            // Clean and Parse
            const cleanText = response.replace(/```json/g, '').replace(/```/g, '').trim();
            const facts = JSON.parse(cleanText);

            if (Array.isArray(facts)) {
                // 4. Store Facts
                for (const item of facts) {
                    if (args.projectId) {
                        await ctx.runMutation(internal.memory.addProjectMemory, {
                            projectId: args.projectId,
                            fact: item.fact,
                            category: item.category || "General",
                            confidence: item.confidence || 0.8,
                            source: "chat",
                            sourceId: args.chatId
                        });
                    }
                }
            }
        } catch (e) {
            console.error("Memory consolidation failed:", e);
        }
    }
});

// New Component-Based Implementation
export const analyzeConversation = action({
    args: {
        chatId: v.id("chats"),
        projectId: v.optional(v.id("projects")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        // 1. Fetch messages using internal query
        const messages = await ctx.runQuery(internal.aiChat.getMessagesInternal, {
            chatId: args.chatId
        });

        if (!messages || messages.length < 5) return;

        // 2. Format transcript
        const transcript = messages.map((m: any) => `${m.role}: ${m.content}`).join("\n");

        // 3. Resolve Org ID
        let orgId = "default";
        if (args.projectId) {
            const project = await ctx.runQuery(internal.projects.getProjectInternal, { projectId: args.projectId });
            if (project) orgId = project.orgId || "default";
        }

        // 4. Delegate to Component
        const apiKey = process.env.GEMINI_API_KEY || "";

        await ctx.runAction(components.adaptive_learning.public.consolidateMemory, {
            transcript: transcript,
            projectId: args.projectId ? args.projectId : "global",
            orgId: orgId,
            apiKey: apiKey
        });

        // 5. Trigger Profiling
        const user = await ctx.runQuery(api.users.getUser, {});
        if (user) {
            await ctx.runAction(components.adaptive_learning.public.learnFromSession, {
                transcript: transcript,
                userId: user._id,
                orgId: orgId,
                apiKey: apiKey
            });
        }
    }
});

export const generateCooperationReport = action({
    args: {
        startupData: v.any(),
        humanCount: v.number(),
        aiCount: v.number(),
        tagCounts: v.any(), // Record<string, number>
        featureUsage: v.any(), // Record<string, {human, ai}>
        modelName: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        // Format detailed stats for the prompt
        const topTags = Object.entries(args.tagCounts as Record<string, number>)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([k, v]) => `- ${k}: ${v}`)
            .join("\n");

        const featureBreakdown = Object.entries(args.featureUsage as Record<string, { human: number, ai: number }>)
            .map(([k, v]) => {
                const total = v.human + v.ai;
                const aiPct = total > 0 ? ((v.ai / total) * 100).toFixed(0) : 0;
                return `- ${k}: ${aiPct}% AI (${v.human} Human, ${v.ai} AI)`;
            })
            .join("\n");

        const aiRatio = ((args.aiCount / (args.humanCount + args.aiCount)) * 100).toFixed(1);

        const prompt = `
            Analyze the "Human Generated vs AI Generated" cooperation for this startup.
            
            Startup: ${args.startupData.name}
            Hypothesis: ${args.startupData.hypothesis}
            
            CORE METRICS:
            - Human Actions: ${args.humanCount}
            - AI Actions: ${args.aiCount}
            - AI Dependency: ${aiRatio}%
            
            MOST USED TAGS/TOPICS:
            ${topTags || "No tags yet."}
            
            FEATURE USAGE (AI vs Human):
            ${featureBreakdown}
            
            PHILOSOPHY:
            "We are human-centered AI. The assistant should always be lower than the human edited."
            
            TASK:
            Generate a strategic report on this balance. 
            If AI usage is > 50%, strongly advise on areas to reclaim human control.
            If AI usage is < 30%, praise the strong human foundation and suggest where AI can be a "copilot" to speed up specific tasks without losing soul.
            
            STRUCTURE (Markdown):
            1. **Executive Summary**: 1-2 sentence overview of the balance.
            2. **Tag Analysis**: What do the most used tags say about their focus?
            3. **Dependency Check**: Review the Feature Usage breakdown. Which area is too AI-heavy?
            4. **Recommendations**: 3 specific actions to safeguard human insight.
            5. **Philosophy Check**: brief quote on human founders.
            
            Return ONLY the valid Markdown content.
        `;

        return callAI(ctx, prompt, SYSTEM_INSTRUCTION, undefined, undefined, 0, [], args.modelName);
    }
});

export const generateStartupSummary = action({
    args: { projectId: v.id("projects") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        // 1. Fetch deep context
        const data: any = await ctx.runQuery(api.projects.get, { projectId: args.projectId });
        if (!data) throw new Error("Project not found");

        // 2. Format context
        const context = `
PROJECT NAME: ${data.name}
HYPOTHESIS: ${data.hypothesis}

CANVAS:
${Object.entries(data.canvas || {}).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

MARKET RESEARCH:
- TAM: ${data.market?.tam}
- SAM: ${data.market?.sam}
- SOM: ${data.market?.som}
- Summary: ${data.market?.reportContent?.slice(0, 500)}...

CUSTOMER INTERVIEWS:
${data.customerInterviews?.map((i: any) => `- [${i.sentiment}] ${i.aiAnalysis}`).join('\n')}

ACTIVE GOALS:
${data.goals?.filter((g: any) => g.status === 'In Progress').map((g: any) => `- ${g.title}: ${(g.keyResults || []).map((kr: any) => `${kr.description} (${kr.current}/${kr.target})`).join(', ')}`).join('\n')}

ROADMAP (Top Features):
${data.features?.slice(0, 10).map((f: any) => `- ${f.title} (${f.status})`).join('\n')}
`;

        const prompt = `You are a world-class venture capitalist and startup strategist. 
Analyze the following startup data and provide a "Master Strategy Summary". 
Focus on:
1. Current State: Where are they actually at based on the data?
2. Critical Gaps: What is missing or contradictory (e.g. high TAM but 0 customer interviews)?
3. Strategic Refinement: How should they pivot or double down based on the feedback?
4. Next Course of Action: List the top 3 high-leverage actions for the next 48 hours.

Be brutal, punchy, and incredibly insightful. Use the 1M context window capability to see the "hidden patterns" across the data.

### STARTUP DATA:
${context}`;

        const summary = await callAI(ctx, prompt, "You are a Master Startup Strategist.", undefined, undefined, 0, [], "gemini-3-flash-preview");

        // Record the generation date
        await ctx.runMutation(api.projects.update, {
            id: args.projectId,
            updates: { lastStrategyGeneratedAt: Date.now() }
        });

        // Add notification
        await ctx.runMutation(api.notifications.addNotification, {
            projectId: args.projectId,
            orgId: data.orgId,
            title: "Strategic Analysis Complete",
            description: "Your bi-weekly Master Strategy Summary has been updated with fresh insights.",
            type: "AI"
        });

        return summary;
    }
});

export const generateDailyMemo = action({
    args: { projectId: v.id("projects"), date: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        // 1. Fetch context
        const data: any = await ctx.runQuery(api.projects.get, { projectId: args.projectId });
        const events = await ctx.runQuery(api.calendar.getEvents, { projectId: args.projectId as any });

        const todayEvents = (events || []).filter((e: any) => {
            const d = new Date(e.start).toISOString().split('T')[0];
            return d === args.date;
        });

        const activeGoal = data.goals?.find((g: any) => g.status === 'In Progress');

        const prompt = `Generate a "Focus for Today" memo for the founder.
THEME: Punchy, motivational, but grounded in data.

DATA:
- Active Goal: ${activeGoal?.title || "No active goal set"}
- Key Results: ${activeGoal?.keyResults?.map((kr: any) => `${kr.description} (${kr.current}/${kr.target})`).join(', ') || "N/A"}
- Calendar for Today: ${todayEvents.map((e: any) => `- ${e.title} (${new Date(e.start).toLocaleTimeString()})`).join('\n') || "Empty schedule"}

Output format:
- A single bold one-sentence "North Star" for the day.
- A bulleted list of focus areas.
- A "Founder Wisdom" quote at the end.

Keep it short (max 150 words).`;

        const memo = await callAI(ctx, prompt, "You are a startup coach.", undefined, undefined, 0, [], "gemini-3-flash-preview");

        // Save it
        await ctx.runMutation(internal.dailyMemos.saveDailyMemo, {
            projectId: args.projectId,
            orgId: data.orgId,
            content: memo,
            date: args.date
        });

        // Add notification
        await ctx.runMutation(api.notifications.addNotification, {
            projectId: args.projectId,
            orgId: data.orgId,
            title: "Daily Focus Ready",
            description: "Your AI-generated Focus for Today is ready for review.",
            type: "AI"
        });

        return memo;
    }
});

// =================================================================================================
// MARKET RESEARCH WORKFLOW ACTIONS
// =================================================================================================

export const analyzeMetric = internalAction({
    args: {
        metric: v.string(), // "TAM", "SAM", or "SOM"
        startupData: v.any(),
        keywords: v.optional(v.array(v.string())),
        attachedFiles: v.optional(v.array(v.object({
            name: v.string(), // filename
            data: v.string(), // content
            mimeType: v.string()
        }))),
        modelName: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const { metric, startupData, keywords, attachedFiles, modelName } = args;

        const prompt = `
            Analyze the ${metric} (Total/Serviceable Addressable/Obtainable Market) for this startup.
            
            Startup: ${startupData.name}
            Hypothesis: ${startupData.hypothesis}
            Problem: ${startupData.canvas['Problem'] || 'N/A'}
            Solution: ${startupData.canvas['Solution'] || 'N/A'}
            
            ${keywords?.length ? `Keywords: ${keywords.join(', ')}` : ''}
            
            TASK:
            1. Estimate the ${metric} in USD for the current year (2024-2026).
            2. Provide a brief rationale (1-2 sentences) citing logic or sources.
            
            OUTPUT FORMAT:
            Return ONLY a raw JSON object:
            {
                "value": 1000000000,
                "rationale": "Based on..."
            }
        `;

        // Construct parts including files if any
        let parts: any[] = [{ text: prompt }];

        if (attachedFiles && attachedFiles.length > 0) {
            attachedFiles.forEach((file: any) => {
                parts.push({
                    inlineData: {
                        mimeType: file.mimeType,
                        data: file.data
                    }
                });
            });
        }

        try {
            // Using callOllamaInternal or callAI
            // Since this is an internal action, we can use callOllamaInternal if exported, or just callAI via existing imports
            // But callAI maps to 'chat' action usually.
            // We'll reuse the logic from generateMarketResearch which uses a direct prompt construction.
            // We need to import 'callOllamaInternal' or copy logic?
            // 'callOllamaInternal' is imported from './ollamaService'.

            const response = await callOllamaInternal(
                modelName || "cloud",
                [{ role: 'user', parts }],
                "You are a market research expert. Output JSON only.",
                "json"
            );

            const clean = response.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(clean);
        } catch (e) {
            console.error(`Failed to analyze ${metric}`, e);
            return { value: 0, rationale: "Failed to estimate." };
        }
    }
});

export const compileResearchReport = internalAction({
    args: {
        tam: v.any(),
        sam: v.any(),
        som: v.any(),
        startupData: v.any(),
        keywords: v.optional(v.array(v.string())),
        attachedFiles: v.optional(v.array(v.object({
            name: v.string(), // filename
            data: v.string(), // content
            mimeType: v.string()
        }))),
        modelName: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const { tam, sam, som, startupData, keywords, attachedFiles } = args;

        const prompt = `
            Generate a comprehensive Market Research Report for: ${startupData.name}
            
            CONTEXTUAL DATA:
            - TAM: $${tam.value} (${tam.rationale})
            - SAM: $${sam.value} (${sam.rationale})
            - SOM: $${som.value} (${som.rationale})
            
            ${keywords?.length ? `Keywords: ${keywords.join(', ')}` : ''}
            
            Task:
            Write a "White Paper" style market research report in clean Markdown.
            Synthesize the provided TAM/SAM/SOM numbers into the narrative.
            Include a table comparing these metrics.
            
            Do NOT output the JSON block at the end, just the report content.
        `;

        let parts: any[] = [{ text: prompt }];
        if (attachedFiles && attachedFiles.length > 0) {
            attachedFiles.forEach((file: any) => {
                parts.push({
                    inlineData: {
                        mimeType: file.mimeType,
                        data: file.data
                    }
                });
            });
        }

        const response = await callOllamaInternal(
            args.modelName || "cloud",
            [{ role: 'user', parts }],
            "You are a professional market analyst.",
            undefined
        );

        return response;
    }
});
