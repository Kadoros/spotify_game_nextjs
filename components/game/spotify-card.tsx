"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrackObject } from "@/types";
import PreviewBtn from "./preview-btn";

interface SpotifyCardProps {
  track: TrackObject;
  label?: string;
  onClick?: () => void;
  isSelected?: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
}

export function SpotifyCard({
  track,
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
      className={`relative aspect-square border border-white/10 rounded-lg md:rounded-2xl overflow-hidden shadow-lg md:shadow-xl
        transition-transform duration-300 transform hover:scale-105 hover:-translate-y-1 hover:shadow-xl md:hover:shadow-2xl cursor-pointer
        ${bgColor}
      `}
    >
      {/* If you want label, uncomment below */}
      {/* {label && (
        <div className="absolute top-1 md:top-2 left-1 md:left-2 z-10 text-white text-lg md:text-xl font-bold drop-shadow-lg">
          {label}
        </div>
      )} */}

      <CardContent className="flex flex-col h-full p-2 md:p-3 text-white justify-center">
        {/* Album image */}
        <div className="flex w-full mb-2 md:mb-3 items-center justify-center">
          <img
            src={track.album.images[0]?.url}
            alt={track.name}
            className="rounded-md md:rounded-lg max-w-3/5 object-cover"
          />
        </div>

        {/* Bottom section with song info on left and preview button on right */}
        <div className="flex items-center justify-between w-full">
          {/* Song info */}
          <div className="flex-1 text-left pr-2 md:pr-3">
            <p className="text-xs md:text-sm font-semibold line-clamp-2 leading-tight mb-1">
              {track.name}
            </p>
            <p className="text-xs md:text-xs text-white/70 line-clamp-1">
              {track.artists.map((a) => a.name).join(", ")}
            </p>
          </div>

          {/* Preview Button */}
          <div className="">
            <div className="">
              <PreviewBtn trackId={track.trackId} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
