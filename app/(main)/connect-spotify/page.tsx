"use client";
import { useSpotifyAuth } from "@/context/SpotifyAuthContext";

export default function ConnectSpotifyPage() {
  const { login } = useSpotifyAuth();
  return (
    <div className="h-full flex items-center justify-center text-white">
      <div className="bg-white/5 border border-white/10 p-6 rounded-2xl max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Spotify Connection Required</h1>
        <p className="mb-4">
          To create a game, you need to connect your Spotify account.
        </p>
        <a href="/api/spotify/login">
          <button
            className="px-4 py-2 bg-green-500 rounded-md text-white font-medium hover:bg-green-600"
            onClick={login}
          >
            Connect to Spotify
          </button>
        </a>
      </div>
    </div>
  );
}
