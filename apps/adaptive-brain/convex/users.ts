import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const getUserByEmail = internalQuery({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();
    },
});

export const getUserByStripeCustomerId = internalQuery({
    args: { stripeCustomerId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_stripe_customer_id", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
            .unique();
    },
});

export const getOrCreateUser = internalMutation({
    args: {
        email: v.string(),
        name: v.optional(v.string()),
        stripeCustomerId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                stripeCustomerId: args.stripeCustomerId || existing.stripeCustomerId,
                name: args.name || existing.name,
            });
            return existing._id;
        }

        return await ctx.db.insert("users", {
            email: args.email,
            name: args.name,
            stripeCustomerId: args.stripeCustomerId,
            subscriptionStatus: "active",
        });
    },
});
