import type { GenericCtx } from "@convex-dev/better-auth";
import type { DataModel } from "./_generated/dataModel";
import { authComponent } from "./auth";

// Get the user ID from the auth component
export const getAuthUserId = async (ctx: GenericCtx<DataModel>) => {
  const user = await authComponent.getAuthUser(ctx);

  if (!user) {
    throw new Error("User not found");
  }

  return user._id;
};
