// lib/spotify.ts
export function generateCodeVerifier(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

import { TrackObject } from "@/types";

export function normalizeTrackObject(track: any): TrackObject {
  return {
    album: {
      album_type: track.album?.album_type || "unknown",
      total_tracks: track.album?.total_tracks || 1,
      available_markets: track.album?.available_markets || [],
      external_urls: {
        spotify: track.album?.external_urls?.spotify || "",
      },
      href: track.album?.href || "",
      id: track.album?.id || "",
      images: (track.album?.images || []).map((img: any) => ({
        url: img.url,
        height: img.height || null,
        width: img.width || null,
      })),
      name: track.album?.name || "Unknown Album",
      release_date: track.album?.release_date || "2024-01-01",
      release_date_precision: track.album?.release_date_precision || "day",
      type: track.album?.type || "album",
      uri: track.album?.uri || "",
    },
    artists: (track.artists || []).map((artist: any) => ({
      external_urls: {
        spotify: artist.external_urls?.spotify || "",
      },
      href: artist.href || "",
      id: artist.id || "",
      name: artist.name || "Unknown Artist",
      type: artist.type || "artist",
      uri: artist.uri || "",
    })),
    available_markets: track.available_markets || [],
    disc_number: track.disc_number || 1,
    duration_ms: track.duration_ms || 0,
    explicit: track.explicit || false,
    external_ids: track.external_ids || {},
    external_urls: {
      spotify: track.external_urls?.spotify || "",
    },
    href: track.href || "",
    trackId: track.id || "",
    is_playable: track.is_playable !== false,
    linked_from: track.linked_from
      ? {
          external_urls: {
            spotify: track.linked_from.external_urls?.spotify || "",
          },
          href: track.linked_from.href || "",
          id: track.linked_from.id || "",
          type: track.linked_from.type || "",
          uri: track.linked_from.uri || "",
        }
      : undefined,
    restrictions: track.restrictions
      ? {
          reason: track.restrictions.reason || "",
        }
      : undefined,
    name: track.name || "Unknown Track",
    popularity: track.popularity || 0,
    preview_url: track.preview_url || null,
    track_number: track.track_number || 1,
    type: "track" as const,
    uri: track.uri || "",
    is_local: track.is_local || false,
  };
}

export function buildTrackObjectArray(rawTracks: any[]): TrackObject[] {
  return rawTracks.map(normalizeTrackObject);
}
