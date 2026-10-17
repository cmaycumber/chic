/**
 * Edit credits: one credit buys one render.
 *
 * Everyone gets `FREE_EDITS` once, the first time they render. After that a
 * render needs a purchased credit (Stripe, 50 for $5, never expire). Product
 * search and shopping never cost anything; only the render does.
 *
 * Abuse note: the free grant is once per user id, and an anonymous session is
 * a user id. Someone who clears cookies gets a fresh anonymous session and a
 * fresh grant. Rate-limiting anonymous sessions is out of scope here.
 */
import { ConvexError, v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import {
  internalMutation,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { privateQuery } from "./lib/utils";
import { vCreditReason } from "./schema";

const DEFAULT_FREE_EDITS = 3;

/** Credits in the one pack on sale, the Stripe price `STRIPE_PRICE_EDITS_50`. */
export const EDITS_PACK_CREDITS = 50;

/** The error code the web app opens the out-of-credits dialog on. */
export const OUT_OF_CREDITS = "OUT_OF_CREDITS";

/**
 * Charging is on only once the pack can actually be bought: with no Stripe
 * key or price configured, nobody could pay their way past the paywall, so
 * renders stay free and the UI shows no balance.
 */
export function billingEnabled(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_EDITS_50
  );
}

/** Free renders for a new person; `FREE_EDITS` overrides the default. */
function freeEdits(): number {
  const parsed = Number(process.env.FREE_EDITS);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : DEFAULT_FREE_EDITS;
}

async function findAccount(
  ctx: QueryCtx | MutationCtx,
  userId: string
): Promise<Doc<"creditAccounts"> | null> {
  return await ctx.db
    .query("creditAccounts")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
}

async function writeLedger(
  ctx: MutationCtx,
  entry: {
    delta: number;
    reason: Doc<"creditLedger">["reason"];
    ref?: string;
    userId: string;
  }
): Promise<void> {
  await ctx.db.insert("creditLedger", { ...entry, createdAt: Date.now() });
}

/** The person's account, opened with their free edits the first time. */
async function ensureAccount(
  ctx: MutationCtx,
  userId: string
): Promise<Doc<"creditAccounts">> {
  const existing = await findAccount(ctx, userId);
  if (existing) {
    return existing;
  }
  const balance = freeEdits();
  const accountId = await ctx.db.insert("creditAccounts", {
    balance,
    freeGranted: true,
    userId,
  });
  await writeLedger(ctx, { delta: balance, reason: "free_grant", userId });
  const account = await ctx.db.get(accountId);
  if (!account) {
    throw new Error("Credit account vanished");
  }
  return account;
}

async function addCredits(
  ctx: MutationCtx,
  userId: string,
  entry: { amount: number; reason: Doc<"creditLedger">["reason"]; ref?: string }
): Promise<number> {
  const account = await ensureAccount(ctx, userId);
  const isPaid =
    entry.amount > 0 &&
    (entry.reason === "purchase" || entry.reason === "admin");
  const balance = account.balance + entry.amount;
  await ctx.db.patch(account._id, {
    balance,
    ...(isPaid ? { purchased: (account.purchased ?? 0) + entry.amount } : {}),
  });
  await writeLedger(ctx, {
    delta: entry.amount,
    reason: entry.reason,
    ref: entry.ref,
    userId,
  });
  return balance;
}

async function hasLedgerEntry(
  ctx: MutationCtx,
  ref: string,
  reason: Doc<"creditLedger">["reason"]
): Promise<Doc<"creditLedger"> | null> {
  const entries = await ctx.db
    .query("creditLedger")
    .withIndex("by_ref", (q) => q.eq("ref", ref))
    .collect();
  return entries.find((entry) => entry.reason === reason) ?? null;
}

/**
 * Take one credit for a render, or throw `OUT_OF_CREDITS` without writing
 * anything. Call it before the comment exists; the returned function records
 * which comment the credit paid for, which is what a refund looks up.
 */
export async function chargeRender(
  ctx: MutationCtx,
  userId: string
): Promise<(commentId: string) => Promise<void>> {
  if (!billingEnabled()) {
    // Nothing charged means nothing to refund: refundRender finds no entry.
    return async () => undefined;
  }
  const account = await ensureAccount(ctx, userId);
  if (account.balance < 1) {
    throw new ConvexError({ code: OUT_OF_CREDITS });
  }
  await ctx.db.patch(account._id, { balance: account.balance - 1 });
  return async (commentId) => {
    await writeLedger(ctx, {
      delta: -1,
      reason: "render",
      ref: commentId,
      userId,
    });
  };
}

/**
 * Give back the credit a failed render took. Only comments that were charged
 * are refunded (ChatGPT app renders are free), and only once, however many
 * times the failure is reported. The credit goes to whoever owns the comment
 * now, so a guest who signed up in the meantime gets it on their account.
 */
export async function refundRender(
  ctx: MutationCtx,
  comment: Doc<"roomComments">
): Promise<void> {
  const ref = comment._id;
  const charged = await hasLedgerEntry(ctx, ref, "render");
  if (!charged || (await hasLedgerEntry(ctx, ref, "refund"))) {
    return;
  }
  await addCredits(ctx, comment.userId, { amount: 1, reason: "refund", ref });
}

/**
 * Move a guest's remaining credits to the account they just signed up or in
 * with. The account counts as having had its free grant either way, so
 * signing up never hands out a second one.
 */
export async function transferCredits(
  ctx: MutationCtx,
  fromUserId: string,
  toUserId: string
): Promise<void> {
  const from = await findAccount(ctx, fromUserId);
  if (!from || fromUserId === toUserId) {
    // A guest who never rendered has nothing to move; the account gets its
    // own free edits on its first render, as anyone's would.
    return;
  }
  const amount = from.balance;
  const to = await findAccount(ctx, toUserId);
  if (to) {
    const purchased = (to.purchased ?? 0) + (from.purchased ?? 0);
    await ctx.db.patch(to._id, {
      balance: to.balance + amount,
      freeGranted: true,
      ...(purchased > 0 ? { purchased } : {}),
    });
  } else {
    await ctx.db.insert("creditAccounts", {
      balance: amount,
      freeGranted: true,
      purchased: from.purchased,
      userId: toUserId,
    });
  }
  await ctx.db.patch(from._id, { balance: 0 });
  if (amount > 0) {
    await writeLedger(ctx, {
      delta: -amount,
      reason: "transfer",
      ref: toUserId,
      userId: fromUserId,
    });
    await writeLedger(ctx, {
      delta: amount,
      reason: "transfer",
      ref: fromUserId,
      userId: toUserId,
    });
  }
}

/**
 * What the signed-in person can still render. `freeEditsLeft` is set while
 * they are on free edits only, so the composer can say "2 free edits left".
 */
export const getCredits = privateQuery({
  args: {},
  handler: async (ctx, _args) => {
    if (!billingEnabled()) {
      return null;
    }
    const account = await findAccount(ctx, ctx.userId);
    if (!account) {
      const balance = freeEdits();
      return { balance, freeEditsLeft: balance };
    }
    return account.purchased
      ? { balance: account.balance }
      : { balance: account.balance, freeEditsLeft: account.balance };
  },
  returns: v.union(
    v.null(),
    v.object({
      balance: v.number(),
      freeEditsLeft: v.optional(v.number()),
    })
  ),
});

/** Support and admin grants. Idempotent when `ref` is given. */
export const internalGrantCredits = internalMutation({
  args: {
    amount: v.number(),
    reason: vCreditReason,
    ref: v.optional(v.string()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!Number.isInteger(args.amount) || args.amount === 0) {
      throw new Error("Amount must be a non-zero whole number");
    }
    if (args.ref && (await hasLedgerEntry(ctx, args.ref, args.reason))) {
      const account = await findAccount(ctx, args.userId);
      return account?.balance ?? 0;
    }
    return await addCredits(ctx, args.userId, {
      amount: args.amount,
      reason: args.reason,
      ref: args.ref,
    });
  },
  returns: v.number(),
});

/**
 * Credit a paid purchase. Called from the Stripe webhook, which Stripe
 * retries and which fires twice for a delayed payment (completed, then
 * async_payment_succeeded), so `ref` (the Checkout Session id) makes every
 * delivery after the first a no-op.
 */
export const internalGrantPurchase = internalMutation({
  args: {
    credits: v.number(),
    ref: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!Number.isInteger(args.credits) || args.credits <= 0) {
      throw new Error("Credits must be a positive whole number");
    }
    if (await hasLedgerEntry(ctx, args.ref, "purchase")) {
      return "duplicate" as const;
    }
    await addCredits(ctx, args.userId, {
      amount: args.credits,
      reason: "purchase",
      ref: args.ref,
    });
    return "granted" as const;
  },
  returns: v.union(v.literal("granted"), v.literal("duplicate")),
});

/**
 * Take back the credits a refunded purchase granted, in proportion to how
 * much of it was refunded. `ref` is the purchase's Checkout Session id; the
 * credits come off whoever the purchase was granted to.
 *
 * Idempotent across retries and repeated partial refunds: what was already
 * taken back for this purchase is subtracted from what is owed now. Credits
 * already spent are not clawed back past zero; the balance never goes
 * negative, and the shortfall is owed again only if a later refund event for
 * the same purchase arrives after they bought more.
 */
export const internalRefundPurchase = internalMutation({
  args: {
    amount: v.number(),
    amountRefunded: v.number(),
    ref: v.string(),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("creditLedger")
      .withIndex("by_ref", (q) => q.eq("ref", args.ref))
      .collect();
    const purchase = entries.find((entry) => entry.reason === "purchase");
    if (!purchase) {
      return { removed: 0, status: "unknown_purchase" as const };
    }
    const fraction =
      args.amount > 0 ? Math.min(1, args.amountRefunded / args.amount) : 1;
    const owed = Math.round(purchase.delta * fraction);
    let taken = 0;
    for (const entry of entries) {
      if (entry.reason === "refund_purchase") {
        taken -= entry.delta;
      }
    }
    const account = await findAccount(ctx, purchase.userId);
    const removed = Math.min(owed - taken, account?.balance ?? 0);
    if (!account || removed <= 0) {
      return { removed: 0, status: "nothing_to_remove" as const };
    }
    await ctx.db.patch(account._id, { balance: account.balance - removed });
    await writeLedger(ctx, {
      delta: -removed,
      reason: "refund_purchase",
      ref: args.ref,
      userId: purchase.userId,
    });
    return { removed, status: "removed" as const };
  },
  returns: v.object({
    removed: v.number(),
    status: v.union(
      v.literal("removed"),
      v.literal("nothing_to_remove"),
      v.literal("unknown_purchase")
    ),
  }),
});
