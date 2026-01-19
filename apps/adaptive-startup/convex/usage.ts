import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const trackUsage = mutation({
    args: {
        model: v.string(),
        tokens: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            console.log("Internal/Test usage tracking - skipping persistence");
            return;
        }

        const today = new Date().toISOString().split('T')[0];

        const existingUsage = await ctx.db
            .query("usage")
            .withIndex("by_user_date", (q) => q.eq("userId", identity.subject).eq("date", today))
            .first();

        if (existingUsage) {
            await ctx.db.patch(existingUsage._id, {
                tokens: existingUsage.tokens + args.tokens,
                requests: existingUsage.requests + 1,
            });
        } else {
            await ctx.db.insert("usage", {
                userId: identity.subject,
                date: today,
                tokens: args.tokens,
                requests: 1,
                model: args.model,
            });
        }
    },
});

export const getUsage = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const usage = await ctx.db
            .query("usage")
            .withIndex("by_user_date", (q) => q.eq("userId", identity.subject))
            .order("desc")
            .take(30);

        return usage.reverse();
    },
});

export const checkLimit = query({
    args: { skipAuth: v.optional(v.boolean()) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            if (args.skipAuth) return { allowed: true, reason: "Internal/Test mode", isPro: true, limitType: null };
            return { allowed: false, reason: "Not authenticated", isPro: false, limitType: null };
        }

        // 1. Get User
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
            .first();

        const isPro = user?.subscriptionStatus === "active" || user?.subscriptionStatus === "trialing";
        const limit = user?.tokenLimit || (isPro ? 4000000 : 10000); // 4M for Pro, 10k for Free

        // 2. Enforce Daily Rate Limit
        const today = new Date().toISOString().split('T')[0];
        const dailyLimit = isPro ? 1000 : 20;

        const todayUsage = await ctx.db
            .query("usage")
            .withIndex("by_user_date", (q) => q.eq("userId", identity.subject).eq("date", today))
            .first();

        if (todayUsage && todayUsage.requests >= dailyLimit) {
            return {
                allowed: false,
                reason: `Daily request limit exceeded (${dailyLimit}/day).`,
                isPro,
                limitType: 'RATE_LIMIT'
            };
        }

        // 3. Enforce Monthly Token Limit
        const currentMonth = today.substring(0, 7); // "YYYY-MM"
        const usageEntries = await ctx.db
            .query("usage")
            .withIndex("by_user_date", (q) => q.eq("userId", identity.subject))
            .filter(q => q.gte(q.field("date"), currentMonth + "-01"))
            .collect();

        const totalUsed = usageEntries.reduce((acc, curr) => acc + curr.tokens, 0);

        if (totalUsed >= limit) {
            return {
                allowed: false,
                reason: `Monthly token limit exceeded (${Math.round(totalUsed)} / ${limit}).`,
                isPro,
                limitType: 'TOKEN_LIMIT'
            };
        }

        return {
            allowed: true,
            reason: "Access granted",
            isPro,
            limitType: null
        };
    },
});

export const getSubscriptionStatus = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return { status: "inactive", isTrialing: false, isPro: false, usage: 0, limit: 0, stripeCustomerId: undefined };

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
            .first();

        if (!user) return { status: "inactive", isTrialing: false, isPro: false, usage: 0, limit: 0, stripeCustomerId: undefined };

        const now = Date.now();
        const isPro = user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing";

        // Fallback trial logic: If no status but created < 3 days ago
        const isTrialing = user.subscriptionStatus === "trialing" ||
            (!user.subscriptionStatus && (now - user._creationTime) < 3 * 24 * 60 * 60 * 1000);

        // Calculate Usage
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = today.substring(0, 7);
        const usageEntries = await ctx.db
            .query("usage")
            .withIndex("by_user_date", (q) => q.eq("userId", identity.subject))
            .filter(q => q.gte(q.field("date"), currentMonth + "-01"))
            .collect();

        const totalUsed = usageEntries.reduce((acc, curr) => acc + curr.tokens, 0);
        const limit = user.tokenLimit || (isPro ? 4000000 : 50000);

        return {
            status: user.subscriptionStatus || (isTrialing ? "trialing" : "expired"),
            isTrialing,
            isPro: isPro || isTrialing,
            daysLeft: isTrialing ? Math.ceil((user._creationTime + 3 * 24 * 60 * 60 * 1000 - now) / (1000 * 60 * 60 * 24)) : 0,
            usage: totalUsed,
            limit: limit,
            seatCount: user.seatCount || 0,
            interval: user.subscriptionInterval || 'month',
            stripeCustomerId: user.stripeCustomerId
        };
    },
});
