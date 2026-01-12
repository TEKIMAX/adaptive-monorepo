import { WorkflowManager } from "@convex-dev/workflow";
import { components, internal } from "./_generated/api";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const workflow = new WorkflowManager(components.workflow);

export const deepResearch = workflow.define({
    args: {
        projectId: v.string(), // Added for context
        startupData: v.any(),
        keywords: v.optional(v.array(v.string())),
        attachedFiles: v.optional(v.array(v.object({
            name: v.string(),
            data: v.string(),
            mimeType: v.string()
        }))),
        modelName: v.optional(v.string())
    },
    handler: async (step, args) => {
        // Parallel Execution of Metrics Analysis
        const [tam, sam, som] = await Promise.all([
            step.runAction(internal.ai.analyzeMetric, {
                metric: "TAM",
                startupData: args.startupData,
                keywords: args.keywords,
                attachedFiles: args.attachedFiles,
                modelName: args.modelName
            }, { name: "analyzeTAM" }),
            step.runAction(internal.ai.analyzeMetric, {
                metric: "SAM",
                startupData: args.startupData,
                keywords: args.keywords,
                attachedFiles: args.attachedFiles,
                modelName: args.modelName
            }, { name: "analyzeSAM" }),
            step.runAction(internal.ai.analyzeMetric, {
                metric: "SOM",
                startupData: args.startupData,
                keywords: args.keywords,
                attachedFiles: args.attachedFiles,
                modelName: args.modelName
            }, { name: "analyzeSOM" })
        ]);

        // Compile Final Report
        const report = await step.runAction(internal.ai.compileResearchReport, {
            tam,
            sam,
            som,
            startupData: args.startupData,
            keywords: args.keywords,
            attachedFiles: args.attachedFiles,
            modelName: args.modelName
        }, { name: "compileReport" });

        // Save final result specifically
        await step.runMutation(internal.market.saveMarketAnalysisResult, {
            projectId: args.projectId,
            tam: tam.value,
            sam: sam.value,
            som: som.value,
            reportContent: report
        }, { name: "saveResult" });

        return {
            tam: tam.value,
            sam: sam.value,
            som: som.value,
            reportContent: report
        };
    }
});

export const startResearch = mutation({
    args: {
        projectId: v.string(), // Added for context
        startupData: v.any(),
        keywords: v.optional(v.array(v.string())),
        attachedFiles: v.optional(v.array(v.object({
            name: v.string(),
            data: v.string(),
            mimeType: v.string()
        }))),
        modelName: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        // 1. Start the workflow
        const runId = await workflow.start(ctx, internal.marketResearch.deepResearch, args);

        // 2. Mark project market data as analyzing + save runId
        const existing = await ctx.db
            .query("market_data")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId as Id<"projects">))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                // @ts-ignore - Schema update pending
                workflowId: runId,
                status: 'analyzing',
                updatedAt: Date.now()
            });
        } else {
            // Create placeholder if not exists
            await ctx.db.insert("market_data", {
                projectId: args.projectId as Id<"projects">,
                orgId: "temp",
                // @ts-ignore
                workflowId: runId,
                status: 'analyzing',
                updatedAt: Date.now(),
                tam: 0, sam: 0, som: 0, reportContent: ""
            } as any);
        }

        return runId;
    }
});
