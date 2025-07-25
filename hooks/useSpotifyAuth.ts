import { useEffect, useState, useCallback } from "react";
import { generateCodeVerifier, generateCodeChallenge } from "@/lib/spotify";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/types";


export function useSpotifyAuth() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

    const fetchProfile = useCallback(async (accessToken: string) => {
    const profileRes = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      throw new Error(await profileRes.text());
    }
    

    const profileData: UserProfile = await profileRes.json();
    setProfile(profileData);
    console.log(profile);

    return profileData;
  }, []);

  useEffect(() => {
  const token = localStorage.getItem("access_token");

  if (token) {
    setIsSignedIn(true);

    // fetch profile again on mount
    fetchProfile(token).catch((e) => {
      console.error("Failed to load profile:", e);
      setIsSignedIn(false);
      setProfile(null);
      localStorage.removeItem("access_token");
    });
  } else {
    setIsSignedIn(false);
    setProfile(null);
  }
}, [fetchProfile]);


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
      scope: "user-read-email user-read-private",
      code_challenge_method: "S256",
      code_challenge: challenge,
    });

    router.push(`https://accounts.spotify.com/authorize?${params.toString()}`);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("verifier");
    setIsSignedIn(false);
    setProfile(null);
    router.push("/");
  };

  const getToken = useCallback(async (code: string, verifier: string) => {
    const body = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
      code_verifier: verifier,
    });

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!tokenRes.ok) {
      throw new Error(await tokenRes.text());
    }

    const tokenData = await tokenRes.json();
    localStorage.setItem("access_token", tokenData.access_token);
    setIsSignedIn(true);
    return tokenData.access_token;
  }, []);



  // You can remove getProfile or keep if you want to fetch profile by URL params later
  

  const handleCallback = useCallback(
    async (urlSearchParams: URLSearchParams) => {
      setLoading(true);
      setError(null);
      try {
        const code = urlSearchParams.get("code");
        const verifier = localStorage.getItem("verifier");

        if (!code || !verifier) {
          setError("Missing code or verifier");
          return;
        }

        const accessToken = await getToken(code, verifier);
        const profile = await fetchProfile(accessToken);
        setProfile(profile);
        router.push("/");
      } catch (error: any) {
        console.error("Error in handleCallback:", error);
        setError(error.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [getToken, fetchProfile, router]
  );

  return {
    isSignedIn,
    profile,
    loading,
    error,
    login,
    logout,
    handleCallback,
    getToken
  };
}
