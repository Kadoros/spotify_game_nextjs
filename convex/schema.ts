import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    userId: v.string(), // Clerk user ID, must be unique per user
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    spotifyAccessToken: v.optional(v.string()),
    spotifyRefreshToken: v.optional(v.string()),
    spotifyExpiresAt: v.optional(v.number()), // timestamp
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  // Game created by a user (Clerk userId)
  games: defineTable({
    ownerId: v.string(), // Clerk user ID
    trackGroups: v.array(
      v.object({
        options: v.array(v.string()), // 4 options
        answer: v.string(),           // correct trackId
      })
    ),
    rounds: v.number(), // should match trackGroups.length
    lives: v.number(),
    createdAt: v.number(),
    link: v.optional(v.string()), // shareable link
  })
  .index("by_owner", ["ownerId"])
  .index("by_link", ["link"]),

  // Game session per player (can be anonymous or Clerk user)
  gameResults: defineTable({
    gameId: v.id("games"),
    playerId: v.optional(v.string()), // Clerk user ID or anonymous
    endRound: v.number(),             // how far the player got
    livesLeft: v.number(),            // lives remaining at end
    isFinished: v.boolean(),          // should be true when recorded
    createdAt: v.number(),
    link: v.optional(v.string()),    // shareable link for results
  })
  .index("by_game", ["gameId"])
  .index("by_player", ["playerId"])
  .index("by_link", ["link"]),
});
