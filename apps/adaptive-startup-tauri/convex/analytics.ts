
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getCooperationStats = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, args) => {
        const { projectId } = args;

        // Parallelize simple count queries
        const [
            allFeatures,
            allCompetitors,
            allDataSources,
            allDocuments,
            marketData,
            project
        ] = await Promise.all([
            ctx.db.query("features").withIndex("by_project", (q) => q.eq("projectId", projectId)).collect(),
            ctx.db.query("competitors").withIndex("by_project", (q) => q.eq("projectId", projectId)).collect(),
            ctx.db.query("data_sources").withIndex("by_project", (q) => q.eq("projectId", projectId)).collect(),
            ctx.db.query("documents").withIndex("by_project_type", (q) => q.eq("projectId", projectId)).collect(),
            ctx.db.query("market_data").withIndex("by_project", (q) => q.eq("projectId", projectId)).first(),
            ctx.db.get(projectId)
        ]);

        let humanCount = 0;
        let aiCount = 0;

        // Breakdown Analyzers
        const featureUsage: Record<string, { human: number, ai: number }> = {};
        const tagCounts: Record<string, number> = {};

        const incrementFeature = (name: string, isAI: boolean) => {
            if (!featureUsage[name]) featureUsage[name] = { human: 0, ai: 0 };
            if (isAI) featureUsage[name].ai++;
            else featureUsage[name].human++;
        };

        const processTags = (tags: any) => {
            if (!tags) return;
            if (Array.isArray(tags)) {
                tags.forEach((t: any) => {
                    const name = typeof t === 'string' ? t : t.name;
                    if (name) {
                        tagCounts[name] = (tagCounts[name] || 0) + 1;
                    }
                });
            }
        };

        const checkSource = (source: string | undefined, tags: any) => {
            const isAITag = Array.isArray(tags) && tags.some((t: any) => (typeof t === 'string' ? t : t.name) === 'AI Assisted');
            return source === 'AI' || isAITag;
        };

        // 1. Features
        allFeatures.forEach(f => {
            const isAI = checkSource(f.source, f.tags);
            if (isAI) aiCount++; else humanCount++;
            incrementFeature('Features', isAI);
            processTags(f.tags);
        });

        // 2. Competitors
        allCompetitors.forEach(c => {
            const isAI = checkSource(c.source, c.tags);
            if (isAI) aiCount++; else humanCount++;
            incrementFeature('Competitors', isAI);
            processTags(c.tags);
        });

        // 3. Data Sources
        allDataSources.forEach(d => {
            const isAI = checkSource(d.source, d.tags);
            if (isAI) aiCount++; else humanCount++;
            incrementFeature('Data Sources', isAI);
            processTags(d.tags);
        });

        // 4. Documents
        allDocuments.forEach(d => {
            // Documents specifically use tags heavily
            const isAI = checkSource(undefined, d.tags);
            if (isAI) aiCount++; else humanCount++;
            incrementFeature('Documents', isAI);
            processTags(d.tags);
        });

        // 5. Market Data
        if (marketData) {
            const isAI = checkSource(marketData.source, marketData.tags);
            if (isAI) aiCount++; else humanCount++;
            incrementFeature('Market Research', isAI);
            processTags(marketData.tags);
            processTags(marketData.keywords);
        }

        // 6. Project-level fields
        if (project) {
            // Journey Story
            if (project.journeyStorySource) {
                const isAI = project.journeyStorySource === 'AI';
                if (isAI) aiCount++; else humanCount++;
                incrementFeature('Journey Story', isAI);
            }

            // Milestones (inside project)
            if (project.milestones) {
                project.milestones.forEach((m: any) => {
                    const isAI = checkSource(m.source, m.tags);
                    if (isAI) aiCount++; else humanCount++;
                    incrementFeature('Timeline', isAI);
                    processTags(m.tags);
                });
            }
        }

        const total = humanCount + aiCount;
        const aiRatio = total > 0 ? (aiCount / total) * 100 : 0;
        const humanRatio = total > 0 ? (humanCount / total) * 100 : 0;

        return {
            humanCount,
            aiCount,
            total,
            aiRatio,
            humanRatio,
            featureUsage,
            tagCounts
        };
    }
});

export const getLatestReport = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("cooperation_reports")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .order("desc")
            .first();
    }
});

import { mutation } from "./_generated/server";

export const saveReport = mutation({
    args: {
        projectId: v.id("projects"),
        content: v.string(),
        stats: v.object({
            humanRatio: v.number(),
            aiRatio: v.number(),
            humanCount: v.number(),
            aiCount: v.number(),
        })
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const project = await ctx.db.get(args.projectId);
        if (!project) throw new Error("Project not found");

        return await ctx.db.insert("cooperation_reports", {
            projectId: args.projectId,
            orgId: project.orgId,
            content: args.content,
            stats: args.stats,
            createdAt: Date.now(),
            createdBy: identity.subject,
        });
    }
});
