import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const recordGameResult = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.optional(v.string()), // null for anonymous
    endRound: v.number(),
    livesLeft: v.number(),
    isFinished: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Player can be anonymous, so auth check is optional
    // But it can be enforced auth if you want:
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) throw new Error("Not authenticated");

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Save the same link for sharing results
    const link = game.link;

    const result = await ctx.db.insert("gameResults", {
      gameId: args.gameId,
      playerId: args.playerId,
      endRound: args.endRound,
      livesLeft: args.livesLeft,
      isFinished: args.isFinished,
      createdAt: Date.now(),
      link,
    });

    return result;
  },
});

export const getResultsByLink = query({
  args: { link: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("gameResults")
      .withIndex("by_link", (q) => q.eq("link", args.link))
      .collect();

    return results;
  },
});

export const getResultsByPlayer = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const playerId = identity.subject;

    const results = await ctx.db
      .query("gameResults")
      .withIndex("by_player", (q) => q.eq("playerId", playerId))
      .collect();

    return results;
  },
});
