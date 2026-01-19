"use node";
import { v } from "convex/values";
import { action } from "../../_generated/server";
import {
    getCompetitorAnalysisPrompt,
    getCompetitorFillPrompt
} from "../prompts";
import { callAI } from "../shared";

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

        const prompt = getCompetitorAnalysisPrompt(
            data.name,
            data.hypothesis,
            data.canvas['Problem'],
            data.canvas['Solution'],
            data.canvas['Unique Value Proposition'],
            data.market.tam,
            data.market.sam,
            data.market.som,
            data.revenueModel.businessModelType,
            data.revenueModel.revenueStreams
        );

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

        const prompt = getCompetitorFillPrompt(
            data.name,
            data.hypothesis,
            data.canvas,
            competitorsWithEmptyCells.map(c => `- ${c.name}: Need data for [${c.emptyAttributes.join(', ')}]`).join('\n'),
            attributes.join(', ')
        );

        try {
            const tools = [{ googleSearch: {} }];

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
