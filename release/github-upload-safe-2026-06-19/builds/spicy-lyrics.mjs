window._spicy_lyrics_metadata = {
  ...window._spicy_lyrics_metadata,
  customBuild: true,
  disableBlockingUpdateScreen: true,
  preferLocalBuild: true,
  source: "local-mjs-bridge",
};

import("./spicy-lyrics.js").catch((error) => {
  console.error("[Spicy Lyrics] [Local Bridge] Failed to load local spicy-lyrics.js", error);
});
