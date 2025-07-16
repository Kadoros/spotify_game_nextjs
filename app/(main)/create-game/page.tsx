"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";

export default function CreateGamePage() {
  const router = useRouter();

  const userData = useQuery(api.users.getUser);

  const accessToken = useMemo(
    () => userData?.spotifyAccessToken ?? null,
    [userData]
  );
  const refreshToken = useMemo(
    () => userData?.spotifyRefreshToken ?? null,
    [userData]
  );

  // Redirect only after userData has loaded
  useEffect(() => {
    if (userData === undefined) return; // still loading

    if (!accessToken || !refreshToken) {
      router.replace("/connect-spotify");
    }
  }, [accessToken, refreshToken, router, userData]);

  const [lives, setLives] = useState(3);
  const [rounds, setRounds] = useState(5);

  const [shortTermTracks, setShortTermTracks] = useState<string[]>([
    "",
    "",
    "",
    "",
  ]);
  const [middleTermTracks, setMiddleTermTracks] = useState<string[]>([
    "",
    "",
    "",
    "",
  ]);
  const [longTermTracks, setLongTermTracks] = useState<string[]>([
    "",
    "",
    "",
    "",
  ]);
  const [activeTerm, setActiveTerm] = useState<"short" | "middle" | "long">(
    "short"
  );

  const activeTracks =
    activeTerm === "short"
      ? shortTermTracks
      : activeTerm === "middle"
        ? middleTermTracks
        : longTermTracks;

  const updateTrack = useCallback(
    (index: number, value: string) => {
      const update = (tracks: string[]) =>
        tracks.map((track, i) => (i === index ? value : track));

      if (activeTerm === "short") setShortTermTracks(update(shortTermTracks));
      if (activeTerm === "middle")
        setMiddleTermTracks(update(middleTermTracks));
      if (activeTerm === "long") setLongTermTracks(update(longTermTracks));
    },
    [activeTerm, shortTermTracks, middleTermTracks, longTermTracks]
  );

  if (userData === undefined) {
    return (
      <div className="text-white text-center p-10">Loading user data...</div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 shadow-lg text-white space-y-6">
      <h1 className="text-2xl font-bold text-center">Create Your Game</h1>

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

      <Button className="w-full hover:bg-gray-700">Create Game</Button>
    </div>
  );
}
