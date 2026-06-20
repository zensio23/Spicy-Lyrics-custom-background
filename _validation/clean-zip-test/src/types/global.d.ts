// Global Types
declare global {
  interface SpicyLyricsBuildMetadata {
    LoadedVersion?: string;
    CompatibilityVersion?: string;
    UpstreamBaseVersion?: string;
    customBuild?: boolean;
    disableBlockingUpdateScreen?: boolean;
    preferLocalBuild?: boolean;
    source?: string;
  }

  interface Window {
    _spicy_lyrics_metadata?: SpicyLyricsBuildMetadata;
    _spicy_lyrics?: any;
  }
  const __SLdev__m: boolean;
}


export {};
