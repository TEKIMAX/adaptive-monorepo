// Direct fetch version for custom cloud endpoints
import { action } from "./_generated/server";
import { v } from "convex/values";

export const SYSTEM_INSTRUCTION = `You are an expert startup consultant and venture capitalist. 
Your goal is to help founders refine their business models using the Lean Canvas framework and create compelling pitch decks.
Be concise, punchy, and professional.`;

// Helper to map Gemini-style messages to Ollama
const mapToOllamaMessages = (
    prompt: string | { role: string, parts: any[] }[],
    systemInstruction?: string
) => {
    const messages: { role: string; content: string; images?: string[] }[] = [];

    // Add system instruction if present
    if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
    }

    if (typeof prompt === 'string') {
        messages.push({ role: 'user', content: prompt });
    } else {
        prompt.forEach((msg) => {
            let content = "";
            const images: string[] = [];

            msg.parts.forEach((part) => {
                if (part.text) content += part.text;
                if (part.inlineData) {
                    // Gemini uses inlineData: { mimeType, data }
                    // Ollama expects base64 strings in 'images'
                    images.push(part.inlineData.data);
                }
            });

            messages.push({
                role: msg.role === 'model' ? 'assistant' : msg.role,
                content: content,
                images: images.length > 0 ? images : undefined
            });
        });
    }
    return messages;
};

// Internal helper function for direct calls across files (within the same package)
export const callOllamaInternal = async (
    modelName: string,
    prompt: string | { role: string, parts: any[] }[],
    systemInstruction?: string,
    responseFormat?: "json" | object,
    apiKey?: string,
    tools?: any[]
): Promise<string> => {
    const envApiKey = process.env.OLLAMA_API_KEY;
    const finalApiKey = apiKey || envApiKey;
    const envModel = process.env.OLLAMA_MODEL || "gemini-3-flash-preview";
    const envNvidiaModel = process.env.OLLAMA_NVIDIA_MODEL || "nemotron-mini:latest";

    // Base cloud endpoint from environment
    const envEndpoint = process.env.OLLAMA_ENDPOINT || process.env.OLLAMA_BASE_URL || "https://api.tekimax.com";

    // Detect if we should use NVIDIA endpoint (Tekimax Proxy specific)
    const useNvidia = modelName.includes('nemotron') || modelName.includes('nvidia');

    // Map generic aliases to environment variables
    let finalModelName = modelName;
    if (useNvidia) {
        if (modelName === 'nemotron' || modelName === 'nvidia' || modelName === 'nemotron-mini') {
            finalModelName = envNvidiaModel;
        }
    } else if (modelName === 'ollama' || modelName === 'cloud') {
        finalModelName = envModel;
    }
    const messages = mapToOllamaMessages(prompt, systemInstruction);

    // Normalize tools for the proxy (must have 'type' field and 'function' field if type is 'function')
    const normalizedTools = tools?.map(t => {
        // Special mapping for Gemini-style google_search to OpenAI-style function
        if ((t as any).googleSearch || t.type === "google_search") {
            return {
                type: "function",
                function: {
                    name: "web_search",
                    description: "Search the web for real-time information to answer current questions.",
                    parameters: {
                        type: "object",
                        properties: {
                            query: { type: "string", description: "The search query" }
                        },
                        required: ["query"]
                    }
                }
            };
        }

        if (t.type === "function") return t;

        // Default to function if type is missing or custom
        return {
            type: "function",
            function: {
                name: (t as any).name || "unnamed_tool",
                description: (t as any).description || "No description provided",
                parameters: (t as any).parameters || { type: "object", properties: {} }
            }
        };
    });

    try {
        // Choose endpoint: Always use the chat-style endpoint, schema is passed in 'format'
        let targetUrl = "";

        // Tekimax Proxy / Custom Endpoint
        // Sanitize base URL
        let baseUrl = envEndpoint.replace(/\/$/, '');

        // Detect if we are hitting the official Ollama Cloud API or the Tekimax Proxy
        const isOfficialOllama = baseUrl.includes("ollama.com");

        // Ensure the correct path is appended
        // Official Ollama: /api
        // Tekimax Proxy: /api/cloud or /api/nvidia/cloud
        let apiPath = "";
        if (isOfficialOllama) {
            apiPath = "/api";
        } else {
            apiPath = useNvidia ? '/api/nvidia/cloud' : '/api/cloud';
        }

        if (!baseUrl.includes(apiPath)) {
            // Remove any other api paths first to avoid double nesting
            baseUrl = baseUrl.replace(/\/api\/cloud$/, '').replace(/\/api\/nvidia\/cloud$/, '').replace(/\/api\/nvidia$/, '').replace(/\/api$/, '');
            baseUrl += apiPath;
        }

        // Ollama uses /chat for the chat API which supports 'format'
        targetUrl = `${baseUrl}/chat`;


        const body = {
            model: finalModelName,
            messages: messages,
            stream: false,
            // If responseFormat is an object (schema), pass it directly. 
            // If it's "json", pass "json".
            format: responseFormat || null,
            keep_alive: null,
            logprobs: null,
            options: {
                temperature: 0 // Lower temperature for structured data
            },
            think: null,
            tools: normalizedTools || [],
            top_logprobs: null,
            // NVIDIA specific / Extended OpenAI compatibility
            chat_template_kwargs: null,
            max_tokens: null,
            reasoning_budget: null,
            seed: null,
            temperature: null,
            top_p: null
        };

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Always send Authorization header for Cloud calls if key is present
                // NVIDIA calls on Tekimax proxy typically don't need the key (public/internal)
                ...((finalApiKey) ? { 'Authorization': `Bearer ${finalApiKey}` } : {})
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Cloud AI Error (${response.status}): ${errorText}`);
        }

        const data = await response.json();

        // Handle potential different response shapes (Ollama standard vs OpenAI/NVIDIA vs custom)
        const content =
            data.choices?.[0]?.message?.content ||
            data.message?.content ||
            data.response ||
            data.content ||
            "";

        return content;
    } catch (error) {
        console.error("Cloud AI Error:", error);
        throw error;
    }
};

// Convex Action - Exposed to be called via ctx.runAction
export const callOllama = action({
    args: {
        model: v.string(),
        messages: v.array(v.object({
            role: v.string(),
            content: v.string()
        })),
        jsonMode: v.optional(v.boolean())
    },
    handler: async (_ctx, args) => {
        // Convert messages to the format expected by the internal function
        const prompt = args.messages.map(m => ({
            role: m.role,
            parts: [{ text: m.content }]
        }));

        const systemMsg = args.messages.find(m => m.role === 'system');
        const systemInstruction = systemMsg?.content;

        // Filter out system messages from the prompt since we pass it separately
        const filteredPrompt = prompt.filter(m => m.role !== 'system');

        return callOllamaInternal(
            args.model,
            filteredPrompt.length > 0 ? filteredPrompt : "",
            systemInstruction,
            args.jsonMode ? "json" : undefined
        );
    }
});
