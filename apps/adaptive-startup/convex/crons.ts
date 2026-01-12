import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
    "purge old deleted projects",
    { hourUTC: 0, minuteUTC: 0 },
    internal.cleanup.purgeOldDeletedProjects
);

export default crons;
