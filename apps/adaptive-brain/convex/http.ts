import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
    path: "/stripe-webhook",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const signature = request.headers.get("stripe-signature");
        if (!signature) return new Response("No signature", { status: 400 });

        const payload = await request.text();
        // Skip verification for now or use process.env.STRIPE_WEBHOOK_SECRET
        const event = JSON.parse(payload);

        // Save Stripe event to database for auditing
        await ctx.runMutation(internal.provisioning.saveStripeEvent, {
            eventId: event.id,
            eventType: event.type,
            customerId: event.data.object.customer || event.data.object.id,
            customerEmail: event.data.object.customer_email || event.data.object.email,
            subscriptionId: event.data.object.id,
            payload: event,
        });

        if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
            const subscription = event.data.object;
            const customerEmail = subscription.customer_email || (event as any).data.object.email; // Fallback strategy
            const stripeCustomerId = subscription.customer;

            // Extract metadata from subscription
            const metadata = subscription.metadata || {};
            const firstName = metadata.firstName || "";
            const lastName = metadata.lastName || "";
            const organizationName = metadata.organizationName || "";
            const subdomainName = metadata.subdomainName || "";
            const name = firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName || "");

            // 1. Get or Create User in BRAIN
            let userId = await ctx.runMutation(internal.users.getOrCreateUser, {
                email: customerEmail || "",
                stripeCustomerId,
                name,
                firstName,
                lastName,
                organizationName,
                subdomainName,
            });

            // 2. Trigger Provisioning if it's a new sub
            if (event.type === "customer.subscription.created") {
                await ctx.runAction(internal.provisioning.triggerProvisioning, {
                    userId: userId,
                    email: customerEmail || "",
                    name,
                    firstName,
                    lastName,
                    organizationName,
                    subdomainName,
                    plan: "pro",
                    subscriptionId: subscription.id,
                });
            }
        } else if (event.type === "customer.subscription.deleted") {
            const subscription = event.data.object;
            const customerEmail = subscription.customer_email;

            // Logic to mark all instances for this user as 'suspended'
            console.log(`BRAIN: Subscription deleted for ${customerEmail}. Suspending instances.`);
            await ctx.runMutation(internal.provisioning.suspendInstances, { email: customerEmail || "" });
        }

        return new Response("OK", { status: 200 });
    }),
});

http.route({
    path: "/gha-callback",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const body = await request.json();
        const { email, instanceUrl, projectSlug, orgId, workosUserId, plan, subdomain, customDomain } = body;

        await ctx.runMutation(internal.provisioning.registerInstance, {
            email,
            instanceUrl,
            projectSlug,
            subdomain,
            customDomain,
            orgId,
            workosUserId,
            plan
        });

        // Optional: Call the NEW instance back to sync status
        // await fetch(`${instanceUrl}/api/sync-subscription`, { ... });

        return new Response("OK", { status: 200 });
    }),
});

// Query endpoint for GitHub Actions to get user data
http.route({
    path: "/user-data",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
        const url = new URL(request.url);
        const email = url.searchParams.get("email");

        if (!email) {
            return new Response(JSON.stringify({ error: "Email required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const userData = await ctx.runQuery(internal.provisioning.getUserData, { email });

        return new Response(JSON.stringify(userData), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    }),
});

export default http;
