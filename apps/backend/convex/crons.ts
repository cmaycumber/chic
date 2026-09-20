import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Rooms made without an account are kept for seven days. This sweeps up the
 * ones past their date, in batches, so a backlog costs several ticks rather
 * than one mutation that runs out of time.
 */
crons.interval(
  "purge expired anonymous rooms",
  { hours: 1 },
  internal.rooms.internalPurgeExpired,
  {}
);

/**
 * Amazon results are shared across rooms and served for a fortnight. This
 * clears out the ones nothing has asked for in a month, so the cache stays a
 * cache rather than a log of every search the product has ever run.
 */
crons.daily(
  "prune cached product searches",
  // biome-ignore lint/style/useNamingConvention: Convex's cron schedule fields
  { hourUTC: 4, minuteUTC: 15 },
  internal.rooms.internalPruneProductSearches,
  {}
);

export default crons;
