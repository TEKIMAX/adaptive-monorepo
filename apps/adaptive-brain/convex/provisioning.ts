import { internalAction, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const triggerProvisioning = internalAction({
    args: {
        userId: v.string(),
        email: v.string(),
        name: v.optional(v.string()),
        plan: v.string(),
        subscriptionId: v.string(),
    },
    handler: async (ctx, args) => {
        const githubToken = process.env.GITHUB_ACCESS_TOKEN;
        const owner = process.env.GITHUB_OWNER;
        const repo = process.env.GITHUB_REPO;

        if (!githubToken || !owner || !repo) {
            console.error("Missing GitHub configuration in BRAIN");
            return;
        }

        console.log(`BRAIN: Triggering provisioning for ${args.email}`);

        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
            method: "POST",
            headers: {
                "Authorization": `token ${githubToken}`,
                "Accept": "application/vnd.github.v3+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                event_type: "provision_backend",
                client_payload: {
                    userId: args.userId,
                    email: args.email,
                    name: args.name || "",
                    subscriptionId: args.subscriptionId,
                    plan: args.plan,
                    callbackUrl: process.env.CONVEX_SITE_URL, // So GHA can call home
                }
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`GHA Trigger Failed: ${error}`);
        }
    }
});

export const registerInstance = internalMutation({
    args: {
        email: v.string(),
        instanceUrl: v.string(),
        projectSlug: v.string(),
        orgId: v.optional(v.string()),
        plan: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        if (!user) throw new Error("User not found in BRAIN");

        const instances = user.instances || [];
        instances.push({
            instanceUrl: args.instanceUrl,
            projectSlug: args.projectSlug,
            orgId: args.orgId,
            plan: args.plan,
            status: "active",
            createdAt: Date.now(),
        });

        await ctx.db.patch(user._id, { instances });

        console.log(`BRAIN: Registered instance for ${args.email} at ${args.instanceUrl}`);
    }
});

export const suspendInstances = internalMutation({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        if (!user) return;

        const instances = (user.instances || []).map(inst => ({
            ...inst,
            status: "suspended"
        }));

        await ctx.db.patch(user._id, {
            subscriptionStatus: "canceled",
            instances
        });

        console.log(`BRAIN: Suspended ${instances.length} instances for ${args.email}`);
    }
});
