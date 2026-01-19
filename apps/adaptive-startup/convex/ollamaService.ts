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

// Helper to call the Rust API (OpenResponses Protocol)
const callOpenResponses = async (
    endpoint: string,
    modelName: string,
    messages: { role: string; content: string; images?: string[] }[],
    apiKey?: string,
    tools?: any[]
): Promise<string> => {
    // Map messages to InputItems
    const inputItems = messages.map(msg => ({
        type: "message",
        role: msg.role,
        content: msg.images && msg.images.length > 0
            ? {
                type: "parts", // Assuming Rust API handles parts, or we need to check types.rs. 
                // types.rs InputContent::Parts(Vec<InputContentPart>)
                // types.rs InputContentPart::Text or InputText
                // Wait, types.rs didn't show Image support explicitly in InputContentPart? 
                // types.rs: Text { text: String }, InputText { text: String }
                // Use simple text content for now if images are not supported by Rust API types yet.
                // Reverting to simple string content for safety unless we verified multimodal support in Rust types.
                // The provided types.rs ONLY showed Text/InputText. 
                // So pass text content directly.
                val: msg.content // Fallback: ignore images for now or append to text?
            }
            : msg.content // InputContent::String(String) serialization
    })).map(item => {
        // Fix shape to match types.rs InputItem serialization (tag="type")
        // types.rs: InputItem { type="message", role, content }
        return {
            type: "message",
            role: item.role,
            content: item.content
        };
    });

    const body = {
        model: modelName,
        input: inputItems,
        stream: true, // We must stream per Rust API
        temperature: 0.7,
        max_output_tokens: 4096
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
            // Pass secrets via Custom Headers for the Worker to forward
            ...(process.env.OLLAMA_BASE_URL ? { 'x-custom-base-url': process.env.OLLAMA_BASE_URL } : {}),
            // Cloudflare Access Headers
            ...(process.env.CLOUDFLARE_ACCESS_ID && process.env.CLOUDFLARE_ACCESS_SECRET ? {
                'CF-Access-Client-Id': process.env.CLOUDFLARE_ACCESS_ID,
                'CF-Access-Client-Secret': process.env.CLOUDFLARE_ACCESS_SECRET
            } : {})
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Rust API Error (${response.status}): ${errorText}`);
    }

    // Handle SSE Stream
    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const jsonStr = line.substring(6).trim();
                if (jsonStr === '[DONE]') continue;

                try {
                    const event = JSON.parse(jsonStr);
                    // OpenResponseEvent types: response.output_text.delta
                    if (event.type === 'response.output_text.delta') {
                        fullText += event.delta;
                    }
                    if (event.type === 'error') {
                        throw new Error(event.error.message || "Unknown Stream Error");
                    }
                } catch (e) {
                    // Ignore parse errors for partial chunks (should implement proper buffer in prod)
                    // For now, this simple loop works for most complete lines
                }
            }
        }
    }

    return fullText;
};

// Internal helper logic
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
    const envModel = process.env.OLLAMA_MODEL || "gemini-3-flash-preview:cloud";

    const envEndpoint = process.env.OLLAMA_BASE_URL || process.env.OLLAMA_ENDPOINT || "https://ollama.com";
    const messages = mapToOllamaMessages(prompt, systemInstruction);

    // Remap generic model names to the environment-configured default
    let finalModelName = modelName;
    if (modelName === 'ollama' || modelName === 'cloud' || modelName === 'gemini-3-flash-preview' || modelName === 'ollama/gemini-3-flash-preview') {
        finalModelName = envModel;
    }

    // Switch: Rust API (OpenResponses) vs Legacy Ollama
    const isRustApi = envEndpoint.includes("workers.dev");

    if (isRustApi) {
        // Use new Rust API Logic
        // Normalize endpoint: ensure no /v1/responses suffix is duplicated
        let targetHelper = envEndpoint.replace(/\/$/, "");
        if (!targetHelper.endsWith("/v1/responses")) {
            targetHelper = `${targetHelper}/v1/responses`;
        }

        // Note: Rust API treats "ollama/..." prefix as routing hint.
        // We pass the mapped model name.
        return callOpenResponses(targetHelper, finalModelName, messages, finalApiKey, tools);
    }

    // --- Legacy Ollama Logic ---
    // For legacy Ollama, strip the 'ollama/' routing prefix if present
    if (!isRustApi && finalModelName.startsWith("ollama/")) {
        finalModelName = finalModelName.replace("ollama/", "");
    }
    // Normalize tools (Keep existing logic)
    const normalizedTools = tools?.map(t => {
        if ((t as any).googleSearch || t.type === "google_search") {
            return {
                type: "function",
                function: {
                    name: "web_search",
                    description: "Search the web for real-time information to answer current questions.",
                    parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] }
                }
            };
        }
        if (t.type === "function") return t;
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
        let targetUrl = "";
        let baseUrl = envEndpoint.replace(/\/$/, '');
        const isOfficialOllama = baseUrl.includes("ollama.com");

        // Ensure the correct path is appended
        let apiPath = "";
        if (isOfficialOllama) {
            apiPath = "/api";
        } else {
            apiPath = '/api';
        }

        if (!baseUrl.includes(apiPath)) {
            baseUrl = baseUrl.replace(/\/api$/, '');
            baseUrl += apiPath;
        }

        targetUrl = `${baseUrl}/chat`;

        const body = {
            model: finalModelName,
            messages: messages,
            stream: false,
            format: responseFormat || null,
            keep_alive: null,
            options: { temperature: 0 },
            tools: normalizedTools || [],
        };

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...((finalApiKey) ? { 'Authorization': `Bearer ${finalApiKey}` } : {}),
                ...(process.env.CLOUDFLARE_ACCESS_ID && process.env.CLOUDFLARE_ACCESS_SECRET ? {
                    'CF-Access-Client-Id': process.env.CLOUDFLARE_ACCESS_ID,
                    'CF-Access-Client-Secret': process.env.CLOUDFLARE_ACCESS_SECRET
                } : {})
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Cloud AI Error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || data.message?.content || data.response || data.content || "";
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
