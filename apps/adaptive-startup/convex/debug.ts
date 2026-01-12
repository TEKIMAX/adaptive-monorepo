import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const inspectUser = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return { error: "Not authenticated" };

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
            .unique();

        if (!user) return { error: "No user found in DB for identity" };

        const role = user.roles && user.roles.length > 0 ? user.roles[0].role : "User";

        const result = {
            ...user,
            role,
            // Robust defaults for missing fields - verifying the logic I added to getUser
            onboardingStep: user.onboardingStep ?? 1,
            onboardingCompleted: user.onboardingCompleted ?? false,
            // Raw values for comparison
            _rawOnboardingStep: user.onboardingStep,
            _rawOnboardingCompleted: user.onboardingCompleted
        };

        return result;
    },
});

// Force set onboarding fields to allow user to see OnboardingFlow
export const forceResetOnboarding = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return "Not authenticated";

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
            .unique();

        if (!user) return "No user found to reset";

        await ctx.db.patch(user._id, {
            onboardingStep: 1,
            onboardingCompleted: false
        });

        return "User onboarding reset to step 1, completed=false";
    },
});


