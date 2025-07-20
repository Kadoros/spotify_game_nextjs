import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAccessToken = query({
  handler: async (ctx) => {
    
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) throw new Error("Not authenticated");

    // const userId = identity.subject;

    // const user = await ctx.db
    //   .query("users")
    //   .withIndex("by_userId", (q) => q.eq("userId", userId))
    //   .unique();
    //   if (!user || !user.spotifyAccessToken || !user.spotifyExpiresAt) {
    //     return null; // no token info
    //     console.log("getAccessToken")
    // }

    // const now = Date.now();

    // if (user.spotifyExpiresAt > now) {
    //   return user.spotifyAccessToken; // valid token
    // }

    return null; // expired token
  },
});

export const refreshAccessToken = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject;

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!user || !user.spotifyAccessToken || !user.spotifyRefreshToken) {
      throw new Error("Spotify tokens not found");
    }

    const now = Date.now();

    if (user.spotifyExpiresAt && user.spotifyExpiresAt > now) {
      return user.spotifyAccessToken;
    }

    const refreshed = await refreshSpotifyToken(user.spotifyRefreshToken);
    if (!refreshed) throw new Error("Failed to refresh token");

    await ctx.db.patch(user._id, {
      spotifyAccessToken: refreshed.access_token,
      spotifyRefreshToken: refreshed.refresh_token ?? user.spotifyRefreshToken,
      spotifyExpiresAt: Date.now() + refreshed.expires_in * 1000,
    });

    return refreshed.access_token;
  },
});

async function refreshSpotifyToken(refreshToken: string) {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) return null;

  return await res.json();
}



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
