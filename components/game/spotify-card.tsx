// components/game/spotify-card.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";

interface SpotifyCardProps {
  trackId: string;
  label?: string;
  onClick?: () => void;
  isSelected?: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
}

export function SpotifyCard({
  trackId,
  label,
  onClick,
  isSelected,
  isCorrect,
  isWrong,
}: SpotifyCardProps) {
  let bgColor = "bg-white/5";
  if (isCorrect) bgColor = "bg-green-600/70";
  else if (isWrong) bgColor = "bg-red-600/70";

  return (
    <Card
      onClick={onClick}
      className={`relative aspect-square border border-white/10 rounded-2xl overflow-hidden shadow-xl
        transition-transform duration-300 transform hover:scale-105 hover:-translate-y-1 hover:shadow-2xl cursor-pointer
        ${bgColor}
      `}
    >
      {label && (
        <div className="absolute top-2 left-2 z-10 text-white text-xl font-bold drop-shadow-lg">
          {label}
        </div>
      )}

      {/* Wrapper to crop only the bottom-right corner */}
      <CardContent className="relative w-full h-full p-0 overflow-hidden">
        <div className="relative w-full h-full overflow-hidden">
          <iframe
            src={`https://open.spotify.com/embed/track/${trackId}`}
            className="absolute border-none"
            style={{
              width: "400px",
              height: "400px",
              left: "-200px",
              top: "-200px",
            }}
            frameBorder="0"
            allow="encrypted-media"
          />
        </div>
      </CardContent>
    </Card>
  );
}
