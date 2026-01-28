// scripts/setup_stripe_webhooks.js
const Stripe = require('stripe');

async function main() {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const payload = JSON.parse(process.env.GH_EVENT_PAYLOAD || '{}');
    const clientPayload = payload.client_payload || payload.event?.client_payload || {};
    const convexUrl = process.env.NEW_CONVEX_URL;

    console.log(`Setting up Stripe Webhook for ${convexUrl}...`);

    try {
        const webhookEndpoint = await stripe.webhookEndpoints.create({
            url: `${convexUrl}/stripe/events`,
            enabled_events: [
                'checkout.session.completed',
                'customer.subscription.created',
                'customer.subscription.updated',
                'customer.subscription.deleted',
                'invoice.payment_succeeded'
            ],
            description: `Webhook for ${clientPayload.email || 'manual-test'}`,
        });

        console.log(`Created Stripe Webhook: ${webhookEndpoint.id}`);
        if (process.env.GITHUB_OUTPUT) {
            const fs = require('fs');
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `stripe_webhook_secret=${webhookEndpoint.secret}\n`);
        } else {
            console.log(`::set-output name=stripe_webhook_secret::${webhookEndpoint.secret}`);
        }

    } catch (error) {
        console.error('Stripe Webhook Setup Failed:', error);
        process.exit(1);
    }
}

main();
