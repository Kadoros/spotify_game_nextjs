// components/game/main-game.tsx
"use client";

import React, { useEffect, useState } from "react";
import SpotifyGrid from "./spotify-grid";
import { TrackObject, TrackGroup } from "@/types";
import GameScoreBoard from "./game-score-board";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useSpotifyApi } from "@/context/SpotifyApiContext"; // Import the context

interface MainGameProps {
  gameId: string;
}

export default function MainGame({ gameId }: MainGameProps) {
  // Fetch game data from Convex
  const gameData = useQuery(api.games.getGameById, {
    gameId: gameId as Id<"games">,
  });

  // Get Spotify API functions
  const { getTrackById } = useSpotifyApi();

  const [currentRound, setCurrentRound] = useState(0);
  const [lives, setLives] = useState(5);
  const [wrongCount, setWrongCount] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const [roundTracks, setRoundTracks] = useState<TrackObject[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch tracks for the current round
  useEffect(() => {
    const fetchRoundTracks = async () => {
      if (!gameData?.trackGroups || !gameData.trackGroups[currentRound]) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const currentTrackGroup = gameData.trackGroups[currentRound];
        const trackPromises = currentTrackGroup.options.map((trackId) =>
          getTrackById(trackId)
        );

        const tracks = await Promise.all(trackPromises);

        // Filter out any null results
        const validTracks = tracks.filter((track) => track !== null);

        setRoundTracks(validTracks);
      } catch (error) {
        console.error("Failed to fetch round tracks:", error);
        setRoundTracks([]);
      } finally {
        setLoading(false);
      }
    };

    if (gameData?.trackGroups) {
      fetchRoundTracks();
    }
  }, [gameData, currentRound, getTrackById]);

  function handleSelect(trackId: string) {
    if (selectedTrackId && isCorrect !== null) return;
    if (!gameData?.trackGroups) return;

    setSelectedTrackId(trackId);

    const currentTrackGroup = gameData.trackGroups[currentRound];
    const correct = trackId === currentTrackGroup.answer;
    setIsCorrect(correct);

    if (correct) {
      setScore((s) => s + 1);

      setTimeout(() => {
        if (currentRound + 1 >= gameData.trackGroups.length) {
          setGameOver(true);
        } else {
          setCurrentRound((r) => r + 1);
        }

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

  // Loading state
  if (gameData === undefined || loading) {
    return (
      <div className="flex items-center justify-center p-8 h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading game data...</p>
        </div>
      </div>
    );
  }

  // Game not found
  if (gameData === null) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="mb-4 text-lg">Game not found.</p>
      </div>
    );
  }

  // No tracks loaded yet
  if (roundTracks.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="mb-4 text-lg">Failed to load tracks for this round.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (gameOver) {
    return (
      <GameScoreBoard
        round={currentRound + 1}
        totalRounds={gameData.trackGroups.length}
        lives={lives}
        score={score}
      />
    );
  }

  const totalRounds = gameData.trackGroups.length;

  return (
    <div className="flex flex-col p-4 max-w-4xl mx-auto h-full">
      <div className="mb-4 flex justify-between text-lg font-semibold">
        <div>
          Round: {currentRound + 1} / {totalRounds}
        </div>
        <div>Lives: {lives}</div>
        <div>Score: {score}</div>
      </div>
      <div className="h-full">
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
