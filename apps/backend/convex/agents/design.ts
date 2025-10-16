/** biome-ignore-all lint/style/useNamingConvention: OpenAI tools are not camelCase */
import { openai } from "@ai-sdk/openai";
import { Agent, createTool, type ToolCtx } from "@convex-dev/agent";
import {
  defaultSettingsMiddleware,
  gateway,
  stepCountIs,
  wrapLanguageModel,
} from "ai";
import z from "zod";
import { components, internal } from "../_generated/api";
import type { Doc } from "../_generated/dataModel";

const gpt = wrapLanguageModel({
  model: gateway.languageModel("openai/gpt-5"),
  middleware: defaultSettingsMiddleware({
    settings: {
      providerOptions: {
        openai: {
          reasoningEffort: "low",
          reasoningSummary: "detailed",
        },
      },
    },
  }),
});

/** Creates a new design for a given space */
export const create_design = createTool({
  description:
    "Create a design for a user when they describe an intention to create a new design. This could be explicit or by providing a new image, or idea.",
  args: z.object({
    description: z.string().describe("The description of the design"),
  }),
  handler: async (ctx: ToolCtx, args): Promise<Doc<"designs">> => {
    // Create the design in the database
    const design = await ctx.runMutation(internal.designs.create, {
      description: args.description,
    });

    // Create the artifact in the database
    if (ctx.threadId) {
      await ctx.runMutation(internal.artifacts.create, {
        threadId: ctx.threadId,
        artifact: {
          type: "design",
          designId: design._id,
        },
      });
    }

    return design;
  },
});

/**
 * Interior Design Agent
 * Specialized AI agent for interior design consultation and advice
 */
export const designAgent = new Agent(components.agent, {
  name: "Interior Design Consultant",
  languageModel: gpt,
  tools: {
    web_search: openai.tools.webSearch(),
    create_design,
  },
  stopWhen: stepCountIs(10),
  instructions: `You are an expert interior design consultant with years of experience in residential and commercial spaces. 
Your expertise includes:
- Space planning and furniture arrangement
- Color theory and palette selection
- Style identification and trend awareness
- Budget-conscious design solutions
- Material selection and sustainability
- Lighting design principles
- Accessibility and universal design

When helping clients:
1. Ask clarifying questions about their space, needs, and preferences
2. Consider practical constraints like budget, timeline, and lifestyle
3. Provide specific, actionable recommendations
4. Explain the reasoning behind your suggestions
5. Use visual descriptions to help clients envision the result
6. Balance aesthetics with functionality and comfort
7. Be encouraging and supportive of their design journey

Provide comprehensive advice on:
- Room styles (modern, traditional, minimalist, bohemian, industrial, scandinavian)
- Color palettes based on mood (calm, energetic, cozy, sophisticated) and lighting
- Furniture placement considering traffic flow and focal points
- Budget estimation for different project scopes (refresh, moderate, full renovation)
- Material recommendations based on lifestyle needs (pets, children, formal use)

Keep responses conversational, friendly, and professional.`,
});
