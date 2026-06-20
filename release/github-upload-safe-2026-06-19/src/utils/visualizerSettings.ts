import {
  $activeCustomVisualizerPresetId,
  $absoluteLoudnessScaling,
  $backgroundBeatBrightness,
  $backgroundBeatGlowStrength,
  $backgroundDropImpact,
  $backgroundMovementSpeed,
  $backgroundResponse,
  $beatdropSpeedMultiplier,
  $calmSectionIntensity,
  $customVisualizerPresets,
  $globalGlowLimit,
  $loudSectionIntensity,
  $perColorReactivity,
  $starAmount,
  $starBeatSensitivity,
  $starBrightness,
  $starShape,
  $starSize,
  $starTwinkleSpeed,
  $starVocalSensitivity,
  $starsEnabled,
  $visualizerPreset,
} from "./stores.ts";

export type VisualizerLanguage = "english" | "german";
export type VisualizerPreset =
  | "custom"
  | "vanilla"
  | "smooth"
  | "cinematic"
  | "energetic"
  | "insane"
  | "eventually"
  | "strokesSnowStrippers";

export type BuiltInVisualizerPreset = Exclude<VisualizerPreset, "custom">;

export interface VisualizerPresetValues {
  backgroundBeatBrightness: number;
  backgroundBeatGlowStrength: number;
  backgroundDropImpact: number;
  backgroundMovementSpeed: number;
  beatdropSpeedMultiplier: number;
  perColorReactivity: number;
  calmSectionIntensity: number;
  loudSectionIntensity: number;
  globalGlowLimit: number;
  backgroundResponse: number;
  absoluteLoudnessScaling: number;
  starsEnabled: boolean;
  starShape: string;
  starAmount: number;
  starBrightness: number;
  starSize: number;
  starTwinkleSpeed: number;
  starVocalSensitivity: number;
  starBeatSensitivity: number;
}

export interface CustomVisualizerPreset {
  id: string;
  name: string;
  values: VisualizerPresetValues;
  createdAt: number;
  updatedAt: number;
}

export const VISUALIZER_PRESET_ORDER: VisualizerPreset[] = [
  "vanilla",
  "cinematic",
  "smooth",
  "energetic",
  "insane",
  "eventually",
  "strokesSnowStrippers",
  "custom",
];

export const VISUALIZER_PRESET_VALUES: Record<
  BuiltInVisualizerPreset,
  VisualizerPresetValues
> = {
  vanilla: {
    backgroundBeatBrightness: 0,
    backgroundBeatGlowStrength: 0,
    backgroundDropImpact: 0,
    backgroundMovementSpeed: 0,
    beatdropSpeedMultiplier: 0,
    perColorReactivity: 0,
    calmSectionIntensity: 0,
    loudSectionIntensity: 0,
    globalGlowLimit: 0,
    backgroundResponse: 0,
    absoluteLoudnessScaling: 0,
    starsEnabled: false,
    starShape: "mixed",
    starAmount: 48,
    starBrightness: 48,
    starSize: 42,
    starTwinkleSpeed: 44,
    starVocalSensitivity: 74,
    starBeatSensitivity: 16,
  },
  smooth: {
    backgroundBeatBrightness: -12,
    backgroundBeatGlowStrength: 24,
    backgroundDropImpact: -8,
    backgroundMovementSpeed: -44,
    beatdropSpeedMultiplier: -34,
    perColorReactivity: 24,
    calmSectionIntensity: -26,
    loudSectionIntensity: -18,
    globalGlowLimit: -34,
    backgroundResponse: -56,
    absoluteLoudnessScaling: -28,
    starsEnabled: false,
    starShape: "softDot",
    starAmount: 28,
    starBrightness: 34,
    starSize: 34,
    starTwinkleSpeed: 38,
    starVocalSensitivity: 70,
    starBeatSensitivity: 8,
  },
  cinematic: {
    backgroundBeatBrightness: 18,
    backgroundBeatGlowStrength: 70,
    backgroundDropImpact: 54,
    backgroundMovementSpeed: -6,
    beatdropSpeedMultiplier: 18,
    perColorReactivity: 64,
    calmSectionIntensity: -18,
    loudSectionIntensity: 48,
    globalGlowLimit: -8,
    backgroundResponse: -28,
    absoluteLoudnessScaling: -8,
    starsEnabled: false,
    starShape: "realStar",
    starAmount: 32,
    starBrightness: 52,
    starSize: 42,
    starTwinkleSpeed: 54,
    starVocalSensitivity: 80,
    starBeatSensitivity: 10,
  },
  energetic: {
    backgroundBeatBrightness: 34,
    backgroundBeatGlowStrength: 104,
    backgroundDropImpact: 96,
    backgroundMovementSpeed: 24,
    beatdropSpeedMultiplier: 72,
    perColorReactivity: 82,
    calmSectionIntensity: -10,
    loudSectionIntensity: 86,
    globalGlowLimit: 6,
    backgroundResponse: -4,
    absoluteLoudnessScaling: 2,
    starsEnabled: false,
    starShape: "sparkleStar",
    starAmount: 44,
    starBrightness: 60,
    starSize: 44,
    starTwinkleSpeed: 68,
    starVocalSensitivity: 76,
    starBeatSensitivity: 22,
  },
  insane: {
    backgroundBeatBrightness: 52,
    backgroundBeatGlowStrength: 148,
    backgroundDropImpact: 166,
    backgroundMovementSpeed: 54,
    beatdropSpeedMultiplier: 138,
    perColorReactivity: 116,
    calmSectionIntensity: -4,
    loudSectionIntensity: 132,
    globalGlowLimit: 22,
    backgroundResponse: 12,
    absoluteLoudnessScaling: 8,
    starsEnabled: false,
    starShape: "crossStar",
    starAmount: 60,
    starBrightness: 78,
    starSize: 50,
    starTwinkleSpeed: 88,
    starVocalSensitivity: 82,
    starBeatSensitivity: 34,
  },
  eventually: {
    backgroundBeatBrightness: 4,
    backgroundBeatGlowStrength: 56,
    backgroundDropImpact: 28,
    backgroundMovementSpeed: -38,
    beatdropSpeedMultiplier: -28,
    perColorReactivity: 74,
    calmSectionIntensity: 16,
    loudSectionIntensity: 30,
    globalGlowLimit: -18,
    backgroundResponse: -54,
    absoluteLoudnessScaling: -18,
    starsEnabled: true,
    starShape: "sparkleStar",
    starAmount: 40,
    starBrightness: 74,
    starSize: 68,
    starTwinkleSpeed: 86,
    starVocalSensitivity: 100,
    starBeatSensitivity: 4,
  },
  strokesSnowStrippers: {
    backgroundBeatBrightness: 30,
    backgroundBeatGlowStrength: 94,
    backgroundDropImpact: 108,
    backgroundMovementSpeed: 42,
    beatdropSpeedMultiplier: 104,
    perColorReactivity: 92,
    calmSectionIntensity: -18,
    loudSectionIntensity: 92,
    globalGlowLimit: 8,
    backgroundResponse: 8,
    absoluteLoudnessScaling: 6,
    starsEnabled: true,
    starShape: "crossStar",
    starAmount: 66,
    starBrightness: 82,
    starSize: 50,
    starTwinkleSpeed: 88,
    starVocalSensitivity: 74,
    starBeatSensitivity: 42,
  },
};

function createPresetId(): string {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeCustomPresetName(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, 48);
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, Math.round(numeric)));
}

function sanitizeStarShape(value: unknown): string {
  return ["mixed", "softDot", "realStar", "sparkleStar", "crossStar"].includes(String(value))
    ? String(value)
    : VISUALIZER_PRESET_VALUES.vanilla.starShape;
}

function sanitizePresetValues(value: Partial<VisualizerPresetValues>): VisualizerPresetValues {
  const defaults = VISUALIZER_PRESET_VALUES.vanilla;
  return {
    backgroundBeatBrightness: clampNumber(
      value.backgroundBeatBrightness,
      -100,
      300,
      defaults.backgroundBeatBrightness
    ),
    backgroundBeatGlowStrength: clampNumber(
      value.backgroundBeatGlowStrength,
      -100,
      300,
      defaults.backgroundBeatGlowStrength
    ),
    backgroundDropImpact: clampNumber(
      value.backgroundDropImpact,
      -100,
      300,
      defaults.backgroundDropImpact
    ),
    backgroundMovementSpeed: clampNumber(
      value.backgroundMovementSpeed,
      -100,
      300,
      defaults.backgroundMovementSpeed
    ),
    beatdropSpeedMultiplier: clampNumber(
      value.beatdropSpeedMultiplier,
      -100,
      300,
      defaults.beatdropSpeedMultiplier
    ),
    perColorReactivity: clampNumber(
      value.perColorReactivity,
      -100,
      300,
      defaults.perColorReactivity
    ),
    calmSectionIntensity: clampNumber(
      value.calmSectionIntensity,
      -100,
      300,
      defaults.calmSectionIntensity
    ),
    loudSectionIntensity: clampNumber(
      value.loudSectionIntensity,
      -100,
      300,
      defaults.loudSectionIntensity
    ),
    globalGlowLimit: clampNumber(value.globalGlowLimit, -100, 300, defaults.globalGlowLimit),
    backgroundResponse: clampNumber(
      value.backgroundResponse,
      -100,
      300,
      defaults.backgroundResponse
    ),
    absoluteLoudnessScaling: clampNumber(
      value.absoluteLoudnessScaling,
      -100,
      300,
      defaults.absoluteLoudnessScaling
    ),
    starsEnabled:
      typeof value.starsEnabled === "boolean" ? value.starsEnabled : defaults.starsEnabled,
    starShape: sanitizeStarShape(value.starShape),
    starAmount: clampNumber(value.starAmount, 0, 100, defaults.starAmount),
    starBrightness: clampNumber(value.starBrightness, 0, 100, defaults.starBrightness),
    starSize: clampNumber(value.starSize, 0, 100, defaults.starSize),
    starTwinkleSpeed: clampNumber(value.starTwinkleSpeed, 0, 100, defaults.starTwinkleSpeed),
    starVocalSensitivity: clampNumber(
      value.starVocalSensitivity,
      0,
      100,
      defaults.starVocalSensitivity
    ),
    starBeatSensitivity: clampNumber(
      value.starBeatSensitivity,
      0,
      100,
      defaults.starBeatSensitivity
    ),
  };
}

function sanitizeCustomPreset(value: unknown): CustomVisualizerPreset | null {
  if (!value || typeof value !== "object") return null;

  const preset = value as Partial<CustomVisualizerPreset>;
  const name = normalizeCustomPresetName(String(preset.name ?? ""));
  if (!name || !preset.values) return null;

  return {
    id: String(preset.id || createPresetId()),
    name,
    values: sanitizePresetValues(preset.values),
    createdAt: Number(preset.createdAt || Date.now()),
    updatedAt: Number(preset.updatedAt || Date.now()),
  };
}

export function getCustomVisualizerPresets(): CustomVisualizerPreset[] {
  return $customVisualizerPresets
    .get()
    .map(sanitizeCustomPreset)
    .filter((preset): preset is CustomVisualizerPreset => Boolean(preset));
}

function setCustomVisualizerPresets(presets: CustomVisualizerPreset[]) {
  $customVisualizerPresets.set(presets);
}

export function getCurrentVisualizerValues(): VisualizerPresetValues {
  return {
    backgroundBeatBrightness: $backgroundBeatBrightness.get(),
    backgroundBeatGlowStrength: $backgroundBeatGlowStrength.get(),
    backgroundDropImpact: $backgroundDropImpact.get(),
    backgroundMovementSpeed: $backgroundMovementSpeed.get(),
    beatdropSpeedMultiplier: $beatdropSpeedMultiplier.get(),
    perColorReactivity: $perColorReactivity.get(),
    calmSectionIntensity: $calmSectionIntensity.get(),
    loudSectionIntensity: $loudSectionIntensity.get(),
    globalGlowLimit: $globalGlowLimit.get(),
    backgroundResponse: $backgroundResponse.get(),
    absoluteLoudnessScaling: $absoluteLoudnessScaling.get(),
    starsEnabled: $starsEnabled.get(),
    starShape: $starShape.get(),
    starAmount: $starAmount.get(),
    starBrightness: $starBrightness.get(),
    starSize: $starSize.get(),
    starTwinkleSpeed: $starTwinkleSpeed.get(),
    starVocalSensitivity: $starVocalSensitivity.get(),
    starBeatSensitivity: $starBeatSensitivity.get(),
  };
}

function applyVisualizerValues(values: VisualizerPresetValues) {
  const safeValues = sanitizePresetValues(values);
  $backgroundBeatBrightness.set(safeValues.backgroundBeatBrightness);
  $backgroundDropImpact.set(safeValues.backgroundDropImpact);
  $backgroundMovementSpeed.set(safeValues.backgroundMovementSpeed);
  $beatdropSpeedMultiplier.set(safeValues.beatdropSpeedMultiplier);
  $perColorReactivity.set(safeValues.perColorReactivity);
  $calmSectionIntensity.set(safeValues.calmSectionIntensity);
  $loudSectionIntensity.set(safeValues.loudSectionIntensity);
  $globalGlowLimit.set(safeValues.globalGlowLimit);
  $backgroundResponse.set(safeValues.backgroundResponse);
  $absoluteLoudnessScaling.set(safeValues.absoluteLoudnessScaling);
  $backgroundBeatGlowStrength.set(safeValues.backgroundBeatGlowStrength);
  $starsEnabled.set(safeValues.starsEnabled);
  $starShape.set(safeValues.starShape);
  $starAmount.set(safeValues.starAmount);
  $starBrightness.set(safeValues.starBrightness);
  $starSize.set(safeValues.starSize);
  $starTwinkleSpeed.set(safeValues.starTwinkleSpeed);
  $starVocalSensitivity.set(safeValues.starVocalSensitivity);
  $starBeatSensitivity.set(safeValues.starBeatSensitivity);
}

export function applyVisualizerPreset(preset: BuiltInVisualizerPreset) {
  applyVisualizerValues(VISUALIZER_PRESET_VALUES[preset]);
  $activeCustomVisualizerPresetId.set("");
  $visualizerPreset.set(preset);
}

export function applyCustomVisualizerPreset(id: string): boolean {
  const preset = getCustomVisualizerPresets().find((item) => item.id === id);
  if (!preset) return false;

  applyVisualizerValues(preset.values);
  $activeCustomVisualizerPresetId.set(id);
  $visualizerPreset.set("custom");
  return true;
}

export function createCustomVisualizerPreset(name: string): CustomVisualizerPreset | null {
  const normalizedName = normalizeCustomPresetName(name);
  if (!normalizedName) return null;

  const now = Date.now();
  const preset: CustomVisualizerPreset = {
    id: createPresetId(),
    name: normalizedName,
    values: getCurrentVisualizerValues(),
    createdAt: now,
    updatedAt: now,
  };

  setCustomVisualizerPresets([...getCustomVisualizerPresets(), preset]);
  $activeCustomVisualizerPresetId.set(preset.id);
  $visualizerPreset.set("custom");
  return preset;
}

export function updateCustomVisualizerPreset(id: string): boolean {
  const presets = getCustomVisualizerPresets();
  let found = false;
  const nextPresets = presets.map((preset) => {
    if (preset.id !== id) return preset;
    found = true;
    return {
      ...preset,
      values: getCurrentVisualizerValues(),
      updatedAt: Date.now(),
    };
  });

  if (!found) return false;
  setCustomVisualizerPresets(nextPresets);
  $activeCustomVisualizerPresetId.set(id);
  $visualizerPreset.set("custom");
  return true;
}

export function renameCustomVisualizerPreset(id: string, name: string): boolean {
  const normalizedName = normalizeCustomPresetName(name);
  if (!normalizedName) return false;

  const presets = getCustomVisualizerPresets();
  let found = false;
  const nextPresets = presets.map((preset) => {
    if (preset.id !== id) return preset;
    found = true;
    return {
      ...preset,
      name: normalizedName,
      updatedAt: Date.now(),
    };
  });

  if (!found) return false;
  setCustomVisualizerPresets(nextPresets);
  return true;
}

export function deleteCustomVisualizerPreset(id: string): boolean {
  const presets = getCustomVisualizerPresets();
  const nextPresets = presets.filter((preset) => preset.id !== id);
  if (nextPresets.length === presets.length) return false;

  setCustomVisualizerPresets(nextPresets);
  if ($activeCustomVisualizerPresetId.get() === id) {
    $activeCustomVisualizerPresetId.set("");
    $visualizerPreset.set("custom");
  }
  return true;
}

export function duplicateVisualizerPreset(
  source: BuiltInVisualizerPreset | CustomVisualizerPreset,
  name: string
): CustomVisualizerPreset | null {
  const normalizedName = normalizeCustomPresetName(name);
  if (!normalizedName) return null;

  const values = typeof source === "string" ? VISUALIZER_PRESET_VALUES[source] : source.values;
  const now = Date.now();
  const preset: CustomVisualizerPreset = {
    id: createPresetId(),
    name: normalizedName,
    values: { ...values },
    createdAt: now,
    updatedAt: now,
  };

  setCustomVisualizerPresets([...getCustomVisualizerPresets(), preset]);
  return preset;
}

export function resetCustomVisualizerPreset(id: string): boolean {
  return applyCustomVisualizerPreset(id);
}

export function exportCustomVisualizerPresets(): string {
  return JSON.stringify(
    {
      version: 1,
      presets: getCustomVisualizerPresets(),
    },
    null,
    2
  );
}

export function importCustomVisualizerPresets(raw: string): number {
  const parsed = JSON.parse(raw) as { presets?: unknown[] } | unknown[];
  const incoming = Array.isArray(parsed) ? parsed : parsed.presets;
  if (!Array.isArray(incoming)) return 0;

  const existing = getCustomVisualizerPresets();
  const existingIds = new Set(existing.map((preset) => preset.id));
  const imported = incoming
    .map(sanitizeCustomPreset)
    .filter((preset): preset is CustomVisualizerPreset => Boolean(preset))
    .map((preset) => ({
      ...preset,
      id: existingIds.has(preset.id) ? createPresetId() : preset.id,
      updatedAt: Date.now(),
    }));

  if (!imported.length) return 0;
  setCustomVisualizerPresets([...existing, ...imported]);
  return imported.length;
}

export function markVisualizerPresetCustom() {
  if ($visualizerPreset.get() !== "custom") {
    $activeCustomVisualizerPresetId.set("");
  }
  $visualizerPreset.set("custom");
}
