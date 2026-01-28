
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getProjectSafe, requireAuth, verifyProjectAccess } from "./auth";

export const getInterviews = query({
    args: { projectId: v.string() }, // localId
    handler: async (ctx: any, args: any) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const project = await getProjectSafe(ctx, args.projectId);
        if (!project) return [];

        const records = await ctx.db
            .query("interviews")
            .withIndex("by_project", (q: any) => q.eq("projectId", project._id))
            .collect();

        // Flatten for frontend
        return records.map((r: any) => {
            const custom = JSON.parse(r.customData || "{}");
            // Map schema field to display key for frontend compatibility
            if (r.willingnessToPay) {
                custom['Willingness to Pay ($)'] = r.willingnessToPay;
            }
            return {
                id: r._id,
                customerStatus: r.customerStatus,
                sentiment: r.sentiment,
                aiAnalysis: r.aiAnalysis,
                willingnessToPay: r.willingnessToPay,
                ...custom // Spread dynamic fields (Name, Role, etc.)
            };
        });
    },
});

export const addInterview = mutation({
    args: {
        projectId: v.string(), // localId
        customerStatus: v.string(),
        customData: v.string(), // JSON
        willingnessToPay: v.optional(v.string())
    },
    handler: async (ctx: any, args: any) => {
        const identity = await requireAuth(ctx);
        const project = await getProjectSafe(ctx, args.projectId);

        if (!project) {
            throw new Error("Project not found");
        }

        const newId = await ctx.db.insert("interviews", {
            projectId: project._id,
            orgId: project.orgId,
            customerStatus: args.customerStatus,
            customData: args.customData,
            willingnessToPay: args.willingnessToPay,
            createdAt: Date.now()
        });
        return newId;
    }
});

export const updateInterview = mutation({
    args: {
        id: v.id("interviews"),
        customerStatus: v.optional(v.string()),
        sentiment: v.optional(v.string()),
        aiAnalysis: v.optional(v.string()),
        customData: v.optional(v.string()),
        willingnessToPay: v.optional(v.string())
    },
    handler: async (ctx: any, args: any) => {
        const identity = await requireAuth(ctx);
        const { id, ...fields } = args;
        const record = await ctx.db.get(id);
        if (!record) return;

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.subject))
            .unique();

        if (!user || !user.orgIds.includes(record.orgId)) {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(id, fields);
    }
});

export const deleteInterview = mutation({
    args: { id: v.id("interviews") },
    handler: async (ctx: any, args: any) => {
        const identity = await requireAuth(ctx);
        const record = await ctx.db.get(args.id);
        if (!record) return;

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.subject))
            .unique();

        if (!user || !user.orgIds.includes(record.orgId)) {
            throw new Error("Unauthorized");
        }
        await ctx.db.delete(args.id);
    }
});

// --- Video Interview Logic ---

export const generateUploadUrl = mutation(async (ctx) => {
    await requireAuth(ctx);
    return await ctx.storage.generateUploadUrl();
});

export const saveVideoInterview = mutation({
    args: {
        projectId: v.string(), // localId
        name: v.string(),
        email: v.string(),
        waiverFileId: v.optional(v.id("_storage")),
        videoFileId: v.optional(v.id("_storage")),
        linkedInterviewId: v.optional(v.string()),
    },
    handler: async (ctx: any, args: any) => {
        const identity = await requireAuth(ctx);
        const project = await getProjectSafe(ctx, args.projectId);

        if (!project) throw new Error("Project not found");

        await ctx.db.insert("video_interviews", {
            projectId: project._id,
            orgId: project.orgId,
            name: args.name,
            email: args.email,
            waiverFileId: args.waiverFileId,
            videoFileId: args.videoFileId,
            linkedInterviewId: args.linkedInterviewId,
            createdAt: Date.now()
        });
    }
});

export const getVideoInterviews = query({
    args: { projectId: v.string() }, // localId or _id
    handler: async (ctx: any, args: any) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const project = await getProjectSafe(ctx, args.projectId);
        if (!project) return [];

        const interviews = await ctx.db
            .query("video_interviews")
            .withIndex("by_project", (q: any) => q.eq("projectId", project._id))
            .filter((q: any) => q.eq(q.field("orgId"), project.orgId)) // Redundant if by_project is enough but safe
            .collect();

        // Enhance with URLs
        return await Promise.all(interviews.map(async (i: any) => ({
            ...i,
            waiverUrl: i.waiverFileId ? await ctx.storage.getUrl(i.waiverFileId) : null,
            videoUrl: i.videoFileId ? await ctx.storage.getUrl(i.videoFileId) : null
        })));
    }
});

export const deleteVideoInterview = mutation({
    args: { id: v.id("video_interviews") },
    handler: async (ctx: any, args: any) => {
        const identity = await requireAuth(ctx);
        const interview = await ctx.db.get(args.id);
        if (!interview) return;

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.subject))
            .unique();

        if (!user || !user.orgIds.includes(interview.orgId)) {
            throw new Error("Unauthorized");
        }

        if (interview.waiverFileId) await ctx.storage.delete(interview.waiverFileId);
        if (interview.videoFileId) await ctx.storage.delete(interview.videoFileId);
        await ctx.db.delete(args.id);
    }
});

export const updateVideoInterview = mutation({
    args: {
        id: v.id("video_interviews"),
        linkedInterviewId: v.optional(v.string()),
        videoFileId: v.optional(v.id("_storage")),
        waiverFileId: v.optional(v.id("_storage"))
    },
    handler: async (ctx: any, args: any) => {
        const identity = await requireAuth(ctx);
        const { id, ...fields } = args;
        const record = await ctx.db.get(id);
        if (!record) return;

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.subject))
            .unique();

        if (!user || !user.orgIds.includes(record.orgId)) {
            throw new Error("Unauthorized");
        }

        // Cleanup old files if being replaced
        if (args.videoFileId && record.videoFileId && args.videoFileId !== record.videoFileId) {
            await ctx.storage.delete(record.videoFileId);
        }
        if (args.waiverFileId && record.waiverFileId && args.waiverFileId !== record.waiverFileId) {
            await ctx.storage.delete(record.waiverFileId);
        }

        await ctx.db.patch(id, fields);
    }
});

export const bulkAddInterviews = mutation({
    args: {
        projectId: v.string(),
        interviews: v.array(v.object({
            customerStatus: v.string(),
            customData: v.string(),
            willingnessToPay: v.optional(v.string())
        })),
        signature: v.optional(v.string()),
        publicKey: v.optional(v.string())
    },
    handler: async (ctx: any, args: any) => {
        const identity = await requireAuth(ctx);
        const project = await getProjectSafe(ctx, args.projectId);
        if (!project) throw new Error("Project not found");

        await Promise.all(args.interviews.map((i: any) =>
            ctx.db.insert("interviews", {
                projectId: project._id,
                orgId: project.orgId,
                customerStatus: i.customerStatus,
                customData: i.customData,
                willingnessToPay: i.willingnessToPay,
                createdAt: Date.now()
            })
        ));

        // Log Activity with Signature
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.subject))
            .unique();

        await ctx.db.insert("activity_log", {
            projectId: project._id,
            orgId: project.orgId,
            userId: identity.subject,
            userName: user?.name || "Unknown User",
            action: "CREATE",
            entityType: "customer_profiles",
            entityId: project._id, // Associated with project
            entityName: `${args.interviews.length} Customer Profiles`,
            changes: `Created ${args.interviews.length} customer profiles via AI Suggestion`,
            signature: args.signature,
            publicKey: args.publicKey,
            timestamp: Date.now()
        });
    }
});

export const bulkDeleteInterviews = mutation({
    args: { ids: v.array(v.id("interviews")) },
    handler: async (ctx: any, args: any) => {
        const identity = await requireAuth(ctx);
        // Verify one by one or fetch all.
        // For simplicity:
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.subject))
            .unique();

        if (!user) throw new Error("Unauthorized");

        await Promise.all(args.ids.map(async (id: any) => {
            const record = await ctx.db.get(id);
            if (record && user.orgIds.includes(record.orgId)) {
                await ctx.db.delete(id);
            }
        }));
    }
});


