"use client";

import { useParams } from "next/navigation";
import MainGame from "@/components/game/main-game";

export default function GamePage() {
  const params = useParams();

  // Get gameId from URL path params
  const gameId = params.gameId as string;

  if (!gameId) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="mb-4 text-lg">No game ID provided.</p>
        <a
          href="/"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go Home
        </a>
      </div>
    );
  }

  return <MainGame gameId={gameId} />;
}
