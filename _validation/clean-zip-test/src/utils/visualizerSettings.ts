import {
  $absoluteLoudnessScaling,
  $backgroundBeatBrightness,
  $backgroundBeatGlowStrength,
  $backgroundDropImpact,
  $backgroundMovementSpeed,
  $backgroundResponse,
  $beatdropSpeedMultiplier,
  $globalGlowLimit,
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

export interface VisualizerPresetValues {
  backgroundBeatBrightness: number;
  backgroundBeatGlowStrength: number;
  backgroundDropImpact: number;
  backgroundMovementSpeed: number;
  beatdropSpeedMultiplier: number;
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
  Exclude<VisualizerPreset, "custom">,
  VisualizerPresetValues
> = {
  vanilla: {
    backgroundBeatBrightness: 0,
    backgroundBeatGlowStrength: 0,
    backgroundDropImpact: 0,
    backgroundMovementSpeed: 0,
    beatdropSpeedMultiplier: 0,
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
    backgroundBeatBrightness: 16,
    backgroundBeatGlowStrength: 36,
    backgroundDropImpact: 14,
    backgroundMovementSpeed: -30,
    beatdropSpeedMultiplier: -18,
    globalGlowLimit: -10,
    backgroundResponse: -42,
    absoluteLoudnessScaling: -26,
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
    backgroundBeatBrightness: 46,
    backgroundBeatGlowStrength: 92,
    backgroundDropImpact: 72,
    backgroundMovementSpeed: 4,
    beatdropSpeedMultiplier: 26,
    globalGlowLimit: 26,
    backgroundResponse: -18,
    absoluteLoudnessScaling: 8,
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
    backgroundBeatBrightness: 72,
    backgroundBeatGlowStrength: 126,
    backgroundDropImpact: 112,
    backgroundMovementSpeed: 34,
    beatdropSpeedMultiplier: 92,
    globalGlowLimit: 48,
    backgroundResponse: 18,
    absoluteLoudnessScaling: 18,
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
    backgroundBeatBrightness: 108,
    backgroundBeatGlowStrength: 168,
    backgroundDropImpact: 182,
    backgroundMovementSpeed: 78,
    beatdropSpeedMultiplier: 172,
    globalGlowLimit: 58,
    backgroundResponse: 40,
    absoluteLoudnessScaling: 28,
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
    backgroundBeatBrightness: 26,
    backgroundBeatGlowStrength: 60,
    backgroundDropImpact: 20,
    backgroundMovementSpeed: -34,
    beatdropSpeedMultiplier: -22,
    globalGlowLimit: 12,
    backgroundResponse: -46,
    absoluteLoudnessScaling: -14,
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
    backgroundBeatBrightness: 78,
    backgroundBeatGlowStrength: 112,
    backgroundDropImpact: 118,
    backgroundMovementSpeed: 58,
    beatdropSpeedMultiplier: 128,
    globalGlowLimit: 54,
    backgroundResponse: 38,
    absoluteLoudnessScaling: 24,
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

export function applyVisualizerPreset(preset: Exclude<VisualizerPreset, "custom">) {
  const values = VISUALIZER_PRESET_VALUES[preset];
  $backgroundBeatBrightness.set(values.backgroundBeatBrightness);
  $backgroundDropImpact.set(values.backgroundDropImpact);
  $backgroundMovementSpeed.set(values.backgroundMovementSpeed);
  $beatdropSpeedMultiplier.set(values.beatdropSpeedMultiplier);
  $globalGlowLimit.set(values.globalGlowLimit);
  $backgroundResponse.set(values.backgroundResponse);
  $absoluteLoudnessScaling.set(values.absoluteLoudnessScaling);
  $backgroundBeatGlowStrength.set(values.backgroundBeatGlowStrength);
  $starsEnabled.set(values.starsEnabled);
  $starShape.set(values.starShape);
  $starAmount.set(values.starAmount);
  $starBrightness.set(values.starBrightness);
  $starSize.set(values.starSize);
  $starTwinkleSpeed.set(values.starTwinkleSpeed);
  $starVocalSensitivity.set(values.starVocalSensitivity);
  $starBeatSensitivity.set(values.starBeatSensitivity);

  $visualizerPreset.set(preset);
}

export function markVisualizerPresetCustom() {
  if ($visualizerPreset.get() !== "custom") {
    $visualizerPreset.set("custom");
  }
}
