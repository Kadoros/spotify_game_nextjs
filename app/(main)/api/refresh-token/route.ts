import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { refreshToken } = await req.json();

  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refreshToken);

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const data = await res.json();

  return NextResponse.json(data);
}
