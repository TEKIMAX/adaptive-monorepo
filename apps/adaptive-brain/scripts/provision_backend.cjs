// scripts/provision_backend.js
const { execSync } = require('child_process');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function createConvexProject(teamId, projectName, token) {
    const url = `https://api.convex.dev/v1/teams/${teamId}/create_project`;
    console.log(`Calling Convex API: ${url}`);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectName: projectName, deploymentType: 'prod' }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to create Convex project: ${response.status} ${text}`);
    }

    return await response.json();
}

const main = async () => {
    const payload = JSON.parse(process.env.GH_EVENT_PAYLOAD || '{}');
    // Handle both repository_dispatch (client_payload) and manual workflow_dispatch/push triggers
    const clientPayload = payload.client_payload || payload.event?.client_payload || {};

    const userId = clientPayload.userId || `test-user-${Math.random().toString(36).slice(2, 7)}`;
    const email = clientPayload.email || "test@example.com";

    const teamId = process.env.CONVEX_TEAM_ID;
    const token = process.env.CONVEX_TEAM_ACCESS_TOKEN;

    if (!teamId || !token) {
        console.error("Missing CONVEX_TEAM_ID or CONVEX_TEAM_ACCESS_TOKEN environment variables.");
        process.exit(1);
    }

    console.log(`Provisioning Convex Backend for ${email} (Team: ${teamId})...`);

    try {
        const projectName = `startup-${userId.slice(-6)}-${Date.now().toString().slice(-4)}`;
        console.log(`Creating project: ${projectName}`);

        const project = await createConvexProject(teamId, projectName, token);
        console.log("Project created. Full response:", JSON.stringify(project, null, 2));

        const deploymentUrl = project.deploymentUrl;

        if (!deploymentUrl) {
            throw new Error(`Could not find deploymentUrl in API response: ${JSON.stringify(project)}`);
        }

        console.log(`Project created. Deployment URL: ${deploymentUrl}`);

        // Output the new URL for the next steps
        console.log(`::set-output name=convex_url::${deploymentUrl}`);
        // The API returns deploymentName or projectId, but usually we need a slug. 
        // We'll use the deploymentName (e.g. astute-ibis-160) which often matches the slug.
        const projectSlug = project.deploymentName || project.slug || projectName;
        console.log(`::set-output name=convex_project_slug::${projectSlug}`);

    } catch (error) {
        console.error("Convex provisioning failed:", error);
        process.exit(1);
    }
};

main();
