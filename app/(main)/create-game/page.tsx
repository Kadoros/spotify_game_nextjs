"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { useSpotifyApi } from "@/context/SpotifyApiContext";
import { TrackGroup } from "@/types";
import { toast } from "sonner";

export default function CreateGamePage() {
  const router = useRouter();
  const { isLoading } = useConvexAuth();

  const [gameId, setGameId] = useState("");

  useEffect(() => {
    if (isLoading) {
      // 로딩 중이면 여기서 로딩 페이지 로직을 처리할 수 있습니다
      console.log("Loading authentication...");
    }
  }, [isLoading]);

  const userData = useQuery(api.users.getUser);
  const createGame = useMutation(api.games.createGame);

  const accessToken = useMemo(
    () => userData?.spotifyAccessToken ?? null,
    [userData]
  );
  const refreshToken = useMemo(
    () => userData?.spotifyRefreshToken ?? null,
    [userData]
  );

  // Handle loading and redirect logic
  useEffect(() => {
    // Wait for Convex authentication to complete first
    if (isLoading) return;

    // Then wait for user data to load
    if (userData === undefined) return;

    // Only redirect after both are loaded and if tokens are missing
    if (!accessToken || !refreshToken) {
      router.replace("/connect-spotify");
    }
  }, [isLoading, accessToken, refreshToken, router, userData]);

  const [lives, setLives] = useState(3);
  const [rounds, setRounds] = useState(5);

  const [activeTerm, setActiveTerm] = useState<"short" | "middle" | "long">(
    "short"
  );

  const { getTopTracks, getRecommendations } = useSpotifyApi();

  const handleMake = useCallback(async (): Promise<void> => {
    // Don't allow game creation if still loading
    if (isLoading || userData === undefined) return;

    const termMap: Record<
      "short" | "middle" | "long",
      "short_term" | "medium_term" | "long_term"
    > = {
      short: "short_term",
      middle: "medium_term",
      long: "long_term",
    };

    try {
      const topTracks: any[] | null = await getTopTracks(
        accessToken!,
        rounds,
        termMap[activeTerm]
      );
      if (!topTracks || topTracks.length < rounds) {
        throw new Error("Not enough top tracks found.");
      }

      const trackGroups: TrackGroup[] = await Promise.all(
        topTracks.map(async (track): Promise<TrackGroup> => {
          const recs: any[] | null = await getRecommendations(accessToken!, {
            seed_tracks: track.id,
            limit: 10,
          });

          const fakes = (recs ?? [])
            .filter((r: any) => r.id !== track.id)
            .slice(0, 3);

          if (fakes.length < 3) {
            throw new Error("Not enough fake tracks found.");
          }

          const options: string[] = [
            track.id,
            ...fakes.map((t: any) => t.id),
          ].sort(() => Math.random() - 0.5);

          return {
            options,
            answer: track.id,
          };
        })
      );

      // Call createGame mutation
      const game = await createGame({ trackGroups, lives });
      setGameId(game);
      // Redirect to the game page by link or id
    } catch (err: any) {
      console.error("Failed to create game:", err);
      toast.error("Error creating game. Try again.");
    }
  }, [
    rounds,
    activeTerm,
    lives,
    getTopTracks,
    getRecommendations,
    createGame,
    router,
    isLoading,
    userData,
  ]);

  const handleCopyLink = useCallback(() => {
    // Get the base URL from router
    const protocol = window.location.protocol;
    const host = window.location.host;
    const shareLink = `${protocol}//${host}/game/${gameId}`;

    navigator.clipboard
      .writeText(shareLink)
      .then(() => {
        toast.success("Link copied to clipboard!");
      })
      .catch(() => {
        toast.error("Failed to copy link");
      });
  }, [gameId]);

  const handlePreviewGame = useCallback(() => {
    router.push(`/game/${gameId}`);
  }, [gameId, router]);

  // Show loading while Convex is loading or user data is loading
  if (isLoading || userData === undefined) {
    return (
      <div className="text-white text-center p-10">
        Loading {isLoading ? "authentication" : "user data"}...
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 shadow-lg text-white space-y-6">
      <h1 className="text-2xl font-bold text-center">Create Your Game</h1>

      {!gameId ? (
        <>
          <div className="space-y-2">
            <Label>Lives</Label>
            <Input
              type="number"
              className="bg-black/40 border-white/20 text-white"
              value={lives}
              onChange={(e) => setLives(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Rounds</Label>
            <Input
              type="number"
              className="bg-black/40 border-white/20 text-white"
              value={rounds}
              onChange={(e) => setRounds(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Time Range</Label>
            <div className="flex gap-2">
              {["short", "middle", "long"].map((term) => (
                <Button
                  key={term}
                  onClick={() => setActiveTerm(term as any)}
                  className={`capitalize px-4 py-2 rounded-md text-white transition border ${
                    activeTerm === term
                      ? "bg-black/40 border-white/40 ring-2 ring-white/40"
                      : "bg-black/40 border-white/10 hover:bg-gray-700"
                  }`}
                >
                  {term.replace("_", " ")} Term
                </Button>
              ))}
            </div>
          </div>

          <Button
            className="w-full hover:bg-gray-700"
            onClick={handleMake}
            disabled={isLoading || userData === undefined}
          >
            Create Game
          </Button>
        </>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">
              Game Created Successfully!
            </h2>
            <p className="text-sm text-white/70">
              Share this link with your friends:
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              readOnly
              value={`${typeof window !== "undefined" ? window.location.protocol + "//" + window.location.host : ""}/game/${gameId}`}
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
      )}
    </div>
  );
}
