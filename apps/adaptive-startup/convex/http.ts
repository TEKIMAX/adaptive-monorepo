import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, components, internal } from "./_generated/api";
import { registerRoutes } from "@convex-dev/stripe";

const http = httpRouter();

registerRoutes(http, components.stripe, {
    webhookPath: "/stripe/events", // Keep consistency with what we told the user
    events: {
        "account.application.authorized": async (ctx, event) => {
            const account = event.data.object as any;
            await ctx.runMutation(internal.stripe.updateConnectedAccountStatus, {
                stripeAccountId: account.id || event.account, // Fallback to event.account if object is not full account
                accountData: account
            });
        },
        "account.application.deauthorized": async (ctx, event) => {
            const stripeAccountId = event.account || (event.data.object as any).id;
            if (stripeAccountId) {
                await ctx.runMutation(internal.stripe.disconnectStripeAccount, { stripeAccountId });
            }
        },
        "account.updated": async (ctx, event) => {
            const account = event.data.object as any;
            await ctx.runMutation(internal.stripe.updateConnectedAccountStatus, {
                stripeAccountId: account.id,
                accountData: account
            });
        },
        "checkout.session.completed": async (ctx, event) => {
            // @ts-ignore - Stripe types might be tricky to get perfect without direct import
            const session = event.data.object;
            const metadata = session.metadata;

            if (metadata?.type === 'subscription_update') {
                // Calculate endsOn based on billing interval
                const isYearly = metadata.interval === 'year';
                const endsOn = isYearly
                    ? Date.now() + 365 * 24 * 60 * 60 * 1000  // 1 year
                    : Date.now() + 30 * 24 * 60 * 60 * 1000;   // 1 month

                await ctx.runMutation(internal.stripe.updateSubscription, {
                    userId: metadata.userId,
                    subscriptionStatus: "active",
                    seatCount: parseInt(metadata.seats || "1"),
                    tier: "pro",
                    tokenLimit: 4000000,
                    endsOn: endsOn,
                    stripeCustomerId: session.customer as string,
                    subscriptionInterval: isYearly ? 'year' : 'month'
                });
            } else if (metadata?.type === 'token_purchase') {
                await ctx.runMutation(internal.stripe.topUpTokens, {
                    userId: metadata.userId,
                    tokensToAdd: parseInt(metadata.tokens || "0")
                });
            }
        },

        "customer.subscription.created": async (ctx, event) => {
            const subscription = event.data.object as any;
            const metadata = subscription.metadata;
            const customerEmail = await getCustomerEmail(ctx, subscription.customer);

            // Try to get userId from metadata, or lookup by stripeCustomerId, or lookup by email
            let userId = metadata?.userId;
            if (!userId) {
                // Try looking up by stripeCustomerId
                const user = await ctx.runQuery(internal.users.getUserByStripeCustomerId, { stripeCustomerId: subscription.customer as string });
                if (user) {
                    userId = user.tokenIdentifier;
                } else if (customerEmail) {
                    // Fallback to email
                    const userByEmail = await ctx.runQuery(internal.users.getUserByEmail, { email: customerEmail });
                    userId = userByEmail?.tokenIdentifier;
                }
            }


            if (userId) {
                const endsOn = subscription.current_period_end ? subscription.current_period_end * 1000 : Date.now() + 365 * 24 * 60 * 60 * 1000;

                // Calculate Seat Count
                // Base plan = 1 seat. Add-on items = extra seats.
                // We check for items matching our Seat Price IDs
                const seatPriceIds = [
                    process.env.STRIPE_SEAT_PRICE_ID,
                    process.env.STRIPE_SEAT_PRICE_ID_YEARLY
                ].filter(Boolean);

                let extraSeats = 0;
                if (subscription.items && subscription.items.data) {
                    subscription.items.data.forEach((item: any) => {
                        if (seatPriceIds.includes(item.price.id)) {
                            extraSeats += item.quantity;
                        }
                    });
                }
                const totalSeats = 1 + extraSeats;

                await ctx.runMutation(internal.stripe.updateSubscriptionStatus, {
                    userId: userId,
                    subscriptionStatus: subscription.status === 'incomplete' ? 'trialing' : subscription.status,
                    endsOn: endsOn,
                    tier: "pro",
                    stripeCustomerId: subscription.customer as string,
                    subscriptionInterval: subscription.items?.data[0]?.price?.recurring?.interval || 'month',
                    seatCount: totalSeats
                });
            } else {
                console.warn("Could not find userId for subscription.created event (likely orphaned)", { customer: subscription.customer, email: customerEmail });
            }
        },

        "customer.subscription.updated": async (ctx, event) => {
            const subscription = event.data.object as any;
            const metadata = subscription.metadata;
            const customerEmail = await getCustomerEmail(ctx, subscription.customer);

            // Try to get userId from metadata, or lookup by stripeCustomerId, or lookup by email
            let userId = metadata?.userId;
            if (!userId) {
                // Try looking up by stripeCustomerId
                const user = await ctx.runQuery(internal.users.getUserByStripeCustomerId, { stripeCustomerId: subscription.customer as string });
                if (user) {
                    userId = user.tokenIdentifier;
                } else if (customerEmail) {
                    // Fallback to email
                    const userByEmail = await ctx.runQuery(internal.users.getUserByEmail, { email: customerEmail });
                    userId = userByEmail?.tokenIdentifier;
                }
            }

            if (userId) {
                // Ensure endsOn is a number
                const endsOn = subscription.current_period_end ? subscription.current_period_end * 1000 : Date.now() + 30 * 24 * 60 * 60 * 1000;

                // Calculate Seat Count
                const seatPriceIds = [
                    process.env.STRIPE_SEAT_PRICE_ID,
                    process.env.STRIPE_SEAT_PRICE_ID_YEARLY
                ].filter(Boolean);

                let extraSeats = 0;
                if (subscription.items && subscription.items.data) {
                    subscription.items.data.forEach((item: any) => {
                        if (seatPriceIds.includes(item.price.id)) {
                            extraSeats += item.quantity;
                        }
                    });
                }
                const totalSeats = 1 + extraSeats;

                await ctx.runMutation(internal.stripe.updateSubscriptionStatus, {
                    userId: userId,
                    subscriptionStatus: subscription.status,
                    endsOn: endsOn,
                    tier: "pro", // For now default to pro as we only have one tier. Ideally read from price metadata.
                    stripeCustomerId: subscription.customer as string,
                    subscriptionInterval: subscription.items?.data[0]?.price?.recurring?.interval || 'month',
                    seatCount: totalSeats
                });
            } else {
                console.warn("Could not find userId for subscription.updated event (likely orphaned)", { customer: subscription.customer, email: customerEmail });
            }
        },
        "customer.subscription.deleted": async (ctx, event) => {
            const subscription = event.data.object as any;
            const metadata = subscription.metadata;
            const customerEmail = await getCustomerEmail(ctx, subscription.customer);

            // Try to get userId from metadata, or lookup by stripeCustomerId, or lookup by email
            let userId = metadata?.userId;
            if (!userId) {
                // Try looking up by stripeCustomerId
                const user = await ctx.runQuery(internal.users.getUserByStripeCustomerId, { stripeCustomerId: subscription.customer as string });
                if (user) {
                    userId = user.tokenIdentifier;
                } else if (customerEmail) {
                    // Fallback to email
                    const userByEmail = await ctx.runQuery(internal.users.getUserByEmail, { email: customerEmail });
                    userId = userByEmail?.tokenIdentifier;
                }
            }

            if (userId) {
                await ctx.runMutation(internal.stripe.updateSubscriptionStatus, {
                    userId: userId,
                    subscriptionStatus: "canceled",
                    endsOn: subscription.current_period_end * 1000,
                });
            }
        },

        "invoice.payment_succeeded": async (ctx, event) => {
            const invoice = event.data.object as any;

            // Only care about subscription payments
            if (invoice.subscription) {
                await ctx.runAction(internal.stripe.processReferralPayment, {
                    subscriptionId: invoice.subscription as string
                });
            }
        }
    }
});

// Helper to get customer email from Stripe
// Helper to get customer email from Stripe
import Stripe from "stripe";

async function getCustomerEmail(ctx: any, customerId: string): Promise<string | null> {
    if (!process.env.STRIPE_SECRET_KEY) return null;

    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY.trim(), { apiVersion: "2025-01-27.acacia" as any });
        const customer = await stripe.customers.retrieve(customerId);
        if (!customer || customer.deleted) return null;
        return (customer as Stripe.Customer).email;
    } catch (e) {
        console.warn("Failed to fetch Stripe customer email:", e);
        return null;
    }
}

http.route({
    path: "/workos-webhook",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const signatureHeader = request.headers.get("WorkOS-Signature");
        const payload = await request.text();

        if (!signatureHeader) {
            return new Response("Missing signature", { status: 401 });
        }

        try {
            await ctx.runAction(api.workos.handleWebhook, {
                signature: signatureHeader,
                payload: payload,
            });
            return new Response("Webhook processed", { status: 200 });
        } catch (error) {
            console.error("Webhook failed:", error);
            return new Response("Webhook failed", { status: 400 });
        }
    }),
});

http.route({
    path: "/api/storage",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
        const url = new URL(request.url);
        const storageId = url.searchParams.get("storageId");

        if (!storageId) {
            return new Response("Missing storageId", { status: 400 });
        }

        const link = await ctx.storage.getUrl(storageId);
        if (!link) {
            return new Response("File not found", { status: 404 });
        }

        return Response.redirect(link);
    }),
});


// ... (existing storage route)

http.route({
    path: "/api/ingest_usage",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return new Response("Missing API Key", { status: 401 });
        }
        const apiKey = authHeader.split(" ")[1];

        // Validate Key (Note: In prod, use a dedicated index or lookup function)
        const keyRecord = await ctx.runQuery(internal.apiKeys.validate, { key: apiKey });
        if (!keyRecord) {
            return new Response("Invalid API Key", { status: 403 });
        }

        const body = await request.json();
        const { userId, model, inputTokens, outputTokens, cost, metadata } = body;

        // Basic Validation
        if (!userId || !model || inputTokens === undefined || outputTokens === undefined) {
            return new Response("Missing required fields", { status: 400 });
        }

        await ctx.runMutation(internal.externalUsage.log, {
            projectId: keyRecord.projectId,
            apiKeyId: keyRecord._id,
            externalUserId: userId,
            model,
            inputTokens,
            outputTokens,
            cost,
            metadata: metadata ? JSON.stringify(metadata) : undefined
        });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    }),
});

import { getRssFeed } from "./blog_rss";

http.route({
    path: "/rss.xml",
    method: "GET",
    handler: getRssFeed,
});

export default http;
