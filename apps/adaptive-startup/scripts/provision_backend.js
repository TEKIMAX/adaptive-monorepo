// scripts/provision_backend.js
const { execSync } = require('child_process');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function createConvexProject(teamId, projectName, token) {
    const response = await fetch(`https://api.convex.dev/api/v1/teams/${teamId}/projects`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: projectName }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to create Convex project: ${response.status} ${text}`);
    }

    return await response.json();
}

const main = async () => {
    const payload = JSON.parse(process.env.GH_EVENT_PAYLOAD);
    const { userId, email } = payload.client_payload;
    const teamId = process.env.CONVEX_TEAM_ID;
    const token = process.env.CONVEX_TEAM_ACCESS_TOKEN;

    console.log(`Provisioning Convex Backend for ${email}...`);

    try {
        const projectName = `startup-${userId.slice(-6)}-${Date.now().toString().slice(-4)}`;
        console.log(`Creating project: ${projectName}`);

        const project = await createConvexProject(teamId, projectName, token);
        const deploymentUrl = project.production_deployment.url;

        console.log(`Project created. Deployment URL: ${deploymentUrl}`);

        // Output the new URL for the next steps
        console.log(`::set-output name=convex_url::${deploymentUrl}`);
        console.log(`::set-output name=convex_project_slug::${project.slug}`);

    } catch (error) {
        console.error("Convex provisioning failed:", error);
        process.exit(1);
    }
};

main();
