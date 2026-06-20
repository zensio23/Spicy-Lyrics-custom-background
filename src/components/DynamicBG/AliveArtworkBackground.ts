import Kawarp, { type KawarpOptions } from "@kawarp/core";
import type { BackgroundAudioSnapshot } from "./types.ts";
import {
  $absoluteLoudnessScaling,
  $backgroundBeatBrightness,
  $backgroundBeatGlowStrength,
  $backgroundDropImpact,
  $backgroundFpsLimit,
  $backgroundMovementSpeed,
  $backgroundResponse,
  $beatdropSpeedMultiplier,
  $calmSectionIntensity,
  $globalGlowLimit,
  $loudSectionIntensity,
  $performanceMode,
  $perColorReactivity,
  $starAmount,
  $starBeatSensitivity,
  $starBrightness,
  $starShape,
  $starSize,
  $starVocalSensitivity,
  $starsEnabled,
  $starTwinkleSpeed,
} from "../../utils/stores.ts";

const TAU = Math.PI * 2;
const MIN_TUNING = -100;
const MAX_TUNING = 300;

type StarShape = "softDot" | "realStar" | "sparkleStar" | "crossStar";
type PerformanceMode = "low" | "medium" | "high";

interface BackgroundVisualSettings {
  waveGlowStrength: number;
  beatBrightness: number;
  dropImpact: number;
  movementSpeed: number;
  beatdropMultiplier: number;
  localWaveVariation: number;
  calmSectionIntensity: number;
  loudSectionIntensity: number;
  glowLimit: number;
  absoluteLoudnessScaling: number;
  response: number;
  performanceMode: PerformanceMode;
  fpsLimit: number;
  renderScale: number;
  starsEnabled: boolean;
  starShape: string;
  starAmount: number;
  starSize: number;
  starBrightness: number;
  starTwinkleSpeed: number;
  starVocalSensitivity: number;
  starBeatSensitivity: number;
}

interface Emitter {
  x: number;
  y: number;
  radius: number;
  stretchX: number;
  stretchY: number;
  rotation: number;
  featureScore: number;
  intensity: number;
  sensitivity: number;
  fadeSpeed: number;
  flowAmplitudeX: number;
  flowAmplitudeY: number;
  flowSpeedX: number;
  flowSpeedY: number;
  phase: number;
  current: number;
  color: [number, number, number];
  glowColor: [number, number, number];
  redWeight: number;
  greenWeight: number;
  blueWeight: number;
  purpleWeight: number;
  lightness: number;
}

interface StarState {
  element: HTMLDivElement;
  shape: StarShape;
  affinity: number;
  sparkle: number;
  vocalBias: number;
  beatBias: number;
  baseOpacity: number;
  twinkleRate: number;
  shimmerRate: number;
  shimmerPhase: number;
  flareRate: number;
  flarePhase: number;
  flareSharpness: number;
  phase: number;
  sizeScale: number;
  rotationDeg: number;
  glowSpread: number;
  lastOpacity: number;
  lastBrightness: number;
  lastScale: number;
  lastGlow: number;
  lastFlare: number;
  lastCoreOpacity: number;
  lastRotation: number;
}

interface SampledImage {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export interface AliveArtworkBackgroundOptions {
  host: HTMLElement;
  key: HTMLElement | string;
  readAudioSnapshot: () => BackgroundAudioSnapshot;
  kawarpOptions: KawarpOptions;
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function approach(
  value: number,
  target: number,
  deltaMs: number,
  attackMs: number,
  releaseMs: number
): number {
  if (!Number.isFinite(deltaMs) || deltaMs <= 0) {
    return target;
  }

  const tau = target > value ? attackMs : releaseMs;
  const alpha = 1 - Math.exp(-deltaMs / Math.max(8, tau));
  return value + (target - value) * alpha;
}

function changedEnough(previous: number, next: number, threshold: number): boolean {
  return previous < 0 || Math.abs(previous - next) >= threshold;
}

function createSeed(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clampTuning(value: number): number {
  return Math.min(MAX_TUNING, Math.max(MIN_TUNING, value));
}

function positiveTuning(value: number): number {
  return clamp(Math.max(0, clampTuning(value)) / MAX_TUNING);
}

function negativeTuning(value: number): number {
  return clamp(Math.max(0, -clampTuning(value)) / Math.abs(MIN_TUNING));
}

function scaleAroundNeutral(value: number, minScale: number, maxScale: number): number {
  const clamped = clampTuning(value);
  if (clamped >= 0) {
    return lerp(1, maxScale, positiveTuning(clamped));
  }
  return lerp(1, minScale, negativeTuning(clamped));
}

function mapAroundNeutral(
  value: number,
  neutralValue: number,
  negativeTarget: number,
  positiveTarget: number
): number {
  const clamped = clampTuning(value);
  if (clamped >= 0) {
    return lerp(neutralValue, positiveTarget, positiveTuning(clamped));
  }
  return lerp(neutralValue, negativeTarget, negativeTuning(clamped));
}

function resolvePerformanceMode(value: string): PerformanceMode {
  return value === "low" || value === "medium" || value === "high" ? value : "high";
}

function getSettings(): BackgroundVisualSettings {
  const performanceMode = resolvePerformanceMode($performanceMode.get());
  const performanceFpsLimit = performanceMode === "low" ? 28 : performanceMode === "medium" ? 42 : 60;
  const fpsLimit = Math.min(
    performanceFpsLimit,
    clamp(Number($backgroundFpsLimit.get() || performanceFpsLimit), 24, 120)
  );
  const renderScale = performanceMode === "low" ? 0.46 : performanceMode === "medium" ? 0.6 : 0.74;

  return {
    waveGlowStrength: clampTuning($backgroundBeatGlowStrength.get()),
    beatBrightness: clampTuning($backgroundBeatBrightness.get()),
    dropImpact: clampTuning($backgroundDropImpact.get()),
    movementSpeed: clampTuning($backgroundMovementSpeed.get()),
    beatdropMultiplier: clampTuning($beatdropSpeedMultiplier.get()),
    localWaveVariation: clampTuning($perColorReactivity.get()),
    calmSectionIntensity: clampTuning($calmSectionIntensity.get()),
    loudSectionIntensity: clampTuning($loudSectionIntensity.get()),
    glowLimit: clampTuning($globalGlowLimit.get()),
    absoluteLoudnessScaling: clampTuning($absoluteLoudnessScaling.get()),
    response: clampTuning($backgroundResponse.get()),
    performanceMode,
    fpsLimit,
    renderScale,
    starsEnabled: $starsEnabled.get(),
    starShape: $starShape.get(),
    starAmount: Math.round(lerp(6, 120, clamp($starAmount.get() / 100))),
    starSize: lerp(1.4, 14.8, clamp($starSize.get() / 100)),
    starBrightness: lerp(0.34, 3.7, clamp($starBrightness.get() / 100)),
    starTwinkleSpeed: lerp(0.55, 2.75, clamp($starTwinkleSpeed.get() / 100)),
    starVocalSensitivity: lerp(0.45, 2.6, clamp($starVocalSensitivity.get() / 100)),
    starBeatSensitivity: lerp(0, 1.32, clamp($starBeatSensitivity.get() / 100)),
  };
}

function rgbToHsl(red: number, green: number, blue: number) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return { hue: 0, saturation: 0, lightness };
  }

  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue = 0;
  switch (max) {
    case r:
      hue = (g - b) / delta + (g < b ? 6 : 0);
      break;
    case g:
      hue = (b - r) / delta + 2;
      break;
    default:
      hue = (r - g) / delta + 4;
      break;
  }

  hue /= 6;
  return { hue, saturation, lightness };
}

function resolveGlowColor(
  [red, green, blue]: [number, number, number],
  score: number
): [number, number, number] {
  const { saturation, lightness } = rgbToHsl(red, green, blue);
  const lift =
    (0.025 + score * 0.05 + saturation * 0.035) *
    (1 - smoothstep(0.62, 0.94, lightness) * 0.82);
  return [
    Math.round(clamp(red + (255 - red) * lift, 0, 255)),
    Math.round(clamp(green + (255 - green) * lift, 0, 255)),
    Math.round(clamp(blue + (255 - blue) * lift, 0, 255)),
  ];
}

function samplePixel(sample: SampledImage, x: number, y: number): [number, number, number] {
  const clampedX = Math.min(sample.width - 1, Math.max(0, Math.round(x)));
  const clampedY = Math.min(sample.height - 1, Math.max(0, Math.round(y)));
  const index = (clampedY * sample.width + clampedX) * 4;
  return [sample.data[index] ?? 0, sample.data[index + 1] ?? 0, sample.data[index + 2] ?? 0];
}

function sampleContrast(sample: SampledImage, x: number, y: number): number {
  const [red, green, blue] = samplePixel(sample, x, y);
  const baseLuma = (red * 0.299 + green * 0.587 + blue * 0.114) / 255;

  let contrast = 0;
  let samples = 0;
  const offsets = [
    [-2, 0],
    [2, 0],
    [0, -2],
    [0, 2],
  ];

  for (const [offsetX, offsetY] of offsets) {
    const [nr, ng, nb] = samplePixel(sample, x + offsetX, y + offsetY);
    const localLuma = (nr * 0.299 + ng * 0.587 + nb * 0.114) / 255;
    contrast += Math.abs(baseLuma - localLuma);
    samples += 1;
  }

  return samples > 0 ? contrast / samples : 0;
}

async function sampleCoverArt(sourceUrl: string): Promise<SampledImage | null> {
  return await new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) {
          resolve(null);
          return;
        }

        const size = 72;
        canvas.width = size;
        canvas.height = size;
        context.drawImage(image, 0, 0, size, size);
        const imageData = context.getImageData(0, 0, size, size);
        resolve({
          width: size,
          height: size,
          data: imageData.data,
        });
      } catch {
        resolve(null);
      }
    };

    image.onerror = () => resolve(null);
    image.src = sourceUrl;
  });
}

export class AliveArtworkBackground {
  public readonly key: HTMLElement | string;
  public readonly host: HTMLElement;

  private readonly readAudioSnapshot: () => BackgroundAudioSnapshot;
  private readonly shell: HTMLDivElement;
  private readonly kawarpCanvas: HTMLCanvasElement;
  private readonly lightCanvas: HTMLCanvasElement;
  private readonly lightContext: CanvasRenderingContext2D | null;
  private readonly starsLayer: HTMLDivElement;
  private readonly kawarp: Kawarp;
  private readonly resizeObserver: ResizeObserver;

  private currentCoverUrl = "";
  private emitters: Emitter[] = [];
  private stars: StarState[] = [];
  private sampledCover: SampledImage | null = null;
  private lastSettingsSignature = "";
  private lastPerformanceSignature = "";
  private lastFrameAt = 0;
  private lastKawarpSpeed = -1;
  private smoothedKawarpSpeed = 0.1;
  private lightsVisible = false;
  private starsVisible = false;
  private disposed = false;
  private visualSignals = {
    loudness: 0,
    bass: 0,
    lowMid: 0,
    vocal: 0,
    presence: 0,
    air: 0,
    transient: 0,
    beat: 0,
    drop: 0,
    impact: 0,
    movement: 0,
    stars: 0,
  };

  public constructor({
    host,
    key,
    readAudioSnapshot,
    kawarpOptions,
  }: AliveArtworkBackgroundOptions) {
    this.host = host;
    this.key = key;
    this.readAudioSnapshot = readAudioSnapshot;

    this.shell = document.createElement("div");
    this.shell.className = "spicy-dynamic-bg-shell";
    this.shell.setAttribute("data-bg-key", typeof key === "string" ? key : "element");

    this.kawarpCanvas = document.createElement("canvas");
    this.kawarpCanvas.className = "spicy-dynamic-bg spicy-dynamic-bg--base";

    this.lightCanvas = document.createElement("canvas");
    this.lightCanvas.className = "spicy-dynamic-bg-lights";
    this.lightCanvas.style.display = "none";
    this.lightContext = this.lightCanvas.getContext("2d");

    this.starsLayer = document.createElement("div");
    this.starsLayer.className = "spicy-dynamic-bg-stars";
    this.starsLayer.style.display = "none";

    this.shell.append(this.kawarpCanvas, this.lightCanvas, this.starsLayer);
    this.host.appendChild(this.shell);

    this.kawarp = new Kawarp(this.kawarpCanvas, kawarpOptions);

    this.resizeObserver = new ResizeObserver(() => {
      this.resizeLightCanvas();
      this.rebuildEmitters();
      this.rebuildStars(true);
    });
    this.resizeObserver.observe(this.host);

    this.resizeLightCanvas();
  }

  public async loadCover(coverUrl: string) {
    if (this.disposed || !coverUrl) return;
    if (coverUrl === this.currentCoverUrl) return;

    this.currentCoverUrl = coverUrl;
    this.shell.setAttribute("data-cover-id", coverUrl);
    this.kawarpCanvas.setAttribute("data-cover-id", coverUrl);

    await this.kawarp.loadImage(coverUrl);
    this.kawarp.start();

    const sampledCover = await sampleCoverArt(coverUrl);
    if (this.disposed || this.currentCoverUrl !== coverUrl) return;
    this.sampledCover = sampledCover;

    this.rebuildEmitters();
    this.rebuildStars(true);
  }

  public render(now: number): boolean {
    if (this.disposed || !this.host.isConnected || !this.shell.isConnected) {
      return false;
    }

    const settings = getSettings();
    const minDelta = 1000 / settings.fpsLimit;
    if (this.lastFrameAt !== 0 && now - this.lastFrameAt < minDelta) {
      return true;
    }

    const deltaMs = this.lastFrameAt === 0 ? minDelta : now - this.lastFrameAt;
    this.lastFrameAt = now;

    this.applySettingsChanges(settings);

    const snapshot = this.readAudioSnapshot();
    this.smoothSignals(snapshot, settings, deltaMs);
    this.updateKawarpSpeed(settings, snapshot, deltaMs);
    this.renderLights(settings, deltaMs, now);
    this.renderStars(settings, deltaMs, now);
    return true;
  }

  public async setTransitionDuration(duration: number) {
    if (this.disposed) return;
    await this.kawarp.setOptions({ transitionDuration: duration });
  }

  public dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.resizeObserver.disconnect();
    this.kawarp.dispose();
    this.stars = [];
    this.emitters = [];
    this.shell.remove();
  }

  private setLightsVisible(visible: boolean) {
    if (this.lightsVisible === visible) return;
    this.lightsVisible = visible;
    this.lightCanvas.style.display = visible ? "" : "none";
  }

  private setStarsVisible(visible: boolean) {
    if (this.starsVisible === visible) return;
    this.starsVisible = visible;
    this.starsLayer.style.display = visible ? "" : "none";
  }

  private applySettingsChanges(settings: BackgroundVisualSettings) {
    const settingsSignature = [
      settings.starsEnabled,
      settings.starShape,
      settings.starAmount,
      settings.starSize.toFixed(2),
    ].join("|");

    if (settingsSignature !== this.lastSettingsSignature) {
      this.lastSettingsSignature = settingsSignature;
      this.rebuildStars(true);
    }

    const performanceSignature = [settings.performanceMode, settings.fpsLimit].join("|");
    if (performanceSignature !== this.lastPerformanceSignature) {
      this.lastPerformanceSignature = performanceSignature;
      this.resizeLightCanvas();
      this.rebuildEmitters();
      this.rebuildStars(true);
    }
  }

  private getEmitterCount(settings: BackgroundVisualSettings) {
    if (settings.performanceMode === "low") {
      return this.host.tagName === "ASIDE" ? 8 : 10;
    }
    if (settings.performanceMode === "medium") {
      return this.host.tagName === "ASIDE" ? 12 : 16;
    }
    return this.host.tagName === "ASIDE" ? 16 : 22;
  }

  private getMaxStarCount(settings: BackgroundVisualSettings) {
    if (settings.performanceMode === "low") return 24;
    if (settings.performanceMode === "medium") return 48;
    return 82;
  }

  private hasCustomGlow(settings: BackgroundVisualSettings) {
    return (
      positiveTuning(settings.waveGlowStrength) > 0 ||
      positiveTuning(settings.beatBrightness) > 0 ||
      positiveTuning(settings.dropImpact) > 0 ||
      positiveTuning(settings.localWaveVariation) > 0 ||
      positiveTuning(settings.calmSectionIntensity) > 0 ||
      positiveTuning(settings.loudSectionIntensity) > 0
    );
  }

  private smoothSignals(
    snapshot: BackgroundAudioSnapshot,
    settings: BackgroundVisualSettings,
    deltaMs: number
  ) {
    const response = scaleAroundNeutral(settings.response, 2.45, 0.72);
    const attackMs = 120 * response;
    const releaseMs = 470 * response;

    const loudnessThreshold = mapAroundNeutral(
      settings.absoluteLoudnessScaling,
      0.3,
      0.18,
      0.48
    );
    const loudnessFloor = mapAroundNeutral(
      settings.absoluteLoudnessScaling,
      0.02,
      0.006,
      0.16
    );
    const loudnessGate = smoothstep(loudnessThreshold, 0.96, snapshot.absoluteLoudness);
    const gatedLoudness = clamp(
      Math.max(0, snapshot.absoluteLoudness - loudnessFloor) * lerp(0.46, 0.98, loudnessGate)
    );

    this.visualSignals.loudness = approach(
      this.visualSignals.loudness,
      gatedLoudness,
      deltaMs,
      attackMs,
      releaseMs
    );
    this.visualSignals.bass = approach(
      this.visualSignals.bass,
      snapshot.bass,
      deltaMs,
      attackMs * 0.9,
      releaseMs * 0.75
    );
    this.visualSignals.lowMid = approach(
      this.visualSignals.lowMid,
      snapshot.lowMid,
      deltaMs,
      attackMs * 0.86,
      releaseMs * 0.74
    );
    this.visualSignals.vocal = approach(
      this.visualSignals.vocal,
      snapshot.vocal,
      deltaMs,
      attackMs * 0.78,
      releaseMs * 0.85
    );
    this.visualSignals.presence = approach(
      this.visualSignals.presence,
      snapshot.presence,
      deltaMs,
      attackMs * 0.74,
      releaseMs * 0.8
    );
    this.visualSignals.air = approach(
      this.visualSignals.air,
      snapshot.air,
      deltaMs,
      attackMs * 0.7,
      releaseMs * 0.72
    );
    this.visualSignals.transient = approach(
      this.visualSignals.transient,
      snapshot.transient,
      deltaMs,
      attackMs * 0.72,
      releaseMs * 0.52
    );
    this.visualSignals.beat = approach(
      this.visualSignals.beat,
      snapshot.beat,
      deltaMs,
      attackMs * 0.58,
      releaseMs * 0.4
    );
    this.visualSignals.drop = approach(
      this.visualSignals.drop,
      snapshot.drop,
      deltaMs,
      attackMs * 0.54,
      releaseMs * 0.44
    );
    this.visualSignals.impact = approach(
      this.visualSignals.impact,
      clamp(snapshot.impact * (0.46 + loudnessGate * 0.78)),
      deltaMs,
      attackMs * 0.86,
      releaseMs * 0.62
    );
    this.visualSignals.movement = approach(
      this.visualSignals.movement,
      snapshot.movement,
      deltaMs,
      attackMs * 0.92,
      releaseMs * 0.82
    );
    this.visualSignals.stars = approach(
      this.visualSignals.stars,
      clamp(snapshot.starSignal * (0.76 + loudnessGate * 0.34)),
      deltaMs,
      attackMs * 0.62,
      releaseMs * 0.65
    );
  }

  private updateKawarpSpeed(
    settings: BackgroundVisualSettings,
    snapshot: BackgroundAudioSnapshot,
    deltaMs: number
  ) {
    const movementScale = scaleAroundNeutral(settings.movementSpeed, 0.42, 2.1);
    const beatdropScale = scaleAroundNeutral(settings.beatdropMultiplier, 0.62, 2.25);
    const dropDriveRaw =
      this.visualSignals.drop * 0.36 +
      this.visualSignals.impact * 0.22 +
      this.visualSignals.beat * 0.14 +
      this.visualSignals.transient * 0.05;
    const dropDrive = smoothstep(0.22, 0.88, dropDriveRaw);
    const dynamicBeatdrop = lerp(1, beatdropScale, dropDrive);
    const pausedBase = snapshot.isPlaying ? 1 : 0.1;
    const baseSpeed = snapshot.baseAnimationSpeed || pausedBase;
    const targetSpeed = clamp(baseSpeed * movementScale * dynamicBeatdrop, 0.06, 2.35);
    const speedResponse = scaleAroundNeutral(settings.response, 1.55, 0.82);
    const speed = approach(
      this.smoothedKawarpSpeed,
      targetSpeed,
      deltaMs,
      220 * speedResponse,
      720 * speedResponse
    );
    this.smoothedKawarpSpeed = speed;

    if (Math.abs(speed - this.lastKawarpSpeed) >= 0.02) {
      this.lastKawarpSpeed = speed;
      void this.kawarp.setOptions({ animationSpeed: speed });
    }
  }

  private resizeLightCanvas() {
    const rect = this.host.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width || this.host.clientWidth || 1));
    const height = Math.max(1, Math.round(rect.height || this.host.clientHeight || 1));
    const settings = getSettings();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.lightCanvas.width = Math.max(64, Math.round(width * settings.renderScale * dpr));
    this.lightCanvas.height = Math.max(64, Math.round(height * settings.renderScale * dpr));
  }

  private rebuildEmitters() {
    const rect = this.host.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) {
      this.emitters = [];
      return;
    }

    const settings = getSettings();
    const count = this.getEmitterCount(settings);

    const sample = this.sampledCover;
    if (!sample) {
      this.emitters = [];
      return;
    }

    const seed = createSeed(`${this.currentCoverUrl}|emitters|${this.host.tagName}`);
    const rng = createRng(seed);
    const emitters: Emitter[] = [];
    const candidates: Array<{
      x: number;
      y: number;
      score: number;
      color: [number, number, number];
    }> = [];

    const gridColumns = 10;
    const gridRows = 10;
    for (let row = 0; row < gridRows; row += 1) {
      for (let column = 0; column < gridColumns; column += 1) {
        const x = (column + 0.5 + (rng() - 0.5) * 0.6) * (sample.width / gridColumns);
        const y = (row + 0.5 + (rng() - 0.5) * 0.6) * (sample.height / gridRows);
        const color = samplePixel(sample, x, y);
        const { saturation, lightness } = rgbToHsl(color[0], color[1], color[2]);
        const contrast = sampleContrast(sample, x, y);
        const centeredness = 1 - Math.abs(y / sample.height - 0.5) * 0.18;
        const score =
          saturation * 0.54 +
          contrast * 0.28 +
          (1 - Math.abs(lightness - 0.5)) * 0.18 * centeredness;
        candidates.push({
          x: x / sample.width,
          y: y / sample.height,
          score,
          color,
        });
      }
    }

    candidates.sort((left, right) => right.score - left.score);

    const placeEmitter = (
      candidate: {
        x: number;
        y: number;
        score: number;
        color: [number, number, number];
      },
      minDistance: number
    ) => {
      const tooClose = emitters.some((emitter) => {
        const dx = emitter.x - candidate.x;
        const dy = emitter.y - candidate.y;
        return Math.sqrt(dx * dx + dy * dy) < minDistance;
      });
      if (tooClose) return false;

      emitters.push(
        this.createEmitter(
          candidate.x,
          candidate.y,
          candidate.color,
          candidate.score,
          rng
        )
      );
      return true;
    };

    const primarySpacing = this.host.tagName === "ASIDE" ? 0.14 : 0.12;
    const relaxedSpacing = primarySpacing * 0.72;

    for (const candidate of candidates) {
      if (emitters.length >= count) break;
      placeEmitter(candidate, primarySpacing);
    }

    if (emitters.length < count) {
      for (const candidate of candidates) {
        if (emitters.length >= count) break;
        placeEmitter(candidate, relaxedSpacing);
      }
    }

    this.emitters = emitters;
  }

  private createEmitter(
    x: number,
    y: number,
    color: [number, number, number],
    score: number,
    rng: () => number
  ): Emitter {
    const [red, green, blue] = color;
    const { lightness } = rgbToHsl(red, green, blue);

    return {
      x,
      y,
      radius: 0.22 + rng() * 0.1 + score * 0.18,
      stretchX: 1.35 + rng() * 1.35,
      stretchY: 0.82 + rng() * 0.38,
      rotation: (rng() - 0.5) * 1.05,
      featureScore: score,
      intensity: 0.56 + score * 0.42 + rng() * 0.18,
      sensitivity: 0.08 + rng() * 0.42,
      fadeSpeed: 0.78 + rng() * 0.48,
      flowAmplitudeX: 0.0004 + rng() * 0.0009,
      flowAmplitudeY: 0.00035 + rng() * 0.00072,
      flowSpeedX: 0.45 + rng() * 0.8,
      flowSpeedY: 0.4 + rng() * 0.7,
      phase: rng() * TAU,
      current: 0,
      color,
      glowColor: resolveGlowColor(color, score),
      redWeight: red / 255,
      greenWeight: green / 255,
      blueWeight: blue / 255,
      purpleWeight: Math.min(red, blue) / 255,
      lightness,
    };
  }

  private rebuildStars(force = false) {
    const settings = getSettings();
    if (!settings.starsEnabled && !force) return;

    this.starsLayer.innerHTML = "";
    this.stars = [];

    if (!settings.starsEnabled) {
      this.setStarsVisible(false);
      return;
    }

    this.setStarsVisible(true);

    const rect = this.host.getBoundingClientRect();
    const areaFactor = clamp(Math.sqrt((rect.width * rect.height) / (1280 * 720)), 0.45, 1);
    const areaAdjustedCount = Math.max(6, Math.round(settings.starAmount * areaFactor));
    const maxCount = this.getMaxStarCount(settings);
    const count = Math.min(areaAdjustedCount, maxCount);

    const seed = createSeed(`${this.currentCoverUrl}|stars|${this.host.tagName}`);
    const rng = createRng(seed);

    const shapes: StarShape[] = ["softDot", "realStar", "sparkleStar", "crossStar"];

    for (let index = 0; index < count; index += 1) {
      const star = document.createElement("div");
      const requestedShape = settings.starShape;
      const resolvedShape = (
        requestedShape === "mixed"
          ? (shapes[Math.floor(rng() * shapes.length)] ?? "softDot")
          : requestedShape
      ) as StarShape;

      const sizeScale = 0.64 + rng() * 1.14;
      const rotationDeg = resolvedShape === "softDot" ? 0 : -44 + rng() * 88;

      star.className = `spicy-dynamic-bg-star ${resolvedShape}`;
      star.style.left = `${(6 + rng() * 88).toFixed(2)}%`;
      star.style.top = `${(6 + rng() * 84).toFixed(2)}%`;
      star.style.setProperty(
        "--star-size",
        `${(settings.starSize * sizeScale).toFixed(2)}px`
      );
      star.style.setProperty("--star-rotation", `${rotationDeg.toFixed(2)}deg`);
      star.style.setProperty("--star-delay", `${(-rng() * 6).toFixed(2)}s`);
      star.style.setProperty(
        "--star-duration",
        `${(1.05 + (1 / settings.starTwinkleSpeed) * 1.4 + rng() * 2.8).toFixed(2)}s`
      );

      this.starsLayer.appendChild(star);
      this.stars.push({
        element: star,
        shape: resolvedShape,
        affinity: 0.5 + rng() * 0.75,
        sparkle: 0.56 + rng() * 1.12,
        vocalBias: 0.42 + rng() * 0.96,
        beatBias: 0.16 + rng() * 1.08,
        baseOpacity: 0.02 + rng() * 0.12,
        twinkleRate: 0.7 + rng() * 1.7,
        shimmerRate: 0.95 + rng() * 2.4,
        shimmerPhase: rng() * TAU,
        flareRate: 0.34 + rng() * 1.18,
        flarePhase: rng() * TAU,
        flareSharpness: 5 + rng() * 4.6,
        phase: rng() * TAU,
        sizeScale,
        rotationDeg,
        glowSpread: 0.78 + rng() * 1.04,
        lastOpacity: -1,
        lastBrightness: -1,
        lastScale: -1,
        lastGlow: -1,
        lastFlare: -1,
        lastCoreOpacity: -1,
        lastRotation: -1,
      });
    }
  }

  private renderLights(settings: BackgroundVisualSettings, deltaMs: number, now: number) {
    const context = this.lightContext;
    if (!context) return;

    const width = this.lightCanvas.width;
    const height = this.lightCanvas.height;
    context.clearRect(0, 0, width, height);

    if (!this.emitters.length || !this.hasCustomGlow(settings)) {
      this.setLightsVisible(false);
      return;
    }

    this.setLightsVisible(true);

    const waveGlowScale = scaleAroundNeutral(settings.waveGlowStrength, 0.34, 2.35);
    const beatBrightnessScale = scaleAroundNeutral(settings.beatBrightness, 0.55, 1.75);
    const impactScale = scaleAroundNeutral(settings.dropImpact, 0.55, 1.95);
    const localVariationScale = scaleAroundNeutral(settings.localWaveVariation, 0.55, 2.05);
    const calmScale = scaleAroundNeutral(settings.calmSectionIntensity, 0.2, 1.35);
    const loudScale = scaleAroundNeutral(settings.loudSectionIntensity, 0.62, 1.72);
    const glowLimitScale = mapAroundNeutral(settings.glowLimit, 0.082, 0.035, 0.16);
    const waveGlowPositive = positiveTuning(settings.waveGlowStrength);
    const waveGlowNegative = negativeTuning(settings.waveGlowStrength);
    const brightnessPositive = positiveTuning(settings.beatBrightness);
    const impactPositive = positiveTuning(settings.dropImpact);
    const impactNegative = negativeTuning(settings.dropImpact);
    const localVariationPositive = positiveTuning(settings.localWaveVariation);
    const localVariationNegative = negativeTuning(settings.localWaveVariation);
    const calmPositive = positiveTuning(settings.calmSectionIntensity);
    const loudPositive = positiveTuning(settings.loudSectionIntensity);
    const fieldEnergy = clamp(
      this.visualSignals.loudness * 0.14 +
        this.visualSignals.bass * 0.17 +
        this.visualSignals.lowMid * 0.12 +
        this.visualSignals.beat * 0.12 +
        this.visualSignals.drop * 0.18 +
        this.visualSignals.transient * 0.05 +
        this.visualSignals.presence * 0.05 +
        this.visualSignals.vocal * 0.06
    );
    const pulseEnergy = clamp(
      this.visualSignals.beat * 0.28 +
        this.visualSignals.drop * 0.28 +
        this.visualSignals.transient * 0.1 +
        this.visualSignals.bass * 0.08 +
        this.visualSignals.loudness * 0.06
    );
    const loudSectionEnergy = clamp(
      this.visualSignals.drop * 0.4 +
        this.visualSignals.impact * 0.32 +
        this.visualSignals.loudness * 0.1 +
        this.visualSignals.beat * 0.06
    );
    const chorusLift = clamp(loudSectionEnergy * loudScale);
    const sceneEnergy = clamp(fieldEnergy * 0.72 + pulseEnergy * 0.12 + chorusLift * 0.32);
    const localParticipation = smoothstep(0.12, 0.4, sceneEnergy);
    const broadParticipation = smoothstep(0.34, 0.72, sceneEnergy + chorusLift * 0.14);
    const peakParticipation = smoothstep(0.58, 0.98, chorusLift + sceneEnergy * 0.22);
    const activeRegionFraction = clamp(
      0.1 +
        waveGlowPositive * 0.04 +
        localParticipation * (0.1 + calmPositive * 0.035) +
        broadParticipation * (0.11 + impactPositive * 0.13) +
        peakParticipation * (0.16 + impactPositive * 0.17 + loudPositive * 0.045) -
        impactNegative * 0.18 -
        localVariationNegative * 0.1,
      0.08,
      lerp(0.55, 0.82, clamp(peakParticipation * 0.75 + impactPositive * 0.25))
    );
    const fieldFloor = clamp(
      fieldEnergy *
        localParticipation *
        calmScale *
        (0.012 + waveGlowPositive * 0.04 + brightnessPositive * 0.012) *
        lerp(1, 0.5, waveGlowNegative),
      0,
      0.075
    );
    const chorusField = clamp(
      (chorusLift * 0.42 + broadParticipation * 0.03 + peakParticipation * 0.052) *
        (0.014 + waveGlowPositive * 0.028 + impactPositive * 0.018 + loudPositive * 0.026),
      0,
      0.11
    );

    const rawTargets: number[] = [];
    const sortedTargets: number[] = [];
    for (const emitter of this.emitters) {
      const warmSignal =
        emitter.redWeight *
        (this.visualSignals.bass * 0.46 +
          this.visualSignals.lowMid * 0.22 +
          this.visualSignals.beat * 0.08);
      const coolSignal =
        emitter.blueWeight *
        (this.visualSignals.air * 0.22 +
          this.visualSignals.presence * 0.18 +
          this.visualSignals.drop * 0.08);
      const greenSignal =
        emitter.greenWeight *
        (this.visualSignals.lowMid * 0.24 +
          this.visualSignals.loudness * 0.12 +
          this.visualSignals.presence * 0.1);
      const purpleSignal =
        emitter.purpleWeight *
        (this.visualSignals.vocal * 0.18 +
          this.visualSignals.air * 0.08 +
          this.visualSignals.drop * 0.06);

      const colorSignal =
        (warmSignal + coolSignal + purpleSignal + greenSignal) *
        (0.64 + emitter.featureScore * 0.55) *
        localVariationScale;
      const activationEnergy =
        sceneEnergy * 0.68 +
        pulseEnergy * 0.18 +
        emitter.featureScore * (0.08 + localVariationPositive * 0.12);
      const activationGate = smoothstep(
        emitter.sensitivity - (0.12 + impactPositive * 0.1 + localVariationPositive * 0.05),
        emitter.sensitivity + (0.26 - impactNegative * 0.05 + localVariationPositive * 0.04),
        activationEnergy
      );
      const localAccent = lerp(
        1 - localVariationPositive * 0.22,
        1 + localVariationPositive * 0.36,
        clamp(emitter.featureScore * 1.25)
      );

      const rawTarget = clamp(
        (fieldFloor * waveGlowScale +
          chorusField * (0.62 + emitter.featureScore * 0.28) +
          colorSignal *
            (0.095 + waveGlowPositive * 0.12 + localParticipation * 0.035) +
          fieldEnergy * waveGlowScale * (0.022 + broadParticipation * 0.055) +
          pulseEnergy * impactScale * (0.052 + peakParticipation * 0.035)) *
          emitter.intensity *
          beatBrightnessScale *
          (0.78 + emitter.featureScore * 0.28) *
          localAccent *
          activationGate
      );

      rawTargets.push(rawTarget);
      sortedTargets.push(rawTarget);
    }

    sortedTargets.sort((left, right) => right - left);
    const activeCount = Math.max(1, Math.round(this.emitters.length * activeRegionFraction));
    const cutoff = sortedTargets[activeCount - 1] ?? 0;

    const activeIntensities: number[] = [];
    for (const [index, emitter] of this.emitters.entries()) {
      const rawTarget = rawTargets[index] ?? 0;
      const regionalGate =
        cutoff <= 0
          ? 1
          : smoothstep(
              Math.max(0, cutoff * lerp(0.3, 0.16, broadParticipation)),
              Math.max(0.001, cutoff * lerp(1.12, 0.94, peakParticipation)),
              rawTarget + fieldFloor * (0.04 + broadParticipation * 0.08) + chorusField * 0.08
            );
      const floorTarget =
        (fieldFloor * (0.16 + emitter.featureScore * 0.12) +
          chorusField * (0.06 + peakParticipation * 0.08)) *
        lerp(1, 0.58, waveGlowNegative);
      const target = clamp(
        Math.max(floorTarget, rawTarget * regionalGate) *
          (0.82 + emitter.featureScore * 0.2) *
          lerp(1, 1.18, peakParticipation)
      );

      emitter.current = approach(
        emitter.current,
        target,
        deltaMs,
        102 / emitter.fadeSpeed,
        390 * emitter.fadeSpeed
      );

      activeIntensities.push(emitter.current * emitter.radius);
    }

    const combinedGlow =
      activeIntensities.reduce((sum, value) => sum + value, 0) / Math.max(1, this.emitters.length);
    const brightnessPressure = clamp(
      waveGlowPositive * 0.32 +
        brightnessPositive * 0.34 +
        impactPositive * 0.18 +
        loudPositive * 0.16
    );
    const safeGlowLimit =
      glowLimitScale * lerp(1, 0.72, brightnessPressure * (0.35 + broadParticipation * 0.65));
    const globalScale = combinedGlow > safeGlowLimit ? safeGlowLimit / combinedGlow : 1;
    const fieldBloom =
      0.34 + waveGlowPositive * 0.18 + impactPositive * 0.09 + peakParticipation * 0.1;

    context.globalCompositeOperation = "screen";

    for (const emitter of this.emitters) {
      const brightColorGuard = lerp(1, 0.58, smoothstep(0.64, 0.92, emitter.lightness));
      const brightSceneGuard = lerp(1, 0.78, brightnessPressure * broadParticipation);
      const alphaGuard = brightColorGuard * brightSceneGuard;
      const intensity = emitter.current * globalScale;
      if (intensity <= 0.01) continue;

      const motion = 0.045 + this.visualSignals.movement * 0.09;
      const offsetX =
        Math.sin(now * 0.00018 * emitter.flowSpeedX + emitter.phase) *
        emitter.flowAmplitudeX *
        motion;
      const offsetY =
        Math.cos(now * 0.00017 * emitter.flowSpeedY + emitter.phase * 0.83) *
        emitter.flowAmplitudeY *
        motion;
      const x = (emitter.x + offsetX) * width;
      const y = (emitter.y + offsetY) * height;
      const radius = Math.max(
        28,
        emitter.radius *
          Math.min(width, height) *
          (0.78 +
            fieldBloom * 0.16 +
            this.visualSignals.beat * 0.04 +
            this.visualSignals.drop * 0.08)
      );
      const haloRadius = radius * (1 + waveGlowPositive * 0.14 + peakParticipation * 0.1);
      const pulseRadius =
        radius * (0.62 + this.visualSignals.beat * 0.035 + this.visualSignals.drop * 0.065);

      const [red, green, blue] = emitter.glowColor;
      const outerAlpha = clamp(
        intensity *
          alphaGuard *
          (0.028 +
            waveGlowPositive * 0.044 +
            brightnessPositive * 0.022 +
            peakParticipation * 0.04),
        0,
        0.16
      );
      const pulseAlpha = clamp(
        intensity *
          alphaGuard *
          (0.026 +
            brightnessPositive * 0.032 +
            pulseEnergy * 0.028 +
            peakParticipation * 0.026 +
            this.visualSignals.presence * 0.008),
        0,
        0.13
      );

      context.save();
      context.translate(x, y);
      context.rotate(emitter.rotation);
      context.scale(emitter.stretchX, emitter.stretchY);

      const haloGradient = context.createRadialGradient(0, 0, 0, 0, 0, haloRadius);
      haloGradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, ${outerAlpha * 0.42})`);
      haloGradient.addColorStop(0.22, `rgba(${red}, ${green}, ${blue}, ${outerAlpha})`);
      haloGradient.addColorStop(0.62, `rgba(${red}, ${green}, ${blue}, ${outerAlpha * 0.34})`);
      haloGradient.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`);

      context.fillStyle = haloGradient;
      context.beginPath();
      context.arc(0, 0, haloRadius, 0, TAU);
      context.fill();

      const pulseGradient = context.createRadialGradient(0, 0, 0, 0, 0, pulseRadius);
      pulseGradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, ${pulseAlpha * 0.5})`);
      pulseGradient.addColorStop(0.28, `rgba(${red}, ${green}, ${blue}, ${pulseAlpha})`);
      pulseGradient.addColorStop(0.78, `rgba(${red}, ${green}, ${blue}, ${pulseAlpha * 0.14})`);
      pulseGradient.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`);

      context.fillStyle = pulseGradient;
      context.beginPath();
      context.arc(0, 0, pulseRadius, 0, TAU);
      context.fill();
      context.restore();
    }

    context.globalCompositeOperation = "source-over";
  }

  private renderStars(settings: BackgroundVisualSettings, deltaMs: number, now: number) {
    if (!settings.starsEnabled || !this.stars.length) {
      this.setStarsVisible(false);
      return;
    }

    this.setStarsVisible(true);

    const phraseEnergy = clamp(
      this.visualSignals.stars * 0.54 +
        this.visualSignals.vocal * 0.3 +
        this.visualSignals.air * 0.1 +
        this.visualSignals.presence * 0.06
    );
    const sustainEnergy = clamp(
      this.visualSignals.stars * 0.38 +
        this.visualSignals.vocal * 0.42 +
        this.visualSignals.air * 0.14 +
        this.visualSignals.presence * 0.06
    );
    const breathEnergy = clamp(
      this.visualSignals.air * 0.4 +
        this.visualSignals.presence * 0.22 +
        this.visualSignals.stars * 0.16 +
        this.visualSignals.vocal * 0.1
    );
    const beatEnergy = clamp(
      this.visualSignals.transient * 0.16 +
        this.visualSignals.beat * 0.12 +
        this.visualSignals.drop * 0.08 +
        this.visualSignals.bass * 0.03
    );
    const vocalDrive = clamp(
      (phraseEnergy * 0.56 + sustainEnergy * 0.44) * settings.starVocalSensitivity
    );
    const beatDrive = clamp(beatEnergy * settings.starBeatSensitivity * 0.42);

    for (const star of this.stars) {
      const slowTwinkle =
        (Math.sin(now * 0.00062 * settings.starTwinkleSpeed * star.twinkleRate + star.phase) + 1) /
        2;
      const shimmer =
        (Math.sin(
          now * 0.00142 * settings.starTwinkleSpeed * star.shimmerRate + star.shimmerPhase
        ) + 1) / 2;
      const microFlicker =
        (Math.sin(
          now * 0.00245 * settings.starTwinkleSpeed * (star.shimmerRate * 0.82 + 0.48) +
            star.shimmerPhase * 1.7
        ) + 1) / 2;
      const livingTwinkle = slowTwinkle * 0.5 + shimmer * 0.34 + microFlicker * 0.16;
      const peakA = Math.pow(
        (Math.sin(now * 0.00031 * settings.starTwinkleSpeed * star.flareRate + star.flarePhase) +
          1) /
          2,
        star.flareSharpness
      );
      const peakB = Math.pow(
        (Math.sin(
          now * 0.00047 * settings.starTwinkleSpeed * (star.flareRate * 1.18) +
            star.flarePhase * 1.43
        ) +
          1) /
          2,
        star.flareSharpness + 1.35
      );
      const rarePeak = Math.max(peakA * 0.82, peakB);

      let shapeFlareBoost = 1;
      let shapeGlowBoost = 1;
      let shapeScaleBoost = 1;
      switch (star.shape) {
        case "sparkleStar":
          shapeFlareBoost = 1.52;
          shapeGlowBoost = 1.28;
          shapeScaleBoost = 1.12;
          break;
        case "crossStar":
          shapeFlareBoost = 1.34;
          shapeGlowBoost = 1.18;
          shapeScaleBoost = 1.08;
          break;
        case "realStar":
          shapeFlareBoost = 1.16;
          shapeGlowBoost = 1.12;
          shapeScaleBoost = 1.04;
          break;
        default:
          shapeFlareBoost = 0.82;
          shapeGlowBoost = 0.94;
          shapeScaleBoost = 1;
          break;
      }

      const vocalLift =
        vocalDrive *
        star.vocalBias *
        star.affinity *
        (0.22 + slowTwinkle * 0.18 + livingTwinkle * 0.12 + sustainEnergy * 0.14);
      const breathLift =
        breathEnergy * star.glowSpread * (0.08 + slowTwinkle * 0.12 + shimmer * 0.08);
      const beatLift =
        beatDrive *
        star.beatBias *
        (0.03 + microFlicker * 0.08 + rarePeak * 0.03) *
        shapeFlareBoost;
      const flare = clamp(
        rarePeak * (0.4 + vocalDrive * 0.56) * star.sparkle * shapeFlareBoost +
          vocalLift * 0.2 +
          breathLift * 0.22 +
          beatLift * 0.08,
        0,
        2
      );
      const targetOpacity = clamp(
        star.baseOpacity * (0.36 + livingTwinkle * 0.58) +
          vocalLift * 0.2 +
          breathLift * 0.12 +
          beatLift * 0.03 +
          flare * 0.14,
        0.02,
        0.84
      );
      const targetBrightness = clamp(
        settings.starBrightness *
          (0.36 +
            livingTwinkle * 0.6 +
            vocalLift * 0.42 +
            breathLift * 0.22 +
            beatLift * 0.06 +
            flare * 0.92),
        0.22,
        4.9
      );
      const targetScale = clamp(
        0.82 +
          livingTwinkle * 0.18 +
          vocalLift * 0.1 +
          breathLift * 0.04 +
          flare * 0.24 * shapeScaleBoost +
          star.sizeScale * 0.05,
        0.7,
        1.74
      );
      const targetGlow = clamp(
        0.16 +
          livingTwinkle * 0.28 +
          vocalLift * 0.2 +
          breathLift * 0.2 +
          beatLift * 0.03 +
          flare * 0.76 * shapeGlowBoost,
        0.08,
        1.82
      );
      const targetCoreOpacity = clamp(
        0.42 + livingTwinkle * 0.2 + vocalLift * 0.14 + breathLift * 0.05 + flare * 0.28,
        0.3,
        1
      );

      const opacity = approach(
        star.lastOpacity < 0 ? targetOpacity : star.lastOpacity,
        targetOpacity,
        deltaMs,
        64,
        230
      );
      const brightness = approach(
        star.lastBrightness < 0 ? targetBrightness : star.lastBrightness,
        targetBrightness,
        deltaMs,
        52,
        190
      );
      const scale = approach(
        star.lastScale < 0 ? targetScale : star.lastScale,
        targetScale,
        deltaMs,
        58,
        180
      );
      const glow = approach(
        star.lastGlow < 0 ? targetGlow : star.lastGlow,
        targetGlow,
        deltaMs,
        46,
        160
      );
      const previousOpacity = star.lastOpacity;
      const previousBrightness = star.lastBrightness;
      const previousScale = star.lastScale;
      const previousGlow = star.lastGlow;
      const previousFlare = star.lastFlare;
      const previousCoreOpacity = star.lastCoreOpacity;
      const previousRotation = star.lastRotation;
      const finalRotation = star.rotationDeg + flare * 2.6;

      if (changedEnough(previousOpacity, opacity, 0.012)) {
        star.element.style.opacity = opacity.toFixed(3);
      }
      if (changedEnough(previousBrightness, brightness, 0.03)) {
        star.element.style.setProperty("--star-brightness", brightness.toFixed(3));
      }
      if (changedEnough(previousScale, scale, 0.018)) {
        star.element.style.setProperty("--star-scale", scale.toFixed(3));
      }
      if (changedEnough(previousGlow, glow, 0.03)) {
        star.element.style.setProperty("--star-glow", glow.toFixed(3));
      }
      if (changedEnough(previousFlare, flare, 0.025)) {
        star.element.style.setProperty("--star-flare", flare.toFixed(3));
      }
      if (changedEnough(previousCoreOpacity, targetCoreOpacity, 0.025)) {
        star.element.style.setProperty("--star-core-opacity", targetCoreOpacity.toFixed(3));
      }
      if (changedEnough(previousRotation, finalRotation, 0.18)) {
        star.element.style.setProperty("--star-rotation", `${finalRotation.toFixed(2)}deg`);
      }

      star.lastOpacity = opacity;
      star.lastBrightness = brightness;
      star.lastScale = scale;
      star.lastGlow = glow;
      star.lastFlare = flare;
      star.lastCoreOpacity = targetCoreOpacity;
      star.lastRotation = finalRotation;
    }
  }
}
