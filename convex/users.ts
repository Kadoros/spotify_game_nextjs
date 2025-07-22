import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getUserById = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!user) throw new Error("User not found");

    return user;
  },
});







export const createUser = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject;

    // Check if user exists by userId index
    const existing = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existing) return;

    await ctx.db.insert("users", {
      userId,
      name: args.name,
      email: args.email,
      spotifyAccessToken: undefined,
      spotifyRefreshToken: undefined,
      spotifyExpiresAt: undefined,
      createdAt: Date.now(),
    });
  },
});

export const getUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject;

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!user) throw new Error("User not found");

    return user;
  },
});

export const updateSpotifyToken = mutation({
  args: {
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresIn: v.number(), // seconds until expiration
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject;

    const existing = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!existing) throw new Error("User not found");

    await ctx.db.patch(existing._id, {
      spotifyAccessToken: args.accessToken,
      spotifyRefreshToken: args.refreshToken,
      spotifyExpiresAt: Date.now() + args.expiresIn * 1000,
    });
  },
});

export const clearSpotifyToken = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject;

    const existing = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!existing) throw new Error("User not found");

    await ctx.db.patch(existing._id, {
      spotifyAccessToken: undefined,
      spotifyRefreshToken: undefined,
      spotifyExpiresAt: undefined,
    });
  },
});
