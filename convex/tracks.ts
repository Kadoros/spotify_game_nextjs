import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createTrack = mutation({
  args: {
    trackObject: v.object({
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

      type: v.literal("track"),
    }),
  },
  handler: async (ctx, args) => {
    const { trackObject } = args;

    const existing = await ctx.db
      .query("tracks")
      .withIndex("by_trackId", (q) => q.eq("trackId", trackObject.trackId))
      .unique();

    if (existing) return;

    await ctx.db.insert("tracks", trackObject);
  },
});

export const getTrack = query({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    const track = await ctx.db
      .query("tracks")
      .withIndex("by_trackId", (q) => q.eq("trackId", args.id))
      .unique();

    if (!track) throw new Error("Track not found");

    return track;
  },
});
