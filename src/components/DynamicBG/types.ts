export interface TimeInterval {
  start: number;
  duration: number;
  confidence: number;
}

export interface Section extends TimeInterval {
  loudness: number;
  tempo: number;
  key: number;
  mode: number;
  time_signature: number;
}

export interface Beat extends TimeInterval {}

export interface Segment extends TimeInterval {
  loudness_start: number;
  loudness_max_time: number;
  loudness_max: number;
  loudness_end?: number;
  pitches?: number[];
  timbre?: number[];
}

export interface TrackData {
  tempo: number;
  loudness: number;
  duration: number;
}

export interface AudioAnalysisData {
  track: TrackData;
  sections: Section[];
  beats: Beat[];
  segments: Segment[];
}

export interface BackgroundAudioSnapshot {
  absoluteLoudness: number;
  bass: number;
  lowMid: number;
  vocal: number;
  presence: number;
  air: number;
  transient: number;
  beat: number;
  drop: number;
  movement: number;
  impact: number;
  overallEnergy: number;
  starSignal: number;
  baseAnimationSpeed: number;
  isPlaying: boolean;
}
