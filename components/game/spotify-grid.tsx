"use client";

import { TrackObject } from "@/types";
import { SpotifyCard } from "./spotify-card";

interface SpotifyGridProps {
  tracks: TrackObject[];
  selectedTrackId: string | null;
  isCorrect: boolean | null;
  onSelect: (trackId: string) => void;
}

export default function SpotifyGrid({
  tracks,
  selectedTrackId,
  isCorrect,
  onSelect,
}: SpotifyGridProps) {
  return (
    <div className="p-4 max-w-xl mx-auto">
      <div className="grid grid-cols-2 gap-4">
        {tracks.slice(0, 4).map((track, idx) => (
          <SpotifyCard
            key={track.id}
            track={track}
            label={String.fromCharCode(65 + idx)} // A, B, C, D
            onClick={() => onSelect(track.id)}
            isSelected={selectedTrackId === track.id}
            isCorrect={isCorrect === true && selectedTrackId === track.id}
            isWrong={isCorrect === false && selectedTrackId === track.id}
          />
        ))}
      </div>
    </div>
  );
}
