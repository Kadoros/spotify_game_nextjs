"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Import canvas-confetti
import confetti from "canvas-confetti";

interface ResultInfoProps {
  round: number;
  totalRounds: number;
  lives: number;
  score: number;
  gameId: string;
  ownerId?: Id<"users"> | null;
  userSelections: string[];
  onRevealResults: () => void;
}

export default function ResultInfo({
  round,
  totalRounds,
  lives,
  score,
  gameId,
  ownerId,
  userSelections = [],
  onRevealResults,
}: ResultInfoProps) {
  // Query owner user info (skip if no ownerId)
  const owner = useQuery(
    api.users.getUserById,
    ownerId ? { userId: ownerId } : "skip"
  );

  // Query current user for player name
  const userData = useQuery(api.users.getUser);

  // Fire confetti when component mounts
  useEffect(() => {
    // Initial burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    // Additional bursts for celebration
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
    }, 250);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
    }, 500);
  }, []);

  return (
    <div className="relative h-full w-full flex items-center justify-center bg-gradient-to-br overflow-hidden">
      {/* Main content */}
      <div className="relative z-10 w-full max-w-2xl px-6">
        {/* Celebration header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4 animate-fade-in">
            {userData?.name || "Player"} guessed until top #{round} song of{" "}
            {owner ? owner.name : "the owner"}!
          </h1>

          {/* Score summary */}
          <div className="flex justify-center gap-8 mb-6 text-white">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{score}</div>
              <div className="text-sm text-white/70">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{lives}</div>
              <div className="text-sm text-white/70">Lives Left</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">
                {userSelections.length}
              </div>
              <div className="text-sm text-white/70">Total Guesses</div>
            </div>
          </div>
        </div>

        {/* Info section with reveal button */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
          <div className="text-center">
            <p className="text-lg font-medium text-white mb-2">
              Game Complete!
            </p>
            <p className="text-sm text-white/70 mb-6">
              Ready to see how you did?
            </p>

            {/* Reveal Results Button */}
            <button
              onClick={onRevealResults}
              className="bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-6 rounded-xl border border-white/30 transition-all duration-200 hover:scale-105"
            >
              🎯 Reveal Result Details
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div>
  );
}
