import { createMcpHandler } from "mcp-handler";
import { registerChicApp, SERVER_INSTRUCTIONS } from "@/lib/chatgpt-app/server";

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

export { handler as DELETE, handler as GET, handler as POST };
