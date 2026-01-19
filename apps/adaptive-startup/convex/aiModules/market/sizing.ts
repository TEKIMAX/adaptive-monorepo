"use node";
import { v } from "convex/values";
import { action } from "../../_generated/server";
import { api } from "../../_generated/api";
import { callAI } from "../shared";

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
