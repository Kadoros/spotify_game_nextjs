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
import { TrackGroup, TrackObject } from "@/types";
import { toast } from "sonner";

export default function CreateGamePage() {
  const router = useRouter();
  const { isLoading } = useConvexAuth();

  const [gameId, setGameId] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  const userData = useQuery(api.users.getUser);
  const createGame = useMutation(api.games.createGame);
  const createTrack = useMutation(api.tracks.createTrack);

  const accessToken = useMemo(
    () => userData?.spotifyAccessToken ?? null,
    [userData]
  );
  const refreshToken = useMemo(
    () => userData?.spotifyRefreshToken ?? null,
    [userData]
  );
  const expriedAt = useMemo(
    () => userData?.spotifyExpiresAt ?? null,
    [userData]
  );

  const updateToken = useMutation(api.users.updateSpotifyToken);

  useEffect(() => {
    if (isLoading || userData === undefined) return;

    const refreshAccessToken = async () => {
      try {
        const res = await fetch("/api/refresh-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        const data = await res.json();

        if (!data.access_token) throw new Error("No access token returned");

        await updateToken({
          accessToken: data.access_token,
          refreshToken: data.refresh_token ?? refreshToken,
          expiresIn: data.expires_in,
        });

        router.refresh();
      } catch (err) {
        console.error("Failed to refresh token", err);
        toast.error("Spotify 인증이 만료되었습니다.");
        router.replace("/connect-spotify");
      }
    };

    if (!accessToken || !refreshToken) {
      router.replace("/connect-spotify");
    } else if (expriedAt && expriedAt < Date.now()) {
      refreshAccessToken();
    }
  }, [
    isLoading,
    userData,
    accessToken,
    refreshToken,
    expriedAt,
    updateToken,
    router,
  ]);

  const [lives, setLives] = useState(3);
  const [rounds, setRounds] = useState(5);
  const [activeTerm, setActiveTerm] = useState<"short" | "middle" | "long">(
    "short"
  );

  const { getTopTracks, getRecommendations } = useSpotifyApi();

  const handleMake = useCallback(async (): Promise<void> => {
    if (isLoading || userData === undefined || !accessToken) return;

    setIsCreating(true);

    const termMap: Record<
      "short" | "middle" | "long",
      "short_term" | "medium_term" | "long_term"
    > = {
      short: "short_term",
      middle: "medium_term",
      long: "long_term",
    };

    try {
      if (rounds < 1 || lives < 1) {
        toast.error("Rounds and Lives must be at least 1");
        return;
      }

      const topTracks = await getTopTracks(
        accessToken,
        rounds,
        termMap[activeTerm]
      );
      if (!topTracks || topTracks.length < rounds) {
        throw new Error("Not enough top tracks found.");
      }

      const allTrackObjects: TrackObject[] = [];

      const trackGroups: TrackGroup[] = await Promise.all(
        topTracks.map(async (track: TrackObject): Promise<TrackGroup> => {
          const recs = await getRecommendations(accessToken, {
            seed_tracks: track.trackId,
            limit: 10,
          });

          const fakes = (recs ?? [])
            .filter((r) => r.trackId !== track.trackId)
            .slice(0, 3);

          if (fakes.length < 3) {
            throw new Error("Not enough fake tracks found.");
          }

          const options = [track, ...fakes];
          options.forEach((t) => {
            if (!allTrackObjects.find((obj) => obj.trackId === t.trackId)) {
              allTrackObjects.push(t);
            }
          });

          return {
            options: options.map((t) => t.trackId),
            answer: track.trackId,
          };
        })
      );

      for (const trackObject of allTrackObjects) {
        await createTrack({
          trackObject: {
            ...trackObject,
            preview_url: trackObject.preview_url ?? undefined,
            album: {
              ...trackObject.album,
              images: trackObject.album.images.map((img) => ({
                url: img.url,
                height: img.height ?? undefined,
                width: img.width ?? undefined,
              })),
            },
          },
        });
      }

      const newGameId = await createGame({ trackGroups, lives });
      setGameId(newGameId);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Failed to create game:", err.message);
        toast.error(err.message || "Error creating game. Try again.");
      } else {
        console.error("Unknown error:", err);
        toast.error("Error creating game. Try again.");
      }
    } finally {
      setIsCreating(false);
    }
  }, [
    rounds,
    activeTerm,
    lives,
    getTopTracks,
    getRecommendations,
    createGame,
    createTrack,
    isLoading,
    userData,
    accessToken,
  ]);

  const handleCopyLink = useCallback(() => {
    if (!gameId) return;
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
    if (!gameId) return;
    router.push(`/game/preview/${gameId}`);
  }, [gameId, router]);

  if (isLoading || userData === undefined) {
    return (
      <div className="text-white text-center p-10">
        Loading {isLoading ? "authentication" : "user data"}...
      </div>
    );
  }

  const terms: ("short" | "middle" | "long")[] = ["short", "middle", "long"];

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
              min={1}
            />
          </div>

          <div className="space-y-2">
            <Label>Rounds</Label>
            <Input
              type="number"
              className="bg-black/40 border-white/20 text-white"
              value={rounds}
              onChange={(e) => setRounds(Number(e.target.value))}
              min={1}
            />
          </div>

          <div className="space-y-2">
            <Label>Time Range</Label>
            <div className="flex gap-2 flex-wrap">
              {terms.map((term) => (
                <Button
                  key={term}
                  onClick={() => setActiveTerm(term)}
                  className={`capitalize px-4 py-2 rounded-md text-white transition border min-w-0 ${
                    activeTerm === term
                      ? "bg-black/40 border-white/40 ring-2 ring-white/40"
                      : "bg-black/40 border-white/10 hover:bg-gray-700"
                  }`}
                >
                  {term} Term
                </Button>
              ))}
            </div>
          </div>

          <Button
            className="w-full hover:bg-gray-700 flex justify-center items-center"
            onClick={handleMake}
            disabled={
              isLoading || userData === undefined || !accessToken || isCreating
            }
          >
            {isCreating && (
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            )}
            {isCreating ? "Creating..." : "Create Game"}
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
              value={`${
                typeof window !== "undefined"
                  ? window.location.protocol + "//" + window.location.host
                  : ""
              }/game/${gameId}`}
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
