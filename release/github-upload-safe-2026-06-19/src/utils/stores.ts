import { atom } from "nanostores";
import { ProjectDisplayVersion } from "../../project/config.ts";

export const SETTINGS_KEY = "SL:settings";
const VISUALIZER_SETTINGS_SCHEMA_VERSION = 4;

const VISUALIZER_SETTING_DEFAULTS = {
  starsEnabled: false,
  starShape: "mixed",
  starAmount: 48,
  starSize: 42,
  starBrightness: 48,
  starTwinkleSpeed: 44,
  starVocalSensitivity: 74,
  starBeatSensitivity: 16,
  backgroundBeatGlowStrength: 0,
  backgroundBeatBrightness: 0,
  backgroundDropImpact: 0,
  backgroundMovementSpeed: 0,
  beatdropSpeedMultiplier: 0,
  perColorReactivity: 0,
  calmSectionIntensity: 0,
  loudSectionIntensity: 0,
  globalGlowLimit: 0,
  absoluteLoudnessScaling: 0,
  backgroundResponse: 0,
  performanceMode: "high",
  backgroundFpsLimit: 100,
  visualizerPreset: "vanilla",
  activeCustomVisualizerPresetId: "",
  customVisualizerPresets: [],
  visualizerLanguage: "english",
} as const;

const SIGNED_VISUALIZER_KEYS = [
  "backgroundBeatGlowStrength",
  "backgroundBeatBrightness",
  "backgroundDropImpact",
  "backgroundMovementSpeed",
  "beatdropSpeedMultiplier",
  "perColorReactivity",
  "calmSectionIntensity",
  "loudSectionIntensity",
  "globalGlowLimit",
  "absoluteLoudnessScaling",
  "backgroundResponse",
] as const;

const PERCENT_VISUALIZER_KEYS = [
  "starAmount",
  "starSize",
  "starBrightness",
  "starTwinkleSpeed",
  "starVocalSensitivity",
  "starBeatSensitivity",
] as const;

const VALID_PERFORMANCE_MODES = new Set(["low", "medium", "high"]);
const VALID_VISUALIZER_LANGUAGES = new Set(["english", "german"]);
const VALID_VISUALIZER_PRESETS = new Set([
  "custom",
  "vanilla",
  "smooth",
  "cinematic",
  "energetic",
  "insane",
  "eventually",
  "strokesSnowStrippers",
]);
const VALID_STAR_SHAPES = new Set(["mixed", "softDot", "realStar", "sparkleStar", "crossStar"]);
const VALID_STATIC_BACKGROUND_MODES = new Set(["off", "auto", "artistHeader", "coverArt", "color"]);

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, Math.round(numeric)));
}

function sanitizeVisualizerSettings(blob: Record<string, any>): boolean {
  let changed = false;

  for (const key of SIGNED_VISUALIZER_KEYS) {
    const defaultValue = VISUALIZER_SETTING_DEFAULTS[key];
    const nextValue = clampNumber(blob[key], -100, 300, defaultValue);
    if (blob[key] !== nextValue) {
      blob[key] = nextValue;
      changed = true;
    }
  }

  for (const key of PERCENT_VISUALIZER_KEYS) {
    const defaultValue = VISUALIZER_SETTING_DEFAULTS[key];
    const nextValue = clampNumber(blob[key], 0, 100, defaultValue);
    if (blob[key] !== nextValue) {
      blob[key] = nextValue;
      changed = true;
    }
  }

  const fpsLimit = clampNumber(
    blob["backgroundFpsLimit"],
    24,
    120,
    VISUALIZER_SETTING_DEFAULTS.backgroundFpsLimit
  );
  if (blob["backgroundFpsLimit"] !== fpsLimit) {
    blob["backgroundFpsLimit"] = fpsLimit;
    changed = true;
  }

  if (typeof blob["starsEnabled"] !== "boolean") {
    blob["starsEnabled"] = VISUALIZER_SETTING_DEFAULTS.starsEnabled;
    changed = true;
  }

  if (
    typeof blob["showNpvDynamicBg"] !== "boolean" &&
    blob["showNpvDynamicBg"] !== undefined
  ) {
    blob["showNpvDynamicBg"] = true;
    changed = true;
  }

  if (!VALID_PERFORMANCE_MODES.has(blob["performanceMode"])) {
    blob["performanceMode"] = VISUALIZER_SETTING_DEFAULTS.performanceMode;
    changed = true;
  }

  if (!VALID_VISUALIZER_LANGUAGES.has(blob["visualizerLanguage"])) {
    blob["visualizerLanguage"] = VISUALIZER_SETTING_DEFAULTS.visualizerLanguage;
    changed = true;
  }

  if (!VALID_VISUALIZER_PRESETS.has(blob["visualizerPreset"])) {
    blob["visualizerPreset"] = VISUALIZER_SETTING_DEFAULTS.visualizerPreset;
    changed = true;
  }

  if (typeof blob["activeCustomVisualizerPresetId"] !== "string") {
    blob["activeCustomVisualizerPresetId"] =
      VISUALIZER_SETTING_DEFAULTS.activeCustomVisualizerPresetId;
    changed = true;
  }

  if (!Array.isArray(blob["customVisualizerPresets"])) {
    blob["customVisualizerPresets"] = VISUALIZER_SETTING_DEFAULTS.customVisualizerPresets;
    changed = true;
  }

  if (!VALID_STAR_SHAPES.has(blob["starShape"])) {
    blob["starShape"] = VISUALIZER_SETTING_DEFAULTS.starShape;
    changed = true;
  }

  if (
    blob["staticBackgroundMode"] !== undefined &&
    !VALID_STATIC_BACKGROUND_MODES.has(blob["staticBackgroundMode"])
  ) {
    blob["staticBackgroundMode"] = "off";
    changed = true;
  }

  return changed;
}

function readSettingsBlob(): Record<string, any> {
  const raw = Spicetify.LocalStorage.get(SETTINGS_KEY);
  if (raw === null || raw === undefined) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveSettingsBlob(obj: Record<string, any>) {
  Spicetify.LocalStorage.set(SETTINGS_KEY, JSON.stringify(obj));
}

function fillMissingSettingsDefaults(blob: Record<string, any>) {
  let changed = false;
  for (const [key, defaultValue] of Object.entries(VISUALIZER_SETTING_DEFAULTS)) {
    if (blob[key] !== undefined) continue;
    blob[key] = defaultValue;
    changed = true;
  }
  return changed;
}

function migrateSettingsKeys(blob: Record<string, any>): Record<string, any> {
  const renames: Record<string, string> = {
    "skip-spicy-font": "skipSpicyFont",
    show_npv_dynamic_bg: "showNpvDynamicBg",
    musicBrightnessReactivity: "backgroundBeatBrightness",
    impactStrength: "backgroundDropImpact",
  };
  let changed = false;
  for (const [oldKey, newKey] of Object.entries(renames)) {
    if (oldKey in blob) {
      if (!(newKey in blob)) {
        blob[newKey] = blob[oldKey];
      }
      delete blob[oldKey];
      changed = true;
    }
  }

  if (typeof blob["performanceMode"] === "boolean") {
    blob["performanceMode"] = blob["performanceMode"] ? "medium" : "high";
    changed = true;
  }

  if (
    blob["backgroundBeatGlowStrength"] === undefined &&
    typeof blob["perColorReactivity"] === "number"
  ) {
    blob["backgroundBeatGlowStrength"] = blob["perColorReactivity"];
    changed = true;
  }

  changed = fillMissingSettingsDefaults(blob) || changed;
  changed = sanitizeVisualizerSettings(blob) || changed;

  if ((blob["visualizerSettingsSchemaVersion"] ?? 0) < VISUALIZER_SETTINGS_SCHEMA_VERSION) {
    blob["visualizerSettingsSchemaVersion"] = VISUALIZER_SETTINGS_SCHEMA_VERSION;
    changed = true;
  }

  if (changed) saveSettingsBlob(blob);
  return blob;
}

const _settings: Record<string, any> = migrateSettingsKeys(readSettingsBlob());

function persistAtom<T>(key: string, defaultValue: T) {
  const store = atom<T>(_settings[key] !== undefined ? _settings[key] : defaultValue);
  store.listen((v) => {
    _settings[key] = v;
    saveSettingsBlob(_settings);
  });
  return store;
}

// Setting atoms (persisted)
export const $staticBackgroundMode = persistAtom<string>("staticBackgroundMode", "off");
export const $simpleLyricsMode = persistAtom<boolean>("simpleLyricsMode", false);
export const $simpleLyricsModeRenderingType = persistAtom<string>(
  "simpleLyricsModeRenderingType",
  "calculate"
);
export const $minimalLyricsMode = persistAtom<boolean>("minimalLyricsMode", false);
export const $skipSpicyFont = persistAtom<boolean>("skipSpicyFont", false);
export const $showNpvDynamicBg = persistAtom<boolean>("showNpvDynamicBg", true);
export const $starsEnabled = persistAtom<boolean>(
  "starsEnabled",
  VISUALIZER_SETTING_DEFAULTS.starsEnabled
);
export const $starShape = persistAtom<string>("starShape", VISUALIZER_SETTING_DEFAULTS.starShape);
export const $starAmount = persistAtom<number>("starAmount", VISUALIZER_SETTING_DEFAULTS.starAmount);
export const $starSize = persistAtom<number>("starSize", VISUALIZER_SETTING_DEFAULTS.starSize);
export const $starBrightness = persistAtom<number>(
  "starBrightness",
  VISUALIZER_SETTING_DEFAULTS.starBrightness
);
export const $starTwinkleSpeed = persistAtom<number>(
  "starTwinkleSpeed",
  VISUALIZER_SETTING_DEFAULTS.starTwinkleSpeed
);
export const $starVocalSensitivity = persistAtom<number>(
  "starVocalSensitivity",
  VISUALIZER_SETTING_DEFAULTS.starVocalSensitivity
);
export const $starBeatSensitivity = persistAtom<number>(
  "starBeatSensitivity",
  VISUALIZER_SETTING_DEFAULTS.starBeatSensitivity
);
export const $backgroundBeatGlowStrength = persistAtom<number>(
  "backgroundBeatGlowStrength",
  VISUALIZER_SETTING_DEFAULTS.backgroundBeatGlowStrength
);
export const $backgroundBeatBrightness = persistAtom<number>(
  "backgroundBeatBrightness",
  VISUALIZER_SETTING_DEFAULTS.backgroundBeatBrightness
);
export const $backgroundDropImpact = persistAtom<number>(
  "backgroundDropImpact",
  VISUALIZER_SETTING_DEFAULTS.backgroundDropImpact
);
export const $backgroundMovementSpeed = persistAtom<number>(
  "backgroundMovementSpeed",
  VISUALIZER_SETTING_DEFAULTS.backgroundMovementSpeed
);
export const $beatdropSpeedMultiplier = persistAtom<number>(
  "beatdropSpeedMultiplier",
  VISUALIZER_SETTING_DEFAULTS.beatdropSpeedMultiplier
);
export const $perColorReactivity = persistAtom<number>(
  "perColorReactivity",
  VISUALIZER_SETTING_DEFAULTS.perColorReactivity
);
export const $calmSectionIntensity = persistAtom<number>(
  "calmSectionIntensity",
  VISUALIZER_SETTING_DEFAULTS.calmSectionIntensity
);
export const $loudSectionIntensity = persistAtom<number>(
  "loudSectionIntensity",
  VISUALIZER_SETTING_DEFAULTS.loudSectionIntensity
);
export const $globalGlowLimit = persistAtom<number>(
  "globalGlowLimit",
  VISUALIZER_SETTING_DEFAULTS.globalGlowLimit
);
export const $absoluteLoudnessScaling = persistAtom<number>(
  "absoluteLoudnessScaling",
  VISUALIZER_SETTING_DEFAULTS.absoluteLoudnessScaling
);
export const $backgroundResponse = persistAtom<number>(
  "backgroundResponse",
  VISUALIZER_SETTING_DEFAULTS.backgroundResponse
);
export const $performanceMode = persistAtom<string>(
  "performanceMode",
  VISUALIZER_SETTING_DEFAULTS.performanceMode
);
export const $backgroundFpsLimit = persistAtom<number>(
  "backgroundFpsLimit",
  VISUALIZER_SETTING_DEFAULTS.backgroundFpsLimit
);
export const $visualizerLanguage = persistAtom<string>(
  "visualizerLanguage",
  VISUALIZER_SETTING_DEFAULTS.visualizerLanguage
);
export const $visualizerPreset = persistAtom<string>(
  "visualizerPreset",
  VISUALIZER_SETTING_DEFAULTS.visualizerPreset
);
export const $activeCustomVisualizerPresetId = persistAtom<string>(
  "activeCustomVisualizerPresetId",
  VISUALIZER_SETTING_DEFAULTS.activeCustomVisualizerPresetId
);
export const $customVisualizerPresets = persistAtom<any[]>(
  "customVisualizerPresets",
  [...VISUALIZER_SETTING_DEFAULTS.customVisualizerPresets]
);
export const $lockedMediaBox = persistAtom<boolean>("lockedMediaBox", false);
// $popupLyricsAllowed: stored as actual boolean "popupLyricsAllowed" in the settings blob.
export const $popupLyricsAllowed = (() => {
  const initial: boolean =
    _settings["popupLyricsAllowed"] !== undefined ? _settings["popupLyricsAllowed"] : true;
  const store = atom<boolean>(initial);
  store.listen((v) => {
    _settings["popupLyricsAllowed"] = v;
    saveSettingsBlob(_settings);
  });
  return store;
})();
export const $viewControlsPosition = persistAtom<string>("viewControlsPosition", "Top");
export const $ttmlMakerMode = persistAtom<boolean>("ttmlMakerMode", true);
export const $developerMode = persistAtom<boolean>("developerMode", false);
export const $timelineOutsideMediaContent = persistAtom<boolean>(
  "timelineOutsideMediaContent",
  true
);

// Version atom - NOT persisted, set once at startup
export const $spicyLyricsVersion = atom<string>(
  (window as any)._spicy_lyrics_metadata?.LoadedVersion ?? ProjectDisplayVersion
);

// Runtime (ephemeral) atoms
export const $currentLyricsType = atom<string>("None");
export const $lyricsContainerExists = atom<boolean>(false);
export const $currentlyFetching = atom<boolean>(false);
export const $currentLyricsData = atom<string>("");
