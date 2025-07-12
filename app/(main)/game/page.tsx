"use client";

import { useSearchParams } from "next/navigation";
import MainGame from "@/components/game/main-game";

export default function GamePage() {
  const searchParams = useSearchParams();

  // Defaults in case missing
  const term = (searchParams.get("term") || "short_term") as
    | "short_term"
    | "medium_term"
    | "long_term";
  const rounds = parseInt(searchParams.get("rounds") || "10");

  return <MainGame term={term} rounds={rounds} />;
}
