// scripts/setup_workos.js
const { WorkOS } = require('@workos-inc/node');

const workos = new WorkOS(process.env.WORKOS_API_KEY);

async function main() {
    const payload = JSON.parse(process.env.GH_EVENT_PAYLOAD || '{}');
    const clientPayload = payload.client_payload || payload.event?.client_payload || {};

    const email = clientPayload.email || "test@example.com";
    const name = clientPayload.name || "Test User";
    const userId = clientPayload.userId || `test-user-${Math.random().toString(36).slice(2, 7)}`;

    console.log(`Setting up WorkOS for ${email} (${name || 'No Name'})`);
    console.log('Client Payload:', JSON.stringify(clientPayload, null, 2));

    try {
        // 1. Create Organization (Minimal first)
        const orgName = name ? `${name}'s Startup` : `${email}'s Startup`;
        console.log(`Attempting to create organization: "${orgName}"`);

        const organization = await workos.organizations.createOrganization({
            name: orgName,
        });

        console.log(`Created WorkOS Organization: ${organization.id}`);

        // 2. Check for existing user
        // Note: We skip explicit user creation and invitations for now
        // Users will be created when they first authenticate via WorkOS
        const { data: users } = await workos.userManagement.listUsers({ email });
        let workosUserId;

        if (users.length > 0) {
            workosUserId = users[0].id;
            console.log(`Found existing WorkOS User: ${workosUserId}`);
        } else {
            // Use email-based identifier until user authenticates
            workosUserId = `pending-${email.replace(/[@.]/g, '-')}`;
            console.log(`No existing user found, will use placeholder: ${workosUserId}`);
            console.log(`User will be created on first authentication to the organization`);
        }

        if (process.env.GITHUB_OUTPUT) {
            const fs = require('fs');
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `workos_org_id=${organization.id}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `workos_user_id=${workosUserId}\n`);
        } else {
            console.log(`::set-output name=workos_org_id::${organization.id}`);
            console.log(`::set-output name=workos_user_id::${workosUserId}`);
        }

    } catch (error) {
        console.error('WorkOS Setup Failed:', error);
        if (error.response) {
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
        if (error.message) {
            console.error('Error message:', error.message);
        }
        process.exit(1);
    }
}


main();
