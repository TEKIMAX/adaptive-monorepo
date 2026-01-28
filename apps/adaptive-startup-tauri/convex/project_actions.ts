"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { WorkOS } from "@workos-inc/node";

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export const create = action({
    args: {
        name: v.string(),
        hypothesis: v.optional(v.string()),
        localId: v.optional(v.string()),
        foundingDate: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const userId = identity.subject;


        // 1. Create Organization in WorkOS

        const org = await workos.organizations.createOrganization({
            name: args.name
        });


        // 2. Add User to Organization in WorkOS

        try {
            await workos.userManagement.createOrganizationMembership({
                organizationId: org.id,
                userId: userId
            });
        } catch (error: any) {
            console.error("Failed to add user to WorkOS Org:", error);
            // Throw a detailed error that the user can see in the frontend
            throw new Error(`Failed to add user to WorkOS Org: ${error.message}. User: ${userId}, Org: ${org.id}, Code: ${error.code}`);
        }

        // 3. Create Project in Convex (and link to this Org)
        const projectId = await ctx.runMutation(internal.projects.createInternal, {
            name: args.name,
            hypothesis: args.hypothesis || "",
            localId: args.localId,
            orgId: org.id,
            tokenIdentifier: identity.subject,
            foundingDate: args.foundingDate
        });

        return projectId;
    }
});

export const deleteProject = action({
    args: { projectId: v.id("projects") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const project = await ctx.runQuery(internal.projects.getProjectInternal, { projectId: args.projectId });
        if (!project) throw new Error("Project not found");

        if (project.userId !== identity.subject) throw new Error("Unauthorized: Only the creator can delete the project");

        // 1. Delete Organization from WorkOS
        // Note: The orgId in project is the WorkOS Org ID
        if (project.orgId && project.orgId.startsWith("org_")) {
            try {
                await workos.organizations.deleteOrganization(project.orgId);
            } catch (e) {
                console.error("Failed to delete WorkOS Org:", e);
                // Continue cleanup even if WorkOS fails (e.g. already deleted)
            }
        }

        // 2. Mark Deleted & Cleanup Users
        await ctx.runMutation(internal.projects.markDeleted, {
            projectId: args.projectId,
            orgId: project.orgId
        });
    }
});

export const generatePortalLink = action({
    args: {
        orgId: v.string(),
        intent: v.string(), // "sso", "dsync", "audit_logs"
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        // Verify the user has access to this org
        const user = await ctx.runQuery(internal.users.getUser);
        if (!user || !user.orgIds.includes(args.orgId)) {
            throw new Error("Unauthorized");
        }

        try {
            const { link } = await workos.portal.generateLink({
                organization: args.orgId,
                intent: args.intent as any,
            });
            return link;
        } catch (error) {
            console.error("Failed to generate portal link:", error);
            throw new Error("Could not generate portal link. Ensure organization exists in WorkOS.");
        }
    }
});
