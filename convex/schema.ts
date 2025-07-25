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
  })
  .index("by_owner", ["ownerId"]),

  // Game session per player (can be anonymous or Clerk user)
  gameResults: defineTable({
    gameId: v.id("games"),
    playerId: v.optional(v.string()), // Clerk user ID or anonymous
    endRound: v.number(),             // how far the player got
    livesLeft: v.number(),            // lives remaining at end
    isFinished: v.boolean(),          // should be true when recorded
    userSelections: v.array(v.string()),
    createdAt: v.number(),
  })
  .index("by_game", ["gameId"])
  .index("by_player", ["playerId"]),

  tracks: defineTable({
    trackId: v.string(),
    name: v.string(),
    uri: v.string(),
    href: v.string(),
    is_local: v.boolean(),
    is_playable: v.boolean(),
    duration_ms: v.number(),
    explicit: v.boolean(),
    popularity: v.number(),
    preview_url: v.optional(v.string()),
    track_number: v.number(),
    disc_number: v.number(),

    external_urls: v.object({
      spotify: v.string(),
    }),

    external_ids: v.optional(
      v.object({
        isrc: v.optional(v.string()),
        ean: v.optional(v.string()),
        upc: v.optional(v.string()),
      })
    ),

    album: v.object({
      album_type: v.string(),
      total_tracks: v.number(),
      available_markets: v.array(v.string()),
      external_urls: v.object({ spotify: v.string() }),
      href: v.string(),
      id: v.string(),
      images: v.array(
        v.object({
          url: v.string(),
          height: v.optional(v.number()),
          width: v.optional(v.number()),
        })
      ),
      name: v.string(),
      release_date: v.string(),
      release_date_precision: v.string(),
      type: v.string(),
      uri: v.string(),
    }),

    artists: v.array(
      v.object({
        external_urls: v.object({ spotify: v.string() }),
        href: v.string(),
        id: v.string(),
        name: v.string(),
        type: v.string(),
        uri: v.string(),
      })
    ),

    available_markets: v.array(v.string()),

    linked_from: v.optional(
      v.object({
        external_urls: v.object({ spotify: v.string() }),
        href: v.string(),
        id: v.string(),
        type: v.string(),
        uri: v.string(),
      })
    ),

    restrictions: v.optional(
      v.object({
        reason: v.string(),
      })
    ),

    type: v.literal("track"), // Optional, but strict if you only allow 'track'
  }).index("by_trackId",["trackId"])


});
