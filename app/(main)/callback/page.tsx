"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSpotifyAuth } from "@/context/SpotifyAuthContext";

export default function Callback() {
  const searchParams = useSearchParams();
  const { handleCallback, loading } = useSpotifyAuth();

  useEffect(() => {
    if (searchParams.get("code")) {
      handleCallback(searchParams);
    }
  }, [searchParams, handleCallback]);

  return (
    <div className="text-white text-center p-10">
      {loading ? "Authenticating with Spotify..." : "Redirecting..."}
    </div>
  );
}
