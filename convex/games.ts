import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { customAlphabet } from "nanoid";

// nanoid for generating short unique links
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 8);

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

    const link = nanoid();

    const game = await ctx.db.insert("games", {
      ownerId,
      trackGroups: args.trackGroups,
      rounds: args.trackGroups.length,
      lives: args.lives,
      createdAt: Date.now(),
      link,
    });

    return game;
  },
});

export const getGameByLink = query({
  args: { link: v.string() },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_link", (q) => q.eq("link", args.link))
      .unique();

    if (!game) {
      throw new Error("Game not found");
    }

    return game;
  },
});

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
