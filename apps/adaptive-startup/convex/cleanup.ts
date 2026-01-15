
import { internalAction, internalMutation } from "./_generated/server";
import Stripe from "stripe";

// CRITICAL: This function is referenced by a Cron Job. Do not remove.
export const purgeOldDeletedProjects = internalMutation({
    args: {},
    handler: async () => {
        // Placeholder implementation to satisfy build/cron requirements.
        console.log("purgeOldDeletedProjects executed (placeholder)");
    }
});

export const clearBadAccount = internalMutation({
    args: {},
    handler: async (ctx) => {
        const projects = await ctx.db.query("projects").collect();
        let cleared = 0;
        // The NEW bad account from logs: acct_1SptZjE3zemG75hd
        const badId = 'acct_1SptZjE3zemG75hd';

        for (const p of projects) {
            if (p.stripeAccountId === badId) {
                await ctx.db.patch(p._id, {
                    stripeAccountId: undefined,
                    stripeConnectedAt: undefined,
                    stripeData: undefined
                });
                cleared++;
            }
        }
        return `Cleared ${cleared} projects with ID ${badId}`;
    }
});

export const identifyPlatform = internalAction({
    args: {},
    handler: async () => {
        const key = process.env.STRIPE_SECRET_KEY!.trim();
        const stripe = new Stripe(key, { apiVersion: "2025-01-27.acacia" as any });

        try {
            // Retrieve "Self" account details
            const account = await stripe.accounts.retrieve();
            return {
                id: account.id,
                email: account.email,
                business_profile_name: account.business_profile?.name,
                settings_dashboard_name: account.settings?.dashboard?.display_name,
                type: account.type,
                charges_enabled: account.charges_enabled
            };
        } catch (e: any) {
            return { error: e.message };
        }
    }
});
