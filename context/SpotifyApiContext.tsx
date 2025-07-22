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

  // 게임용 비슷한 트랙 추천 함수 추가
  getSimilarTracksForGame: (
    token: string,
    targetTrack: TrackObject,
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

  // 오디오 특성 계산 헬퍼 함수
  const calculateAudioSimilarity = (features1: any, features2: any): number => {
    if (!features1 || !features2) return 0;

    const weights = {
      tempo: 0.2,
      energy: 0.2,
      danceability: 0.2,
      valence: 0.15,
      acousticness: 0.1,
      loudness: 0.1,
      speechiness: 0.05,
    };

    let totalScore = 0;
    let totalWeight = 0;

    // 템포 유사도 (BPM 차이를 0-1 스케일로 변환)
    if (features1.tempo && features2.tempo) {
      const tempoDiff = Math.abs(features1.tempo - features2.tempo);
      const tempoSimilarity = Math.max(0, 1 - tempoDiff / 50); // 50 BPM 차이를 최대로 설정
      totalScore += tempoSimilarity * weights.tempo;
      totalWeight += weights.tempo;
    }

    // 에너지 유사도
    if (features1.energy !== undefined && features2.energy !== undefined) {
      const energySimilarity =
        1 - Math.abs(features1.energy - features2.energy);
      totalScore += energySimilarity * weights.energy;
      totalWeight += weights.energy;
    }

    // 댄서빌리티 유사도
    if (
      features1.danceability !== undefined &&
      features2.danceability !== undefined
    ) {
      const danceabilitySimilarity =
        1 - Math.abs(features1.danceability - features2.danceability);
      totalScore += danceabilitySimilarity * weights.danceability;
      totalWeight += weights.danceability;
    }

    // 발랜스 유사도 (긍정적/부정적 느낌)
    if (features1.valence !== undefined && features2.valence !== undefined) {
      const valenceSimilarity =
        1 - Math.abs(features1.valence - features2.valence);
      totalScore += valenceSimilarity * weights.valence;
      totalWeight += weights.valence;
    }

    // 어쿠스틱 유사도
    if (
      features1.acousticness !== undefined &&
      features2.acousticness !== undefined
    ) {
      const acousticnessSimilarity =
        1 - Math.abs(features1.acousticness - features2.acousticness);
      totalScore += acousticnessSimilarity * weights.acousticness;
      totalWeight += weights.acousticness;
    }

    // 볼륨 유사도 (dB를 0-1 스케일로 변환)
    if (features1.loudness !== undefined && features2.loudness !== undefined) {
      const loudnessDiff = Math.abs(features1.loudness - features2.loudness);
      const loudnessSimilarity = Math.max(0, 1 - loudnessDiff / 20); // 20dB 차이를 최대로 설정
      totalScore += loudnessSimilarity * weights.loudness;
      totalWeight += weights.loudness;
    }

    // 스피치 유사도
    if (
      features1.speechiness !== undefined &&
      features2.speechiness !== undefined
    ) {
      const speechinessSimilarity =
        1 - Math.abs(features1.speechiness - features2.speechiness);
      totalScore += speechinessSimilarity * weights.speechiness;
      totalWeight += weights.speechiness;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  };

  // 게임용 비슷한 트랙 추천 함수 - 오디오 특성 기반 정교한 유사도 매칭
  const getSimilarTracksForGame = useCallback(
    async (
      token: string,
      targetTrack: TrackObject,
      limit: number = 3
    ): Promise<TrackObject[] | null> => {
      if (!token) {
        setError("No access token. Please log in first.");
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const targetTrackId = targetTrack.trackId;
        const targetArtistId = targetTrack.artists[0]?.id;

        // 타겟 트랙의 오디오 특성 가져오기
        const targetAudioFeatures = await fetchWebApi(
          token,
          `audio-features/${targetTrackId}`
        );

        let candidates: TrackObject[] = [];

        // 1. 관련 아티스트의 트랙들 (같은 아티스트 제외)
        if (targetArtistId) {
          const relatedArtists = await getRelatedArtists(token, targetArtistId);
          if (relatedArtists && relatedArtists.length > 0) {
            // 인기도가 비슷한 관련 아티스트만 선택 (±25 범위)
            const similarPopularityArtists = relatedArtists.filter(
              (artist) =>
                Math.abs(artist.popularity - (targetTrack.popularity || 50)) <=
                25
            );

            for (const artist of similarPopularityArtists.slice(0, 4)) {
              const artistTracks = await getArtistTopTracks(token, artist.id);
              if (artistTracks) {
                // 비슷한 인기도와 길이의 트랙만 선택
                const similarTracks = artistTracks.filter((track) => {
                  const popularityDiff = Math.abs(
                    track.popularity - (targetTrack.popularity || 50)
                  );
                  const durationDiff = Math.abs(
                    track.duration_ms - targetTrack.duration_ms
                  );
                  return popularityDiff <= 20 && durationDiff <= 45000; // 45초 이내 차이
                });
                candidates.push(...similarTracks.slice(0, 3));
              }
            }
          }
        }

        // 2. 같은 년도 또는 비슷한 년도의 트랙들
        const targetYear = parseInt(
          targetTrack.album.release_date.split("-")[0]
        );
        const searchQueries = [
          `year:${targetYear}`,
          `year:${targetYear - 1}`,
          `year:${targetYear + 1}`,
          `year:${targetYear - 2}`,
          `year:${targetYear + 2}`,
        ];

        for (const query of searchQueries.slice(0, 3)) {
          try {
            const searchData = await fetchWebApi(
              token,
              `search?q=${query}&type=track&market=KR&limit=30`
            );
            if (searchData.tracks?.items) {
              const tracks = searchData.tracks.items
                .map(normalizeTrackObject)
                .filter(
                  (track: { popularity: number; duration_ms: number }) => {
                    // 기본적인 필터링
                    const popularityDiff = Math.abs(
                      track.popularity - (targetTrack.popularity || 50)
                    );
                    const durationDiff = Math.abs(
                      track.duration_ms - targetTrack.duration_ms
                    );
                    return popularityDiff <= 30 && durationDiff <= 60000; // 1분 이내 차이
                  }
                );
              candidates.push(...tracks.slice(0, 5));
            }
          } catch (err) {
            console.warn(`Search failed for ${query}:`, err);
          }
        }

        // 3. 장르 기반 검색 (타겟 아티스트 정보에서 추정)
        if (targetArtistId) {
          try {
            const artistData = await fetchWebApi(
              token,
              `artists/${targetArtistId}`
            );
            if (artistData.genres && artistData.genres.length > 0) {
              for (const genre of artistData.genres.slice(0, 2)) {
                const genreTracks = await searchByGenre(token, genre, 25);
                if (genreTracks) {
                  const filteredGenreTracks = genreTracks.filter((track) => {
                    const popularityDiff = Math.abs(
                      track.popularity - (targetTrack.popularity || 50)
                    );
                    const durationDiff = Math.abs(
                      track.duration_ms - targetTrack.duration_ms
                    );
                    return popularityDiff <= 25 && durationDiff <= 50000;
                  });
                  candidates.push(...filteredGenreTracks.slice(0, 4));
                }
              }
            }
          } catch (err) {
            console.warn("Failed to fetch artist genres:", err);
          }
        }

        // 중복 제거 및 타겟 트랙과 같은 아티스트 제외
        const uniqueCandidates = candidates.filter((track, index, self) => {
          const isUnique =
            index === self.findIndex((t) => t.trackId === track.trackId);
          const isNotTarget = track.trackId !== targetTrackId;
          const isNotSameArtist = !track.artists.some((artist) =>
            targetTrack.artists.some(
              (targetArtist) => targetArtist.id === artist.id
            )
          );
          return isUnique && isNotTarget && isNotSameArtist;
        });

        if (uniqueCandidates.length === 0) {
          throw new Error("No suitable candidates found");
        }

        // 4. 오디오 특성 기반 유사도 계산 및 정렬
        if (targetAudioFeatures) {
          const candidateIds = uniqueCandidates.map((track) => track.trackId);

          // 배치로 audio features 가져오기 (최대 100개씩)
          const batches = [];
          for (let i = 0; i < candidateIds.length; i += 100) {
            batches.push(candidateIds.slice(i, i + 100));
          }

          const allAudioFeatures: any[] = [];
          for (const batch of batches) {
            try {
              const batchFeatures = await fetchWebApi(
                token,
                `audio-features?ids=${batch.join(",")}`
              );
              if (batchFeatures.audio_features) {
                allAudioFeatures.push(...batchFeatures.audio_features);
              }
            } catch (err) {
              console.warn("Failed to fetch batch audio features:", err);
            }
          }

          // 각 후보 트랙의 유사도 계산
          const candidatesWithSimilarity = uniqueCandidates
            .map((track) => {
              const audioFeatures = allAudioFeatures.find(
                (af) => af && af.id === track.trackId
              );
              const similarity = audioFeatures
                ? calculateAudioSimilarity(targetAudioFeatures, audioFeatures)
                : 0;

              return {
                track,
                similarity,
                audioFeatures,
              };
            })
            .filter((item) => item.similarity > 0.3) // 최소 30% 유사도
            .sort((a, b) => b.similarity - a.similarity); // 유사도 높은 순

          // 상위 유사 트랙들 중에서 선택 (너무 유사한 것만 선택하지 않도록 다양성 추가)
          const topSimilar = candidatesWithSimilarity.slice(
            0,
            Math.min(20, candidatesWithSimilarity.length)
          );
          const selectedTracks: TrackObject[] = [];

          // 유사도가 높은 순서대로 선택하되, 약간의 랜덤성 추가
          for (
            let i = 0;
            i < topSimilar.length && selectedTracks.length < limit;
            i++
          ) {
            const shouldSelect =
              Math.random() > 0.1 || selectedTracks.length < 2; // 90% 확률로 선택, 또는 2개 미만이면 무조건 선택
            if (shouldSelect) {
              selectedTracks.push(topSimilar[i].track);
            }
          }

          // 부족한 경우 나머지 후보에서 랜덤 선택
          if (selectedTracks.length < limit) {
            const remaining = topSimilar
              .filter((item) => !selectedTracks.includes(item.track))
              .map((item) => item.track)
              .sort(() => 0.5 - Math.random());

            selectedTracks.push(
              ...remaining.slice(0, limit - selectedTracks.length)
            );
          }

          return selectedTracks.slice(0, limit);
        } else {
          // 오디오 특성을 가져올 수 없는 경우, 기본적인 유사도로 선택
          uniqueCandidates.sort((a, b) => {
            const popularityDiffA = Math.abs(
              a.popularity - (targetTrack.popularity || 50)
            );
            const popularityDiffB = Math.abs(
              b.popularity - (targetTrack.popularity || 50)
            );
            return popularityDiffA - popularityDiffB;
          });

          const topCandidates = uniqueCandidates.slice(0, limit * 2);
          const shuffled = topCandidates.sort(() => 0.5 - Math.random());

          return shuffled.slice(0, limit);
        }
      } catch (err: any) {
        setError(err.message || "Failed to get similar tracks for game");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [
      fetchWebApi,
      getArtistTopTracks,
      getRelatedArtists,
      searchByGenre,
      calculateAudioSimilarity,
    ]
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
        getSimilarTracksForGame,
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
