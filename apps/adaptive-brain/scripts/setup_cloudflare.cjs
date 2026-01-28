// scripts/setup_cloudflare.js
const { execSync } = require('child_process');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

function sanitizeSubdomain(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-|-$/g, '');
}

async function addCustomDomainToPages(projectName, customDomain, accountId, apiToken) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains`;

    // Check if domain already exists
    const listResponse = await fetch(url, {
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
        return true;
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
        console.error(`Failed to add custom domain to Pages: ${response.status} ${text}`);
        return false;
    }

    const data = await response.json();
    console.log(`✓ Added custom domain ${customDomain} to Pages project ${projectName}`);
    return true;
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

async function main() {
    const payload = JSON.parse(process.env.GH_EVENT_PAYLOAD || '{}');
    const clientPayload = payload.client_payload || payload.event?.client_payload || {};

    const userId = clientPayload.userId || `test-user-${Math.random().toString(36).slice(2, 7)}`;
    const projectName = `startup-client-${userId.slice(-6)}-${Date.now().toString().slice(-4)}`;

    console.log(`Setting up Cloudflare Pages project: ${projectName}`);

    const cfToken = process.env.CLOUDFLARE_API_TOKEN;
    const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;

    try {
        // 1. Create the project
        try {
            execSync(`npx wrangler pages project create ${projectName} --production-branch main`, { stdio: 'inherit' });
        } catch (e) {
            console.warn(`Project ${projectName} might already exist or creation failed, continuing...`);
        }

        // 2. Set environment variables via API
        // We need to associate Convex and WorkOS
        const convexUrl = process.env.VITE_CONVEX_URL;
        const workosOrgId = process.env.VITE_WORKOS_ORG_ID;
        const workosClientId = process.env.VITE_WORKOS_CLIENT_ID;
        const workosOrgName = process.env.VITE_WORKOS_ORG_NAME || clientPayload.subdomainName;

        // Create custom domain and redirect URI if org name is provided
        let appCustomDomain = '';
        let workosRedirectUri = '';

        if (workosOrgName) {
            const sanitizedSubdomain = sanitizeSubdomain(workosOrgName);
            const baseDomain = 'adaptivestartup.io';
            appCustomDomain = `${sanitizedSubdomain}.${baseDomain}`;
            workosRedirectUri = `https://${appCustomDomain}/auth/callback`;

            console.log(`Setting up custom domain: ${appCustomDomain}`);
            console.log(`Redirect URI: ${workosRedirectUri}`);

            // Add custom domain to Pages project
            await addCustomDomainToPages(projectName, appCustomDomain, cfAccountId, cfToken);

            // Setup DNS
            try {
                const zoneId = await getZoneId(baseDomain, cfToken);
                await createDNSRecord(zoneId, appCustomDomain, `${projectName}.pages.dev`, cfToken);
            } catch (e) {
                console.warn(`DNS setup failed: ${e.message}. You may need to configure DNS manually.`);
            }
        }

        if (convexUrl && workosOrgId) {
            console.log(`Setting environment variables for project ${projectName}...`);

            const envVars = {
                VITE_CONVEX_URL: { value: convexUrl },
                VITE_WORKOS_ORG_ID: { value: workosOrgId },
                VITE_WORKOS_CLIENT_ID: { value: workosClientId },
            };

            // Add redirect URI as secret if available
            if (workosRedirectUri) {
                envVars.VITE_WORKOS_REDIRECT_URI = { 
                    value: workosRedirectUri,
                    type: 'secret'
                };
            }

            const url = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/pages/projects/${projectName}`;
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${cfToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    deployment_configs: {
                        production: { env_vars: envVars },
                        preview: { env_vars: envVars },
                    }
                }),
            });

            const data = await response.json();
            if (data.success) {
                console.log(`Environment variables set for ${projectName}.`);
            } else {
                console.error(`Failed to set environment variables: ${JSON.stringify(data.errors)}`);
            }
        }

        console.log(`Cloudflare project ${projectName} ready.`);
        if (process.env.GITHUB_OUTPUT) {
            const fs = require('fs');
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `cloudflare_project_name=${projectName}\n`);
            if (workosRedirectUri) {
                fs.appendFileSync(process.env.GITHUB_OUTPUT, `workos_redirect_uri=${workosRedirectUri}\n`);
                fs.appendFileSync(process.env.GITHUB_OUTPUT, `app_custom_domain=${appCustomDomain}\n`);
            }
        } else {
            console.log(`::set-output name=cloudflare_project_name::${projectName}`);
            if (workosRedirectUri) {
                console.log(`::set-output name=workos_redirect_uri::${workosRedirectUri}`);
                console.log(`::set-output name=app_custom_domain::${appCustomDomain}`);
            }
        }

    } catch (error) {
        console.error('Cloudflare Setup Failed:', error);
        process.exit(1);
    }
}

main();
