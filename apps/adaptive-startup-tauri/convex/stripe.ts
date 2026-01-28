import { action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import Stripe from "stripe";

export const createProSubscriptionSecret = action({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim(), { apiVersion: "2025-01-27.acacia" as any });
        const basePriceId = process.env.STRIPE_BASE_PRICE_ID;
        if (!basePriceId) throw new Error("Missing Base Price ID");

        // 1. Find or create customer
        const customers = await stripe.customers.list({ email: identity.email, limit: 1 });
        let customerId = customers.data.length > 0 ? customers.data[0].id : null;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: identity.email,
                name: identity.name,
                metadata: { userId: identity.subject }
            });
            customerId = customer.id;
        }

        // Save customer ID to user
        await ctx.runMutation(internal.stripe.saveStripeCustomerId, {
            userId: identity.subject,
            stripeCustomerId: customerId
        });

        // 2. Create Subscription
        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: basePriceId, quantity: 1 }],
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent'],
            metadata: {
                userId: identity.subject,
                type: "subscription_update",
                seats: 1
            }
        });

        const invoice = subscription.latest_invoice as any;
        const paymentIntent = invoice.payment_intent as any;

        if (!paymentIntent.client_secret) {
            throw new Error("Failed to create payment intent");
        }

        return {
            clientSecret: paymentIntent.client_secret,
            subscriptionId: subscription.id
        };
    }
});

// ... (existing code)

export const createBillingPortalSession = action({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.runQuery(internal.users.getUserByToken, { tokenIdentifier: identity.subject });
        if (!user) throw new Error("User not found");

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: "2025-01-27.acacia" as any,
        });

        let customerId = user.stripeCustomerId;

        // Fallback: Find customer by email if not found
        if (!customerId) {
            const customers = await stripe.customers.list({
                email: user.email,
                limit: 1,
            });
            customerId = customers.data[0]?.id;

            // If found by email, save it for next time
            if (customerId) {
                await ctx.runMutation(internal.stripe.saveStripeCustomerId, {
                    userId: identity.subject,
                    stripeCustomerId: customerId
                });
            }
        }

        if (!customerId) {
            throw new Error("No Stripe customer found");
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${process.env.HOST_URL}/team`, // Redirect back to team page
        });

        return session.url;
    },
});

export const createSubscriptionCheckout = action({
    args: {
        seats: v.number(), // Total number of seats (including owner)
        interval: v.optional(v.string()), // 'month' or 'year'
        referralCode: v.optional(v.string()) // New: For tracking referrals
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();



        if (!identity) {
            console.error("Authentication failed in stripe:createSubscriptionCheckout");
            throw new Error("Not authenticated");
        }


        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim(), { apiVersion: "2025-01-27.acacia" as any }); // Use latest stable or matching version
        const domain = (process.env.HOST_URL || "https://adaptivestartup.io").replace(/\/$/, "");

        const basePriceId = process.env.STRIPE_BASE_PRICE_ID;
        const yearlyPriceId = process.env.STRIPE_YEARLY_PRICE_ID;
        const seatPriceId = process.env.STRIPE_SEAT_PRICE_ID;

        if (!basePriceId || !seatPriceId) throw new Error("Missing Stripe Price IDs");

        let discounts = undefined;
        if (args.referralCode) {
            // Validate code via query or schema check if needed, but for now we just pass to metadata.
            // OPTIONAL: Lookup a system-wide "Referral Coupon" ID to apply a discount for the NEW user.
            // If the user wants the REFEREE to get a discount, we'd add it here.
            // For now, we just track it.
        }

        const selectedPriceId = args.interval === 'year' && yearlyPriceId ? yearlyPriceId : basePriceId;

        const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
            {
                price: selectedPriceId,
                quantity: 1,
            }
        ];

        if (args.seats > 1) {
            line_items.push({
                price: seatPriceId,
                quantity: args.seats - 1,
            });
        }

        const session = await stripe.checkout.sessions.create({
            customer_email: identity.email,
            line_items: line_items,
            mode: "subscription",
            allow_promotion_codes: true,
            success_url: `${domain}/?subscription_success=true`,
            cancel_url: `${domain}/?subscription_canceled=true`,
            metadata: {
                userId: identity.subject,
                seats: args.seats,
                type: "subscription_update",
                interval: args.interval || 'month'
            },
            subscription_data: {
                metadata: {
                    userId: identity.subject,
                    seats: args.seats,
                    type: "subscription_update",
                    interval: args.interval || 'month'
                }
            }
        });

        return { url: session.url };
    },
});

export const buyTokens = action({
    args: {
        packs: v.number(), // Number of 1M token packs
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim(), { apiVersion: "2025-01-27.acacia" as any });
        const domain = (process.env.HOST_URL || "https://adaptivestartup.io").replace(/\/$/, "");
        const tokenPriceId = process.env.STRIPE_TOKEN_PACK_PRICE_ID; // $10 for 1M tokens

        if (!tokenPriceId) throw new Error("Missing TOKEN Price ID");

        const totalTokens = args.packs * 1000000;

        const session = await stripe.checkout.sessions.create({
            customer_email: identity.email,
            line_items: [{ price: tokenPriceId, quantity: args.packs }],
            mode: "payment",
            success_url: `${domain}/subscription?tokens_purchased=true`,
            cancel_url: `${domain}/subscription?canceled=true`,
            metadata: {
                userId: identity.subject,
                type: "token_purchase",
                tokens: totalTokens
            },
        });

        return { url: session.url };
    },
});

export const addSeats = action({
    args: {
        seatsToAdd: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.runQuery(internal.users.getUserByToken, { tokenIdentifier: identity.subject });
        if (!user || !user.stripeCustomerId) throw new Error("No Stripe customer found");

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-01-27.acacia" as any });

        // Get active subscription
        const subscriptions = await stripe.subscriptions.list({
            customer: user.stripeCustomerId,
            status: 'active',
            limit: 1,
            expand: ['data.items']
        });

        const subscription = subscriptions.data[0];
        if (!subscription) throw new Error("No active subscription found");

        const isYearly = subscription.items.data[0].price.recurring?.interval === 'year';

        let seatPriceId = process.env.STRIPE_SEAT_PRICE_ID; // Default Monthly

        if (isYearly) {
            seatPriceId = process.env.STRIPE_SEAT_PRICE_ID_YEARLY;
            if (!seatPriceId) throw new Error("Missing Yearly Seat Price ID in env");
        } else {
            if (!seatPriceId) throw new Error("Missing Monthly Seat Price ID in env");
        }

        // Check if seat item exists (check both IDs to be safe, or just current valid one)
        const seatItem = subscription.items.data.find(item => item.price.id === seatPriceId);

        if (seatItem) {
            // Update quantity
            await stripe.subscriptionItems.update(seatItem.id, {
                quantity: (seatItem.quantity || 1) + args.seatsToAdd,
                proration_behavior: 'always_invoice', // Charge immediately
            });
        } else {
            // Add new item
            await stripe.subscriptionItems.create({
                subscription: subscription.id,
                price: seatPriceId!,
                quantity: args.seatsToAdd,
                proration_behavior: 'always_invoice',
            });
        }

        return { success: true };
    }
});

export const updateSubscription = internalMutation({
    args: {
        userId: v.string(),
        subscriptionStatus: v.string(),
        seatCount: v.number(),
        tier: v.string(),
        tokenLimit: v.number(),
        endsOn: v.optional(v.number()), // Subscription end timestamp
        stripeCustomerId: v.optional(v.string()), // Added
        subscriptionInterval: v.optional(v.string()), // 'month' or 'year'
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", q => q.eq("tokenIdentifier", args.userId))
            .first();

        if (user) {
            // Set isFounder to true if subscription is active/trialing with pro tier
            const isFounder = (args.subscriptionStatus === 'active' || args.subscriptionStatus === 'trialing') &&
                (args.tier === 'pro' || args.tier === 'enterprise');

            await ctx.db.patch(user._id, {
                subscriptionStatus: args.subscriptionStatus,
                seatCount: args.seatCount,
                subscriptionTier: args.tier,
                tokenLimit: args.tokenLimit,
                isFounder: isFounder,
                onboardingCompleted: true, // Auto-complete onboarding on first checkout
                ...(args.endsOn !== undefined && { endsOn: args.endsOn }),
                ...(args.stripeCustomerId && { stripeCustomerId: args.stripeCustomerId }),
            });
        }
    },
});

export const topUpTokens = internalMutation({
    args: {
        userId: v.string(),
        tokensToAdd: v.number(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", q => q.eq("tokenIdentifier", args.userId))
            .first();

        if (user) {
            const currentLimit = user.tokenLimit || 50000;
            await ctx.db.patch(user._id, {
                tokenLimit: currentLimit + args.tokensToAdd
            });
        }
    },
});

export const updateSubscriptionStatus = internalMutation({
    args: {
        userId: v.string(),
        subscriptionStatus: v.string(),
        endsOn: v.optional(v.number()),
        tier: v.optional(v.string()),
        seatCount: v.optional(v.number()),
        stripeCustomerId: v.optional(v.string()), // Added
        subscriptionInterval: v.optional(v.string()), // 'month' or 'year'
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", q => q.eq("tokenIdentifier", args.userId))
            .first();

        if (user) {
            // Determine isFounder based on subscription status
            const effectiveTier = args.tier || user.subscriptionTier;
            const isFounder = (args.subscriptionStatus === 'active' || args.subscriptionStatus === 'trialing') &&
                (effectiveTier === 'pro' || effectiveTier === 'enterprise');

            await ctx.db.patch(user._id, {
                subscriptionStatus: args.subscriptionStatus,
                isFounder: isFounder,
                onboardingCompleted: true, // Auto-complete onboarding on subscription update
                ...(args.endsOn !== undefined && { endsOn: args.endsOn }),
                ...(args.tier !== undefined && { subscriptionTier: args.tier }),
                ...(args.seatCount !== undefined && { seatCount: args.seatCount }),
                ...(args.stripeCustomerId && { stripeCustomerId: args.stripeCustomerId }),
                ...(args.subscriptionInterval && { subscriptionInterval: args.subscriptionInterval }),
            });
        }
    },
});

export const saveStripeCustomerId = internalMutation({
    args: {
        userId: v.string(),
        stripeCustomerId: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", q => q.eq("tokenIdentifier", args.userId))
            .first();

        if (user) {
            await ctx.db.patch(user._id, {
                stripeCustomerId: args.stripeCustomerId
            });
        }
    },
});
// --- PLATFORM CONNECT ---
export const createAccountLink = action({
    args: { projectId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.runQuery(internal.users.getUserByToken, { tokenIdentifier: identity.subject });
        if (!user || !user.isFounder) {
            throw new Error("Access denied: Founder status required");
        }

        const clientId = process.env.STRIPE_CLIENT_ID?.trim();
        if (!clientId) throw new Error("Missing STRIPE_CLIENT_ID");

        const state = args.projectId;
        // We rely on the Stripe Dashboard default Redirect URI configuration to avoid mismatch errors.
        // Ensure you have configured the correct default URI for both Test mode (localhost) and Live mode.
        const url = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&state=${state}`;
        return { url };
    }
});

export const exchangeConnectCode = action({
    args: { code: v.string(), projectId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.runQuery(internal.users.getUserByToken, { tokenIdentifier: identity.subject });
        if (!user || !user.isFounder) {
            throw new Error("Access denied: Founder status required");
        }

        // Exchange code for token
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim(), { apiVersion: "2025-01-27.acacia" as any });
        const response = await stripe.oauth.token({
            grant_type: 'authorization_code',
            code: args.code,
        });

        const connectedAccountId = response.stripe_user_id;

        // Save to project
        await ctx.runMutation(internal.projects.saveStripeAccount, {
            projectId: args.projectId,
            stripeAccountId: connectedAccountId
        });

        return { success: true, accountId: connectedAccountId };
    }
});

export const createAccountSession = action({
    args: { stripeAccountId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.runQuery(internal.users.getUserByToken, { tokenIdentifier: identity.subject });
        if (!user || !user.isFounder) {
            throw new Error("Access denied: Founder status required");
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim(), { apiVersion: "2025-01-27.acacia" as any });

        const accountSession = await stripe.accountSessions.create({
            account: args.stripeAccountId,
            components: {
                payment_details: { enabled: true, features: { capture_payments: true, destination_on_behalf_of_charge_management: true, refund_management: true, dispute_management: true } },
                payments: { enabled: true, features: { capture_payments: true, destination_on_behalf_of_charge_management: true, refund_management: true, dispute_management: true } },
                payouts: { enabled: true, features: { edit_payout_schedule: true, instant_payouts: true, standard_payouts: true } },
                account_onboarding: { enabled: true },
                balances: { enabled: true, features: { edit_payout_schedule: true, instant_payouts: true, standard_payouts: true } },
                documents: { enabled: true },
                notification_banner: { enabled: true },
                account_management: { enabled: true, features: { external_account_collection: true } },
            },
        });

        return { clientSecret: accountSession.client_secret };
    }
});

export const updateConnectedAccountStatus = internalMutation({
    args: {
        stripeAccountId: v.string(),
        accountData: v.any()
    },
    handler: async (ctx, args) => {
        const project = await ctx.db
            .query("projects")
            .filter(q => q.eq(q.field("stripeAccountId"), args.stripeAccountId))
            .first();

        if (project) {
            // Merge existing data with new data if needed, or just overwrite
            // For now, we'll overwrite with the latest account object which defines the status
            await ctx.db.patch(project._id, {
                stripeData: JSON.stringify(args.accountData)
            });
        }
    }
});

export const disconnectStripeAccount = internalMutation({
    args: {
        stripeAccountId: v.string()
    },
    handler: async (ctx, args) => {
        const project = await ctx.db
            .query("projects")
            .filter(q => q.eq(q.field("stripeAccountId"), args.stripeAccountId))
            .first();

        if (project) {
            await ctx.db.patch(project._id, {
                stripeAccountId: undefined,
                stripeConnectedAt: undefined,
                stripeData: undefined
            });
            console.log(`Disconnected Stripe Account ${args.stripeAccountId} from Project ${project._id}`);
        } else {
            console.warn(`Received deauth for unknown account ${args.stripeAccountId}`);
        }
    }
});

export const getConnectedAccountData = action({
    args: { stripeAccountId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.runQuery(internal.users.getUserByToken, { tokenIdentifier: identity.subject });
        if (!user || !user.isFounder) {
            throw new Error("Access denied: Founder status required");
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-01-27.acacia" as any });

        // Fetch Customers (Limit 20)
        const customers = await stripe.customers.list({ limit: 20 }, { stripeAccount: args.stripeAccountId });

        // Fetch Invoices (Limit 20)
        const invoices = await stripe.invoices.list({ limit: 20 }, { stripeAccount: args.stripeAccountId });

        // Fetch Recent Charges (Revenue proxy)
        const charges = await stripe.charges.list({ limit: 20 }, { stripeAccount: args.stripeAccountId });

        return {
            customers: customers.data,
            invoices: invoices.data,
            charges: charges.data
        };
    }
});

export const createConnectedLoginLink = action({
    args: { stripeAccountId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.runQuery(internal.users.getUserByToken, { tokenIdentifier: identity.subject });
        if (!user || !user.isFounder) {
            throw new Error("Access denied: Founder status required");
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-01-27.acacia" as any });

        // This generally works for Express accounts. For Standard, they log in normally at stripe.com.
        // But we'll try generating a login link if it's an Express account, otherwise this might fail or we just return stripe.com.
        // Standard accounts don't support login links via API usually (they own the account).
        // If the user uses Standard authed via OAuth, they just go to dashboard.stripe.com.
        // We will return a generic link or handle error.
        try {
            const link = await stripe.accounts.createLoginLink(args.stripeAccountId);
            return { url: link.url };
        } catch (e: any) {
            // If it fails (likely Standard account), return generic
            console.error("Could not create login link (likely Standard account):", e.message);
            return { url: "https://dashboard.stripe.com" };
        }
    }
});

export const applyReferralSetupCredit = action({
    args: { tokenIdentifier: v.string() },
    handler: async (ctx, args) => {
        // Scheduled actions don't have auth context, so we trust the caller (internal scheduler)
        // const identity = await ctx.auth.getUserIdentity(); 

        const user = await ctx.runQuery(internal.users.getUserByToken, { tokenIdentifier: args.tokenIdentifier });
        if (!user) {
            console.error("User not found for referral credit");
            return;
        }

        if (user.hasReceivedReferralSetupCredit) {
            return;
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim(), { apiVersion: "2025-01-27.acacia" as any });
        let customerId = user.stripeCustomerId;

        // Auto-create customer if missing
        if (!customerId) {
            try {
                const customer = await stripe.customers.create({
                    email: user.email,
                    name: user.name,
                    metadata: { userId: user._id }
                });
                customerId = customer.id;

                // Save the new customer ID
                await ctx.runMutation(internal.stripe.saveStripeCustomerId, {
                    userId: args.tokenIdentifier,  // saveStripeCustomerId expects tokenIdentifier
                    stripeCustomerId: customerId
                });
            } catch (err: any) {
                console.error("Failed to create Stripe customer:", err.message);
                return;
            }
        }

        if (!customerId) {
            console.error("Still no Stripe Customer ID for user", user._id);
            return;
        }

        try {
            await stripe.customers.createBalanceTransaction(customerId, {
                amount: -5000,
                currency: 'usd',
                description: 'Referral Program Setup Bonus'
            });

            await ctx.runMutation(internal.referrals.markSetupCreditReceived, { userId: user._id });

        } catch (e: any) {
            console.error("Failed to apply credit:", e.message);
        }
    }
});

export const processReferralPayment = action({
    args: { subscriptionId: v.string() },
    handler: async (ctx, args) => {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim(), { apiVersion: "2025-01-27.acacia" as any });

        try {
            const subscription = await stripe.subscriptions.retrieve(args.subscriptionId);
            const referralCode = subscription.metadata?.referral_code;

            if (referralCode) {
                await ctx.runMutation(internal.referrals.processReferralSuccess, { code: referralCode });
            }
        } catch (e) {
            console.error("Error processing referral payment:", e);
        }
    }
});

// --- CONNECTED ACCOUNT PRODUCT & INVOICE ACTIONS ---

export const listConnectedProducts = action({
    args: { stripeAccountId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.runQuery(internal.users.getUserByToken, { tokenIdentifier: identity.subject });
        if (!user || !user.isFounder) {
            throw new Error("Access denied: Founder status required");
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim(), { apiVersion: "2025-01-27.acacia" as any });

        // 1. Fetch Products
        const products = await stripe.products.list(
            { limit: 20, active: true, expand: ['data.default_price'] },
            { stripeAccount: args.stripeAccountId }
        );

        // 2. Fetch Payment Links
        const paymentLinks = await stripe.paymentLinks.list(
            { limit: 50, active: true, expand: ['data.line_items'] },
            { stripeAccount: args.stripeAccountId }
        );

        // 3. Map Payment Links to Products
        // This is a simplified matching strategy assuming 1 link per product for now
        const productsWithLinks = products.data.map(product => {
            const link = paymentLinks.data.find(pl => {
                const lineItem = pl.line_items?.data[0];
                // Check if price matches (if standard pricing) or product matches
                return lineItem?.price?.product === product.id;
            });
            return {
                ...product,
                paymentLinkUrl: link?.url
            };
        });

        return productsWithLinks;
    }
});

export const createConnectedProduct = action({
    args: {
        stripeAccountId: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        amount: v.number(), // in cents
        imageUrl: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.runQuery(internal.users.getUserByToken, { tokenIdentifier: identity.subject });
        if (!user || !user.isFounder) {
            throw new Error("Access denied: Founder status required");
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim(), { apiVersion: "2025-01-27.acacia" as any });

        // 1. Create Product
        const product = await stripe.products.create(
            {
                name: args.name,
                description: args.description,
                images: args.imageUrl ? [args.imageUrl] : undefined,
                default_price_data: {
                    currency: 'usd',
                    unit_amount: args.amount,
                }
            },
            { stripeAccount: args.stripeAccountId }
        );

        // 2. Create Payment Link
        // We need the ID of the price we just created
        const priceId = typeof product.default_price === 'string'
            ? product.default_price
            : product.default_price?.id;

        if (!priceId) throw new Error("Failed to create price for product");

        const paymentLink = await stripe.paymentLinks.create(
            {
                line_items: [{ price: priceId, quantity: 1 }]
            },
            { stripeAccount: args.stripeAccountId }
        );

        return { product, paymentLink };
    }
});

export const archiveConnectedProduct = action({
    args: {
        stripeAccountId: v.string(),
        productId: v.string()
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.runQuery(internal.users.getUserByToken, { tokenIdentifier: identity.subject });
        if (!user || !user.isFounder) {
            throw new Error("Access denied: Founder status required");
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim(), { apiVersion: "2025-01-27.acacia" as any });

        // Archive Product
        await stripe.products.update(
            args.productId,
            { active: false },
            { stripeAccount: args.stripeAccountId }
        );

        return { success: true };
    }
});

export const listConnectedInvoices = action({
    args: { stripeAccountId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.runQuery(internal.users.getUserByToken, { tokenIdentifier: identity.subject });
        if (!user || !user.isFounder) {
            throw new Error("Access denied: Founder status required");
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim(), { apiVersion: "2025-01-27.acacia" as any });

        const invoices = await stripe.invoices.list(
            { limit: 20, expand: ['data.customer'] },
            { stripeAccount: args.stripeAccountId }
        );

        return invoices.data;
    }
});

export const createConnectedInvoice = action({
    args: {
        stripeAccountId: v.string(),
        customerName: v.string(),
        customerEmail: v.string(),
        amount: v.number(), // in cents
        description: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.runQuery(internal.users.getUserByToken, { tokenIdentifier: identity.subject });
        if (!user || !user.isFounder) {
            throw new Error("Access denied: Founder status required");
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim(), { apiVersion: "2025-01-27.acacia" as any });

        // 1. Find or Create Customer on Connected Account
        const customers = await stripe.customers.list(
            { email: args.customerEmail, limit: 1 },
            { stripeAccount: args.stripeAccountId }
        );
        let customerId = customers.data[0]?.id;

        if (!customerId) {
            const newCustomer = await stripe.customers.create(
                { email: args.customerEmail, name: args.customerName },
                { stripeAccount: args.stripeAccountId }
            );
            customerId = newCustomer.id;
        }

        // 2. Create Invoice Item (The line item)
        await stripe.invoiceItems.create(
            {
                customer: customerId,
                amount: args.amount,
                currency: 'usd',
                description: args.description,
            },
            { stripeAccount: args.stripeAccountId }
        );

        // 3. Create Draft Invoice
        const invoice = await stripe.invoices.create(
            {
                customer: customerId,
                auto_advance: false, // Draft
                collection_method: 'send_invoice',
                days_until_due: 30,
            },
            { stripeAccount: args.stripeAccountId }
        );

        return invoice;
    }
});

export const deleteConnectedInvoice = action({
    args: {
        stripeAccountId: v.string(),
        invoiceId: v.string()
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim(), { apiVersion: "2025-01-27.acacia" as any });

        // Only draft invoices can be deleted. otherwise void.
        // For simplicity we try to delete, if it fails we returns error
        try {
            await stripe.invoices.del(
                args.invoiceId,
                { stripeAccount: args.stripeAccountId }
            );
        } catch (e: any) {
            // If delete fails (e.g. not draft), try to void
            if (e.code === 'invoice_not_editable') {
                await stripe.invoices.voidInvoice(
                    args.invoiceId,
                    { stripeAccount: args.stripeAccountId }
                );
            } else {
                throw e;
            }
        }

        return { success: true };
    }
});
