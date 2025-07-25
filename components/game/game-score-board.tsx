"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Import canvas-confetti instead of magicui
import confetti from "canvas-confetti";

interface GameScoreBoardProps {
  round: number;
  totalRounds: number;
  lives: number;
  score: number;
  gameId: string;
  ownerId?: Id<"users"> | null;
  userSelections: string[]; // Add userSelections prop
}

export default function GameScoreBoard({
  round,
  totalRounds,
  lives,
  score,
  gameId,
  ownerId,
  userSelections = [],
}: GameScoreBoardProps) {
  const [resultId, setResultId] = useState("");
  const userData = useQuery(api.users.getUser);
  const recordGameResult = useMutation(api.gameResults.recordGameResult);
  const hasRecordedResult = useRef(false);

  // Query owner user info (skip if no ownerId)
  const owner = useQuery(
    api.users.getUserById,
    ownerId ? { userId: ownerId } : "skip"
  );

  // Record game result when component mounts
  useEffect(() => {
    const recordResult = async () => {
      if (hasRecordedResult.current) return; // Prevent duplicate recordings

      try {
        const _resultId = await recordGameResult({
          gameId: gameId as Id<"games">,
          playerId: userData?.userId, // Clerk user ID or undefined for anonymous
          endRound: round,
          livesLeft: lives,
          isFinished: true,
          userSelections: userSelections,
        });
        hasRecordedResult.current = true;

        setResultId(_resultId);
        console.log("Game result recorded successfully");
      } catch (error) {
        console.error("Failed to record game result:", error);
      }
    };

    recordResult();
  }, [
    recordGameResult,
    gameId,
    userData?.userId,
    round,
    lives,
    userSelections,
  ]);

  // Fire confetti when game ends
  useEffect(() => {
    if (1) {
      // Initial burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, []);

  function handleCopyLink() {
    if (typeof window !== "undefined") {
      const url = `${window.location.protocol}//${window.location.host}/result/${gameId}`;
      navigator.clipboard
        .writeText(url)
        .then(() => {
          // Show success message
          const button = document.activeElement as HTMLButtonElement;
          const originalText = button.textContent;
          button.textContent = "Copied!";
          button.classList.add("bg-green-600");

          setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove("bg-green-600");
          }, 2000);
        })
        .catch(() => {
          alert("Failed to copy link to clipboard");
        });
    }
  }

  function handlePreviewGame() {
    if (typeof window !== "undefined") {
      window.open(`/result/${resultId}`, "_blank");
    }
  }

  return (
    <div className="relative h-full w-full flex items-center justify-center bg-gradient-to-br overflow-hidden">
      {/* Main content */}
      <div className="relative z-10 w-full max-w-2xl px-6">
        {/* Celebration header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h1 className="text-4xl font-bold text-white mb-2 animate-fade-in">
            Congratulations!
          </h1>
          <h2 className="text-xl font-semibold text-white/90 mb-4">
            You guessed until top #{round} song of{" "}
            {owner ? owner.name : "the owner"}!
          </h2>

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

        {/* Share section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
          <div className="text-center mb-4">
            <p className="text-lg font-medium text-white mb-2">
              Challenge Your Friends!
            </p>
            <p className="text-sm text-white/70">
              Share this game and see if they can beat your score
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                readOnly
                value={
                  typeof window !== "undefined"
                    ? `${window.location.protocol}//${window.location.host}/result/${resultId}`
                    : ""
                }
                className="bg-black/40 border-white/30 text-white placeholder:text-white/50 focus:border-white/50 flex-1"
                placeholder="Game link will appear here..."
              />
              <Button
                onClick={handleCopyLink}
                className="bg-black/40 border-white/20 hover:bg-gray-700 px-4"
              >
                Copy
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handlePreviewGame}
                className="flex-1 bg-black/40 border-white/20 hover:bg-gray-700 px-4"
              >
                🎮 Play Again
              </Button>
              <Button
                onClick={() => (window.location.href = "/")}
                className="flex-1 bg-black/40 border-white/20 hover:bg-gray-700 px-4"
              >
                🏠 Home
              </Button>
            </div>

            {/* Manual confetti trigger for testing */}
            <Button
              onClick={handlePreviewGame}
              className="w-full bg-black/40 border-white/20 hover:bg-gray-700 px-4"
            >
              preview result page
            </Button>
          </div>
        </div>

        {/* Fun stats */}
        <div className="mt-6 text-center text-white/70 text-sm">
          <p>
            You got {Math.round((score / totalRounds) * 100)}% of the songs
            right!
            {score === totalRounds && " Perfect score! 🏆"}
            {score >= totalRounds * 0.8 &&
              score < totalRounds &&
              " Excellent! 🌟"}
            {score >= totalRounds * 0.6 &&
              score < totalRounds * 0.8 &&
              " Good job! 👏"}
            {score < totalRounds * 0.6 && " Keep practicing! 💪"}
          </p>
          {process.env.NODE_ENV === "development" && (
            <p className="mt-2 text-xs text-white/50">
              Debug: {userSelections.length} selections recorded
            </p>
          )}
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

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
