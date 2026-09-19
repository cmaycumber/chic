import {
  customAction,
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";
import { action, mutation, query } from "../_generated/server";
import { getAuthUserId } from "../utils";

export const publicQuery = query;
export const publicMutation = mutation;
export const publicAction = action;

export const privateQuery = customQuery(query, {
  args: {},
  input: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return { args: {}, ctx: { ...ctx, userId } };
  },
});

export const privateMutation = customMutation(mutation, {
  args: {},
  input: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return { args: {}, ctx: { ...ctx, userId } };
  },
});

export const privateAction = customAction(action, {
  args: {},
  input: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return { args: {}, ctx: { ...ctx, userId } };
  },
});
