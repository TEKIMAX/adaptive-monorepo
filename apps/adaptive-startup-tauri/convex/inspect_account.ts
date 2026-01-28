
import { internalAction } from "./_generated/server";
import Stripe from "stripe";

export const inspectStripeAccount = internalAction({
    args: {},
    handler: async (ctx) => {
        // Strip any accidental whitespace or quotes from the key
        const key = process.env.STRIPE_SECRET_KEY!.trim().replace(/['"]+/g, '');
        const stripe = new Stripe(key, { apiVersion: "2025-01-27.acacia" as any });

        // Use the ID we saw in the logs
        const accountId = 'acct_1Spsr8AEvr76ru1r';

        try {
            const account = await stripe.accounts.retrieve(accountId);
            return {
                id: account.id,
                type: account.type,
                country: account.country,
                livemode: (account as any).livemode,
                created_key_prefix: key.substring(0, 8) + "..."
            };
        } catch (e: any) {
            return {
                error: e.message,
                used_key_prefix: key.substring(0, 8) + "..."
            };
        }
    }
});
