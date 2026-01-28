// scripts/setup_cloudflare.js
const { execSync } = require('child_process');

async function main() {
    const payload = JSON.parse(process.env.GH_EVENT_PAYLOAD);
    const userId = payload.client_payload.userId;
    const projectName = `startup-client-${userId.slice(-6)}-${Date.now().toString().slice(-4)}`;

    console.log(`Setting up Cloudflare Pages project: ${projectName}`);

    try {
        // 1. Create the project
        // Note: CLI might need a branch, we'll use 'main'
        try {
            execSync(`npx wrangler pages project create ${projectName} --production-branch main`, { stdio: 'inherit' });
        } catch (e) {
            console.warn(`Project ${projectName} might already exist or creation failed, continuing...`);
        }

        // 2. Set environment variables (Note: wrangler currently supports setting them in dashboard or via API more reliably for Pages)
        // However, we can use the build-time env vars if we deploy via CLI

        console.log(`Cloudflare project ${projectName} ready.`);
        console.log(`::set-output name=cloudflare_project_name::${projectName}`);

    } catch (error) {
        console.error('Cloudflare Setup Failed:', error);
        process.exit(1);
    }
}

main();
