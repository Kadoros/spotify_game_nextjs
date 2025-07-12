declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: typeof Spotify;
  }

  interface Spotify {
    Player: new (options: {
      name: string;
      getOAuthToken: (cb: (token: string) => void) => void;
      volume?: number;
    }) => SpotifyPlayer;
  }

  interface SpotifyPlayer {
    connect: () => boolean;
    disconnect: () => void;
    addListener: (
      event: string,
      cb: (...args: any[]) => void
    ) => boolean;
  }
}
