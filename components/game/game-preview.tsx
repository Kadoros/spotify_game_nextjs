"use client";

import React, { useCallback, useState } from "react";
import SpotifyGrid from "./spotify-grid";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { TrackObject } from "@/types";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";

interface MainGamePreviewProps {
  gameId: string;
}

export default function MainGamePreview({ gameId }: MainGamePreviewProps) {
  const gameData = useQuery(api.games.getGameById, {
    gameId: gameId as Id<"games">,
  });

  const [currentRound, setCurrentRound] = useState(0);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  const currentTrackGroup = gameData?.trackGroups?.[currentRound];

  const roundTracks = useQuery(
    api.tracks.getTracksByIds,
    currentTrackGroup
      ? {
          trackIds: currentTrackGroup.options as Id<"tracks">[],
        }
      : "skip"
  );

  const handleCopyLink = useCallback(() => {
    if (!gameId) return;
    const protocol = window.location.protocol;
    const host = window.location.host;
    const shareLink = `${protocol}//${host}/game/${gameId}`;

    navigator.clipboard
      .writeText(shareLink)
      .then(() => {
        toast.success("Link copied to clipboard!");
      })
      .catch(() => {
        toast.error("Failed to copy link");
      });
  }, [gameId]);

  function handleSelect(trackId: string) {
    setSelectedTrackId(trackId);
  }

  function handleNext() {
    if (gameData && currentRound + 1 < gameData.trackGroups.length) {
      setCurrentRound(currentRound + 1);
      setSelectedTrackId(null);
    }
  }

  function handlePrev() {
    if (currentRound > 0) {
      setCurrentRound(currentRound - 1);
      setSelectedTrackId(null);
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

  return (
    <div className="flex flex-col p-4 max-w-4xl mx-auto">
      {/* Main Content */}
      <div className="flex-grow">
        <div className="mb-4 flex justify-between text-lg font-semibold">
          <div>Round: {currentRound + 1}</div>
          <div className="text-sm text-gray-500">Preview mode</div>
        </div>

        <SpotifyGrid
          tracks={roundTracks as TrackObject[]}
          selectedTrackId={selectedTrackId}
          isCorrect={null}
          onSelect={handleSelect}
        />
        <div className="mt-6 flex justify-between items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={currentRound === 0}
            className="bg-black/40 border-white/20 hover:bg-gray-700 px-4 disabled:opacity-50 outline-2 rounded-lg"
          >
            ⬅ Prev
          </button>

          <div className="flex gap-2">
            <Input
              readOnly
              value={`${typeof window !== "undefined" ? window.location.protocol + "//" + window.location.host : ""}/game/${gameId}`}
              className="bg-black/40 border-white/20 text-white "
            />
            <Button
              onClick={handleCopyLink}
              className="bg-black/40 border-white/20 hover:bg-gray-700 px-4 outline-2 rounded-lg"
            >
              Copy
            </Button>
          </div>

          <button
            onClick={handleNext}
            disabled={currentRound + 1 >= gameData.trackGroups.length}
            className="bg-black/40 border-white/20 hover:bg-gray-700 px-4 disabled:opacity-50 outline-2 rounded-lg"
          >
            Next ➡
          </button>
        </div>
      </div>

      {/* Bottom Controls */}
    </div>
  );
}
