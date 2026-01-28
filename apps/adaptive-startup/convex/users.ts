import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { authKit } from "./auth";
import { internal } from "./_generated/api";
import { getEntitlements } from "./permissions";


export const updateFromWebhook = internalMutation({
    args: {
        tokenIdentifier: v.string(), // workos_user_id
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        pictureUrl: v.optional(v.string()),
        orgId: v.optional(v.string()), // WorkOS Org ID
        role: v.optional(v.string()), // "admin" or "member"
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", args.tokenIdentifier)
            )
            .unique();

        let shouldUpdateTeamMember = false;

        if (user) {
            // Update existing user
            const updates: any = {};
            if (args.name) updates.name = args.name;
            if (args.email) updates.email = args.email;
            if (args.pictureUrl) updates.pictureUrl = args.pictureUrl;

            // If orgId is provided and not in the list, add it
            if (args.orgId && !user.orgIds.includes(args.orgId)) {
                updates.orgIds = [...user.orgIds, args.orgId];
            }

            // Handle roles
            if (args.orgId && args.role) {
                const currentRoles = user.roles || [];
                const existingRoleIndex = currentRoles.findIndex(r => r.orgId === args.orgId);
                if (existingRoleIndex >= 0) {
                    // Update role if changed
                    const currentRole = currentRoles[existingRoleIndex].role;
                    // Protect "Founder" role from being overwritten by default "member" role from webhook
                    if (currentRole === "Founder" && args.role === "member") {

                    } else if (currentRole !== args.role) {
                        const newRoles = [...currentRoles];
                        newRoles[existingRoleIndex] = { orgId: args.orgId!, role: args.role! };
                        updates.roles = newRoles;
                        if (args.role === "Founder") shouldUpdateTeamMember = true;
                    }
                } else {
                    // Add new role
                    updates.roles = [...currentRoles, { orgId: args.orgId!, role: args.role! }];
                    if (args.role === "Founder") shouldUpdateTeamMember = true;
                }
            }

            await ctx.db.patch(user._id, updates);

            // Auto-activate Founder in team members
            if (shouldUpdateTeamMember && args.email) {
                await ctx.scheduler.runAfter(0, internal.team.updateMemberStatusByInviteId, {
                    email: args.email,
                    status: "Active",
                    acceptedRole: true
                });
            }

            return { userId: user._id, orgIds: updates.orgIds || user.orgIds, roles: updates.roles || user.roles };
        } else {
            // Create new user
            const roles = args.orgId && args.role ? [{ orgId: args.orgId, role: args.role }] : [];
            const userId = await ctx.db.insert("users", {
                tokenIdentifier: args.tokenIdentifier,
                name: args.name,
                email: args.email,
                pictureUrl: args.pictureUrl,
                orgIds: args.orgId ? [args.orgId] : [],
                roles: roles,
                onboardingStep: 1,
                onboardingCompleted: false,
            });

            if (args.role === "Founder" && args.email) {
                await ctx.scheduler.runAfter(0, internal.team.updateMemberStatusByInviteId, {
                    email: args.email,
                    status: "Active",
                    acceptedRole: true
                });
            }

            return { userId, orgIds: args.orgId ? [args.orgId] : [], roles };
        }
    },
});

export const removeOrgFromUser = internalMutation({
    args: {
        tokenIdentifier: v.string(),
        orgId: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", args.tokenIdentifier)
            )
            .unique();

        if (user) {
            const updates: any = {};

            // Remove from orgIds
            if (user.orgIds && user.orgIds.includes(args.orgId)) {
                updates.orgIds = user.orgIds.filter((id: string) => id !== args.orgId);
            }

            // Remove from roles
            if (user.roles) {
                const newRoles = user.roles.filter((r: any) => r.orgId !== args.orgId);
                if (newRoles.length !== user.roles.length) {
                    updates.roles = newRoles;
                }
            }

            if (Object.keys(updates).length > 0) {
                await ctx.db.patch(user._id, updates);
            }

            // Cleanup Team Members (Fix for Zombie Members)
            if (user.email) {
                const teamMembers = await ctx.db
                    .query("team_members")
                    .withIndex("by_email", (q) => q.eq("email", user.email!))
                    .collect();

                for (const member of teamMembers) {
                    if (member.orgId === args.orgId) {
                        await ctx.db.delete(member._id);
                    }
                }
            }
        }
    }
});

// Internal query to lookup user by email (for Stripe webhooks)
export const getUserByEmail = internalQuery({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .filter(q => q.eq(q.field("email"), args.email))
            .first();
    }
});

export const recordInstanceDetails = internalMutation({
    args: {
        email: v.string(),
        instanceUrl: v.string(),
        instanceProjectSlug: v.string(),
    },
    handler: async (ctx, args) => {
        const userToUpdate = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        if (userToUpdate) {
            await ctx.db.patch(userToUpdate._id, {
                instanceUrl: args.instanceUrl,
                instanceProjectSlug: args.instanceProjectSlug,
            });
        }
    }
});

// Internal query to lookup user by token identifier
export const getUserByToken = internalQuery({
    args: { tokenIdentifier: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_token", q => q.eq("tokenIdentifier", args.tokenIdentifier))
            .unique();
    }
});

// Internal query to lookup user by Stripe customer ID
export const getUserByStripeCustomerId = internalQuery({
    args: { stripeCustomerId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_stripe_customer_id", q => q.eq("stripeCustomerId", args.stripeCustomerId))
            .first();
    }
});

export const addInvitation = internalMutation({
    args: {
        id: v.string(), // Added ID
        email: v.string(),
        orgId: v.string(),
        role: v.optional(v.string()),
        token: v.optional(v.string()),
        acceptUrl: v.optional(v.string()),
        orgName: v.optional(v.string()),
        inviterName: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        // Find user by email (since they might not be authenticated yet or tokenIdentifier might differ)
        const user = await ctx.db
            .query("users")
            .filter(q => q.eq(q.field("email"), args.email))
            .first();

        if (user) {
            const currentInvites = user.invitations || [];
            // Avoid duplicates
            if (!currentInvites.some(i => i.orgId === args.orgId)) {
                await ctx.db.patch(user._id, {
                    invitations: [...currentInvites, {
                        id: args.id, // Store ID
                        orgId: args.orgId,
                        role: args.role,
                        status: 'pending',
                        token: args.token,
                        acceptUrl: args.acceptUrl,
                        orgName: args.orgName,
                        inviterName: args.inviterName,
                        date: Date.now()
                    }]
                });
            }
        }
    }
});

export const resolveInvitation = internalMutation({
    args: {
        email: v.string(),
        orgId: v.string()
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .filter(q => q.eq(q.field("email"), args.email))
            .first();

        if (user && user.invitations) {
            const newInvites = user.invitations.filter(i => i.orgId !== args.orgId);
            if (newInvites.length !== user.invitations.length) {
                await ctx.db.patch(user._id, { invitations: newInvites });
            }
        }
    }
});

export const store = mutation({
    args: {
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        pictureUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            console.error("Store User: Not authenticated - identity is null");
            // throw new Error("Called storeUser without authentication present");
            return null;
        }

        // Check if we've already stored this identity or if we're updating it
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.subject)
            )
            .unique();

        if (user !== null) {
            // If we've seen this identity before but the name has changed, patch the value.
            const updates: any = {};
            if (user.name !== args.name) updates.name = args.name;
            if (user.pictureUrl !== args.pictureUrl) updates.pictureUrl = args.pictureUrl;

            // Backfill onboarding fields if missing
            if (user.onboardingStep === undefined) updates.onboardingStep = 1;
            if (user.onboardingCompleted === undefined) updates.onboardingCompleted = false;

            if (Object.keys(updates).length > 0) {
                await ctx.db.patch(user._id, updates);
            }
            return user._id;
        }

        // If it's a new identity, create a new `User`.
        const userId = await ctx.db.insert("users", {
            tokenIdentifier: identity.subject,
            name: args.name,
            email: args.email,
            pictureUrl: args.pictureUrl,
            orgIds: [],
            status: "active",
            onboardingStep: 1,
            onboardingCompleted: false,
            // Default 3-Day Trial for Explorer
            subscriptionStatus: "trialing",
            subscriptionTier: "starter",
            endsOn: Date.now() + (3 * 24 * 60 * 60 * 1000), // 3 Days
        });
        // NOTE: We are NOT creating a default org here anymore if we rely on Webhooks/WorkOS to handle it.
        // However, for immediate UI feedback, we might want to keep it or trigger a background action.
        // For now, we'll leave it as is, but the Webhook will be the ultimate synchronizer.

        // Create a default organization for the user (Legacy/Fallback)
        const orgName = `${args.name || "User"}'s Org`;
        const orgSlug = (args.name || "user").toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now();

        const orgId = await ctx.db.insert("organizations", {
            name: orgName,
            slug: orgSlug,
            creatorId: userId
        });

        // Link user to org
        await ctx.db.patch(userId, { orgIds: [orgId] });

        return userId;
    },
});

export const getUser = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            return null;
        }
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.subject)
            )
            .unique();

        if (!user) return null;

        // Determine current role (fallback to first role or "User")
        let role = "User";
        if (user.roles && user.roles.length > 0) {
            role = user.roles[0].role;
        }

        return {
            ...user,
            role,
            // Robust defaults for missing fields
            onboardingStep: user.onboardingStep ?? 1,
            onboardingCompleted: user.onboardingCompleted ?? false,
            // Entitlements
            entitlements: getEntitlements(user)
        };
    },
});

export const listByOrg = query({
    args: { orgId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (!args.orgId) return [];

        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
            .unique();

        if (!currentUser || !currentUser.orgIds.includes(args.orgId!)) {
            return [];
        }

        const users = await ctx.db.query("users").collect();
        // Filter users who have the orgId in their orgIds array
        return users.filter(u => u.orgIds.includes(args.orgId!));
    },
});



export const removeOrgFromUserByEmail = internalMutation({
    args: {
        email: v.string(),
        orgId: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .filter(q => q.eq(q.field("email"), args.email))
            .first();

        if (user) {
            const updates: any = {};

            // Remove from orgIds
            if (user.orgIds && user.orgIds.includes(args.orgId)) {
                updates.orgIds = user.orgIds.filter((id: string) => id !== args.orgId);
            }

            // Remove from roles
            if (user.roles) {
                const newRoles = user.roles.filter((r: any) => r.orgId !== args.orgId);
                if (newRoles.length !== user.roles.length) {
                    updates.roles = newRoles;
                }
            }

            if (Object.keys(updates).length > 0) {
                await ctx.db.patch(user._id, updates);
            }
        }
    }
});

export const getProjectsByOrgId = internalQuery({
    args: { orgId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("projects")
            .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
            .collect();
    },
});

export const updateOnboardingStep = mutation({
    args: {
        step: v.number(),
        name: v.optional(v.string()),
        data: v.optional(v.object({
            role: v.optional(v.string()), // CEO, Founder...
            orgSize: v.optional(v.string()),
            yearsInBusiness: v.optional(v.string()),
            industry: v.optional(v.string()),
            startupName: v.optional(v.string()),
            hypothesis: v.optional(v.string()),
            foundingYear: v.optional(v.string()),
            aiInteractionStyle: v.optional(v.string()),
        }))
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        const updates: any = { onboardingStep: args.step };

        if (args.name) {
            updates.name = args.name;
        }

        if (args.data) {
            updates.onboardingData = {
                ...(user.onboardingData || {}),
                ...args.data
            };
        }

        await ctx.db.patch(user._id, updates);
    }
});

export const completeOnboarding = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        await ctx.db.patch(user._id, { onboardingCompleted: true });
    }
});

export const registerPublicKey = mutation({
    args: { publicKey: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        await ctx.db.patch(user._id, { publicKey: args.publicKey });
        return { success: true };
    }
});
