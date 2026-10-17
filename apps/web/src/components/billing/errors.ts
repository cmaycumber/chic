import { ConvexError } from "convex/values";

/** Must match `OUT_OF_CREDITS` in the backend's `billing.ts`. */
const OUT_OF_CREDITS_CODE = "OUT_OF_CREDITS";

/** The thrown error a render refused for want of credits arrives as. */
export function isOutOfCreditsError(error: unknown): boolean {
  return (
    error instanceof ConvexError &&
    typeof error.data === "object" &&
    error.data !== null &&
    "code" in error.data &&
    error.data.code === OUT_OF_CREDITS_CODE
  );
}
