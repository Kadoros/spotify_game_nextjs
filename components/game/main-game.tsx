"use client";

import React, { useState } from "react";
import SpotifyGrid from "./spotify-grid";
import GameScoreBoard from "./game-score-board";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { TrackObject } from "@/types";

interface MainGameProps {
  gameId: string;
}

export default function MainGame({ gameId }: MainGameProps) {
  const gameData = useQuery(api.games.getGameById, {
    gameId: gameId as Id<"games">,
  });

  const [currentRound, setCurrentRound] = useState(0);
  const [lives, setLives] = useState(5);
  const [wrongCount, setWrongCount] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // New state to track all user selections
  const [userSelections, setUserSelections] = useState<string[]>([]);

  const currentTrackGroup = gameData?.trackGroups?.[currentRound];

  const roundTracks = useQuery(
    api.tracks.getTracksByIds,
    currentTrackGroup
      ? {
          trackIds: currentTrackGroup.options as Id<"tracks">[],
        }
      : "skip"
  );

  function handleSelect(trackId: string) {
    if (
      selectedTrackId ||
      isCorrect !== null ||
      !currentTrackGroup ||
      !gameData
    )
      return;

    setSelectedTrackId(trackId);

    // Record the user's selection
    setUserSelections((prev) => [...prev, trackId]);

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
      const newWrongCount = wrongCount + 1;
      const newLives = lives - 1;

      setWrongCount(newWrongCount);
      setLives(newLives);

      if (newLives <= 0 || newWrongCount >= 2) {
        setTimeout(() => setGameOver(true), 1500);
      } else {
        setTimeout(() => {
          setSelectedTrackId(null);
          setIsCorrect(null);
        }, 1500);
      }
    }
  }

  if (gameData === undefined || roundTracks === undefined) {
    return (
      <div className="flex items-center justify-center p-8 h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-lg">Loading game data...</p>
        </div>
      </div>
    );
  }

  if (gameData === null) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="mb-4 text-lg">Game not found.</p>
      </div>
    );
  }

  if (!roundTracks || roundTracks.length === 0) {
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
    // Pass userSelections to GameScoreBoard if needed
    return (
      <GameScoreBoard
        gameId={gameId}
        round={currentRound + 1}
        totalRounds={gameData.trackGroups.length}
        lives={lives}
        score={score}
        ownerId={gameData.ownerId as Id<"users">}
        userSelections={userSelections || []} // Ensure it's always an array
      />
    );
  }

  return (
    <div className="flex flex-col p-4 max-w-4xl mx-auto h-full">
      <div className="mb-4 flex justify-between text-lg font-semibold">
        <div>Top: {currentRound + 1}</div>
        <div>❤️ : {lives}</div>
      </div>

      {/* Optional: Display current selections for debugging */}
      {process.env.NODE_ENV === "development" && (
        <div className="mb-2 text-sm text-gray-500">
          Selections: {userSelections.length} recorded
        </div>
      )}

      <div className="h-full">
        <SpotifyGrid
          tracks={roundTracks as TrackObject[]}
          selectedTrackId={selectedTrackId}
          isCorrect={isCorrect}
          onSelect={handleSelect}
        />
      </div>
    </div>
  );
}
