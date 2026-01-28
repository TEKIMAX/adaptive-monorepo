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

        if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
            const subscription = event.data.object;
            const customerEmail = subscription.customer_email || (event as any).data.object.email; // Fallback strategy
            const stripeCustomerId = subscription.customer;

            // 1. Get or Create User in BRAIN
            let userId = await ctx.runMutation(internal.users.getOrCreateUser, {
                email: customerEmail || "",
                stripeCustomerId,
            });

            // 2. Trigger Provisioning if it's a new sub
            if (event.type === "customer.subscription.created") {
                await ctx.runAction(internal.provisioning.triggerProvisioning, {
                    userId: userId,
                    email: customerEmail || "",
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
        const { email, instanceUrl, projectSlug, orgId, workosUserId, plan } = body;

        await ctx.runMutation(internal.provisioning.registerInstance, {
            email,
            instanceUrl,
            projectSlug,
            orgId,
            workosUserId,
            plan
        });

        // Optional: Call the NEW instance back to sync status
        // await fetch(`${instanceUrl}/api/sync-subscription`, { ... });

        return new Response("OK", { status: 200 });
    }),
});

export default http;
