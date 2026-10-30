import { createMcpHandler } from "mcp-handler";
import { after } from "next/server";
import {
  flushAnalytics,
  registerChicApp,
  SERVER_INSTRUCTIONS,
} from "@/lib/chatgpt-app/server";

/**
 * The MCP endpoint for the Chic app in ChatGPT (Streamable HTTP). Stateless:
 * every request builds a fresh server, so any instance can answer it.
 */
const handler = createMcpHandler(registerChicApp, {
  instructions: SERVER_INSTRUCTIONS,
  serverInfo: { name: "chic", version: "1.0.0" },
});

/** `redesign_room` waits up to 45 s for a render before answering. */
export const maxDuration = 60;

/** Every request flushes PostHog MCP analytics once its response is done. */
function withAnalyticsFlush(request: Request): Promise<Response> {
  after(flushAnalytics);
  return handler(request);
}

export {
  withAnalyticsFlush as DELETE,
  withAnalyticsFlush as GET,
  withAnalyticsFlush as POST,
};
