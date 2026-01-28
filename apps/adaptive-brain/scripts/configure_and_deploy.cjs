// Configure environment variables and deploy to new Convex project
const { execSync } = require('child_process');
const fs = require('fs');

async function createDeployKey(deploymentName, token) {
    const url = `https://api.convex.dev/v1/deployments/${deploymentName}/create_deploy_key`;

    console.log(`Creating deploy key for deployment ${deploymentName}...`);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: 'GitHub Actions CI/CD Deploy Key',
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

async function setEnvironmentVariables(deploymentName, envVars, token) {
    const url = `https://${deploymentName}.convex.cloud/api/v1/update_environment_variables`;

    const changes = Object.entries(envVars)
        .filter(([_, value]) => value) // Only include non-empty values
        .map(([name, value]) => ({ name, value }));

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Convex ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ changes }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to set environment variables: ${response.status} ${text}`);
    }

    console.log(`✓ Set ${changes.length} environment variables`);
}

async function deployCode(deploymentName, deployKey) {
    console.log('Deploying code to Convex...');

    try {
        execSync(`npx convex deploy`, {
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
        WORKOS_API_KEY: process.env.WORKOS_API_KEY,
        WORKOS_ORG_ID: process.env.WORKOS_ORG_ID,
        WORKOS_CLIENT_ID: process.env.WORKOS_CLIENT_ID,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    };

    console.log(`Configuring deployment: ${deploymentName}`);
    console.log(`Project ID: ${projectId}`);
    console.log(`Project Slug: ${projectSlug}`);

    try {
        // Step 1: Create deploy key for the deployment
        console.log('\n1. Creating deploy key...');
        const deployKey = await createDeployKey(deploymentName, teamToken);

        // Step 2: Set environment variables
        console.log('\n2. Setting environment variables...');
        await setEnvironmentVariables(deploymentName, envVars, teamToken);

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
