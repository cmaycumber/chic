import { query } from "./_generated/server";

export const getPinterestAccount = query({
  args: {},
  handler: async (ctx) => {
    const account = await ctx.db
      .query("account")
      .withIndex("providerId_userId", (q) => q.eq("providerId", "pinterest"))
      .first();
    return account;
  },
});
