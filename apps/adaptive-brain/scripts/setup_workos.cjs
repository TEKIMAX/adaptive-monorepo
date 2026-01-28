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

    try {
        // 1. Create Organization
        const organization = await workos.organizations.createOrganization({
            name: name ? `${name}'s Startup` : `${email}'s Startup`,
            allowProfilesOutsideOrganization: true,
        });

        console.log(`Created WorkOS Organization: ${organization.id}`);

        // 2. Get or Create User
        const { data: users } = await workos.userManagement.listUsers({ email });
        let workosUser;
        if (users.length > 0) {
            workosUser = users[0];
            console.log(`Found existing WorkOS User: ${workosUser.id}`);
        } else {
            try {
                workosUser = await workos.userManagement.createUser({
                    email,
                    emailVerified: true,
                });
                console.log(`Created new WorkOS User: ${workosUser.id}`);
            } catch (createError) {
                // If creation fails, try listing again in case of race condition
                console.warn(`User creation failed, attempting to find existing user: ${createError.message}`);
                const { data: retryUsers } = await workos.userManagement.listUsers({ email });
                if (retryUsers.length > 0) {
                    workosUser = retryUsers[0];
                    console.log(`Found existing WorkOS User on retry: ${workosUser.id}`);
                } else {
                    throw createError;
                }
            }
        }

        // 3. Add User to Organization/Invitation
        // We still send an invitation to ensure they can set a password if new, 
        // but now we have their ID.
        const invitation = await workos.userManagement.sendInvitation({
            email: email,
            organizationId: organization.id,
            expiresInDays: 7,
        });

        console.log(`Sent WorkOS Invitation: ${invitation.id} for Org: ${organization.id}`);

        if (process.env.GITHUB_OUTPUT) {
            const fs = require('fs');
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `workos_org_id=${organization.id}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `workos_user_id=${workosUser.id}\n`);
        } else {
            console.log(`::set-output name=workos_org_id::${organization.id}`);
            console.log(`::set-output name=workos_user_id::${workosUser.id}`);
        }

    } catch (error) {
        console.error('WorkOS Setup Failed:', error);
        process.exit(1);
    }
}


main();
