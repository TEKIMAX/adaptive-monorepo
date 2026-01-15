"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { WorkOS } from "@workos-inc/node";
import crypto from "crypto";

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export const handleWebhook = action({
    args: {
        signature: v.string(),
        payload: v.string(),
    },
    handler: async (ctx, args) => {
        try {

            const secret = process.env.WORKOS_WEBHOOK_SECRET!;

            if (!secret) throw new Error("WORKOS_WEBHOOK_SECRET is not set");

            // Parse signature header
            // Header format: t=timestamp, v1=signature
            const parts = args.signature.split(",");
            const timestampPart = parts.find(p => p.trim().startsWith("t="));
            const signaturePart = parts.find(p => p.trim().startsWith("v1="));

            if (!timestampPart || !signaturePart) {
                throw new Error("Invalid signature header format");
            }

            const timestamp = timestampPart.split("=")[1];
            const signature = signaturePart.split("=")[1];

            // Verify signature
            const toSign = `${timestamp}.${args.payload}`;
            const computedSignature = crypto
                .createHmac("sha256", secret)
                .update(toSign)
                .digest("hex");

            if (computedSignature !== signature) {
                // Try timing safe equal for security, but fall back to string comparison if needed
                // Note: In V8/Node, timingSafeEqual requires buffers of equal length
                const a = Buffer.from(computedSignature);
                const b = Buffer.from(signature);
                if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
                    throw new Error("Signature hash does not match");
                }
            }



            const webhook = JSON.parse(args.payload);


            if (webhook.event === "invitation.created") {
                const invite = webhook.data;
                let orgName = invite.organization_name;
                let inviterName = "Someone";

                // 1. Fetch Organization Name if missing
                if (!orgName) {
                    try {
                        const org = await workos.organizations.getOrganization(invite.organization_id);
                        orgName = org.name;
                    } catch (e) {
                        console.error("Failed to fetch org name for invite:", e);
                        orgName = "New Organization";
                    }
                }

                // 2. Fetch Inviter Name
                if (invite.inviter_user_id) {
                    try {
                        const inviter = await workos.userManagement.getUser(invite.inviter_user_id);
                        inviterName = `${inviter.firstName} ${inviter.lastName}`.trim() || inviter.email || "Someone";
                    } catch (e) {
                        console.error("Failed to fetch inviter name:", e);
                    }
                }

                await ctx.runMutation(internal.users.addInvitation, {
                    id: invite.id,
                    email: invite.email,
                    orgId: invite.organization_id,
                    role: 'member', // Default, or fetch if needed
                    token: invite.token,
                    acceptUrl: invite.accept_invitation_url,
                    orgName: orgName,
                    inviterName: inviterName
                });
            } else if (webhook.event === "invitation.accepted") {
                const invite = webhook.data;
                const inviteId = invite.id;


                // Resolve invitation in users table
                await ctx.runMutation(internal.users.resolveInvitation, {
                    email: invite.email,
                    orgId: invite.organization_id
                });

                // Fetch user details if available
                let userDetails = { name: "", pictureUrl: "" };
                // Fix: WorkOS payload uses 'accepted_user_id', not 'accepted_by_user_id'
                const userId = invite.accepted_user_id || invite.accepted_by_user_id;


                if (userId) {
                    try {
                        const user = await workos.userManagement.getUser(userId);
                        userDetails.name = `${user.firstName} ${user.lastName}`.trim();
                        userDetails.pictureUrl = user.profilePictureUrl || "";


                        // Ensure User is linked to Org in 'users' table immediately
                        await ctx.runMutation(internal.users.updateFromWebhook, {
                            tokenIdentifier: userId,
                            orgId: invite.organization_id,
                            role: 'member',
                            name: userDetails.name,
                            email: invite.email,
                            pictureUrl: userDetails.pictureUrl
                        });
                    } catch (e) {
                        console.error("Failed to fetch user details or update user for accepted invite:", e);
                    }
                }

                // Find ALL Projects from Org ID and add member to each
                const projects = await ctx.runQuery(internal.users.getProjectsByOrgId, { orgId: invite.organization_id });

                for (const project of projects) {
                    await ctx.runMutation(internal.team.updateMemberStatusByInviteId, {
                        workosInvitationId: inviteId,
                        email: invite.email,
                        status: "Active",
                        acceptedRole: true,
                        name: userDetails.name || undefined,
                        pictureUrl: userDetails.pictureUrl || undefined,
                        projectId: project._id,
                        orgId: invite.organization_id
                    });
                }

            } else if (webhook.event === "invitation.revoked" || webhook.event === "invitation.deleted") {
                const invite = webhook.data;
                // Resolve/Remove invitation from users table
                await ctx.runMutation(internal.users.resolveInvitation, {
                    email: invite.email,
                    orgId: invite.organization_id
                });

                // CRITICAL: Also remove the user from the organization's member list and roles
                await ctx.runMutation(internal.users.removeOrgFromUserByEmail, {
                    email: invite.email,
                    orgId: invite.organization_id
                });

                // Also update team member status if applicable
                await ctx.runMutation(internal.team.updateMemberStatusByInviteId, {
                    workosInvitationId: invite.id,
                    status: "Revoked",
                    acceptedRole: false,
                });
            } else if (webhook.event === "user.created" || webhook.event === "user.updated") {
                const user = webhook.data;
                await ctx.runMutation(internal.users.updateFromWebhook, {
                    tokenIdentifier: user.id,
                    name: `${user.firstName} ${user.lastName}`.trim(),
                    email: user.email,
                    pictureUrl: user.profilePictureUrl,
                });
            } else if (webhook.event === "organization_membership.created") {
                const membership = webhook.data;

                // 1. Fetch User Details from WorkOS to get name/picture
                let userDetails = { name: "Member", email: "", pictureUrl: "" };
                try {
                    const user = await workos.userManagement.getUser(membership.user_id);
                    userDetails = {
                        name: `${user.firstName} ${user.lastName}`.trim(),
                        email: user.email,
                        pictureUrl: user.profilePictureUrl || ""
                    };
                } catch (e) {
                    console.error("Failed to fetch user details for membership:", e);
                }

                // 2. Update Users Table
                await ctx.runMutation(internal.users.updateFromWebhook, {
                    tokenIdentifier: membership.user_id,
                    orgId: membership.organization_id,
                    role: 'member', // Default role
                    name: userDetails.name,
                    email: userDetails.email,
                    pictureUrl: userDetails.pictureUrl
                });

                // 3. Update Team Member Record (Sync Profile)
                if (userDetails.email) {
                    await ctx.runMutation(internal.team.updateMemberStatusByInviteId, {
                        email: userDetails.email,
                        status: "Active",
                        acceptedRole: true,
                        name: userDetails.name,
                        pictureUrl: userDetails.pictureUrl
                    });
                }
            } else if (webhook.event === "organization_membership.deleted") {
                const membership = webhook.data;
                await ctx.runMutation(internal.users.removeOrgFromUser, {
                    tokenIdentifier: membership.user_id,
                    orgId: membership.organization_id,
                });
            } else if (webhook.event === "organization.deleted") {
                const org = webhook.data;
                await ctx.runMutation(internal.projects.markOrgDeleted, {
                    orgId: org.id,
                });
            } else if (
                webhook.event === "authentication.email_verification_succeeded" ||
                webhook.event === "authentication.password_reset_succeeded" ||
                webhook.event === "authentication.magic_link_succeeded"
            ) {
                // No specific action needed?
            }
        } catch (err: any) {
            console.error("WorkOS Webhook Failed:", err);
            throw new Error(`Webhook Error: ${err.message || String(err)}`);
        }

        return { success: true };
    },
});

export const getWidgetToken = action({
    args: {
        orgId: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.runQuery(api.users.getUser);
        if (!user || !user.orgIds.includes(args.orgId)) {
            throw new Error("Unauthorized org access");
        }



        // Auto-fix: Ensure user has 'founder' role if they are accessing settings
        try {
            const memberships = await workos.userManagement.listOrganizationMemberships({
                userId: identity.subject,
                organizationId: args.orgId,
            });

            if (memberships.data.length > 0) {
                const membership = memberships.data[0];


                if (membership.role.slug === 'member') {


                    // Enforce Active status locally
                    if (user && user.email) {
                        await ctx.scheduler.runAfter(0, internal.team.updateMemberStatusByInviteId, {
                            email: user.email,
                            status: "Active",
                            acceptedRole: true
                        });
                    }
                }
            }
        } catch (e) {
            console.error("Failed to check/update membership:", e);
            // Continue trying to get token anyway
        }

        try {
            const token = await workos.widgets.getToken({
                organizationId: args.orgId,
                userId: identity.subject,
                scopes: [
                    'widgets:users-table:manage',
                    'widgets:sso:manage',
                    'widgets:domain-verification:manage'
                ],
            });

            return token;
        } catch (err: any) {
            console.error("Failed to generate widget token:", err);
            if (err.raw) console.error("WorkOS Raw Error:", JSON.stringify(err.raw, null, 2));
            throw err;
        }
    },
});

export const updateOrganization = action({
    args: {
        orgId: v.string(),
        name: v.optional(v.string()),
        stripeCustomerId: v.optional(v.string()), // Allow linking Stripe
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.runQuery(api.users.getUser);
        if (!user || !user.orgIds.includes(args.orgId)) {
            throw new Error("Unauthorized org access");
        }

        // Verify user is an admin or founder via WorkOS
        const memberships = await workos.userManagement.listOrganizationMemberships({
            userId: identity.subject,
            organizationId: args.orgId,
        });

        const isAdmin = memberships.data.some(m => ['founder', 'admin'].includes(m.role.slug));
        if (!isAdmin) throw new Error("Unauthorized: Only Admins or Founders can update the organization");

        const updatePayload: any = { organization: args.orgId };
        if (args.name) updatePayload.name = args.name;
        if (args.stripeCustomerId) updatePayload.stripeCustomerId = args.stripeCustomerId;

        const updatedOrg = await workos.organizations.updateOrganization(updatePayload);
        return updatedOrg;
    },
});

export const acceptInvitation = action({
    args: {
        invitationId: v.string()
    },
    handler: async (ctx, args) => {

        try {
            // 1. Fetch details first to get email/orgId
            const invite = await workos.userManagement.getInvitation(args.invitationId);

            // 2. Accept at WorkOS
            await workos.userManagement.acceptInvitation(args.invitationId);

            // 3. Update local state immediately (don't wait for webhook)
            await ctx.runMutation(internal.users.resolveInvitation, {
                email: invite.email,
                orgId: invite.organizationId!
            });

            await ctx.runMutation(internal.team.updateMemberStatusByInviteId, {
                workosInvitationId: args.invitationId,
                status: "Active",
                acceptedRole: true,
            });

        } catch (e: any) {
            console.error("Failed to accept invitation:", e);
            throw new Error("Failed to accept invitation");
        }
    }
});

export const revokeInvitation = action({
    args: {
        invitationId: v.string()
    },
    handler: async (ctx, args) => {
        try {
            // 1. Fetch details first
            const invite = await workos.userManagement.getInvitation(args.invitationId);

            // 2. Revoke at WorkOS
            await workos.userManagement.revokeInvitation(args.invitationId);

            // 3. Update local state
            await ctx.runMutation(internal.users.resolveInvitation, {
                email: invite.email,
                orgId: invite.organizationId!
            });

            // Optionally remove member from team if needed, but resolveInvitation handles the user side.

        } catch (e: any) {
            console.error("Failed to revoke invitation:", e);
            throw new Error("Failed to revoke invitation");
        }
    }
});

export const leaveOrganization = action({
    args: {
        orgId: v.string()
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        try {
            // 1. Get User's WorkOS Memberships for this Org
            const memberships = await workos.userManagement.listOrganizationMemberships({
                userId: identity.subject,
                organizationId: args.orgId
            });

            const membership = memberships.data.find(m => m.organizationId === args.orgId);
            if (!membership) {
                console.warn("No membership found in WorkOS to delete, but proceeding with local cleanup.");
            } else {
                // 2. Delete Membership in WorkOS
                await workos.userManagement.deleteOrganizationMembership(membership.id);
            }

            // 3. Trigger Local Cleanup (Remove from users table and team_members)
            // We reuse the removeOrgFromUser internal mutation which handles both
            await ctx.runMutation(internal.users.removeOrgFromUser, {
                tokenIdentifier: identity.subject,
                orgId: args.orgId
            });

        } catch (e: any) {
            console.error("Failed to leave organization:", e);
            throw new Error("Failed to leave organization: " + e.message);
        }
    }
});
export const syncOrganizationMembers = action({
    args: {
        orgId: v.string(),
        projectId: v.id("projects"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        try {
            // 1. Fetch all memberships from WorkOS
            const memberships = await workos.userManagement.listOrganizationMemberships({
                organizationId: args.orgId,
                limit: 100
            });

            const activeMembers = memberships.data;
            let updatedCount = 0;

            // 2. Iterate and update local status
            for (const membership of activeMembers) {
                try {
                    // Fetch user details to get email
                    const user = await workos.userManagement.getUser(membership.userId);

                    if (user.email) {
                        // Update local team member status to Active
                        await ctx.runMutation(internal.team.updateMemberStatusByInviteId, {
                            email: user.email,
                            status: "Active",
                            acceptedRole: true,
                            name: `${user.firstName} ${user.lastName}`.trim(),
                            pictureUrl: user.profilePictureUrl || undefined,
                            projectId: args.projectId,
                            orgId: args.orgId
                        });
                        updatedCount++;
                    }
                } catch (e) {
                    console.error(`Failed to sync member ${membership.userId}:`, e);
                }
            }

            return { success: true, count: updatedCount };

        } catch (e: any) {
            console.error("Failed to sync organization members:", e);
            throw new Error("Failed to sync members: " + e.message);
        }
    }
});
