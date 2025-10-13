import type { GenericCtx as BetterAuthCtx } from "@convex-dev/better-auth";
import type { DataModel } from "./_generated/dataModel";
import type { GenericCtx } from "./_generated/server";
import { authComponent } from "./auth";

// Get the user ID from the auth component
export const getAuthUserId = async (ctx: GenericCtx) => {
  // Temp path until I know the issue with the types
  const user = await authComponent.getAuthUser(
    ctx as unknown as BetterAuthCtx<DataModel>
  );
  if (!user) {
    throw new Error("User not found");
  }
  return user.userId;
};
