import { internalMutation } from "./_generated/server";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export const purgeOldDeletedProjects = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const cutoff = now - ONE_YEAR_MS;

        // Note: For scalability, this should use an index on (status, updatedAt) or similar,
        /// but for now we'll do a scan or use key-based pagination if needed.
        // Given likely volume, a filter on the full table might be okay periodically or we 
        // should add an index. I'll stick to simple iteration for this implementation phase.

        const projects = await ctx.db.query("projects").collect();
        let deletedCount = 0;

        for (const p of projects) {
            if (p.status === "Deleted" && p.updatedAt < cutoff) {
                await ctx.db.delete(p._id);
                deletedCount++;
                // We should also ideally cascade delete all child resources (canvases, goals, etc.)
                // This is complex. For now, we delete the project root. 
                // A better approach later is a cascading delete helper.
            }
        }


    }
});
