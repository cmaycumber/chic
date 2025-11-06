import agent from "@convex-dev/agent/convex.config";
import aggregate from "@convex-dev/aggregate/convex.config";
import betterAuth from "@convex-dev/better-auth/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(betterAuth);
app.use(agent);
app.use(aggregate);

export default app;
