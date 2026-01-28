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

        // 2. Get existing user or let invitation create them
        // WorkOS automatically creates users when sending invitations
        const { data: users } = await workos.userManagement.listUsers({ email });
        let workosUser = users.length > 0 ? users[0] : null;

        if (workosUser) {
            console.log(`Found existing WorkOS User: ${workosUser.id}`);
        } else {
            console.log(`User will be created via invitation for: ${email}`);
        }

        // 3. Send invitation (this will create the user if they don't exist)
        const invitation = await workos.userManagement.sendInvitation({
            email: email,
            organizationId: organization.id,
            expiresInDays: 7,
        });

        console.log(`Sent WorkOS Invitation: ${invitation.id} for Org: ${organization.id}`);

        // 4. Fetch the user again after invitation (they should exist now)
        if (!workosUser) {
            const { data: newUsers } = await workos.userManagement.listUsers({ email });
            workosUser = newUsers.length > 0 ? newUsers[0] : null;
            if (workosUser) {
                console.log(`User created via invitation: ${workosUser.id}`);
            } else {
                console.warn(`Could not find user after invitation, using placeholder ID`);
                // Use a placeholder - the user will be created when they accept the invitation
                workosUser = { id: `pending-${email.replace('@', '-at-')}` };
            }
        }

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
