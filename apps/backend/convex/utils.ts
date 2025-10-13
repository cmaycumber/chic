import type { GenericCtx } from "./_generated/server";
import { authComponent } from "./auth";

// Get the user ID from the auth component
export const getAuthUserId = async (ctx: GenericCtx) => {
  const user = await authComponent.getAuthUser(ctx);
  if (!user) {
    throw new Error("User not found");
  }
  return user.userId;
};
