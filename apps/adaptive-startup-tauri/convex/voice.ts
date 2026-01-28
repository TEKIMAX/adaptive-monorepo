"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { GoogleGenAI } from "@google/genai";
import { internal } from "./_generated/api";

// Helper to initialize AI
const getAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Server API Key missing");
    return new GoogleGenAI({ apiKey });
};

export const processAudioQuestion = action({
    args: {
        audioData: v.string(), // Base64 encoded audio
        mimeType: v.string(),
        startupData: v.any(), // Context
        history: v.optional(v.array(v.object({
            role: v.string(),
            text: v.string()
        })))
    },
    handler: async (ctx, args) => {
        try {
            const ai = getAI();
            // User requested "actual conversational model" - gemini-2.0-flash-exp is the latest multimodal one.
            // gemini-1.5-pro is also good but 2.0 is faster for voice.
            const modelName = "gemini-2.0-flash-exp";

            const userPrompt = "Listen to the user's answer or question. Compare it against their Business Model Canvas context provided below. Guide them or quiz them on the next logical step. You have access to Google Search if you need to fetch real-time examples or market data to help them. Keep your response conversational, encouraging, and brief (under 3 sentences) so it flows naturally as a voice conversation.";

            const contextBlock = `
            [Startup Context]
            Name: ${args.startupData.name}
            Hypothesis: ${args.startupData.hypothesis}
            Problem: ${args.startupData.canvas['Problem'] || 'N/A'}
            Solution: ${args.startupData.canvas['Solution'] || 'N/A'}
            Customer Segments: ${args.startupData.canvas['Customer Segments'] || 'N/A'}
            `;

            const parts: any[] = [
                { text: contextBlock },
                { text: args.history ? `Previous conversation:\n${args.history.map(h => `${h.role}: ${h.text}`).join('\n')}` : "" },
                { text: "User's Audio Input:" },
                {
                    inlineData: {
                        mimeType: args.mimeType,
                        data: args.audioData
                    }
                },
                { text: userPrompt }
            ];

            // Enable Google Search Tool
            const tools = [{ googleSearch: {} }];

            const response = await ai.models.generateContent({
                model: modelName,
                contents: [{ role: 'user', parts: parts }],
                config: {
                    // We want text back, which we will read aloud on client.
                    // Note: When using tools, we cannot strictly enforce responseMimeType="text/plain" 
                    // if it conflicts, but usually it's fine. 
                    // For safety with tools, we often omit it or use it carefully.
                    // We'll omit it to let the model decide best format (usually text for chat).
                    tools: tools
                }
            });

            const textResponse = response.text || "I didn't catch that. Could you say it again?";

            return {
                text: textResponse,
                // In a more advanced version, we would generate audio here too
            };

        } catch (error) {
            console.error("Voice Processing Error:", error);
            return {
                text: "I'm having trouble hearing you right now. Please try again."
            };
        }
    }
});
