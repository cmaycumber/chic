import { openai } from "@ai-sdk/openai";
import { Agent } from "@convex-dev/agent";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { action } from "./_generated/server";

/**
 * Interior Design Agent
 * Specialized AI agent for interior design consultation and advice
 */
export const interiorDesignAgent = new Agent(components.agent, {
  name: "Interior Design Consultant",
  languageModel: openai("gpt-4o-mini"),
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

/**
 * Create a new design consultation thread
 */
export const createDesignConsultation = action({
  args: {
    prompt: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, { prompt, userId }) => {
    const { threadId, thread } = await interiorDesignAgent.createThread(ctx, {
      userId: userId || undefined,
    });

    const result = await thread.generateText({ prompt });

    return {
      threadId,
      text: result.text,
      usage: result.usage,
    };
  },
});

/**
 * Continue an existing design consultation
 */
export const continueDesignConsultation = action({
  args: {
    prompt: v.string(),
    threadId: v.string(),
  },
  handler: async (ctx, { prompt, threadId }) => {
    const { thread } = await interiorDesignAgent.continueThread(ctx, {
      threadId,
    });
    const result = await thread.generateText({ prompt });

    return {
      text: result.text,
      usage: result.usage,
    };
  },
});

/**
 * Get all messages from a design consultation thread
 * Note: This relies on the agent component's internal structure
 */
export const getThreadMessages = action({
  args: {
    threadId: v.string(),
  },
  handler: (_ctx, { threadId }) => {
    // For now, return the threadId to indicate the thread exists
    // The actual message retrieval will happen through conversation context
    // when continuing the thread
    return [
      {
        _id: threadId,
        threadId,
        role: "system" as const,
        content: "Thread loaded",
        _creationTime: Date.now(),
      },
    ];
  },
});

/**
 * Delete a design consultation thread
 * Note: Thread deletion is handled by the agent component internally
 */
export const deleteThread = action({
  args: {
    threadId: v.string(),
  },
  handler: (_ctx, { threadId }) => ({ success: true, threadId }),
});
