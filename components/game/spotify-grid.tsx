"use client";

import { useEffect, useState } from "react";
import { TrackObject } from "@/types";
import { SpotifyCard } from "./spotify-card";

interface SpotifyGridProps {
  tracks: TrackObject[];
  selectedTrackId: string | null;
  isCorrect: boolean | null;
  onSelect: (trackId: string) => void;
}

function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export default function SpotifyGrid({
  tracks,
  selectedTrackId,
  isCorrect,
  onSelect,
}: SpotifyGridProps) {
  const [shuffledTracks, setShuffledTracks] = useState<TrackObject[]>([]);

  useEffect(() => {
    setShuffledTracks(shuffleArray(tracks.slice(0, 4)));
  }, [tracks]);

  return (
    <div className="p-4 max-w-xl mx-auto">
      <div className="grid grid-cols-2 gap-4">
        {shuffledTracks.map((track, idx) => (
          <SpotifyCard
            key={track.trackId}
            track={track}
            label={String.fromCharCode(65 + idx)} // A, B, C, D
            onClick={() => onSelect(track.trackId)}
            isSelected={selectedTrackId === track.trackId}
            isCorrect={isCorrect === true && selectedTrackId === track.trackId}
            isWrong={isCorrect === false && selectedTrackId === track.trackId}
          />
        ))}
      </div>
    </div>
  );
}
