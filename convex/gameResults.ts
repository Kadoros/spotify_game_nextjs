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
    userSelections: v.array(v.string()), // Add userSelections array
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
      userSelections: args.userSelections, // Include userSelections in the insert
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

export const getResultByResultId = query({
  args: { resultId: v.id("gameResults") },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("gameResults")
      .withIndex("by_id", (q) => q.eq("_id", args.resultId))
      .unique();

    return result;
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

// Optional: Query to get detailed results with track information
export const getDetailedResultsByGameId = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("gameResults")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    // Optionally fetch track details for each result
    const detailedResults = await Promise.all(
      results.map(async (result) => {
        const trackDetails = await Promise.all(
          result.userSelections.map(async (trackId) => {
            const track = await ctx.db
              .query("tracks")
              .withIndex("by_trackId", (q) => q.eq("trackId", trackId))
              .first();
            return track;
          })
        );

        return {
          ...result,
          selectedTracks: trackDetails.filter(Boolean), // Remove null results
        };
      })
    );

    return detailedResults;
  },
});