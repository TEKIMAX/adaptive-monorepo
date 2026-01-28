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

        // 2. Create/Invite User as Admin
        // We send an invitation that links the user to the new organization.
        const invitation = await workos.userManagement.sendInvitation({
            email: email,
            organizationId: organization.id,
            expiresInDays: 7,
            // invitationUrl: process.env.VITE_APP_URL + '/accept-invite', // Optional: customize redirect
        });

        console.log(`Sent WorkOS Invitation: ${invitation.id} for Org: ${organization.id}`);

        // 3. Output the orgId for next steps
        console.log(`::set-output name=workos_org_id::${organization.id}`);

    } catch (error) {
        console.error('WorkOS Setup Failed:', error);
        process.exit(1);
    }
}


main();
