"use client";

import { useSpotifyAuth } from "@/hooks/useSpotifyAuth";

export default function Callback() {
  const { profile, loading, logout } = useSpotifyAuth();

  if (loading)
    return (
      <p className="p-8 text-center text-gray-400 dark:text-gray-500">
        Loading your profile...
      </p>
    );

  if (!profile) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 text-center border border-red-700 rounded-lg text-red-400 bg-red-900/70">
        <p>Failed to load profile. Please try logging in again.</p>
        <button
          onClick={logout}
          className="mt-4 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-gray-900 text-gray-300 rounded-xl shadow-lg space-y-6">
      <div className="flex flex-col items-center">
        {profile.images?.[0] && (
          <img
            src={profile.images[0].url}
            alt="User Avatar"
            className="w-32 h-32 rounded-full mb-4 shadow-lg"
          />
        )}
        <h1 className="text-3xl font-semibold">{profile.display_name}</h1>
        <p className="text-gray-400 text-sm mt-1">{profile.email}</p>
      </div>

      <ul className="space-y-3 text-sm">
        <li>
          <strong>ID:</strong> {profile.id}
        </li>
        <li>
          <strong>Country:</strong> {profile.country}
        </li>
        <li>
          <strong>Followers:</strong> {profile.followers.total.toLocaleString()}
        </li>
        <li>
          <strong>Product:</strong>{" "}
          <span className="capitalize">{profile.product}</span>
        </li>
        <li>
          <strong>Explicit Content Filter:</strong>{" "}
          {profile.explicit_content.filter_enabled ? "Enabled" : "Disabled"}{" "}
          {profile.explicit_content.filter_locked ? "(Locked)" : ""}
        </li>
        <li>
          <strong>Type:</strong> {profile.type}
        </li>
        <li>
          <strong>Spotify URI:</strong>{" "}
          <a
            href={profile.external_urls.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline"
          >
            {profile.uri}
          </a>
        </li>
        <li>
          <strong>Profile URL:</strong>{" "}
          <a
            href={profile.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline"
          >
            View on Spotify
          </a>
        </li>
      </ul>

      <button
        onClick={logout}
        className="w-full py-3 mt-6 bg-red-700 text-white font-semibold rounded-lg hover:bg-red-800 transition"
      >
        Logout
      </button>
    </div>
  );
}
