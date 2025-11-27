/**
 * Get Design Tool
 *
 * Retrieves a design by ID to view its current state.
 * Useful for checking design details before modification.
 */
"use node";
import { createTool, type ToolCtx } from "@convex-dev/agent";
import z from "zod";
import { internal } from "../../_generated/api";
import type { Doc, Id } from "../../_generated/dataModel";

/**
 * Gets a design by ID
 */
// biome-ignore lint/style/useNamingConvention: OpenAI tool names use snake_case
export const get_design = createTool({
  description:
    "Fetch current design state before modifications. Returns all details including imageStorageId and products.",
  args: z.object({
    designId: z.string().describe("Design ID to retrieve"),
  }),
  handler: async (ctx: ToolCtx, args): Promise<Doc<"designs"> | null> => {
    const design = await ctx.runQuery(internal.designs.read, {
      id: args.designId as Id<"designs">,
    });

    if (!design) {
      throw new Error(`Design with ID ${args.designId} not found`);
    }

    return design;
  },
});
