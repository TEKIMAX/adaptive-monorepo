import { v } from "convex/values";
import { action, mutation, query, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";




import {
    UI_TOOLS,
    geminiTools,
    ROUTER_TOOL,
    tableTool,
    chartTool,
    pitchDeckTool,
    imageGenTool,
    modelCanvasTool,
    startupJourneyTool,
    customerCardsTool,
    financialSnapshotTool,
    swotAnalysisTool,
    actionCardTool,
    executionAuditTool
} from "./aiModules/tools";
import { getPersonaDirective, getChatSystemInstruction } from "./aiModules/prompts";

// Backwards compatibility for existing code using ALL_TOOLS
const ALL_TOOLS = UI_TOOLS;

// --- END TOOL DEFINITIONS ---

export const createChat = mutation({
    args: {
        projectId: v.optional(v.string()), // Relaxed to string to support localId or string IDs
        title: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const subject = identity.subject;

        // Fetch user for orgId
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        // Use DB ID if available, else fallback to identity subject (for non-synced users)
        const finalUserId = user?._id || subject;
        const orgId = user?.orgIds?.[0] || "default";

        // Normalize Project ID
        let validProjectId: Id<"projects"> | undefined = undefined;
        if (args.projectId) {
            validProjectId = ctx.db.normalizeId("projects", args.projectId) || undefined;
            if (!validProjectId) {
                const p = await ctx.db.query("projects").withIndex("by_localId", q => q.eq("localId", args.projectId as string)).first();
                if (p) validProjectId = p._id;
            }
        }

        const chatId = await ctx.db.insert("chats", {
            projectId: validProjectId,
            orgId,
            userId: finalUserId,
            title: args.title,
            createdAt: Date.now(),
            lastMessageAt: Date.now(),
        });

        return chatId;
    },
});

// Internal query for Actions to fetch messages
export const getMessagesInternal = internalQuery({
    args: { chatId: v.id("chats") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("messages")
            .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
            .collect();
    }
});

export const getMessages = query({
    args: { chatId: v.id("chats") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return []; // or throw

        return await ctx.db
            .query("messages")
            .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
            .collect();
    },
});

export const listChats = query({
    args: {
        projectId: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        // Determine the User ID to filter by.
        // If user record exists, use its _id.
        // If not (e.g. sync issue), use the identity.subject.
        const filterUserId = user?._id || identity.subject;

        if (args.projectId) {
            // Normalize
            let validProjectId = ctx.db.normalizeId("projects", args.projectId);
            if (!validProjectId) {
                const p = await ctx.db.query("projects").withIndex("by_localId", q => q.eq("localId", args.projectId as string)).first();
                if (p) validProjectId = p._id;
            }

            if (validProjectId) {
                const projectChats = await ctx.db
                    .query("chats")
                    .withIndex("by_project", q => q.eq("projectId", validProjectId))
                    .order("desc")
                    .collect();

                // Filter by userId to ensure isolation
                return projectChats.filter(chat => chat.userId === filterUserId);
            }
            return [];
        }

        if (user) {
            return await ctx.db
                .query("chats")
                .withIndex("by_user", q => q.eq("userId", user._id))
                .order("desc")
                .collect();
        } else {
            // Fallback scan if user record is missing but identity exists
            const allChats = await ctx.db.query("chats").order("desc").collect();
            return allChats.filter(c => c.userId === identity.subject);
        }
    }
});

export const saveMessage = mutation({
    args: {
        chatId: v.id("chats"),
        role: v.string(),
        content: v.string(),
        toolResults: v.optional(v.string()),
        groundingMetadata: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        // Verify chat exists first to avoid orphaned messages or errors on patching deleted chats
        const chat = await ctx.db.get(args.chatId);
        if (!chat) {
            // Chat not found, skipping message save.
            return;
            // Or throw new Error("Chat not found"); 
            // Returning allows the action to complete without crashing, but the user won't see the message.
        }

        await ctx.db.insert("messages", {
            chatId: args.chatId,
            role: args.role,
            content: args.content,
            createdAt: Date.now(),
            toolResults: args.toolResults,
            groundingMetadata: args.groundingMetadata
        });

        await ctx.db.patch(args.chatId, {
            lastMessageAt: Date.now()
        });
    }
});

export const updateChatTitle = mutation({
    args: { chatId: v.id("chats"), title: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const chat = await ctx.db.get(args.chatId);
        if (!chat) throw new Error("Chat not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        const isOwner = chat.userId === user?._id || chat.userId === identity.subject;
        if (!isOwner) throw new Error("Unauthorized");

        await ctx.db.patch(args.chatId, { title: args.title });
    }
});

export const deleteChat = mutation({
    args: { chatId: v.id("chats") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const chat = await ctx.db.get(args.chatId);
        if (!chat) throw new Error("Chat not found");

        // Verify ownership (fallback to subject comparison if userId format differs)
        // We know we save userId as either DB ID or subject.
        // Let's check both possibilities or assume exact match logic from retrieval.
        // Actually, explicit match is best.
        // But for safety, let's just check if identity matches via user lookup or subject.

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        const isOwner = chat.userId === user?._id || chat.userId === identity.subject;

        if (!isOwner) throw new Error("Unauthorized");

        // Delete all messages first
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_chat", q => q.eq("chatId", args.chatId))
            .collect();

        await Promise.all(messages.map(m => ctx.db.delete(m._id)));

        // Delete the chat
        await ctx.db.delete(args.chatId);
    }
});

// Internal mutation to append content for streaming
export const appendToMessage = mutation({
    args: {
        messageId: v.id("messages"),
        contentChunk: v.optional(v.string()), // Made optional to allow reasoning-only updates
        // Disable "thinking" for faster response as requested
        reasoningChunk: v.optional(v.string()), // New: Reasoning stream
    },
    handler: async (ctx, args) => {
        const msg = await ctx.db.get(args.messageId);
        if (!msg) return;

        let patches: any = {};
        if (args.contentChunk) {
            patches.content = msg.content + args.contentChunk;
        }
        if (args.reasoningChunk) {
            patches.reasoning = (msg.reasoning || "") + args.reasoningChunk;
        }

        if (Object.keys(patches).length > 0) {
            await ctx.db.patch(args.messageId, patches);
        }
    }
});
// Helper to format canvas data
const formatCanvas = (canvas: any) => {
    if (!canvas) return "No Lean Canvas data available.";
    return `
    - Problem: ${canvas.problem || "N/A"}
    - Solution: ${canvas.solution || "N/A"}
    - Value Prop: ${canvas.uniqueValueProposition || "N/A"}
    - Unfair Advantage: ${canvas.unfairAdvantage || "N/A"}
    - Customer Segments: ${canvas.customerSegments || "N/A"}
    - Key Metrics: ${canvas.keyMetrics || "N/A"}
    - Channels: ${canvas.channels || "N/A"}
    - Cost Structure: ${canvas.costStructure || "N/A"}
    - Revenue Streams: ${canvas.revenueStreams || "N/A"}
  `;
};

export const getProjectContext = query({
    args: { projectId: v.string() },
    handler: async (ctx, args) => {
        let validProjectId = ctx.db.normalizeId("projects", args.projectId);
        if (!validProjectId) {
            const p = await ctx.db.query("projects").withIndex("by_localId", q => q.eq("localId", args.projectId)).first();
            if (p) validProjectId = p._id;
        }

        if (!validProjectId) return null;

        const project = await ctx.db.get(validProjectId);
        if (!project) return null;

        // Fetch Active Canvas
        let canvasData = null;
        if (project.currentCanvasId) {
            canvasData = await ctx.db.get(project.currentCanvasId);
        } else {
            canvasData = await ctx.db
                .query("canvases")
                .withIndex("by_project", q => q.eq("projectId", project._id))
                .first();
        }

        // Fetch Deck Slides
        const slides = await ctx.db
            .query("deck_slides")
            .withIndex("by_project", q => q.eq("projectId", project._id))
            .collect();

        // Fetch Interviews (Limit to recent 10 to save tokens)
        const interviews = await ctx.db
            .query("interviews")
            .withIndex("by_project", q => q.eq("projectId", project._id))
            .order("desc")
            .take(10);

        return {
            hypothesis: project.hypothesis,
            canvas: canvasData,
            slides: slides.map(s => `[Slide ${s.order}] ${s.title}: ${s.content} (Notes: ${s.notes})`).join("\n"),
            interviews: interviews.map(i => `[Interview] ${i.customerStatus}: ${i.customData} (Analysis: ${i.aiAnalysis})`).join("\n"),
            expenses: (project.expenseLibrary || []).map(e => `- ${e.name}: $${e.amount} (${e.frequency}, ${e.category || 'General'})`).join("\n")
        };
    }
});

export const sendMessage = action({
    args: {
        chatId: v.id("chats"),
        content: v.string(), // User message
        pageContext: v.string(), // e.g., 'Business Plan'
        modelName: v.optional(v.string()), // Allow overriding
        projectId: v.optional(v.string()), // Relaxed to string
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.runQuery(api.users.getUser);

        // 0. CHECK LIMITS
        const limit = await ctx.runQuery(api.usage.checkLimit, {});
        if (!limit.allowed) {
            // Throw a structured error string that the frontend can parse
            throw new Error(JSON.stringify({
                code: "LIMIT_EXCEEDED",
                message: limit.reason,
                isPro: limit.isPro,
                limitType: limit.limitType
            }));
        }

        // 1. Save User Message
        await ctx.runMutation(api.aiChat.saveMessage, {
            chatId: args.chatId,
            role: 'user',
            content: args.content
        });

        // 2. Fetch Chat History
        const messages = await ctx.runQuery(api.aiChat.getMessages, { chatId: args.chatId });
        // Transform to Gemini format used in history
        const history = messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        // 3. Create Assistant Message Placeholder
        const messageId = await ctx.runMutation(api.aiChat.createAssistantMessage, {
            chatId: args.chatId
        });

        // 4. Stream response via NVIDIA Proxy
        // NOTE: GoogleGenAI SDK usage replaced by NVIDIA proxy fetch.

        // --- CONTEXT INJECTION ---
        let projectContextString = "";
        if (args.projectId) {
            const contextData = await ctx.runQuery(api.aiChat.getProjectContext, { projectId: args.projectId });
            if (contextData) {
                projectContextString = `
=== PROJECT CONTEXT (Use this to inform your answers) ===
HYPOTHESIS: ${contextData.hypothesis || "Not defined"}

LEAN CANVAS:
${formatCanvas(contextData.canvas)}

EXPENSE LIBRARY (Operating Costs):
${contextData.expenses || "No expenses recorded."}

PITCH DECK SLIDES:
${contextData.slides || "No slides yet."}

RECENT CUSTOMER INTERVIEWS:
${contextData.interviews || "No interviews yet."}
=========================================================
                    `;
            }
        }

        const interactionStyle = user?.onboardingData?.aiInteractionStyle || "Strategist";

        const personaDirective = getPersonaDirective(interactionStyle);
        const systemInstruction = getChatSystemInstruction(args.pageContext, projectContextString, personaDirective);

        // Map history to OpenAI/NVIDIA format
        // history is: { role: 'user'|'model', parts: [{ text: string }] }[]
        const streamMessages = [
            { role: 'system', content: systemInstruction },
            ...history.map(m => ({
                role: m.role === 'model' ? 'assistant' : m.role,
                content: m.parts[0]?.text || ""
            })),
            { role: 'user', content: args.content }
        ];

        try {
            // Define Endpoint
            const envEndpoint = process.env.OLLAMA_BASE_URL || process.env.OLLAMA_ENDPOINT || "https://ollama.com";
            const baseUrl = envEndpoint.replace(/\/$/, '');

            // Remap logic
            const envModel = process.env.OLLAMA_MODEL || "gemini-3-flash-preview:cloud";
            let modelName = args.modelName || "cloud";

            if (modelName === 'ollama' || modelName === 'cloud' || modelName === 'gemini-3-flash-preview' || modelName === 'ollama/gemini-3-flash-preview') {
                modelName = envModel;
            }

            const isRustApi = envEndpoint.includes("workers.dev");
            let targetUrl = `${baseUrl}/api/chat`;
            if (isRustApi) {
                targetUrl = `${baseUrl}/v1/responses`;
            }

            // --- Format Payload for Target API ---
            let payload: any;

            if (isRustApi) {
                // Rust API expects InputItem format with 'input' field
                const inputItems = streamMessages.map(msg => ({
                    type: "message",
                    role: msg.role,
                    content: msg.content
                }));

                payload = {
                    model: modelName,
                    input: inputItems,
                    stream: true,
                    temperature: 0.7,
                    max_output_tokens: 4096,
                    tools: geminiTools, // Rust API uses Gemini tool format
                    tool_choice: "auto",
                    thinking: true,
                    chat_template_kwargs: { "enable_thinking": true }
                };
            } else {
                // Standard Ollama / Legacy Logic
                payload = {
                    model: modelName,
                    messages: streamMessages,
                    stream: true,
                    temperature: 0.7,
                    top_p: 0.9,
                    max_tokens: 2048,
                    tools: ROUTER_TOOL,
                    tool_choice: "auto",
                    thinking: true,
                    chat_template_kwargs: { "enable_thinking": true }
                };
            }

            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(process.env.OLLAMA_API_KEY ? { 'Authorization': `Bearer ${process.env.OLLAMA_API_KEY}` } : {}),
                    ...(process.env.CLOUDFLARE_ACCESS_ID && process.env.CLOUDFLARE_ACCESS_SECRET ? {
                        'CF-Access-Client-Id': process.env.CLOUDFLARE_ACCESS_ID,
                        'CF-Access-Client-Secret': process.env.CLOUDFLARE_ACCESS_SECRET
                    } : {})
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`AI Service Error (${response.status}): ${errText}`);
            }

            if (!response.body) {
                throw new Error("No response body for streaming");
            }

            // Manual Stream Parsing (SSE & NDJSON)
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let fullText = "";
            let accumulatedToolCalls: Record<number, any> = {};

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                const lines = buffer.split('\n');
                buffer = lines.pop() || "";

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;

                    let data: any = null;

                    // 1. Handle SSE Format (data: {...})
                    if (trimmed.startsWith('data: ')) {
                        const dataStr = trimmed.slice(6);
                        if (dataStr === '[DONE]') continue;
                        try {
                            data = JSON.parse(dataStr);
                        } catch (e) { continue; }
                    }
                    // 2. Handle NDJSON Format ({...})
                    else if (trimmed.startsWith('{')) {
                        try {
                            data = JSON.parse(trimmed);
                        } catch (e) { continue; }
                    }

                    if (data) {
                        try {
                            // Logic: Parse Thinking, Content, and Tool Calls

                            // A. Thinking Delta
                            // Support various formats:
                            // 1. response.output_thinking.delta (Rust / OpenResponses)
                            // 2. choices[0].delta.reasoning_content (DeepSeek / OpenAI)
                            // 3. message.thinking (Ollama)
                            let reasoningDelta = "";
                            if (data.type === 'response.output_thinking.delta') {
                                reasoningDelta = data.delta;
                            } else {
                                reasoningDelta =
                                    data.choices?.[0]?.delta?.reasoning_content ||
                                    data.message?.thinking ||
                                    "";
                            }

                            // B. Content Delta
                            const contentDelta =
                                data.choices?.[0]?.delta?.content ||
                                data.message?.content ||
                                (data.type === 'response.output_text.delta' ? data.delta : "") || // OpenResponses text delta
                                "";

                            // Update DB if we have text or thinking
                            if (contentDelta || reasoningDelta) {
                                if (contentDelta) fullText += contentDelta;
                                await ctx.runMutation(api.aiChat.appendToMessage, {
                                    messageId,
                                    contentChunk: contentDelta || undefined,
                                    reasoningChunk: reasoningDelta || undefined
                                });
                            }

                            // C. Tool Calls
                            // Support OpenAI 'tool_calls' delta AND Rust 'response.output_item.added'
                            const toolCallsDelta = data.choices?.[0]?.delta?.tool_calls ||
                                data.tool_calls ||
                                data.message?.tool_calls;

                            // 1. OpenAI / Standard Format
                            if (toolCallsDelta) {
                                for (const tc of toolCallsDelta) {
                                    const index = tc.index || 0;
                                    if (!accumulatedToolCalls[index]) {
                                        accumulatedToolCalls[index] = {
                                            id: tc.id || "",
                                            type: tc.type || "function",
                                            function: { name: "", arguments: "" }
                                        };
                                    }
                                    if (tc.id) accumulatedToolCalls[index].id = tc.id;
                                    if (tc.function?.name) accumulatedToolCalls[index].function.name = tc.function.name;
                                    if (tc.function?.arguments) accumulatedToolCalls[index].function.arguments += tc.function.arguments;
                                }
                            }

                            // 2. Rust Worker Format (OpenResponses Item Added)
                            if (data.type === 'response.output_item.added' && data.item?.object === 'tool_call') {
                                const tc = data.item;
                                // We treat this as a completed tool call (usually) or a start.
                                // The worker emits the FULL tool call in 'item' usually for 'added' event?
                                // Or it might be the start.
                                // Based on previous debugging, 'item' contains the tool call definition.
                                const index = 0; // Assuming single tool call for now or we map ID
                                if (!accumulatedToolCalls[index]) {
                                    accumulatedToolCalls[index] = {
                                        id: tc.id || "call_" + Date.now(),
                                        type: "function",
                                        function: { name: tc.function.name, arguments: tc.function.arguments || "" }
                                    };
                                } else {
                                    // If already exists, maybe append? But 'added' usually implies full item.
                                    // We'll Overwrite/Append.
                                    accumulatedToolCalls[index].function.name = tc.function.name;
                                    accumulatedToolCalls[index].function.arguments = tc.function.arguments;
                                }
                            }

                        } catch (e) {
                            // ignore processing errors for a single chunk
                        }
                    }
                }
            }

            // Final flush
            if (buffer.trim()) {
                const trimmed = buffer.trim();
                let data: any = null;
                if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
                    try { data = JSON.parse(trimmed.slice(6)); } catch (e) { }
                } else if (trimmed.startsWith('{')) {
                    try { data = JSON.parse(trimmed); } catch (e) { }
                }

                if (data) {
                    const contentDelta = data.choices?.[0]?.delta?.content || data.message?.content;
                    if (contentDelta) {
                        fullText += contentDelta;
                        await ctx.runMutation(api.aiChat.appendToMessage, {
                            messageId,
                            contentChunk: contentDelta
                        });
                    }
                }
            }

            // Process Tool Calls
            // Convert accumulated map to array
            const finalToolCalls = Object.values(accumulatedToolCalls);
            if (finalToolCalls.length > 0) {
                const toolsToStore = await Promise.all(finalToolCalls.map(async (fc: any) => {
                    let args = {};
                    try {
                        args = JSON.parse(fc.function.arguments);
                    } catch (e) {
                        console.error("Failed to parse tool arguments:", fc.function.arguments);
                    }

                    let data = args as any;
                    const name = fc.function.name;

                    // Image Generation Logic (NVIDIA SDXL)
                    // ... (Keeping existing image gen logic as is, assuming endpoint handles it or we refactor later if needed. For now, focus on chat)
                    if (name === 'generateImage') {
                        try {
                            // Using API_BASE for image gen? 
                            // API_BASE is removed. Need to use envEndpoint or logic.
                            // Image Gen was using ${API_BASE}/api/media/generate-image
                            // We should probably use the same base url.
                            const endpointUrl = `${baseUrl}/api/media/generate-image`;

                            // ... Re-implement image gen fetch with new URL ...
                            const styleInstructions = " . Abstract, illustrative, artistic style. Diverse community representation if people are shown, but prefer abstract concepts. No specific individual leaders. High quality, modern design.";
                            const finalPrompt = data.prompt + styleInstructions;

                            // 1. Call API
                            const imgResponse = await fetch(endpointUrl, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    prompt: finalPrompt,
                                    cfg_scale: 7,
                                    steps: 25,
                                    width: 1024,
                                    height: 1024
                                })
                            });
                            if (!imgResponse.ok) {
                                throw new Error(`Image Gen Failed: ${imgResponse.statusText}`);
                            }

                            const imageBlob = await imgResponse.blob();

                            // 2. Upload to Convex Storage
                            // a. Get Upload URL
                            const uploadUrl = await ctx.runMutation(api.files.generateUploadUrl);

                            // b. POST to Upload URL
                            const uploadResponse = await fetch(uploadUrl, {
                                method: "POST",
                                headers: { "Content-Type": "image/png" },
                                body: imageBlob,
                            });

                            if (!uploadResponse.ok) {
                                throw new Error(`Storage Upload Failed: ${uploadResponse.statusText}`);
                            }

                            const { storageId } = await uploadResponse.json();

                            // 3. Get Download URL
                            const publicUrl = await ctx.runQuery(api.files.getDownloadUrl, { storageId });

                            if (data.isLogo) {
                                data = {
                                    ...data,
                                    url: [publicUrl, publicUrl] // Array format for logos if needed
                                };
                            } else {
                                data = {
                                    ...data,
                                    url: publicUrl
                                };
                            }
                        } catch (err) {
                            console.error("Image Generation Error:", err);
                            const placeholderUrl = `https://placehold.co/1024x1024/7f1d1d/ffffff/png?text=Generation+Failed&font=playfair-display`;
                            data = { ...data, url: placeholderUrl };
                        }
                    }

                    return {
                        type: name === 'renderTable' ? 'table' :
                            name === 'renderChart' ? 'chart' :
                                name === 'renderPitchDeck' ? 'pitch_deck' :
                                    name === 'generateImage' ? 'image' :
                                        name === 'renderModelCanvas' ? 'model_canvas' :
                                            name === 'updateStartupJourney' ? 'startup_journey' :
                                                name === 'renderCustomerCards' ? 'customer_cards' :
                                                    name === 'renderFinancialSnapshot' ? 'financial_snapshot' :
                                                        name === 'renderSWOTAnalysis' ? 'swot_analysis' :
                                                            name === 'renderOKRCard' ? 'okr_card' :
                                                                name === 'renderMarketSizing' ? 'market_sizing' :
                                                                    name === 'renderLegalRiskAssessment' ? 'legal_risk' :
                                                                        name === 'renderProcessFlow' ? 'process_flow' :
                                                                            name === 'renderActionCard' ? 'action_card' :
                                                                                name === 'renderExpenseAnalysis' ? 'expense_analysis' :
                                                                                    'unknown',
                        data: data
                    };

                }));

                // Update DB with tool results
                if (toolsToStore.length > 0) {
                    await ctx.runMutation(api.aiChat.updateMessageMetadata, {
                        messageId,
                        toolResults: JSON.stringify(toolsToStore)
                    });
                }
            }


            // 5. Schedule Background Analysis (Self-Adaptivity Loop - Level 2)
            // Trigger every 10 messages to keep the Knowledge Graph and Profile updated
            if (messages.length > 0 && messages.length % 10 === 0) {
                await ctx.scheduler.runAfter(0, api.ai.analyzeConversation, {
                    chatId: args.chatId,
                    projectId: args.projectId as any
                }).catch(e => console.error("Background Session Analysis failed:", e));
            }

        } catch (error: any) {
            console.error("AI Service Error:", error);
            await ctx.runMutation(api.aiChat.appendToMessage, {
                messageId,
                contentChunk: `\n\n*[System Error: Failed to connect to AI Analyst. ${error?.message || "Unknown error"}]*`
            });
            throw error;
        }
    }
});

export const createAssistantMessage = mutation({
    args: { chatId: v.id("chats") },
    handler: async (ctx, args) => {
        return await ctx.db.insert("messages", {
            chatId: args.chatId,
            role: 'assistant',
            content: '', // Start empty
            reasoning: '', // Start empty
            createdAt: Date.now()
        });
    }
});

export const updateMessageMetadata = mutation({
    args: {
        messageId: v.id("messages"),
        toolResults: v.optional(v.string()),
        groundingMetadata: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.messageId, {
            toolResults: args.toolResults,
            groundingMetadata: args.groundingMetadata
        });
    }
});

export const updateMessageTools = mutation({
    args: {
        messageId: v.id("messages"),
        toolCalls: v.any() // Using any to accept array of objects
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.messageId, {
            toolResults: JSON.stringify(args.toolCalls)
        });
    }
});

// Helper to safely add milestone
export const addMilestone = mutation({
    args: {
        projectId: v.string(), // accepting string to normalize inside
        milestone: v.any() // The milestone object
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        let validProjectId = ctx.db.normalizeId("projects", args.projectId);
        if (!validProjectId) {
            const p = await ctx.db.query("projects").withIndex("by_localId", q => q.eq("localId", args.projectId)).first();
            if (p) validProjectId = p._id;
        }

        if (!validProjectId) throw new Error("Project not found");

        const project = await ctx.db.get(validProjectId);
        if (!project) throw new Error("Project not found");

        const currentMilestones = project.milestones || [];
        // Append new milestone
        await ctx.db.patch(validProjectId, {
            milestones: [...currentMilestones, args.milestone]
        });
    }
});
