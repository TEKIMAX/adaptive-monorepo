import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, components, internal } from "./_generated/api";
import { registerRoutes } from "@convex-dev/stripe";

const http = httpRouter();

// Stripe routes removed - handled by BRAIN Control Plane


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
    path: "/api/sync-subscription",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const authHeader = request.headers.get("Authorization");
        const brainSecret = process.env.BRAIN_SHARED_SECRET;

        if (!brainSecret || authHeader !== `Bearer ${brainSecret}`) {
            return new Response("Unauthorized", { status: 401 });
        }

        const { status, tier, endsOn } = await request.json();

        // Use an internal mutation to update the local 'singleton' or user records
        // For a dedicated instance, we might just update the configuration or the owner user
        await ctx.runMutation(internal.stripe.updateSubscriptionStatus, {
            subscriptionStatus: status,
            endsOn,
            tier,
            // In a dedicated instance, we might not need the userId if there's only one owner
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    }),
});

export default http;
