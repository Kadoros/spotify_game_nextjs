import React from "react";

export default function PreviewBtn({ trackId }: { trackId: string }) {
  return (
    <div className="scale-[0.5] md:scale-[1]">
      <div className="overflow-hidden w-[63px] h-[60px] rounded-2xl">
        <div className="relative w-[63px] h-[130px] overflow-hidden flex items-end justify-end ">
          <iframe
            src={`https://open.spotify.com/embed/track/${trackId}`}
            className="w-[300px] h-[300px] border-none"
            frameBorder="0"
            allow="encrypted-media"
          />
        </div>
      </div>
    </div>
  );
}
