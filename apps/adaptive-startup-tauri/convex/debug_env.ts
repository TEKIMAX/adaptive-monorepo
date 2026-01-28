import { query } from "./_generated/server";

export const getEnvDebug = query({
    args: {},
    handler: async (ctx) => {
        const key = process.env.STRIPE_SECRET_KEY || "";
        return {
            keyPrefix: key.substring(0, 8), // sk_test_ or sk_live_
            basePriceId: process.env.STRIPE_BASE_PRICE_ID
        };
    }
});
