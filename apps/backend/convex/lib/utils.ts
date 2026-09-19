import {
  customAction,
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";
import { action, mutation, query } from "../_generated/server";
import { getAuthUser } from "../utils";

export const publicQuery = query;
export const publicMutation = mutation;
export const publicAction = action;

/**
 * The signed-in user is already fetched to get their id, so hand the whole
 * record through: callers that need `isAnonymous` or a display name would
 * otherwise pay for a second lookup of a user we have in hand.
 */
const withUser = async <Ctx>(ctx: Ctx) => {
  const user = await getAuthUser(ctx as Parameters<typeof getAuthUser>[0]);
  return { args: {}, ctx: { ...ctx, user, userId: user._id } };
};

export const privateQuery = customQuery(query, {
  args: {},
  input: withUser,
});

export const privateMutation = customMutation(mutation, {
  args: {},
  input: withUser,
});

export const privateAction = customAction(action, {
  args: {},
  input: withUser,
});
