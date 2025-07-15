// components/game/main-game.tsx
"use client";

import React, { useEffect, useState } from "react";
import SpotifyGrid from "./spotify-grid";
import { useSpotifyApi } from "@/context/SpotifyApiContext";
import { useSpotifyAuth } from "@/context/SpotifyAuthContext";
import { TrackObject } from "@/types";

interface MainGameProps {
  rounds: number;
  term: "short_term" | "medium_term" | "long_term";
}

export default function MainGame({ rounds, term }: MainGameProps) {
  const { getTopTracks, getRecommendations, error, hasToken } = useSpotifyApi();
  const { isSignedIn, login } = useSpotifyAuth();

  const [topTracks, setTopTracks] = useState<TrackObject[]>([]);
  const [recommendations, setRecommendations] = useState<
    Record<string, TrackObject[]>
  >({});
  const [loading, setLoading] = useState(true);

  const [currentRound, setCurrentRound] = useState(0);
  const [lives, setLives] = useState(5);
  const [wrongCount, setWrongCount] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const [roundTracks, setRoundTracks] = useState<TrackObject[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  async function fetchData() {
    if (!hasToken || !isSignedIn) {
      setTopTracks([]);
      setRecommendations({});
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const tops = await getTopTracks(rounds, term);
      if (!tops) {
        setTopTracks([]);
        setRecommendations({});
        setLoading(false);
        return;
      }
      setTopTracks(tops);

      const recs: Record<string, TrackObject[]> = {};
      await Promise.all(
        tops.map(async (track) => {
          const rec = await getRecommendations({
            seed_tracks: track.id,
            limit: 3,
          });
          recs[track.id] = rec ?? [];
        })
      );
      setRecommendations(recs);
    } catch {
      setTopTracks([]);
      setRecommendations({});
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [rounds, term, hasToken, isSignedIn]);

  useEffect(() => {
    if (topTracks.length === 0) return;
    if (!recommendations) return;

    if (currentRound >= topTracks.length) {
      setGameOver(true);
      return;
    }

    const topTrack = topTracks[currentRound];
    const recs = recommendations[topTrack.id] || [];

    const candidates = [topTrack, ...recs.slice(0, 3)];
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);

    setRoundTracks(shuffled);

    setSelectedTrackId(null);
    setIsCorrect(null);
    setWrongCount(0);
  }, [currentRound, topTracks, recommendations]);

  function handleSelect(trackId: string) {
    if (selectedTrackId && isCorrect !== null) return;

    setSelectedTrackId(trackId);

    const topTrack = topTracks[currentRound];
    const correct = trackId === topTrack.id;
    setIsCorrect(correct);

    if (correct) {
      setScore((s) => s + 1);

      setTimeout(() => {
        if (currentRound + 1 >= rounds) setGameOver(true);
        else setCurrentRound((r) => r + 1);

        setSelectedTrackId(null);
        setIsCorrect(null);
        setWrongCount(0);
      }, 1500);
    } else {
      setLives((l) => l - 1);
      setWrongCount((w) => w + 1);

      if (lives - 1 <= 0 || wrongCount + 1 >= 2) {
        setTimeout(() => setGameOver(true), 1500);
      } else {
        setTimeout(() => {
          setSelectedTrackId(null);
          setIsCorrect(null);
        }, 1500);
      }
    }
  }

  if (!isSignedIn || !hasToken) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="mb-4 text-lg">Please log in to view your top tracks.</p>
        <button
          onClick={login}
          className="px-4 py-2 rounded bg-blue-600 text-white"
        >
          Log in with Spotify
        </button>
      </div>
    );
  }

  if (loading)
    return <div className="p-8 text-center">Loading game data...</div>;

  if (gameOver) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
        <p className="mb-2">
          Your score: {score} / {rounds}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 max-w-4xl mx-auto h-full ">
      <div className="mb-4 flex justify-between text-lg font-semibold">
        <div>
          Round: {currentRound + 1} / {rounds}
        </div>
        <div>Lives: {lives}</div>
        <div>Score: {score}</div>
      </div>
      <div className="h-full ">
        <SpotifyGrid
          tracks={roundTracks}
          selectedTrackId={selectedTrackId}
          isCorrect={isCorrect}
          onSelect={handleSelect}
        />
      </div>
    </div>
  );
}
