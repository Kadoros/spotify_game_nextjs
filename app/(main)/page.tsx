"use client";

import { useEffect, useState } from "react";
import { useSpotifyAuth } from "@/context/SpotifyAuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TermAndRoundSelector } from "@/components/game/term-and-round-selector";
import { useUser } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function Home() {
  const router = useRouter();

  const { user } = useUser();
  const createUser = useMutation(api.users.createUser);

  useEffect(() => {
    if (user) {
      createUser({
        name: user.fullName ?? undefined,
        email: user.emailAddresses[0]?.emailAddress ?? undefined,
      });
    }
  }, [user, createUser]);

  const handleStart = () => {
    // Example: pass term and rounds as query params if you want
    router.push(`/create-game`);
  };

  return (
    <main className="flex flex-col items-center text-center gap-6 max-w-xl px-4 mx-auto h-full justify-center">
      <h1 className="text-4xl font-bold">🎧 Guess Repeat</h1>
      <p className="text-lg text-gray-300 max-w-md">
        One of your top 5 most-played Spotify songs is hidden among 3 similar
        tracks. Can your friends guess which one is the real repeat?
      </p>

      <Button
        onClick={handleStart}
        className="bg-black/40 border-white/20 hover:bg-gray-700 px-4 text-lg"
      >
        Create Game
      </Button>

      <div className="mt-12 text-sm text-gray-500">
        Built with Spotify API, Clerk Auth, and Next.js 💿
      </div>
    </main>
  );
}
