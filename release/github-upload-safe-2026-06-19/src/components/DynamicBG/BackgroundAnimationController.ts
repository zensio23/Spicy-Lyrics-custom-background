import type { AudioAnalysisData, TimeInterval } from "./types.ts";

export class BackgroundAnimationController {
  private readonly BASE_TEMPO = 120.0;
  private readonly BEAT_PULSE_MAX = 0.82;
  private readonly BEAT_PULSE_DECAY = 3.8;
  private readonly MIN_BEAT_CONFIDENCE = 0.52;

  private getActiveElement<T extends TimeInterval>(elements: T[], currentTime: number): T | null {
    return (
      elements.find((element) => {
        return currentTime >= element.start && currentTime < element.start + element.duration;
      }) ?? null
    );
  }

  private getLoudnessFactor(decibels: number): number {
    const normalized = Math.max(0, (decibels + 40) / 40);
    return 0.58 + normalized * 0.48;
  }

  public getSpeedMultiplier(currentTime: number, data: AudioAnalysisData): number {
    let currentSpeed = 1.0;

    const currentSection = this.getActiveElement(data.sections, currentTime);
    if (currentSection) {
      const tempoMultiplier = currentSection.tempo / this.BASE_TEMPO;
      const loudnessMultiplier = this.getLoudnessFactor(currentSection.loudness);
      currentSpeed = tempoMultiplier * loudnessMultiplier;
    } else {
      currentSpeed =
        (data.track.tempo / this.BASE_TEMPO) * this.getLoudnessFactor(data.track.loudness);
    }

    const currentBeat = this.getActiveElement(data.beats, currentTime);
    if (currentBeat && currentBeat.confidence > this.MIN_BEAT_CONFIDENCE) {
      const progressIntoBeat = (currentTime - currentBeat.start) / currentBeat.duration;
      const pulseDecay = Math.exp(-this.BEAT_PULSE_DECAY * progressIntoBeat);
      const beatPulseAddition =
        this.BEAT_PULSE_MAX * pulseDecay * Math.pow(currentBeat.confidence, 1.25);
      currentSpeed += beatPulseAddition;
    }

    return Math.max(0.1, Math.min(currentSpeed, 2.25));
  }
}
