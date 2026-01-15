import Stripe from 'stripe';
// Usage: node setupStripe.js <STRIPE_SECRET_KEY>
const stripe = new Stripe(process.argv[2]);

async function main() {
    try {

        const baseProd = await stripe.products.create({ name: 'Adaptive Startup Pro Base' });
        const basePrice = await stripe.prices.create({
            product: baseProd.id,
            unit_amount: 16000,
            currency: 'usd',
            recurring: { interval: 'month' },
            nickname: 'Base Subscription'
        });

        const yearlyPrice = await stripe.prices.create({
            product: baseProd.id,
            unit_amount: 172800, // $160 * 12 * 0.90 = $1728
            currency: 'usd',
            recurring: { interval: 'year' },
            nickname: 'Yearly Subscription (10% Off)'
        });


        const seatProd = await stripe.products.create({ name: 'Adaptive Startup Pro Seat' });
        const seatPrice = await stripe.prices.create({
            product: seatProd.id,
            unit_amount: 3500,
            currency: 'usd',
            recurring: { interval: 'month' },
            nickname: 'Seat Add-on (Monthly)'
        });

        const seatPriceYearly = await stripe.prices.create({
            product: seatProd.id,
            unit_amount: 37800, // $35 * 12 * 0.90 = $378
            currency: 'usd',
            recurring: { interval: 'year' },
            nickname: 'Seat Add-on (Yearly)'
        });


        const tokenProd = await stripe.products.create({ name: '1M Token Pack' });
        const tokenPrice = await stripe.prices.create({
            product: tokenProd.id,
            unit_amount: 1000,
            currency: 'usd',
            nickname: '1M Tokens'
        });

        // Output JSON for easy parsing
        console.log(JSON.stringify({
            STRIPE_BASE_PRICE_ID: basePrice.id,
            STRIPE_YEARLY_PRICE_ID: yearlyPrice.id,
            STRIPE_SEAT_PRICE_ID: seatPrice.id,
            STRIPE_SEAT_PRICE_ID_YEARLY: seatPriceYearly.id,
            STRIPE_TOKEN_PACK_PRICE_ID: tokenPrice.id
        }));

    } catch (error) {
        console.error("Error creating Stripe products:", error);
        process.exit(1);
    }
}

main();
