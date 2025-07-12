// components/game/spotify-grid.tsx
"use client";

import { SpotifyCard } from "./spotify-card";

interface Track {
  id: string;
  name: string;
  uri: string;
  artists: { name: string }[];
}

interface SpotifyGridProps {
  tracks: Track[];
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 sm:p-12">
      {tracks.map((track, idx) => (
        <SpotifyCard
          key={track.id}
          trackId={track.id}
          label={String.fromCharCode(65 + idx)}
          onClick={() => onSelect(track.id)}
          isSelected={selectedTrackId === track.id}
          isCorrect={isCorrect === true && selectedTrackId === track.id}
          isWrong={isCorrect === false && selectedTrackId === track.id}
        />
      ))}
    </div>
  );
}
