import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        email: v.string(),
        name: v.optional(v.string()),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        organizationName: v.optional(v.string()),
        subdomainName: v.optional(v.string()), // e.g., 'acme' for acme.adaptivestartup.io
        stripeCustomerId: v.optional(v.string()),
        subscriptionStatus: v.optional(v.string()), // 'pro', 'enterprise', etc.
        orgId: v.optional(v.string()), // Primary WorkOS Org ID
        workosUserId: v.optional(v.string()), // WorkOS User ID

        // The "Registry": mapping user to their dedicated application instances
        instances: v.optional(v.array(v.object({
            instanceUrl: v.string(),
            projectSlug: v.string(),
            subdomain: v.optional(v.string()), // Custom subdomain for this instance
            customDomain: v.optional(v.string()), // Full domain: subdomain.adaptivestartup.io
            orgId: v.optional(v.string()), // Org ID for THIS specific instance
            workosUserId: v.optional(v.string()), // User ID for this instance
            plan: v.string(),
            status: v.string(), // 'provisioning' | 'active' | 'suspended'
            createdAt: v.number(),
        }))),
    }).index("by_email", ["email"]).index("by_stripe_customer_id", ["stripeCustomerId"]).index("by_subdomain", ["subdomainName"]),

    // Store Stripe events for auditing and reference
    stripeEvents: defineTable({
        eventId: v.string(), // Stripe event ID
        eventType: v.string(), // e.g., 'customer.subscription.created'
        customerId: v.optional(v.string()),
        customerEmail: v.optional(v.string()),
        subscriptionId: v.optional(v.string()),
        payload: v.any(), // Full Stripe event payload
        processedAt: v.number(),
    }).index("by_customer_id", ["customerId"]).index("by_event_id", ["eventId"]),

    // Track provisioning jobs
    provisioningJobs: defineTable({
        email: v.string(),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        organizationName: v.optional(v.string()),
        subdomainName: v.optional(v.string()),
        userId: v.optional(v.string()),
        plan: v.string(),
        subscriptionId: v.optional(v.string()),
        status: v.string(), // 'pending' | 'in_progress' | 'completed' | 'failed'
        githubRunId: v.optional(v.string()),
        instanceUrl: v.optional(v.string()),
        projectSlug: v.optional(v.string()),
        customDomain: v.optional(v.string()), // e.g., acme.adaptivestartup.io
        error: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_email", ["email"]).index("by_status", ["status"]),
});
