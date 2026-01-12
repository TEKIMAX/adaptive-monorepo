import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getProjectSafe, requireAuth } from "./auth";


export const createFolder = mutation({
    args: {
        projectId: v.string(), // Changed from v.id("projects") to support localId
        name: v.string(),
        parentId: v.optional(v.id("folders")),
        tags: v.optional(v.array(v.object({ name: v.string(), color: v.string() }))),
    },
    handler: async (ctx, args) => {
        const identity = await requireAuth(ctx);
        const project = await getProjectSafe(ctx, args.projectId);
        if (!project) throw new Error("Project not found");

        const folderId = await ctx.db.insert("folders", {
            projectId: project._id,
            orgId: project.orgId,
            name: args.name,
            parentId: args.parentId,
            tags: args.tags,
            createdAt: Date.now(),
        });

        return folderId;
    },
});

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        await requireAuth(ctx);
        return await ctx.storage.generateUploadUrl();
    },
});

export const saveFile = mutation({
    args: {
        projectId: v.string(), // Changed from v.id("projects")
        folderId: v.optional(v.id("folders")),
        name: v.string(),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        tags: v.optional(v.array(v.object({ name: v.string(), color: v.string() }))),
        type: v.string(),
        storageId: v.id("_storage"),
        size: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await requireAuth(ctx);
        const project = await getProjectSafe(ctx, args.projectId);
        if (!project) throw new Error("Project not found");

        const fileId = await ctx.db.insert("files", {
            projectId: project._id,
            orgId: project.orgId,
            folderId: args.folderId,
            name: args.name,
            title: args.title,
            description: args.description,
            tags: args.tags,
            type: args.type,
            storageId: args.storageId,
            size: args.size,
            createdAt: Date.now(),
        });

        return fileId;
    },
});

export const moveFile = mutation({
    args: {
        fileId: v.id("files"),
        folderId: v.optional(v.union(v.id("folders"), v.null())), // New parent folder (or null for root)
    },
    handler: async (ctx, args) => {
        const identity = await requireAuth(ctx);
        const file = await ctx.db.get(args.fileId);
        if (!file) return;

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.subject))
            .unique();

        if (!user || !user.orgIds.includes(file.orgId)) {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.fileId, {
            folderId: args.hasOwnProperty('folderId') ? args.folderId : undefined,
        });
    },
});

export const moveFolder = mutation({
    args: {
        folderId: v.id("folders"),
        parentId: v.optional(v.union(v.id("folders"), v.null())),
    },
    handler: async (ctx, args) => {
        const identity = await requireAuth(ctx);
        const folder = await ctx.db.get(args.folderId);
        if (!folder) return;

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.subject))
            .unique();

        if (!user || !user.orgIds.includes(folder.orgId)) {
            throw new Error("Unauthorized");
        }

        // Circular check is complex in backend, skipping for now (UI handles it usually, or assume simple move)
        // Ideally should check if new parent is child of current folder.

        await ctx.db.patch(args.folderId, {
            parentId: args.hasOwnProperty('parentId') ? args.parentId : undefined,
        });
    },
});

export const updateFolder = mutation({
    args: {
        folderId: v.id("folders"),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await requireAuth(ctx);
        const folder = await ctx.db.get(args.folderId);
        if (!folder) return;

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.subject))
            .unique();

        if (!user || !user.orgIds.includes(folder.orgId)) {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.folderId, {
            name: args.name,
        });
    },
});

export const updateFile = mutation({
    args: {
        fileId: v.id("files"),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await requireAuth(ctx);
        const file = await ctx.db.get(args.fileId);
        if (!file) return;

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.subject))
            .unique();

        if (!user || !user.orgIds.includes(file.orgId)) {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.fileId, {
            name: args.name,
        });
    },
});

export const list = query({
    args: {
        projectId: v.string(),
        parentId: v.optional(v.id("folders")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return { folders: [], files: [], documents: [] };

        const project = await getProjectSafe(ctx, args.projectId);
        if (!project) return { folders: [], files: [], documents: [] };

        const folders = await ctx.db
            .query("folders")
            .withIndex("by_project_parent", (q) =>
                q.eq("projectId", project._id).eq("parentId", args.parentId)
            )
            .collect();

        const files = await ctx.db
            .query("files")
            .withIndex("by_project_folder", (q) =>
                q.eq("projectId", project._id).eq("folderId", args.parentId)
            )
            .collect();

        // Also fetch documents (text docs)
        const documents = await ctx.db
            .query("documents")
            .withIndex("by_project_folder", (q) =>
                q.eq("projectId", project._id).eq("folderId", args.parentId)
            )
            .collect();

        // Get signed URLs for files
        const filesWithUrls = await Promise.all(
            files.map(async (file) => ({
                ...file,
                url: await ctx.storage.getUrl(file.storageId),
            }))
        );

        return { folders, files: filesWithUrls, documents };
    },
});

export const getAllFileSystem = query({
    args: {
        projectId: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return { folders: [], files: [], documents: [] };

        const project = await getProjectSafe(ctx, args.projectId);
        if (!project) return { folders: [], files: [], documents: [] };

        const folders = await ctx.db
            .query("folders")
            .withIndex("by_project_parent", (q) => q.eq("projectId", project._id))
            .collect();

        const files = await ctx.db
            .query("files")
            .withIndex("by_project_folder", (q) => q.eq("projectId", project._id))
            .collect();

        const documents = await ctx.db
            .query("documents")
            .withIndex("by_project_folder", (q) => q.eq("projectId", project._id))
            .collect();

        return { folders, files, documents };
    },
});

export const deleteFolder = mutation({
    args: { folderId: v.id("folders") },
    handler: async (ctx, args) => {
        const identity = await requireAuth(ctx);
        const folder = await ctx.db.get(args.folderId);
        if (!folder) return;

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.subject))
            .unique();

        if (!user || !user.orgIds.includes(folder.orgId)) {
            throw new Error("Unauthorized");
        }

        // Recursive Delete
        await deleteFolderRecursive(ctx, args.folderId, folder.projectId);
    },
});

// Recursive Helper Logic inside the mutation context
async function deleteFolderRecursive(ctx: any, folderId: any, projectId: any) {
    // 1. Find Subfolders
    const subfolders = await ctx.db
        .query("folders")
        .withIndex("by_project_parent", (q: any) => q.eq("projectId", projectId).eq("parentId", folderId))
        .collect();

    for (const sub of subfolders) {
        await deleteFolderRecursive(ctx, sub._id, projectId);
    }

    // 2. Delete Files in this folder
    const files = await ctx.db
        .query("files")
        .withIndex("by_project_folder", (q: any) => q.eq("projectId", projectId).eq("folderId", folderId))
        .collect();

    for (const file of files) {
        await ctx.storage.delete(file.storageId);
        await ctx.db.delete(file._id);
    }

    // 3. Delete Documents in this folder
    const docs = await ctx.db
        .query("documents")
        .withIndex("by_project_folder", (q: any) => q.eq("projectId", projectId).eq("folderId", folderId))
        .collect();

    for (const doc of docs) {
        await ctx.db.delete(doc._id);
    }

    // 4. Delete the folder itself
    await ctx.db.delete(folderId);
}

export const deleteFile = mutation({
    args: {
        fileId: v.id("files"),
    },
    handler: async (ctx, args) => {
        const identity = await requireAuth(ctx);
        const file = await ctx.db.get(args.fileId);
        if (!file) return;

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.subject))
            .unique();

        if (!user || !user.orgIds.includes(file.orgId)) {
            throw new Error("Unauthorized");
        }

        await ctx.storage.delete(file.storageId);
        await ctx.db.delete(args.fileId);
    },
});

export const searchFiles = query({
    args: {
        projectId: v.string(),
        query: v.string(),
        type: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const project = await getProjectSafe(ctx, args.projectId);
        if (!project) return [];

        const results = await (args.type
            ? ctx.db.query("files").withSearchIndex("search_by_name", q => q.search("name", args.query).eq("projectId", project._id).eq("type", args.type)).collect()
            : ctx.db.query("files").withSearchIndex("search_by_name", q => q.search("name", args.query).eq("projectId", project._id)).collect()
        );

        // ... existing code ...
        return results.map(file => ({
            id: file._id,
            name: file.name,
            type: file.type,
            storageId: file.storageId,
            size: file.size,
            folderId: file.folderId
        }));
    }
});

export const getDownloadUrl = query({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.storageId);
    },
});
