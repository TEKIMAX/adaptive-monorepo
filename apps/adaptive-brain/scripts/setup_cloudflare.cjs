// scripts/setup_cloudflare.js
const { execSync } = require('child_process');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

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

        if (convexUrl && workosOrgId) {
            console.log(`Setting environment variables for project ${projectName}...`);

            const envVars = {
                VITE_CONVEX_URL: { value: convexUrl },
                VITE_WORKOS_ORG_ID: { value: workosOrgId },
                VITE_WORKOS_CLIENT_ID: { value: workosClientId },
            };

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
        } else {
            console.log(`::set-output name=cloudflare_project_name::${projectName}`);
        }

    } catch (error) {
        console.error('Cloudflare Setup Failed:', error);
        process.exit(1);
    }
}

main();
