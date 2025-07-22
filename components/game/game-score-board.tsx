"use client";

import { useEffect, useRef } from "react";
import { Confetti, type ConfettiRef } from "@/components/magicui/confetti";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface GameScoreBoardProps {
  round: number;
  totalRounds: number;
  lives: number;
  score: number;
  gameId: string;
  ownerId?: Id<"users"> | null;
}

export default function GameScoreBoard({
  round,
  totalRounds,
  lives,
  score,
  gameId,
  ownerId,
}: GameScoreBoardProps) {
  const confettiRef = useRef<ConfettiRef>(null);
  const isGameOver = round > totalRounds;

  // Query owner user info (skip if no ownerId)
  const owner = useQuery(
    api.users.getUserById,
    ownerId ? { userId: ownerId } : "skip"
  );

  useEffect(() => {
    if (isGameOver) {
      confettiRef.current?.fire({});
    }
  }, [isGameOver]);

  function handleCopyLink() {
    if (typeof window !== "undefined") {
      const url = `${window.location.protocol}//${window.location.host}/game/${gameId}`;
      navigator.clipboard.writeText(url);
      alert("Game link copied to clipboard!");
    }
  }

  function handlePreviewGame() {
    if (typeof window !== "undefined") {
      window.open(`/game/${gameId}`, "_blank");
    }
  }

  return (
    <div className="relative h-full w-full flex items-center justify-center">
      <Confetti
        ref={confettiRef}
        className="absolute left-0 top-0 z-0 w-full h-full"
      />

      <div className="grid grid-cols-2 gap-4 w-full max-w-xl px-6 py-4 rounded-2xl bg-white/5 backdrop-blur-sm shadow-xl text-white relative z-10">
        {isGameOver ? (
          <div className="col-span-2 space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-semibold mb-2">
                You guessed until top #{round - 1} song of{" "}
                {owner ? owner.name : "the owner"} !!
              </h2>
              <p className="text-sm text-white/70">
                Share this link with your friends:
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                readOnly
                value={
                  typeof window !== "undefined"
                    ? `${window.location.protocol}//${window.location.host}/game/${gameId}`
                    : ""
                }
                className="bg-black/40 border-white/20 text-white"
              />
              <Button
                onClick={handleCopyLink}
                className="bg-black/40 border-white/20 hover:bg-gray-700 px-4"
              >
                Copy
              </Button>
            </div>

            <Button
              onClick={handlePreviewGame}
              className="w-full hover:bg-gray-700"
            >
              Preview Game
            </Button>
          </div>
        ) : (
          <div className="col-span-2 space-y-4 text-center">
            <h2 className="text-lg font-semibold mb-2 text-red-500">
              Unlucky!
            </h2>
            <p className="text-sm text-gray-300 mb-2">Top #{round}</p>

            <div className="flex gap-2 justify-center mb-4">
              <span className="flex flex-col items-center">
                <span className="text-sm text-gray-300">Lives</span>
                <span
                  className={`text-2xl font-bold tracking-wide ${
                    lives <= 1 ? "text-red-500" : "text-green-400"
                  }`}
                >
                  {lives}
                </span>
              </span>
            </div>

            <div className="flex gap-2 justify-center">
              <Input
                readOnly
                value={
                  typeof window !== "undefined"
                    ? `${window.location.protocol}//${window.location.host}/game/${gameId}`
                    : ""
                }
                className="bg-black/40 border-white/20 text-white max-w-xs"
              />
              <Button
                onClick={handleCopyLink}
                className="bg-black/40 border-white/20 hover:bg-gray-700 px-4"
              >
                Copy
              </Button>
            </div>

            <Button
              onClick={handlePreviewGame}
              className="w-full hover:bg-gray-700"
            >
              Preview Game
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
