"use client";

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
    num: number,
    time_range?: "short_term" | "medium_term" | "long_term"
  ) => Promise<any[] | null>;

  // 새로운 추천 함수들
  getRecommendations: (options: Record<string, any>) => Promise<any[] | null>;
  getRelatedArtists: (artistId: string) => Promise<any[] | null>;
  getArtistTopTracks: (
    artistId: string,
    market?: string
  ) => Promise<any[] | null>;
  searchByGenre: (genre: string, limit?: number) => Promise<any[] | null>;
  searchSimilarTracks: (
    trackId: string,
    limit?: number
  ) => Promise<any[] | null>;

  loading: boolean;
  error: string | null;
  hasToken: boolean;
}

const SpotifyApiContext = createContext<SpotifyApiContextType | undefined>(
  undefined
);

export function SpotifyApiProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);

  // Initialize token on client side only
  useEffect(() => {
    const savedToken = localStorage.getItem("access_token");
    if (savedToken) {
      setToken(savedToken);
      setHasToken(true);
    }
  }, []);

  // Listen for token changes in localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "access_token") {
        const newToken = e.newValue;
        setToken(newToken);
        setHasToken(!!newToken);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Helper to call Spotify Web API
  const fetchWebApi = useCallback(
    async (endpoint: string, method = "GET", body?: any) => {
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

        // Handle token expiration
        if (res.status === 401) {
          localStorage.removeItem("access_token");
          setToken(null);
          setHasToken(false);
          throw new Error("Token expired. Please log in again.");
        }

        throw new Error(data.error?.message || res.statusText);
      }

      return await res.json();
    },
    [token]
  );

  const getTopTracks = useCallback(
    async (
      num: number,
      time_range: "short_term" | "medium_term" | "long_term" = "short_term"
    ): Promise<any[] | null> => {
      if (!token) {
        setError("No access token. Please log in first.");
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await fetchWebApi(
          `me/top/tracks?limit=${num}&time_range=${time_range}`
        );
        return data.items ?? null;
      } catch (err: any) {
        setError(err.message || "Failed to fetch top tracks");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchWebApi, token]
  );

  // 관련 아티스트 가져오기
  const getRelatedArtists = useCallback(
    async (artistId: string): Promise<any[] | null> => {
      if (!token) {
        setError("No access token. Please log in first.");
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await fetchWebApi(`artists/${artistId}/related-artists`);
        return data.artists ?? null;
      } catch (err: any) {
        setError(err.message || "Failed to fetch related artists");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchWebApi, token]
  );

  // 아티스트의 인기 트랙 가져오기
  const getArtistTopTracks = useCallback(
    async (artistId: string, market: string = "KR"): Promise<any[] | null> => {
      if (!token) {
        setError("No access token. Please log in first.");
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await fetchWebApi(
          `artists/${artistId}/top-tracks?market=${market}`
        );
        return data.tracks ?? null;
      } catch (err: any) {
        setError(err.message || "Failed to fetch artist top tracks");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchWebApi, token]
  );

  // 장르별 검색
  const searchByGenre = useCallback(
    async (genre: string, limit: number = 20): Promise<any[] | null> => {
      if (!token) {
        setError("No access token. Please log in first.");
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await fetchWebApi(
          `search?q=genre:${encodeURIComponent(
            genre
          )}&type=track&market=KR&limit=${limit}`
        );
        return data.tracks?.items ?? null;
      } catch (err: any) {
        setError(err.message || "Failed to search by genre");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchWebApi, token]
  );

  // 트랙 기반 유사한 트랙 검색 (audio features 활용)
  const searchSimilarTracks = useCallback(
    async (trackId: string, limit: number = 20): Promise<any[] | null> => {
      if (!token) {
        setError("No access token. Please log in first.");
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        // 먼저 트랙 정보와 audio features를 가져옴
        const [trackData, audioFeatures] = await Promise.all([
          fetchWebApi(`tracks/${trackId}`),
          fetchWebApi(`audio-features/${trackId}`),
        ]);

        // 아티스트의 장르 정보로 검색
        const artistGenres = trackData.artists[0]?.genres || [];
        const searchQuery =
          artistGenres.length > 0
            ? `genre:${artistGenres[0]}`
            : `artist:${trackData.artists[0]?.name}`;

        const searchData = await fetchWebApi(
          `search?q=${encodeURIComponent(
            searchQuery
          )}&type=track&market=KR&limit=${limit}`
        );

        // 원본 트랙 제외
        const similarTracks =
          searchData.tracks?.items?.filter(
            (track: any) => track.id !== trackId
          ) ?? null;

        return similarTracks;
      } catch (err: any) {
        setError(err.message || "Failed to find similar tracks");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchWebApi, token]
  );

  // 기존 getRecommendations 함수를 대체 방법으로 구현
  const getRecommendations = useCallback(
    async (options: Record<string, any>): Promise<any[] | null> => {
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
              const trackData = await fetchWebApi(`tracks/${trackId}`);
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
              const relatedArtists = await getRelatedArtists(artistId);
              if (relatedArtists && relatedArtists.length > 0) {
                // 관련 아티스트 중 랜덤하게 2-3명 선택
                const selectedArtists = relatedArtists
                  .sort(() => 0.5 - Math.random())
                  .slice(0, 3);

                for (const relatedArtist of selectedArtists) {
                  const topTracks = await getArtistTopTracks(relatedArtist.id);
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
            const genreTracks = await searchByGenre(genre, 20); // 더 많이 가져와서 필터링
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
              const trackData = await fetchWebApi(`tracks/${trackId}`);
              const artistGenres = trackData.artists[0]?.genres || [];

              // 장르 기반 검색 (원본 아티스트 제외)
              if (artistGenres.length > 0) {
                const genreTracks = await searchByGenre(artistGenres[0], 20);
                if (genreTracks) {
                  recommendations.push(...genreTracks.slice(0, 10));
                }
              } else {
                // 장르 정보가 없으면 아티스트 이름으로 검색
                const searchData = await fetchWebApi(
                  `search?q=artist:${encodeURIComponent(
                    trackData.artists[0]?.name
                  )}&type=track&market=KR&limit=20`
                );
                if (searchData.tracks?.items) {
                  recommendations.push(...searchData.tracks.items.slice(0, 10));
                }
              }
            } catch (err) {
              console.warn(`Failed to get similar tracks for ${trackId}:`, err);
            }
          }
        }

        // 제외할 아티스트 ID 목록에서 중복 제거
        excludedArtistIds = [...new Set(excludedArtistIds)];

        // 같은 아티스트 트랙 필터링 및 중복 제거
        const filteredRecommendations = recommendations.filter(
          (track, index, self) => {
            // 중복 트랙 제거
            const isUnique = index === self.findIndex((t) => t.id === track.id);

            // 제외할 아티스트 확인
            const hasExcludedArtist = track.artists?.some((artist: any) =>
              excludedArtistIds.includes(artist.id)
            );

            return isUnique && !hasExcludedArtist;
          }
        );

        // 추천 트랙이 부족한 경우 일반 인기 트랙으로 보충
        if (filteredRecommendations.length < (options.limit || 20)) {
          try {
            const popularTracks = await searchByGenre("pop", 50);
            if (popularTracks) {
              const additionalTracks = popularTracks.filter((track) => {
                const hasExcludedArtist = track.artists?.some((artist: any) =>
                  excludedArtistIds.includes(artist.id)
                );
                const alreadyIncluded = filteredRecommendations.some(
                  (rec) => rec.id === track.id
                );
                return !hasExcludedArtist && !alreadyIncluded;
              });

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

        return shuffled.slice(0, limit);
      } catch (err: any) {
        setError(err.message || "Failed to fetch recommendations");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchWebApi, token, getArtistTopTracks, searchByGenre, getRelatedArtists]
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
        loading,
        error,
        hasToken,
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
