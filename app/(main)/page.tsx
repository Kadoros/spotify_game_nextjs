"use client";

import { useSpotifyAuth } from "@/hooks/useSpotifyAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
  const { isSignedIn, login } = useSpotifyAuth();

  const handleStart = () => {
    router.push("/game");
  };

  return (
    <main className="flex flex-col items-center text-center gap-6 max-w-xl px-4 mx-auto h-screen justify-center">
      <h1 className="text-4xl font-bold">🎧 Guess Repeat</h1>
      <p className="text-lg text-gray-300 max-w-md">
        One of your top 5 most-played Spotify songs is hidden among 3 similar
        tracks. Can your friends guess which one is the real repeat?
      </p>

      {!isSignedIn ? (
        <Button onClick={login} className="text-lg px-6 py-3">
          Sign in to Start 🎵
        </Button>
      ) : (
        <Button onClick={handleStart} className="text-lg px-6 py-3">
          Play Game 🎮
        </Button>
      )}

      <div className="mt-12 text-sm text-gray-500">
        Built with Spotify API, Clerk Auth, and Next.js 💿
      </div>
    </main>
  );
}
