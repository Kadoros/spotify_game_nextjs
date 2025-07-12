// types/index.ts

export interface Image {
  url: string;
  height: number;
  width: number;
}

export interface UserProfile {
  country: string;
  display_name: string;
  email: string;
  explicit_content: {
    filter_enabled: boolean;
    filter_locked: boolean;
  };
  external_urls: { spotify: string };
  followers: { href: string | null; total: number };
  href: string;
  id: string;
  images: Image[];
  product: string;
  type: string;
  uri: string;
}

// Global augmentation for Spotify Web Playback SDK
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: SpotifyNamespace;
  }
  interface Spotify{
    
  }

  interface SpotifyNamespace {
    Player: new (options: {
      name: string;
      getOAuthToken: (cb: (token: string) => void) => void;
      volume?: number;
    }) => SpotifyPlayer;
  }

  interface SpotifyPlayer {
    connect: () => boolean | Promise<boolean>;
    disconnect: () => void;
    addListener: (
      event: string,
      cb: (...args: any[]) => void
    ) => boolean;
    removeListener: (event: string) => void;
  }
}

export {};
