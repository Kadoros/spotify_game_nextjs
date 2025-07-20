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

export interface TrackObject {
  album: {
    album_type: string;
    total_tracks: number;
    available_markets: string[];
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    images: { url: string; height: number | null; width: number | null }[];
    name: string;
    release_date: string;
    release_date_precision: string;
    type: string;
    uri: string;
  };

  artists: {
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    name: string;
    type: string;
    uri: string;
  }[];

  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: {
    isrc?: string;
    ean?: string;
    upc?: string;
    [key: string]: string | undefined;
  };
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  is_playable: boolean;
  linked_from?: {
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    type: string;
    uri: string;
  };
  restrictions?: {
    reason: string;
  };
  name: string;
  popularity: number;
  preview_url: string | null;
  track_number: number;
  type: "track";
  uri: string;
  is_local: boolean;
}

export interface TrackGroup {
  options: string[];
  answer: string;
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
