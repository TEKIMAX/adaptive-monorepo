import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const triggerProvisioning = internalAction({
    args: {
        userId: v.string(),
        email: v.string(),
        name: v.optional(v.string()),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        organizationName: v.optional(v.string()),
        subdomainName: v.optional(v.string()),
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

        console.log(`BRAIN: Triggering provisioning for ${args.email} (${args.subdomainName})`);

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
                    firstName: args.firstName || "",
                    lastName: args.lastName || "",
                    organizationName: args.organizationName || "",
                    subdomainName: args.subdomainName || "",
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
        subdomain: v.optional(v.string()),
        customDomain: v.optional(v.string()),
        orgId: v.optional(v.string()),
        workosUserId: v.optional(v.string()),
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
            subdomain: args.subdomain,
            customDomain: args.customDomain,
            orgId: args.orgId,
            workosUserId: args.workosUserId,
            plan: args.plan,
            status: "active",
            createdAt: Date.now(),
        });

        await ctx.db.patch(user._id, {
            instances,
            orgId: args.orgId || user.orgId,
            workosUserId: args.workosUserId || user.workosUserId
        });

        console.log(`BRAIN: Registered instance for ${args.email} at ${args.customDomain || args.instanceUrl}`);
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

// Save Stripe events for reference
export const saveStripeEvent = internalMutation({
    args: {
        eventId: v.string(),
        eventType: v.string(),
        customerId: v.optional(v.string()),
        customerEmail: v.optional(v.string()),
        subscriptionId: v.optional(v.string()),
        payload: v.any(),
    },
    handler: async (ctx, args) => {
        // Check if event already processed
        const existing = await ctx.db
            .query("stripeEvents")
            .withIndex("by_event_id", (q) => q.eq("eventId", args.eventId))
            .unique();

        if (existing) {
            console.log(`BRAIN: Stripe event ${args.eventId} already processed`);
            return existing._id;
        }

        return await ctx.db.insert("stripeEvents", {
            ...args,
            processedAt: Date.now(),
        });
    },
});

// Create provisioning job
export const createProvisioningJob = internalMutation({
    args: {
        email: v.string(),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        organizationName: v.optional(v.string()),
        subdomainName: v.optional(v.string()),
        userId: v.optional(v.string()),
        plan: v.string(),
        subscriptionId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("provisioningJobs", {
            email: args.email,
            firstName: args.firstName,
            lastName: args.lastName,
            organizationName: args.organizationName,
            subdomainName: args.subdomainName,
            userId: args.userId,
            plan: args.plan,
            subscriptionId: args.subscriptionId,
            status: "pending",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

// Query user data for GitHub Actions
export const getUserData = internalQuery({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        if (!user) return null;

        // Get latest provisioning job
        const jobs = await ctx.db
            .query("provisioningJobs")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .collect();

        return {
            user,
            latestJob: jobs.sort((a, b) => b.createdAt - a.createdAt)[0],
        };
    },
});
