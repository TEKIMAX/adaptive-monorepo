import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        email: v.string(),
        name: v.optional(v.string()),
        stripeCustomerId: v.optional(v.string()),
        subscriptionStatus: v.optional(v.string()), // 'pro', 'enterprise', etc.
        orgId: v.optional(v.string()), // Primary WorkOS Org ID
        workosUserId: v.optional(v.string()), // WorkOS User ID

        // The "Registry": mapping user to their dedicated application instances
        instances: v.optional(v.array(v.object({
            instanceUrl: v.string(),
            projectSlug: v.string(),
            orgId: v.optional(v.string()), // Org ID for THIS specific instance
            workosUserId: v.optional(v.string()), // User ID for this instance
            plan: v.string(),
            status: v.string(), // 'provisioning' | 'active' | 'suspended'
            createdAt: v.number(),
        }))),
    }).index("by_email", ["email"]).index("by_stripe_customer_id", ["stripeCustomerId"]),
});
