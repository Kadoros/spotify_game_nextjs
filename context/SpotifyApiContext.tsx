"use client";

import { api } from "@/convex/_generated/api";
import { TrackObject } from "@/types";
import { useMutation, useQuery } from "convex/react";
import React, {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

interface SpotifyApiContextType {
  getTopTracks: (
    token: string,
    num: number,
    time_range?: "short_term" | "medium_term" | "long_term"
  ) => Promise<TrackObject[] | null>;
  getTrackById: (token: string, trackId: string) => Promise<TrackObject | null>;

  // 새로운 추천 함수들
  getRecommendations: (
    token: string,
    options: Record<string, any>
  ) => Promise<TrackObject[] | null>;
  getRelatedArtists: (token: string, artistId: string) => Promise<any[] | null>;
  getArtistTopTracks: (
    token: string,
    artistId: string,
    market?: string
  ) => Promise<TrackObject[] | null>;
  searchByGenre: (
    token: string,
    genre: string,
    limit?: number
  ) => Promise<TrackObject[] | null>;
  searchSimilarTracks: (
    token: string,
    trackId: string,
    limit?: number
  ) => Promise<TrackObject[] | null>;

  loading: boolean;
  error: string | null;
}

const SpotifyApiContext = createContext<SpotifyApiContextType | undefined>(
  undefined
);

export function SpotifyApiProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to normalize Spotify track data to TrackObject format
  const normalizeTrackObject = (track: any): TrackObject => {
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
  };

  // Helper to call Spotify Web API with automatic token refresh
  const fetchWebApi = useCallback(
    async (
      token: string,
      endpoint: string,
      method = "GET",
      body?: any,
      retryCount = 0
    ) => {
      if (!token) throw new Error("No access token");

      const res = await fetch(`https://api.spotify.com/v1/${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));

        // Handle token expiration with automatic refresh (retry once)
        if (res.status === 401 && retryCount === 0) {
          try {
            // const newToken = await refreshTokenMutation();
            // setToken(newToken);

            // Retry the request with the new token
            return await fetchWebApi(token, endpoint, method, body, 1);
          } catch (refreshError) {
            throw new Error("Token expired. Please log in again.");
          }
        }

        throw new Error(data.error?.message || res.statusText);
      }

      return await res.json();
    },
    []
  );

  const getTopTracks = useCallback(
    async (
      token: string,
      num: number,
      time_range: "short_term" | "medium_term" | "long_term" = "short_term"
    ): Promise<TrackObject[] | null> => {
      if (!token) {
        setError("No access token. Please log in first.");
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await fetchWebApi(
          token,
          `me/top/tracks?limit=${num}&time_range=${time_range}`
        );
        const tracks = data.items || [];
        return tracks.map(normalizeTrackObject);
      } catch (err: any) {
        setError(err.message || "Failed to fetch top tracks");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchWebApi, normalizeTrackObject]
  );

  const getTrackById = useCallback(
    async (token: string, trackId: string): Promise<TrackObject | null> => {
      if (!token) {
        setError("No access token. Please log in first.");
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await fetchWebApi(token, `tracks/${trackId}`);
        return normalizeTrackObject(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch track");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchWebApi, normalizeTrackObject]
  );

  // 관련 아티스트 가져오기
  const getRelatedArtists = useCallback(
    async (token: string, artistId: string): Promise<any[] | null> => {
      if (!token) {
        setError("No access token. Please log in first.");
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await fetchWebApi(
          token,
          `artists/${artistId}/related-artists`
        );
        return data.artists ?? null;
      } catch (err: any) {
        setError(err.message || "Failed to fetch related artists");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchWebApi]
  );

  // 아티스트의 인기 트랙 가져오기
  const getArtistTopTracks = useCallback(
    async (
      token: string,
      artistId: string,
      market: string = "KR"
    ): Promise<TrackObject[] | null> => {
      if (!token) {
        setError("No access token. Please log in first.");
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await fetchWebApi(
          token,
          `artists/${artistId}/top-tracks?market=${market}`
        );
        const tracks = data.tracks || [];
        return tracks.map(normalizeTrackObject);
      } catch (err: any) {
        setError(err.message || "Failed to fetch artist top tracks");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchWebApi, normalizeTrackObject]
  );

  // 장르별 검색
  const searchByGenre = useCallback(
    async (
      token: string,
      genre: string,
      limit: number = 20
    ): Promise<TrackObject[] | null> => {
      if (!token) {
        setError("No access token. Please log in first.");
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await fetchWebApi(
          token,
          `search?q=genre:${encodeURIComponent(
            genre
          )}&type=track&market=KR&limit=${limit}`
        );
        const tracks = data.tracks?.items || [];
        return tracks.map(normalizeTrackObject);
      } catch (err: any) {
        setError(err.message || "Failed to search by genre");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchWebApi, normalizeTrackObject]
  );

  // 트랙 기반 유사한 트랙 검색 (audio features 활용)
  const searchSimilarTracks = useCallback(
    async (
      token: string,
      trackId: string,
      limit: number = 20
    ): Promise<TrackObject[] | null> => {
      if (!token) {
        setError("No access token. Please log in first.");
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        // 먼저 트랙 정보와 audio features를 가져옴
        const [trackData, audioFeatures] = await Promise.all([
          fetchWebApi(token, `tracks/${trackId}`),
          fetchWebApi(token, `audio-features/${trackId}`),
        ]);

        // 아티스트의 장르 정보로 검색
        const artistGenres = trackData.artists[0]?.genres || [];
        const searchQuery =
          artistGenres.length > 0
            ? `genre:${artistGenres[0]}`
            : `artist:${trackData.artists[0]?.name}`;

        const searchData = await fetchWebApi(
          token,
          `search?q=${encodeURIComponent(
            searchQuery
          )}&type=track&market=KR&limit=${limit}`
        );

        // 원본 트랙 제외
        const similarTracks =
          searchData.tracks?.items?.filter(
            (track: any) => track.id !== trackId
          ) || [];

        return similarTracks.map(normalizeTrackObject);
      } catch (err: any) {
        setError(err.message || "Failed to find similar tracks");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchWebApi, normalizeTrackObject]
  );

  // 기존 getRecommendations 함수를 대체 방법으로 구현
  const getRecommendations = useCallback(
    async (
      token: string,
      options: Record<string, any>
    ): Promise<TrackObject[] | null> => {
      if (!token) {
        setError("No access token. Please log in first.");
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        let recommendations: any[] = [];
        let excludedArtistIds: string[] = [];

        // seed_tracks가 있는 경우, 원본 트랙의 아티스트 ID들을 가져와서 제외 목록에 추가
        if (options.seed_tracks) {
          const trackIds = Array.isArray(options.seed_tracks)
            ? options.seed_tracks
            : [options.seed_tracks];

          // 원본 트랙들의 아티스트 ID 수집
          for (const trackId of trackIds) {
            try {
              const trackData = await fetchWebApi(token, `tracks/${trackId}`);
              const artistIds =
                trackData.artists?.map((artist: any) => artist.id) || [];
              excludedArtistIds.push(...artistIds);
            } catch (err) {
              console.warn(`Failed to fetch track ${trackId}:`, err);
            }
          }
        }

        // seed_artists가 있는 경우 (해당 아티스트는 제외하고 관련 아티스트의 트랙 추천)
        if (options.seed_artists) {
          const artistIds = Array.isArray(options.seed_artists)
            ? options.seed_artists
            : [options.seed_artists];

          // seed_artists도 제외 목록에 추가
          excludedArtistIds.push(...artistIds);

          for (const artistId of artistIds.slice(0, 2)) {
            // 최대 2개만 처리
            try {
              // 관련 아티스트 가져오기
              const relatedArtists = await getRelatedArtists(token, artistId);
              if (relatedArtists && relatedArtists.length > 0) {
                // 관련 아티스트 중 랜덤하게 2-3명 선택
                const selectedArtists = relatedArtists
                  .sort(() => 0.5 - Math.random())
                  .slice(0, 3);

                for (const relatedArtist of selectedArtists) {
                  const topTracks = await getArtistTopTracks(
                    token,
                    relatedArtist.id
                  );
                  if (topTracks) {
                    recommendations.push(...topTracks.slice(0, 3));
                  }
                }
              }
            } catch (err) {
              console.warn(
                `Failed to get related artists for ${artistId}:`,
                err
              );
            }
          }
        }

        // seed_genres가 있는 경우
        if (options.seed_genres) {
          const genres = Array.isArray(options.seed_genres)
            ? options.seed_genres
            : [options.seed_genres];

          for (const genre of genres.slice(0, 2)) {
            // 최대 2개만 처리
            const genreTracks = await searchByGenre(token, genre, 20); // 더 많이 가져와서 필터링
            if (genreTracks) {
              recommendations.push(...genreTracks.slice(0, 10));
            }
          }
        }

        // seed_tracks가 있는 경우 (유사한 트랙 검색)
        if (options.seed_tracks) {
          const trackIds = Array.isArray(options.seed_tracks)
            ? options.seed_tracks
            : [options.seed_tracks];

          for (const trackId of trackIds.slice(0, 2)) {
            // 최대 2개만 처리
            try {
              // 트랙 정보 가져오기
              const trackData = await fetchWebApi(token, `tracks/${trackId}`);
              const artistGenres = trackData.artists[0]?.genres || [];

              // 장르 기반 검색 (원본 아티스트 제외)
              if (artistGenres.length > 0) {
                const genreTracks = await searchByGenre(
                  token,
                  artistGenres[0],
                  20
                );
                if (genreTracks) {
                  recommendations.push(...genreTracks.slice(0, 10));
                }
              } else {
                // 장르 정보가 없으면 아티스트 이름으로 검색
                const searchData = await fetchWebApi(
                  token,
                  `search?q=artist:${encodeURIComponent(
                    trackData.artists[0]?.name
                  )}&type=track&market=KR&limit=20`
                );
                if (searchData.tracks?.items) {
                  const searchTracks =
                    searchData.tracks.items.map(normalizeTrackObject);
                  recommendations.push(...searchTracks.slice(0, 10));
                }
              }
            } catch (err) {
              console.warn(`Failed to get similar tracks for ${trackId}:`, err);
            }
          }
        }

        // 제외할 아티스트 ID 목록에서 중복 제거
        excludedArtistIds = [...new Set(excludedArtistIds)];

        // 같은 아티스트 트랙 필터링 및 중복 제거 - TrackObject 타입으로 처리
        const filteredRecommendations = recommendations.filter(
          (track: TrackObject, index: number, self: TrackObject[]) => {
            // 중복 트랙 제거
            const isUnique =
              index === self.findIndex((t) => t.trackId === track.trackId);

            // 제외할 아티스트 확인
            const hasExcludedArtist = track.artists?.some((artist) =>
              excludedArtistIds.includes(artist.id)
            );

            return isUnique && !hasExcludedArtist;
          }
        );

        // 추천 트랙이 부족한 경우 일반 인기 트랙으로 보충
        if (filteredRecommendations.length < (options.limit || 20)) {
          try {
            const popularTracks = await searchByGenre(token, "pop", 50);
            if (popularTracks) {
              const additionalTracks = popularTracks.filter(
                (track: TrackObject) => {
                  const hasExcludedArtist = track.artists?.some((artist) =>
                    excludedArtistIds.includes(artist.id)
                  );
                  const alreadyIncluded = filteredRecommendations.some(
                    (rec: TrackObject) => rec.trackId === track.trackId
                  );
                  return !hasExcludedArtist && !alreadyIncluded;
                }
              );

              filteredRecommendations.push(...additionalTracks);
            }
          } catch (err) {
            console.warn("Failed to fetch additional popular tracks:", err);
          }
        }

        // 섞고 제한
        const shuffled = filteredRecommendations.sort(
          () => 0.5 - Math.random()
        );
        const limit = options.limit || 20;

        return shuffled.slice(0, limit) as TrackObject[];
      } catch (err: any) {
        setError(err.message || "Failed to fetch recommendations");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [
      fetchWebApi,
      getArtistTopTracks,
      searchByGenre,
      getRelatedArtists,
      normalizeTrackObject,
    ]
  );

  return (
    <SpotifyApiContext.Provider
      value={{
        getTopTracks,
        getRecommendations,
        getRelatedArtists,
        getArtistTopTracks,
        searchByGenre,
        searchSimilarTracks,
        getTrackById,
        loading,
        error,
      }}
    >
      {children}
    </SpotifyApiContext.Provider>
  );
}

export function useSpotifyApi() {
  const context = useContext(SpotifyApiContext);
  if (!context) {
    throw new Error("useSpotifyApi must be used within SpotifyApiProvider");
  }
  return context;
}
