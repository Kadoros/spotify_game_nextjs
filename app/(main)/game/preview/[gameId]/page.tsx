"use client";

import { useParams } from "next/navigation";
import MainGamePreview from "@/components/game/game-preview";
import Link from "next/link";

export default function GamePrwviewPage() {
  const params = useParams();

  // Get gameId from URL path params
  const gameId = params.gameId as string;

  if (!gameId) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="mb-4 text-lg">No game ID provided.</p>
        <Link
          href="/"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go Home
        </Link>
      </div>
    );
  }

  return <MainGamePreview gameId={gameId} />;
}
