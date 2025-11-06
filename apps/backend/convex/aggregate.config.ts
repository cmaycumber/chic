/**
 * Aggregate Configuration for Likes Count
 *
 * This file uses the low-level Aggregate API to track likes count per design.
 * We use designId as the key so we can efficiently count likes for each design.
 */

import { Aggregate } from "@convex-dev/aggregate";
import { components } from "./_generated/api";

/**
 * Aggregate likes by design ID
 * This allows efficient counting of likes per design without scanning all likes.
 *
 * Key structure: designId (as string)
 * We only need count, not sum, so Value is empty string.
 */
export const likesCountAggregate = new Aggregate<string, string>(
  components.aggregate
);
