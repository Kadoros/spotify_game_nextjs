import { customAlphabet } from "nanoid";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Mutation to record a game result
export const recordGameResult = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.optional(v.string()), // optional for anonymous users
    endRound: v.number(),
    livesLeft: v.number(),
    isFinished: v.boolean(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    const resultId = await ctx.db.insert("gameResults", {
      gameId: args.gameId,
      playerId: args.playerId,
      endRound: args.endRound,
      livesLeft: args.livesLeft,
      isFinished: args.isFinished,
      createdAt: Date.now(),
    });

    return resultId;
  },
});

// Query to get all results for a specific game
export const getResultsByGameId = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("gameResults")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    return results;
  },
});

// Query to get all results for the current player
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
