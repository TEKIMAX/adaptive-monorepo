import { internalQuery } from "./_generated/server";

export const listUsers = internalQuery({
    args: {},
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        return users.map(u => ({
            name: u.name,
            id: u._id,
            token: u.tokenIdentifier,
            orgIds: u.orgIds
        }));
    }
});
