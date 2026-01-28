// Configure environment variables and deploy to new Convex project
const { execSync } = require('child_process');
const fs = require('fs');

async function createDeployKey(projectId, token) {
    const url = `https://api.convex.dev/api/projects/${projectId}/deploy_keys`;

    console.log(`Creating deploy key for project ${projectId}...`);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            description: 'GitHub Actions CI/CD Deploy Key',
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to create deploy key: ${response.status} ${text}`);
    }

    const result = await response.json();
    console.log(`✓ Deploy key created: ${result.deployKey.substring(0, 20)}...`);
    return result.deployKey;
}

async function setEnvironmentVariable(deploymentName, key, value, token) {
    const url = `https://api.convex.dev/api/deployment/${deploymentName}/environment_variables`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: key,
            value: value,
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to set ${key}: ${response.status} ${text}`);
    }

    console.log(`✓ Set ${key}`);
}

async function deployCode(deploymentName, deployKey) {
    console.log('Deploying code to Convex...');

    try {
        execSync(`npx convex deploy --prod`, {
            stdio: 'inherit',
            env: {
                ...process.env,
                CONVEX_DEPLOYMENT: `prod:${deploymentName}`,
                CONVEX_DEPLOY_KEY: deployKey,
            }
        });

        console.log('✓ Code deployed successfully');

    } catch (error) {
        console.error('Deployment failed:', error.message);
        throw error;
    }
}

async function main() {
    const deploymentName = process.env.DEPLOYMENT_NAME;
    const projectId = process.env.PROJECT_ID;
    const projectSlug = process.env.PROJECT_SLUG;
    const teamToken = process.env.CONVEX_TEAM_ACCESS_TOKEN;

    const envVars = {
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
        WORKOS_ORG_ID: process.env.WORKOS_ORG_ID,
        WORKOS_CLIENT_ID: process.env.WORKOS_CLIENT_ID,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    };

    console.log(`Configuring deployment: ${deploymentName}`);
    console.log(`Project ID: ${projectId}`);
    console.log(`Project Slug: ${projectSlug}`);

    try {
        // Step 1: Create deploy key for the project
        console.log('\n1. Creating deploy key...');
        const deployKey = await createDeployKey(projectId, teamToken);

        // Step 2: Set environment variables
        console.log('\n2. Setting environment variables...');
        for (const [key, value] of Object.entries(envVars)) {
            if (value) {
                await setEnvironmentVariable(deploymentName, key, value, teamToken);
            }
        }

        // Step 3: Deploy code using the deploy key
        console.log('\n3. Deploying code...');
        await deployCode(deploymentName, deployKey);

        console.log('\n✅ Configuration and deployment complete!');

    } catch (error) {
        console.error('\n❌ Configuration failed:', error);
        process.exit(1);
    }
}

main();
