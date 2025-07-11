"use client";

import { useEffect } from "react";
import { useSpotifyAuth } from "@/hooks/useSpotifyAuth";

export default function Callback() {
  const { handleCallback, loading, profile } = useSpotifyAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    handleCallback(params);
  }, [handleCallback]);

  if (loading) return <p>Loading...</p>;

  return <div>Welcome, {profile?.display_name || "user"}</div>;
}
