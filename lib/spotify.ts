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

// Define interfaces for Spotify API response types
interface SpotifyImage {
  url: string;
  height?: number | null;
  width?: number | null;
}

interface SpotifyExternalUrls {
  spotify?: string;
}

interface SpotifyAlbum {
  album_type?: string;
  total_tracks?: number;
  available_markets?: string[];
  external_urls?: SpotifyExternalUrls;
  href?: string;
  id?: string;
  images?: SpotifyImage[];
  name?: string;
  release_date?: string;
  release_date_precision?: string;
  type?: string;
  uri?: string;
}

interface SpotifyArtist {
  external_urls?: SpotifyExternalUrls;
  href?: string;
  id?: string;
  name?: string;
  type?: string;
  uri?: string;
}

interface SpotifyLinkedFrom {
  external_urls?: SpotifyExternalUrls;
  href?: string;
  id?: string;
  type?: string;
  uri?: string;
}

interface SpotifyRestrictions {
  reason?: string;
}

interface SpotifyTrackResponse {
  album?: SpotifyAlbum;
  artists?: SpotifyArtist[];
  available_markets?: string[];
  disc_number?: number;
  duration_ms?: number;
  explicit?: boolean;
  external_ids?: Record<string, string>;
  external_urls?: SpotifyExternalUrls;
  href?: string;
  id?: string;
  is_playable?: boolean;
  linked_from?: SpotifyLinkedFrom;
  restrictions?: SpotifyRestrictions;
  name?: string;
  popularity?: number;
  preview_url?: string | null;
  track_number?: number;
  type?: string;
  uri?: string;
  is_local?: boolean;
}

export function normalizeTrackObject(track: SpotifyTrackResponse): TrackObject {
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
      images: (track.album?.images || []).map((img: SpotifyImage) => ({
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
    artists: (track.artists || []).map((artist: SpotifyArtist) => ({
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

export function buildTrackObjectArray(rawTracks: SpotifyTrackResponse[]): TrackObject[] {
  return rawTracks.map(normalizeTrackObject);
}