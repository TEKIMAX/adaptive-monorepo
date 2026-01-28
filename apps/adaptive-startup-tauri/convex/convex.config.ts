import { defineApp } from "convex/server";
import workOSAuthKit from "@convex-dev/workos-authkit/convex.config";
import stripe from "@convex-dev/stripe/convex.config.js";
import prosemirrorSync from "@convex-dev/prosemirror-sync/convex.config";
import adaptiveLearning from "./adaptive_learning/convex.config";
import workflow from "@convex-dev/workflow/convex.config";

const app = defineApp();
app.use(workOSAuthKit, { name: "workOSAuthKit" });
app.use(stripe);
app.use(workflow);
app.use(prosemirrorSync);
app.use(adaptiveLearning);

export default app;
