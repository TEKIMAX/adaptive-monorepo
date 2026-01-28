// Setup custom subdomain DNS on Cloudflare
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function getZoneId(domain, apiToken) {
    const url = `https://api.cloudflare.com/client/v4/zones?name=${domain}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to get zone ID: ${response.status} ${text}`);
    }

    const data = await response.json();
    if (!data.result || data.result.length === 0) {
        throw new Error(`Zone not found for domain: ${domain}`);
    }

    return data.result[0].id;
}

async function createDNSRecord(zoneId, subdomain, target, apiToken) {
    const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`;

    // Check if record already exists
    const listUrl = `${url}?name=${subdomain}`;
    const listResponse = await fetch(listUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
        },
    });

    const listData = await listResponse.json();

    // If record exists, update it instead
    if (listData.result && listData.result.length > 0) {
        const existingRecordId = listData.result[0].id;
        console.log(`DNS record already exists for ${subdomain}, updating...`);

        const updateUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${existingRecordId}`;
        const updateResponse = await fetch(updateUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'CNAME',
                name: subdomain,
                content: target,
                ttl: 1, // Auto
                proxied: true, // Enable Cloudflare proxy
            }),
        });

        if (!updateResponse.ok) {
            const text = await updateResponse.text();
            throw new Error(`Failed to update DNS record: ${updateResponse.status} ${text}`);
        }

        const updateData = await updateResponse.json();
        console.log(`✓ Updated DNS record: ${subdomain} → ${target}`);
        return updateData.result;
    }

    // Create new record
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: 'CNAME',
            name: subdomain,
            content: target,
            ttl: 1, // Auto
            proxied: true, // Enable Cloudflare proxy for SSL
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to create DNS record: ${response.status} ${text}`);
    }

    const data = await response.json();
    console.log(`✓ Created DNS record: ${subdomain} → ${target}`);
    return data.result;
}

async function addCustomDomainToPages(projectName, customDomain, accountId, apiToken) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains`;

    // Check if domain already exists
    const listUrl = url;
    const listResponse = await fetch(listUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
        },
    });

    const listData = await listResponse.json();

    // Check if domain already attached
    if (listData.result && listData.result.some(d => d.name === customDomain)) {
        console.log(`✓ Custom domain ${customDomain} already attached to Pages project`);
        return;
    }

    // Add custom domain to Pages project
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: customDomain,
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to add custom domain to Pages: ${response.status} ${text}`);
    }

    const data = await response.json();
    console.log(`✓ Added custom domain ${customDomain} to Pages project ${projectName}`);
    return data.result;
}

const main = async () => {
    const payload = JSON.parse(process.env.GH_EVENT_PAYLOAD || '{}');
    const clientPayload = payload.client_payload || payload.event?.client_payload || {};

    const subdomainName = clientPayload.subdomainName;
    const projectName = process.env.CLOUDFLARE_PROJECT_NAME;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

    if (!subdomainName) {
        console.error('Missing subdomainName in client_payload');
        process.exit(1);
    }

    if (!projectName) {
        console.error('Missing CLOUDFLARE_PROJECT_NAME environment variable');
        process.exit(1);
    }

    if (!apiToken || !accountId) {
        console.error('Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID');
        process.exit(1);
    }

    const baseDomain = 'adaptivestartup.io';
    const fullDomain = `${subdomainName}.${baseDomain}`;
    const pagesTarget = `${projectName}.pages.dev`; // Cloudflare Pages domain

    console.log(`Setting up DNS for ${fullDomain}...`);
    console.log(`Target: ${pagesTarget}`);

    try {
        // Step 1: Get Zone ID for adaptivestartup.io
        console.log('\n1. Getting Cloudflare Zone ID...');
        const zoneId = await getZoneId(baseDomain, apiToken);
        console.log(`✓ Zone ID: ${zoneId}`);

        // Step 2: Create CNAME record
        console.log('\n2. Creating DNS CNAME record...');
        await createDNSRecord(zoneId, fullDomain, pagesTarget, apiToken);

        // Step 3: Add custom domain to Cloudflare Pages project
        console.log('\n3. Adding custom domain to Pages project...');
        await addCustomDomainToPages(projectName, fullDomain, accountId, apiToken);

        // Output the custom domain for the workflow
        if (process.env.GITHUB_OUTPUT) {
            const fs = require('fs');
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `custom_domain=${fullDomain}\n`);
        } else {
            console.log(`::set-output name=custom_domain::${fullDomain}`);
        }

        console.log(`\n✅ DNS setup complete!`);
        console.log(`Your instance will be available at: https://${fullDomain}`);
        console.log(`Note: DNS propagation may take a few minutes.`);

    } catch (error) {
        console.error('\n❌ DNS setup failed:', error);
        process.exit(1);
    }
};

main();
