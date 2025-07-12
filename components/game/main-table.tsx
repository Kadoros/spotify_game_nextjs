"use client";

import { useEffect, useState } from "react";
import { useSpotifyApi } from "@/context/SpotifyApiContext";
import { useSpotifyAuth } from "@/context/SpotifyAuthContext";
import { Button } from "@/components/ui/button";
import { TracksTable } from "@/components/game/tracks-table";

interface Track {
  id: string;
  name: string;
  uri: string;
  artists: { name: string }[];
}

interface MainGameProps {
  rounds: number;
  term: "short_term" | "medium_term" | "long_term";
}

export default function MainGame({ rounds, term }: MainGameProps) {
  const { getTopTracks, getRecommendations, error, hasToken } = useSpotifyApi();
  const { isSignedIn, login } = useSpotifyAuth();

  const [topTracks, setTopTracks] = useState<Track[] | null>(null);
  const [recommendations, setRecommendations] = useState<Record<
    string,
    Track[]
  > | null>(null);
  const [fetching, setFetching] = useState(false);

  async function fetchData() {
    if (!hasToken || !isSignedIn) {
      setTopTracks(null);
      setRecommendations(null);
      return;
    }

    setFetching(true);
    try {
      const tracks = await getTopTracks(rounds, term);
      setTopTracks(tracks);

      if (tracks && tracks.length > 0) {
        const recs: Record<string, Track[]> = {};
        await Promise.all(
          tracks.map(async (track) => {
            const recTracks = await getRecommendations({
              seed_tracks: track.id,
              limit: 3,
            });
            recs[track.id] = recTracks ?? [];
          })
        );
        setRecommendations(recs);
      } else {
        setRecommendations(null);
      }
    } catch {
      setTopTracks(null);
      setRecommendations(null);
    }
    setFetching(false);
  }

  useEffect(() => {
    fetchData();
  }, [rounds, term]);

  if (!isSignedIn || !hasToken) {
    return (
      <div className="flex flex-col justify-center items-center p-8">
        <p className="mb-4 text-lg">Please log in to view your top tracks.</p>
        <Button onClick={login}>Log in with Spotify</Button>
      </div>
    );
  }

  return (
    <div>
      <Button onClick={fetchData} disabled={fetching} className="mb-6 w-32">
        {fetching ? "Loading..." : "Refresh"}
      </Button>

      {error && <div className="text-red-500 mb-4">Error: {error}</div>}

      {!fetching && (!topTracks || topTracks.length === 0) && (
        <div>No tracks found.</div>
      )}

      {!fetching && topTracks && topTracks.length > 0 && (
        <TracksTable topTracks={topTracks} recommendations={recommendations} />
      )}
    </div>
  );
}
