import type { KawarpOptions } from "@kawarp/core";
import { $staticBackgroundMode } from "../../utils/stores.ts";
import Global from "../Global/Global.ts";
import { SpotifyPlayer } from "../Global/SpotifyPlayer.ts";
import ArtistVisuals from "./ArtistVisuals/Main.ts";
import { PageContainer } from "../Pages/PageView.ts";
import { AliveArtworkBackground } from "./AliveArtworkBackground.ts";
import { BackgroundAnimationController } from "./BackgroundAnimationController.ts";
import { BackgroundAudioEngine, DEFAULT_SNAPSHOT } from "./BackgroundAudioEngine.ts";
import type { AudioAnalysisData, BackgroundAudioSnapshot } from "./types.ts";
import { getDynamicAudioAnalysis } from "../../utils/audioAnalysis.ts";
import Logger from "../../utils/Logger.ts";

const dynamicBgLogger = new Logger("Dynamic Background");

const KawarpTransitionDuration = 1000;
export const KawarpOptionsStatic: KawarpOptions = {
  warpIntensity: 1,
  blurPasses: 8,
  animationSpeed: 0.1,
  saturation: 1.5,
  dithering: 0.008,
  transitionDuration: 500,
  tintIntensity: 0,
  scale: 1,
};

const COLOR_BG_FALLBACK_RGB = "18, 18, 18, 1";
const dynamicBackgrounds = new Map<HTMLElement | string, AliveArtworkBackground>();
const audioEngine = new BackgroundAudioEngine();
const animationController = new BackgroundAnimationController();

let cachedColorBackgroundEl: HTMLElement | null = null;
let renderHandle: number | null = null;

interface ApplyDynamicBackgroundOpts {
  doTransitionDurationAppendWithPromise?: boolean;
}

function startRenderLoop() {
  if (renderHandle !== null) return;

  const renderFrame = (now: number) => {
    renderHandle = null;
    let shouldContinue = false;

    dynamicBackgrounds.forEach((background, key) => {
      const alive = background.render(now);
      if (!alive) {
        background.dispose();
        dynamicBackgrounds.delete(key);
        return;
      }
      shouldContinue = true;
    });

    if (shouldContinue) {
      renderHandle = requestAnimationFrame(renderFrame);
    }
  };

  renderHandle = requestAnimationFrame(renderFrame);
}

function stopRenderLoopIfIdle() {
  if (dynamicBackgrounds.size > 0) return;
  if (renderHandle !== null) {
    cancelAnimationFrame(renderHandle);
    renderHandle = null;
  }
  audioEngine.dispose();
}

function removeDynamicNodes(host: HTMLElement) {
  host
    .querySelectorAll<HTMLElement>(".spicy-dynamic-bg-shell")
    .forEach((element) => element.remove());
  host.querySelectorAll<HTMLElement>(".spicy-dynamic-bg").forEach((element) => {
    if (
      element.classList.contains("StaticBackground") ||
      element.classList.contains("ColorBackground")
    )
      return;
    element.remove();
  });
}

function removeStaticNodes(host: HTMLElement) {
  host
    .querySelectorAll<HTMLElement>(
      ".spicy-dynamic-bg.StaticBackground, .spicy-dynamic-bg.ColorBackground"
    )
    .forEach((element) => {
      element.remove();
    });
}

export function disposeDynamicBackground(target: HTMLElement | string) {
  const background = dynamicBackgrounds.get(target);
  if (!background) return;
  background.dispose();
  dynamicBackgrounds.delete(target);
  stopRenderLoopIfIdle();
}

export function disposeDynamicBackgroundsIn(host: HTMLElement) {
  for (const [key, background] of dynamicBackgrounds.entries()) {
    if (background.host === host) {
      background.dispose();
      dynamicBackgrounds.delete(key);
    }
  }
  stopRenderLoopIfIdle();
}

export default async function ApplyDynamicBackground(
  element: HTMLElement,
  tag?: string,
  opts: ApplyDynamicBackgroundOpts = {}
) {
  if (!element) return;

  dynamicBgLogger.debug("Applying dynamic background", { tag });
  const preCurrentImgCover = SpotifyPlayer.GetCover("large") ?? "";
  const currentImgCover = preCurrentImgCover?.replace("spotify:image:", "https://i.scdn.co/image/");
  const isEpisode = SpotifyPlayer.GetContentType() === "episode";
  const backgroundKey = tag ?? element;

  const artists = SpotifyPlayer.GetArtists() ?? [];
  const trackArtist =
    artists.length > 0 && artists[0]?.uri
      ? artists[0].uri.replace("spotify:artist:", "")
      : undefined;

  const trackId = SpotifyPlayer.GetId() ?? undefined;
  const staticBgMode = $staticBackgroundMode.get();

  if (staticBgMode !== "off") {
    disposeDynamicBackground(backgroundKey);
    removeDynamicNodes(element);

    if (staticBgMode === "color") {
      let dynamicBg = element.querySelector<HTMLElement>(".spicy-dynamic-bg.ColorBackground");
      if (!dynamicBg) {
        dynamicBg = document.createElement("div");
        dynamicBg.classList.add("spicy-dynamic-bg", "ColorBackground");
        dynamicBg.style.setProperty("--MinContrastColor", COLOR_BG_FALLBACK_RGB);
        dynamicBg.style.setProperty("--HighContrastColor", COLOR_BG_FALLBACK_RGB);
        dynamicBg.style.setProperty("--OverlayColor", COLOR_BG_FALLBACK_RGB);
        element.appendChild(dynamicBg);
      }
      cachedColorBackgroundEl = dynamicBg;

      try {
        const colorQuery = await Spicetify.GraphQL.Request(
          Spicetify.GraphQL.Definitions.getDynamicColorsByUris,
          {
            imageUris: [SpotifyPlayer.GetCover("large") ?? ""],
          }
        );

        const colorResponse = colorQuery.data.dynamicColors[0];
        const colorBestFit =
          colorResponse.bestFit === "DARK"
            ? "dark"
            : colorResponse.bestFit === "LIGHT"
              ? "light"
              : "dark";

        const colors = colorResponse[colorBestFit];
        const fromColorObj = colors.minContrast;
        const toColorObj = colors.highContrast;
        const overlayColorObj = colors.higherContrast;

        const fromColorBgObj = fromColorObj.backgroundBase;
        const toColorBgObj = toColorObj.backgroundBase;
        const overlayColorBgObj = overlayColorObj.backgroundBase;

        const fromColor = `${fromColorBgObj.red}, ${fromColorBgObj.green}, ${fromColorBgObj.blue}, ${fromColorBgObj.alpha}`;
        const toColor = `${toColorBgObj.red}, ${toColorBgObj.green}, ${toColorBgObj.blue}, ${toColorBgObj.alpha}`;
        const overlayColor = `${overlayColorBgObj.red}, ${overlayColorBgObj.green}, ${overlayColorBgObj.blue}, ${overlayColorBgObj.alpha}`;

        dynamicBg.style.setProperty("--MinContrastColor", fromColor);
        dynamicBg.style.setProperty("--HighContrastColor", toColor);
        dynamicBg.style.setProperty("--OverlayColor", overlayColor);
      } catch (error) {
        dynamicBgLogger.error(
          "Failed to fetch dynamic colors, using fallback black background",
          error
        );
      }
      return;
    }

    const staticBackgroundUrl = await GetStaticBackground(trackArtist, trackId);
    if (isEpisode || !staticBackgroundUrl) return;

    const prevBg = element.querySelector<HTMLElement>(".spicy-dynamic-bg.StaticBackground");
    if (prevBg && prevBg.getAttribute("data-cover-id") === staticBackgroundUrl) {
      return;
    }

    const dynamicBg = document.createElement("div");
    dynamicBg.classList.add("spicy-dynamic-bg", "StaticBackground", "Hidden");
    dynamicBg.style.backgroundImage = `url("${staticBackgroundUrl}")`;
    dynamicBg.setAttribute("data-cover-id", staticBackgroundUrl);
    element.appendChild(dynamicBg);

    setTimeout(() => {
      if (prevBg) {
        prevBg.classList.add("Hidden");
        setTimeout(() => prevBg.remove(), 500);
      }
      dynamicBg.classList.remove("Hidden");
    }, 80);
    return;
  }

  removeStaticNodes(element);

  let background = dynamicBackgrounds.get(backgroundKey);
  if (!background || background.host !== element) {
    disposeDynamicBackground(backgroundKey);
    removeDynamicNodes(element);
    background = new AliveArtworkBackground({
      host: element,
      key: backgroundKey,
      readAudioSnapshot: getBackgroundAudioSnapshot,
      kawarpOptions: KawarpOptionsStatic,
    });
    dynamicBackgrounds.set(backgroundKey, background);
  }

  await background.loadCover(currentImgCover);
  startRenderLoop();

  const msDelay = KawarpOptionsStatic.transitionDuration * 2;
  if (opts.doTransitionDurationAppendWithPromise) {
    await new Promise((resolve) => setTimeout(resolve, msDelay));
    await background.setTransitionDuration(KawarpTransitionDuration);
  } else {
    setTimeout(() => {
      void background.setTransitionDuration(KawarpTransitionDuration);
    }, msDelay);
  }
}

export async function GetStaticBackground(
  trackArtist: string | undefined,
  trackId: string | undefined
): Promise<string | undefined> {
  if (!trackArtist || !trackId) return undefined;

  try {
    return await ArtistVisuals.ApplyContent(trackArtist, trackId);
  } catch (error) {
    dynamicBgLogger.error("Error setting static low quality dynamic background", error);
    return undefined;
  }
}

let staticColorBgTransitionTimeout: ReturnType<typeof setTimeout> | null = null;

const getColorBackgroundElement = (): HTMLElement | null => {
  if (cachedColorBackgroundEl?.isConnected) {
    return cachedColorBackgroundEl;
  }
  const element =
    PageContainer?.querySelector<HTMLElement>(".spicy-dynamic-bg.ColorBackground") ?? null;
  cachedColorBackgroundEl = element;
  return element;
};

Global.Event.listen("playback:songchange", () => {
  if ($staticBackgroundMode.get() === "color" && PageContainer) {
    if (staticColorBgTransitionTimeout) {
      clearTimeout(staticColorBgTransitionTimeout);
      staticColorBgTransitionTimeout = null;

      const dynamicBg = getColorBackgroundElement();
      if (dynamicBg) {
        const min = dynamicBg.style.getPropertyValue("--MinContrastColor").trim();
        const high = dynamicBg.style.getPropertyValue("--HighContrastColor").trim();
        const overlay = dynamicBg.style.getPropertyValue("--OverlayColor").trim();
        if (
          min !== COLOR_BG_FALLBACK_RGB ||
          high !== COLOR_BG_FALLBACK_RGB ||
          overlay !== COLOR_BG_FALLBACK_RGB
        ) {
          dynamicBg.style.setProperty("--MinContrastColor", COLOR_BG_FALLBACK_RGB);
          dynamicBg.style.setProperty("--HighContrastColor", COLOR_BG_FALLBACK_RGB);
          dynamicBg.style.setProperty("--OverlayColor", COLOR_BG_FALLBACK_RGB);
        }
      }
    }

    staticColorBgTransitionTimeout = setTimeout(() => {
      const contentBox = PageContainer.querySelector<HTMLElement>(".ContentBox");
      if (contentBox) {
        void ApplyDynamicBackground(contentBox);
      }

      if (staticColorBgTransitionTimeout) {
        clearTimeout(staticColorBgTransitionTimeout);
        staticColorBgTransitionTimeout = null;
      }
    }, 1000);
  }
});

const audioAnalysisCache = new Map<string, AudioAnalysisData | null>();
const audioAnalysisInflightRequests = new Map<string, Promise<AudioAnalysisData | null>>();
let latestPlaybackTrackId: string | null = null;

const pruneAudioAnalysisCache = (activeTrackId: string) => {
  for (const cachedTrackId of audioAnalysisCache.keys()) {
    if (cachedTrackId !== activeTrackId) {
      audioAnalysisCache.delete(cachedTrackId);
    }
  }
};

const fetchAudioAnalysisForTrack = async (trackId: string): Promise<AudioAnalysisData | null> => {
  if (audioAnalysisCache.has(trackId)) {
    return audioAnalysisCache.get(trackId) ?? null;
  }

  const inflight = audioAnalysisInflightRequests.get(trackId);
  if (inflight) {
    return inflight;
  }

  const request = getDynamicAudioAnalysis(trackId)
    .then((analysis) => {
      audioAnalysisCache.set(trackId, analysis);
      return analysis;
    })
    .finally(() => {
      audioAnalysisInflightRequests.delete(trackId);
    });

  audioAnalysisInflightRequests.set(trackId, request);
  return request;
};

const queueAudioAnalysisPrefetch = (trackId: string | null | undefined) => {
  if (!trackId || audioAnalysisCache.has(trackId) || audioAnalysisInflightRequests.has(trackId)) {
    return;
  }

  void fetchAudioAnalysisForTrack(trackId).catch((error) => {
    dynamicBgLogger.warn("Failed to prefetch audio analysis", error);
  });
};

function getBackgroundAudioSnapshot(): BackgroundAudioSnapshot {
  const trackId = SpotifyPlayer.GetId() ?? null;
  if (trackId) {
    latestPlaybackTrackId = trackId;
    pruneAudioAnalysisCache(trackId);
    queueAudioAnalysisPrefetch(trackId);
  }

  const analysis = trackId ? (audioAnalysisCache.get(trackId) ?? null) : null;
  const isPlaying = Spicetify.Player.isPlaying();
  const currentTimeMs = SpotifyPlayer.GetPosition();
  const baseAnimationSpeed = getBaseAnimationSpeed(trackId, currentTimeMs, analysis, isPlaying);

  try {
    return {
      ...audioEngine.getSnapshot(trackId, currentTimeMs, analysis, isPlaying),
      baseAnimationSpeed,
    };
  } catch (error) {
    dynamicBgLogger.warn("Background audio snapshot failed", error);
    return {
      ...DEFAULT_SNAPSHOT,
      baseAnimationSpeed,
      isPlaying,
    };
  }
}

function getBaseAnimationSpeed(
  trackId: string | null,
  currentTimeMs: number,
  analysis: AudioAnalysisData | null,
  isPlaying: boolean
): number {
  if (!isPlaying) {
    return 0.1;
  }

  if (!trackId || !analysis) {
    return 1;
  }

  try {
    return animationController.getSpeedMultiplier(currentTimeMs / 1000, analysis);
  } catch (error) {
    dynamicBgLogger.warn("Background animation speed fallback triggered", error);
    return 1;
  }
}

Global.Event.listen("playback:songchange", () => {
  latestPlaybackTrackId = SpotifyPlayer.GetId() ?? null;

  if (latestPlaybackTrackId) {
    pruneAudioAnalysisCache(latestPlaybackTrackId);
    queueAudioAnalysisPrefetch(latestPlaybackTrackId);
  } else {
    audioAnalysisCache.clear();
  }
});

Global.Event.listen("playback:progress", () => {
  const trackId = SpotifyPlayer.GetId();
  if (trackId) {
    queueAudioAnalysisPrefetch(trackId);
  }
});

const reapplyPageBackground = () => {
  const contentBox = PageContainer?.querySelector<HTMLElement>(".ContentBox");
  if (!contentBox) return;

  disposeDynamicBackground("lpagebg");
  removeDynamicNodes(contentBox);
  removeStaticNodes(contentBox);
  void ApplyDynamicBackground(contentBox, "lpagebg");
};

$staticBackgroundMode.listen(reapplyPageBackground);
