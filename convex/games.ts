import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new game
export const createGame = mutation({
  args: {
    trackGroups: v.array(
      v.object({
        options: v.array(v.string()),
        answer: v.string(),
      })
    ),
    lives: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const ownerId = identity.subject;

    if (args.trackGroups.length === 0) {
      throw new Error("trackGroups cannot be empty");
    }

    const gameId = await ctx.db.insert("games", {
      ownerId,
      trackGroups: args.trackGroups,
      rounds: args.trackGroups.length,
      lives: args.lives,
      createdAt: Date.now(),
    });

    return gameId;
  },
});

// Get a game by its ID

export const getGameById = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_id", (q) => q.eq("_id", args.gameId))
      .unique();
    return game;
  },
});


// Get games created by the current user
export const getGamesByOwner = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const ownerId = identity.subject;

    const games = await ctx.db
      .query("games")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .collect();

    return games;
  },
});
