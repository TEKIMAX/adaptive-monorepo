// Test script to simulate Stripe webhook events
const https = require('https');

const BRAIN_URL = process.env.BRAIN_CONVEX_URL || 'https://outstanding-goldfinch-979.convex.site';

// Simulated Stripe subscription.created event
const testEvent = {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    api_version: '2025-11-17',
    created: Math.floor(Date.now() / 1000),
    type: 'customer.subscription.created',
    data: {
        object: {
            id: `sub_test_${Date.now()}`,
            object: 'subscription',
            customer: `cus_test_${Date.now()}`,
            customer_email: 'test@example.com',
            status: 'active',
            items: {
                data: [
                    {
                        price: {
                            id: 'price_1Spx0lDb04z0Udv5BKHKiYrf',
                            product: 'prod_test',
                            unit_amount: 2900,
                            currency: 'usd',
                        },
                    },
                ],
            },
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 2592000, // 30 days
            metadata: {
                firstName: 'John',
                lastName: 'Doe',
                organizationName: 'Acme Corp',
                subdomainName: 'acme',
            },
        },
    },
};

async function sendWebhook() {
    console.log('🧪 Testing Stripe Webhook...');
    console.log(`📧 Email: ${testEvent.data.object.customer_email}`);
    console.log(`🔗 Brain URL: ${BRAIN_URL}/stripe-webhook`);

    const url = new URL(`${BRAIN_URL}/stripe-webhook`);

    const postData = JSON.stringify(testEvent);

    const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'stripe-signature': 'test_signature', // For test purposes
        },
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ Webhook sent successfully!');
                    console.log('📊 Response:', data || 'OK');
                    resolve(data);
                } else {
                    console.error(`❌ Webhook failed with status ${res.statusCode}`);
                    console.error('Response:', data);
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Request failed:', error);
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

async function checkUserData() {
    console.log('\n🔍 Checking user data in Brain...');

    const url = `${BRAIN_URL}/user-data?email=test@example.com`;

    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    const userData = JSON.parse(data);
                    console.log('✅ User data retrieved:');
                    console.log(JSON.stringify(userData, null, 2));
                    resolve(userData);
                } else {
                    console.error(`❌ Failed to get user data: ${res.statusCode}`);
                    console.error('Response:', data);
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
        }).on('error', (error) => {
            console.error('❌ Request failed:', error);
            reject(error);
        });
    });
}

async function main() {
    try {
        // Send webhook
        await sendWebhook();

        // Wait a bit for processing
        console.log('\n⏳ Waiting 3 seconds for processing...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check user data
        await checkUserData();

        console.log('\n✅ Test completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('1. Check GitHub Actions runs: https://github.com/tekimax/adaptive-monorepo/actions');
        console.log('2. Verify Brain database has the user and events');
        console.log('3. Monitor provisioning job status');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

main();
