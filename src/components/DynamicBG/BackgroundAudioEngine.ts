import type {
  AudioAnalysisData,
  BackgroundAudioSnapshot,
  Beat,
  Section,
  Segment,
  TimeInterval,
} from "./types.ts";

const TAU = Math.PI * 2;

const DEFAULT_SNAPSHOT: BackgroundAudioSnapshot = {
  absoluteLoudness: 0,
  bass: 0,
  lowMid: 0,
  vocal: 0,
  presence: 0,
  air: 0,
  transient: 0,
  beat: 0,
  drop: 0,
  movement: 0,
  impact: 0,
  overallEnergy: 0,
  starSignal: 0,
  baseAnimationSpeed: 1,
  isPlaying: false,
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function normalizeRange(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return clamp((value - min) / (max - min));
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maxN(values: number[], count: number): number[] {
  if (count <= 0) return [];
  return [...values].sort((a, b) => b - a).slice(0, count);
}

interface LiveFrequencySnapshot {
  rms: number;
  bass: number;
  lowMid: number;
  vocal: number;
  presence: number;
  air: number;
  transient: number;
}

class LiveFrequencyAnalyser {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private frequencyData: Uint8Array | null = null;
  private timeDomainData: Float32Array | null = null;
  private mediaElement: HTMLMediaElement | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private hardFailure = false;
  private lastTotalEnergy = 0;

  private ensureConnected(): boolean {
    if (this.hardFailure) return false;

    const mediaElement = document.querySelector<HTMLMediaElement>("audio");
    if (!mediaElement) {
      return false;
    }

    if (
      this.mediaElement === mediaElement &&
      this.audioContext &&
      this.analyserNode &&
      this.frequencyData &&
      this.timeDomainData
    ) {
      if (this.audioContext.state === "suspended") {
        void this.audioContext.resume().catch(() => undefined);
      }
      return true;
    }

    try {
      this.dispose(false);

      const AudioContextCtor =
        window.AudioContext ??
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) {
        this.hardFailure = true;
        return false;
      }

      const captureCapableMedia = mediaElement as HTMLMediaElement & {
        captureStream?: () => MediaStream;
      };
      const capturedStream = captureCapableMedia.captureStream?.();
      if (!capturedStream) {
        return false;
      }

      const audioContext = new AudioContextCtor();
      const mediaStreamSource = audioContext.createMediaStreamSource(capturedStream);
      const analyserNode = audioContext.createAnalyser();

      analyserNode.fftSize = 1024;
      analyserNode.smoothingTimeConstant = 0.58;

      mediaStreamSource.connect(analyserNode);

      this.audioContext = audioContext;
      this.analyserNode = analyserNode;
      this.frequencyData = new Uint8Array(analyserNode.frequencyBinCount);
      this.timeDomainData = new Float32Array(analyserNode.fftSize);
      this.mediaElement = mediaElement;
      this.mediaStreamSource = mediaStreamSource;
      this.lastTotalEnergy = 0;

      if (audioContext.state === "suspended") {
        void audioContext.resume().catch(() => undefined);
      }
      return true;
    } catch {
      this.dispose(false);
      return false;
    }
  }

  private getBandEnergy(minHz: number, maxHz: number): number {
    if (!this.audioContext || !this.analyserNode || !this.frequencyData) {
      return 0;
    }

    const nyquist = this.audioContext.sampleRate / 2;
    const minIndex = Math.floor((minHz / nyquist) * this.frequencyData.length);
    const maxIndex = Math.ceil((maxHz / nyquist) * this.frequencyData.length);

    if (maxIndex <= minIndex) {
      return 0;
    }

    let sum = 0;
    let count = 0;
    for (
      let index = Math.max(0, minIndex);
      index < Math.min(this.frequencyData.length, maxIndex);
      index += 1
    ) {
      const normalized = this.frequencyData[index] / 255;
      sum += normalized * normalized;
      count += 1;
    }

    return count > 0 ? Math.sqrt(sum / count) : 0;
  }

  public sample(): LiveFrequencySnapshot | null {
    if (
      !this.ensureConnected() ||
      !this.analyserNode ||
      !this.frequencyData ||
      !this.timeDomainData
    ) {
      return null;
    }

    this.analyserNode.getByteFrequencyData(this.frequencyData as Uint8Array<ArrayBuffer>);
    this.analyserNode.getFloatTimeDomainData(this.timeDomainData as Float32Array<ArrayBuffer>);

    let sumSquares = 0;
    for (const sample of this.timeDomainData) {
      sumSquares += sample * sample;
    }
    const rms = Math.sqrt(sumSquares / this.timeDomainData.length);

    const bass = this.getBandEnergy(20, 140);
    const lowMid = this.getBandEnergy(140, 420);
    const vocal = this.getBandEnergy(420, 2400);
    const presence = this.getBandEnergy(2400, 5400);
    const air = this.getBandEnergy(5400, 12000);

    const totalEnergy = bass * 0.32 + lowMid * 0.18 + vocal * 0.24 + presence * 0.14 + air * 0.12;
    const transient = clamp((totalEnergy - this.lastTotalEnergy) * 4.5);
    this.lastTotalEnergy = lerp(this.lastTotalEnergy, totalEnergy, 0.48);

    return {
      rms: clamp(rms * 5.4),
      bass,
      lowMid,
      vocal,
      presence,
      air,
      transient,
    };
  }

  public dispose(markHardFailure = true) {
    if (markHardFailure) {
      this.hardFailure = true;
    }

    try {
      this.mediaStreamSource?.disconnect();
    } catch {
      // Ignore disconnect failures from partially initialized nodes.
    }

    try {
      void this.audioContext?.close();
    } catch {
      // Ignore teardown failures.
    }

    this.audioContext = null;
    this.analyserNode = null;
    this.frequencyData = null;
    this.timeDomainData = null;
    this.mediaElement = null;
    this.mediaStreamSource = null;
    this.lastTotalEnergy = 0;
  }
}

function normalizeDb(value: number | undefined): number {
  if (value === undefined || Number.isNaN(value)) return 0;
  return smoothstep(-42, -4, value);
}

function pitchRichness(segment: Segment | null): number {
  if (!segment?.pitches?.length) return 0;
  return average(maxN(segment.pitches, 3));
}

function timbreValue(segment: Segment | null, index: number, min: number, max: number): number {
  const value = segment?.timbre?.[index];
  if (typeof value !== "number") return 0;
  return normalizeRange(value, min, max);
}

export class BackgroundAudioEngine {
  private readonly liveAnalyser = new LiveFrequencyAnalyser();
  private activeTrackId: string | null = null;
  private lastTimeSeconds = 0;
  private sectionIndex = 0;
  private beatIndex = 0;
  private segmentIndex = 0;

  private resetIndices(trackId: string | null) {
    this.activeTrackId = trackId;
    this.lastTimeSeconds = 0;
    this.sectionIndex = 0;
    this.beatIndex = 0;
    this.segmentIndex = 0;
  }

  private advanceIndex<T extends TimeInterval>(
    items: T[],
    currentTime: number,
    currentIndex: number
  ): number {
    if (!items.length) return 0;

    let nextIndex = Math.min(currentIndex, items.length - 1);

    while (
      nextIndex < items.length - 1 &&
      currentTime >= items[nextIndex].start + items[nextIndex].duration
    ) {
      nextIndex += 1;
    }

    while (nextIndex > 0 && currentTime < items[nextIndex].start) {
      nextIndex -= 1;
    }

    return nextIndex;
  }

  private getCurrentSection(data: AudioAnalysisData, currentTime: number): Section | null {
    if (!data.sections.length) return null;
    this.sectionIndex = this.advanceIndex(data.sections, currentTime, this.sectionIndex);
    return data.sections[this.sectionIndex] ?? null;
  }

  private getCurrentBeat(data: AudioAnalysisData, currentTime: number): Beat | null {
    if (!data.beats.length) return null;
    this.beatIndex = this.advanceIndex(data.beats, currentTime, this.beatIndex);
    return data.beats[this.beatIndex] ?? null;
  }

  private getCurrentSegment(data: AudioAnalysisData, currentTime: number): Segment | null {
    if (!data.segments.length) return null;
    this.segmentIndex = this.advanceIndex(data.segments, currentTime, this.segmentIndex);
    return data.segments[this.segmentIndex] ?? null;
  }

  private getBeatPulse(currentBeat: Beat | null, currentTime: number): number {
    if (!currentBeat || currentBeat.confidence < 0.2 || currentBeat.duration <= 0) {
      return 0;
    }

    const progress = clamp((currentTime - currentBeat.start) / currentBeat.duration);
    const pulse = Math.exp(-5.2 * progress) * currentBeat.confidence;
    return clamp(pulse);
  }

  private getAnalysisBandFallbacks(segment: Segment | null, absoluteLoudness: number) {
    const pitchEnergy = pitchRichness(segment);
    const body = timbreValue(segment, 0, -120, 120);
    const brightness = timbreValue(segment, 1, -120, 120);
    const shimmer = timbreValue(segment, 3, -120, 120);
    const air = timbreValue(segment, 5, -120, 120);

    return {
      bass: clamp(absoluteLoudness * 0.62 + body * 0.24),
      lowMid: clamp(absoluteLoudness * 0.48 + body * 0.22 + brightness * 0.1),
      vocal: clamp(absoluteLoudness * 0.38 + pitchEnergy * 0.36 + brightness * 0.18),
      presence: clamp(brightness * 0.38 + pitchEnergy * 0.24 + absoluteLoudness * 0.24),
      air: clamp(shimmer * 0.32 + air * 0.38 + pitchEnergy * 0.16 + absoluteLoudness * 0.08),
    };
  }

  public getSnapshot(
    trackId: string | null,
    currentTimeMs: number,
    analysis: AudioAnalysisData | null,
    isPlaying: boolean
  ): BackgroundAudioSnapshot {
    if (!trackId || !isPlaying) {
      this.resetIndices(trackId);
      const live = this.liveAnalyser.sample();
      if (!live) {
        return {
          ...DEFAULT_SNAPSHOT,
          isPlaying,
        };
      }

      const passiveEnergy = clamp(live.rms * 0.35);
      return {
        ...DEFAULT_SNAPSHOT,
        absoluteLoudness: passiveEnergy,
        bass: live.bass * 0.35,
        lowMid: live.lowMid * 0.3,
        vocal: live.vocal * 0.28,
        presence: live.presence * 0.25,
        air: live.air * 0.22,
        transient: 0,
        beat: passiveEnergy * 0.12,
        drop: passiveEnergy * 0.08,
        movement: passiveEnergy * 0.2,
        impact: passiveEnergy * 0.15,
        overallEnergy: passiveEnergy,
        starSignal: clamp(
          live.vocal * 0.52 +
            live.air * 0.28 +
            live.presence * 0.16 -
            live.bass * 0.14 -
            live.lowMid * 0.06
        ),
        isPlaying,
      };
    }

    const currentTimeSeconds = Math.max(0, currentTimeMs / 1000);
    if (trackId !== this.activeTrackId || currentTimeSeconds + 1 < this.lastTimeSeconds) {
      this.resetIndices(trackId);
    }
    this.lastTimeSeconds = currentTimeSeconds;

    const live = this.liveAnalyser.sample();
    if (!analysis) {
      if (!live) {
        return {
          ...DEFAULT_SNAPSHOT,
          isPlaying,
        };
      }

      const overallEnergy = clamp(live.rms * 0.85 + live.bass * 0.1 + live.vocal * 0.05);
      const beat = clamp(live.bass * 0.42 + live.transient * 0.42 + live.lowMid * 0.16);
      const drop = clamp(live.bass * 0.46 + live.transient * 0.34 + overallEnergy * 0.2);
      return {
        ...DEFAULT_SNAPSHOT,
        absoluteLoudness: clamp(live.rms * 1.18),
        bass: live.bass,
        lowMid: live.lowMid,
        vocal: live.vocal,
        presence: live.presence,
        air: live.air,
        transient: live.transient,
        beat,
        drop,
        movement: clamp(overallEnergy * 0.65 + beat * 0.22 + live.transient * 0.18),
        impact: clamp(drop * 0.72 + live.transient * 0.18 + overallEnergy * 0.12),
        overallEnergy,
        starSignal: clamp(
          live.vocal * 0.86 +
            live.air * 0.48 +
            live.presence * 0.28 +
            live.transient * 0.03 -
            live.bass * 0.18 -
            live.lowMid * 0.08
        ),
        isPlaying,
      };
    }

    const currentSection = this.getCurrentSection(analysis, currentTimeSeconds);
    const currentBeat = this.getCurrentBeat(analysis, currentTimeSeconds);
    const currentSegment = this.getCurrentSegment(analysis, currentTimeSeconds);

    const trackLoudness = normalizeDb(analysis.track.loudness);
    const sectionLoudness = normalizeDb(currentSection?.loudness ?? analysis.track.loudness);
    const segmentLoudness = normalizeDb(
      currentSegment?.loudness_max ??
        currentSegment?.loudness_start ??
        currentSection?.loudness ??
        analysis.track.loudness
    );

    const absoluteLoudness = clamp(
      trackLoudness * 0.18 + sectionLoudness * 0.34 + segmentLoudness * 0.48
    );

    const beatPulse = this.getBeatPulse(currentBeat, currentTimeSeconds);
    const segmentTransient = clamp(
      normalizeRange(currentSegment?.loudness_max_time ?? 0, 0.01, 0.12) * 0.55 +
        normalizeDb(currentSegment?.loudness_max) * 0.22
    );
    const fallbackBands = this.getAnalysisBandFallbacks(currentSegment, absoluteLoudness);

    const bass = live ? lerp(fallbackBands.bass, live.bass, 0.76) : fallbackBands.bass;
    const lowMid = live ? lerp(fallbackBands.lowMid, live.lowMid, 0.7) : fallbackBands.lowMid;
    const vocal = live ? lerp(fallbackBands.vocal, live.vocal, 0.78) : fallbackBands.vocal;
    const presence = live
      ? lerp(fallbackBands.presence, live.presence, 0.72)
      : fallbackBands.presence;
    const air = live ? lerp(fallbackBands.air, live.air, 0.78) : fallbackBands.air;
    const transient = clamp(
      (live?.transient ?? 0) * 0.72 + segmentTransient * 0.58 + beatPulse * 0.18
    );

    const tempo = currentSection?.tempo ?? analysis.track.tempo;
    const tempoFactor = smoothstep(76, 168, tempo);
    const beat = clamp(
      beatPulse * 0.58 + bass * 0.18 + lowMid * 0.1 + transient * 0.12 + absoluteLoudness * 0.1
    );
    const drop = clamp(
      absoluteLoudness * 0.18 +
        bass * 0.24 +
        lowMid * 0.08 +
        transient * 0.24 +
        beatPulse * 0.16 +
        tempoFactor * 0.1
    );
    const movement = clamp(
      tempoFactor * 0.24 + absoluteLoudness * 0.24 + beat * 0.3 + drop * 0.16 + transient * 0.06
    );
    const impact = clamp(drop * 0.58 + beat * 0.22 + absoluteLoudness * 0.14 + transient * 0.06);
    const overallEnergy = clamp(
      absoluteLoudness * 0.28 +
        bass * 0.16 +
        lowMid * 0.1 +
        vocal * 0.16 +
        air * 0.08 +
        beat * 0.12 +
        drop * 0.1
    );
    const sustainContour = clamp(
      vocal * 0.58 +
        air * 0.24 +
        presence * 0.18 +
        absoluteLoudness * 0.06 -
        transient * 0.08 -
        bass * 0.12 -
        lowMid * 0.04
    );
    const starSignal = clamp(
      vocal * 0.82 +
        air * 0.42 +
        presence * 0.28 +
        sustainContour * 0.26 +
        absoluteLoudness * 0.04 -
        bass * 0.18 -
        lowMid * 0.08 -
        beatPulse * 0.09 +
        Math.sin(currentTimeSeconds * 0.75 + TAU * 0.125) * 0.016
    );

    return {
      ...DEFAULT_SNAPSHOT,
      absoluteLoudness,
      bass,
      lowMid,
      vocal,
      presence,
      air,
      transient,
      beat,
      drop,
      movement,
      impact,
      overallEnergy,
      starSignal,
      isPlaying,
    };
  }

  public dispose() {
    this.liveAnalyser.dispose(false);
    this.resetIndices(null);
  }
}

export { DEFAULT_SNAPSHOT };
