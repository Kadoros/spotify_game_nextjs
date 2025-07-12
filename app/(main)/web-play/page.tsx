"use client";
import React, { useState, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";

function SpotifyWebPlayer() {
  const [player, setPlayer] = useState(null);
  const [is_paused, setPaused] = useState(false);
  const [is_active, setActive] = useState(false);
  const [current_track, setTrack] = useState({
    name: "",
    album: {
      images: [{ url: "" }],
    },
    artists: [{ name: "" }],
  });
  const [token, setToken] = useState("");
  const [deviceId, setDeviceId] = useState("");

  useEffect(() => {
    // Get access token from localStorage
    const token = localStorage.getItem("access_token");
    if (token) {
      setToken(token);
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: "Next.js Web Playback SDK",
        getOAuthToken: (cb) => {
          cb(token);
        },
        volume: 0.5,
      });

      setPlayer(player);

      player.addListener("ready", ({ device_id }) => {
        console.log("Ready with Device ID", device_id);
        setDeviceId(device_id);
      });

      player.addListener("not_ready", ({ device_id }) => {
        console.log("Device ID has gone offline", device_id);
      });

      player.addListener("player_state_changed", (state) => {
        if (!state) {
          return;
        }

        setTrack(state.track_window.current_track);
        setPaused(state.paused);

        player.getCurrentState().then((state) => {
          !state ? setActive(false) : setActive(true);
        });
      });

      player.connect();
    };

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [token]);

  const handlePlayPause = () => {
    if (player) {
      player.togglePlay();
    }
  };

  const handleNext = () => {
    if (player) {
      player.nextTrack();
    }
  };

  const handlePrevious = () => {
    if (player) {
      player.previousTrack();
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-white text-2xl mb-4">No Access Token Found</h2>
          <p className="text-gray-400">
            Please make sure you have 'access_token' in localStorage
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-green-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Next.js Spotify Player
            </h1>
            <p className="text-gray-300">
              {is_active ? "Connected and ready to play" : "Connecting..."}
            </p>
          </div>

          {/* Main Player Card */}
          <div className="bg-black/50 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-gray-800">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Album Art */}
              <div className="flex-shrink-0">
                <div className="w-80 h-80 rounded-2xl overflow-hidden shadow-2xl">
                  {current_track.album.images[0]?.url ? (
                    <img
                      src={current_track.album.images[0].url}
                      alt={current_track.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <Volume2 size={80} className="text-gray-600" />
                    </div>
                  )}
                </div>
              </div>

              {/* Track Info and Controls */}
              <div className="flex-1 text-center lg:text-left">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {current_track.name || "No track playing"}
                  </h2>
                  <p className="text-xl text-gray-300">
                    {current_track.artists[0]?.name || "Unknown artist"}
                  </p>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-center lg:justify-start gap-4 mb-6">
                  <button
                    onClick={handlePrevious}
                    className="w-14 h-14 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white transition-colors"
                    disabled={!is_active}
                  >
                    <SkipBack size={24} />
                  </button>

                  <button
                    onClick={handlePlayPause}
                    className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center text-black transition-colors disabled:bg-gray-600"
                    disabled={!is_active}
                  >
                    {is_paused ? <Play size={28} /> : <Pause size={28} />}
                  </button>

                  <button
                    onClick={handleNext}
                    className="w-14 h-14 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white transition-colors"
                    disabled={!is_active}
                  >
                    <SkipForward size={24} />
                  </button>
                </div>

                {/* Status */}
                <div className="text-sm text-gray-400">
                  {!is_active && (
                    <p>
                      Transfer playback to this device using Spotify Connect
                    </p>
                  )}
                  {is_active && <p>Playing on Next.js Web Player</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Device Info */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 bg-black/30 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-300">
                Device ID: {deviceId || "Connecting..."}
              </span>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-black/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              How to use:
            </h3>
            <ol className="text-gray-300 space-y-2">
              <li>1. Make sure you have a Spotify Premium account</li>
              <li>2. Open Spotify on another device (phone, desktop, etc.)</li>
              <li>3. Start playing a song</li>
              <li>4. Click the Spotify Connect button (devices icon)</li>
              <li>
                5. Select "Next.js Web Playback SDK" to transfer playback here
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SpotifyWebPlayer;
