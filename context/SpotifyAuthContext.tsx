"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { generateCodeVerifier, generateCodeChallenge } from "@/lib/spotify";
import { UserProfile } from "@/types";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface SpotifyAuthContextType {
  isSignedIn: boolean;
  profile: UserProfile | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
  handleCallback: (params: URLSearchParams) => Promise<void>;
}

const SpotifyAuthContext = createContext<SpotifyAuthContextType | null>(null);

export const SpotifyAuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProfile = async (accessToken: string) => {
    const res = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) throw new Error("Failed to fetch profile");

    const data = await res.json();
    setProfile(data);
    setIsSignedIn(true);
    return data;
  };

  const updateSpotifyToken = useMutation(api.users.updateSpotifyToken);

  const handleCallback = useCallback(
    async (params: URLSearchParams) => {
      // Wait for Convex authentication to complete before processing callback
      if (isLoading) return;

      setLoading(true);
      try {
        const code = params.get("code");
        const verifier = localStorage.getItem("verifier");
        if (!code || !verifier) throw new Error("Missing code or verifier");

        // Request token from Spotify
        const body = new URLSearchParams({
          client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
          grant_type: "authorization_code",
          code,
          redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
          code_verifier: verifier,
        });

        const res = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });

        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error_description || "Failed to get token");

        // Save tokens in localStorage as before
        localStorage.setItem("access_token", data.access_token);

        // Only update tokens in Convex if user is authenticated
        if (isAuthenticated) {
          await updateSpotifyToken({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
          });
        }

        // Fetch and set profile
        await fetchProfile(data.access_token);

        router.push("/");
      } catch (err) {
        console.error(err);
        setIsSignedIn(false);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    },
    [updateSpotifyToken, router, isLoading, isAuthenticated]
  );

  const login = async () => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI!;
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);
    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: [
        "user-read-email",
        "user-read-private",
        "user-top-read",
        "streaming",
        "user-read-playback-state",
        "user-modify-playback-state",
        "app-remote-control",
      ].join(" "),
      code_challenge_method: "S256",
      code_challenge: challenge,
    });

    router.push(`https://accounts.spotify.com/authorize?${params.toString()}`);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setIsSignedIn(false);
    setProfile(null);
    router.push("/");
  };

  useEffect(() => {
    // Wait for Convex authentication to complete before checking Spotify tokens
    if (isLoading) {
      // While Convex is loading, show loading state
      setLoading(true);
      return;
    }

    // Once Convex loading is complete, check for Spotify token
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetchProfile(token)
      .catch(() => {
        setIsSignedIn(false);
        setProfile(null);
        localStorage.removeItem("access_token");
      })
      .finally(() => setLoading(false));
  }, [isLoading]); // Add isLoading as dependency

  // Show loading while either Convex or Spotify auth is loading
  const combinedLoading = isLoading || loading;

  return (
    <SpotifyAuthContext.Provider
      value={{
        isSignedIn,
        profile,
        loading: combinedLoading,
        login,
        logout,
        handleCallback,
      }}
    >
      {children}
    </SpotifyAuthContext.Provider>
  );
};

export const useSpotifyAuth = () => {
  const context = useContext(SpotifyAuthContext);
  if (!context)
    throw new Error("useSpotifyAuth must be used inside SpotifyAuthProvider");
  return context;
};
