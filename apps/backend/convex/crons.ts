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

export default crons;
