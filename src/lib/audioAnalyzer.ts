import { SubtitleCue } from './srtParser';
import {
  PhoneticAudioFrame,
  extractPhoneticTrackFromSamples,
  synthesizePhoneticTrackFromCues,
} from './visemeEngine';

export type SpeechPace = 'calm' | 'moderate' | 'energetic';

export interface AudioAnalysisResult {
  /** Normalized speech energy [0..1] sampled at `sampleRateHz` (default 10 Hz = every 100ms) */
  envelope: number[];
  sampleRateHz: number;
  /** 20 Hz phonetic acoustic features for multi-viseme lip-sync */
  phoneticFrames?: PhoneticAudioFrame[];
  phoneticHz?: number;
  duration: number;
  averageEnergy: number;
  peakEnergy: number;
  speechRatio: number;
  pace: SpeechPace;
  source: 'decoded-audio' | 'cue-cadence';
}

const DEFAULT_ENVELOPE_HZ = 10;

/**
 * Pure, testable RMS speech-envelope extractor from raw PCM audio samples.
 * Produces normalized [0..1] amplitude buckets for voice-synced lip-sync and gesture intensity.
 */
export function extractAudioEnvelopeFromSamples(
  samples: Float32Array | number[],
  pcmSampleRate: number,
  envelopeHz = DEFAULT_ENVELOPE_HZ
): AudioAnalysisResult {
  const totalSamples = samples.length;
  const safeRate = Math.max(1000, pcmSampleRate);
  const duration = totalSamples / safeRate;
  const bucketSize = Math.max(1, Math.floor(safeRate / envelopeHz));
  const bucketCount = Math.max(1, Math.ceil(totalSamples / bucketSize));

  const rawRms: number[] = new Array(bucketCount);
  let maxRms = 0.0001;

  for (let b = 0; b < bucketCount; b++) {
    const start = b * bucketSize;
    const end = Math.min(totalSamples, start + bucketSize);
    let sumSq = 0;
    for (let i = start; i < end; i++) {
      const v = samples[i] || 0;
      sumSq += v * v;
    }
    const rms = Math.sqrt(sumSq / Math.max(1, end - start));
    rawRms[b] = rms;
    if (rms > maxRms) maxRms = rms;
  }

  // Normalize with gentle perceptual compression (sqrt) so quiet dialogue still animates clearly
  let activeBuckets = 0;
  let sumNorm = 0;
  let transitions = 0;
  let prevActive = false;

  const envelope = rawRms.map((rms) => {
    const linear = Math.min(1, rms / (maxRms * 0.85));
    const perceptual = Number(Math.min(1, Math.pow(linear, 0.72)).toFixed(3));
    const isSpeaking = perceptual > 0.16;
    if (isSpeaking) activeBuckets++;
    if (isSpeaking !== prevActive) transitions++;
    prevActive = isSpeaking;
    sumNorm += perceptual;
    return perceptual;
  });

  const averageEnergy = Number((sumNorm / envelope.length).toFixed(3));
  const speechRatio = Number((activeBuckets / envelope.length).toFixed(3));
  const transitionsPerSec = duration > 0.5 ? transitions / duration : 0;

  let pace: SpeechPace = 'moderate';
  if (speechRatio < 0.42 && transitionsPerSec < 1.8) {
    pace = 'calm';
  } else if (averageEnergy > 0.48 || transitionsPerSec > 3.2) {
    pace = 'energetic';
  }

  const phonetic = extractPhoneticTrackFromSamples(samples, safeRate, 20);

  return {
    envelope,
    sampleRateHz: envelopeHz,
    phoneticFrames: phonetic.frames,
    phoneticHz: phonetic.phoneticHz,
    duration: Number(duration.toFixed(2)),
    averageEnergy,
    peakEnergy: 1,
    speechRatio,
    pace,
    source: 'decoded-audio',
  };
}

/**
 * Pure, deterministic speech cadence generator derived from SRT or Script cues
 * when no audio file is attached or audio decoding is unavailable.
 */
export function synthesizeEnvelopeFromCues(
  cues: SubtitleCue[],
  duration: number,
  envelopeHz = DEFAULT_ENVELOPE_HZ
): AudioAnalysisResult {
  const safeDuration = Math.max(4, duration);
  const bucketCount = Math.max(10, Math.ceil(safeDuration * envelopeHz));
  const envelope: number[] = new Array(bucketCount).fill(0.04);

  let activeBuckets = 0;
  let sumNorm = 0;

  for (let b = 0; b < bucketCount; b++) {
    const t = b / envelopeHz;
    const cue = cues.find((c) => t >= c.startTime && t <= c.endTime);
    if (cue) {
      const localT = t - cue.startTime;
      const cueDur = Math.max(0.2, cue.endTime - cue.startTime);
      const wordCount = Math.max(1, cue.text.trim().split(/\s+/).length);
      const syllableFreq = Math.min(5.2, Math.max(2.4, (wordCount / cueDur) * 1.45));
      const edgeFade = Math.min(1, localT / 0.18, (cueDur - localT) / 0.18);
      const cadence = 0.52 + 0.38 * Math.abs(Math.sin(localT * Math.PI * syllableFreq + cue.index));
      const energy = Number(Math.max(0.08, Math.min(0.95, cadence * edgeFade)).toFixed(3));
      envelope[b] = energy;
      activeBuckets++;
      sumNorm += energy;
    } else {
      sumNorm += 0.04;
    }
  }

  const totalWords = cues.reduce((acc, c) => acc + c.text.trim().split(/\s+/).length, 0);
  const wordsPerSec = safeDuration > 0 ? totalWords / safeDuration : 1.5;
  const pace: SpeechPace =
    wordsPerSec > 2.4 ? 'energetic' : wordsPerSec < 1.3 ? 'calm' : 'moderate';

  const phonetic = synthesizePhoneticTrackFromCues(cues, safeDuration, 20);

  return {
    envelope,
    sampleRateHz: envelopeHz,
    phoneticFrames: phonetic.frames,
    phoneticHz: phonetic.phoneticHz,
    duration: Number(safeDuration.toFixed(2)),
    averageEnergy: Number((sumNorm / bucketCount).toFixed(3)),
    peakEnergy: 0.95,
    speechRatio: Number((activeBuckets / bucketCount).toFixed(3)),
    pace,
    source: 'cue-cadence',
  };
}

/**
 * Decodes an uploaded or bundled audio URL in the browser via Web Audio API
 * to measure true voiceover speech amplitude for lip-sync and expressiveness.
 */
export async function analyzeAudioUrl(
  audioUrl: string,
  fallbackCues: SubtitleCue[],
  fallbackDuration: number
): Promise<AudioAnalysisResult> {
  if (typeof window === 'undefined') {
    return synthesizeEnvelopeFromCues(fallbackCues, fallbackDuration);
  }

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioCtx) {
    return synthesizeEnvelopeFromCues(fallbackCues, fallbackDuration);
  }

  let ctx: AudioContext | null = null;
  try {
    const res = await fetch(audioUrl);
    if (!res.ok) throw new Error('Audio fetch failed');
    const arrayBuffer = await res.arrayBuffer();
    ctx = new AudioCtx();
    const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const channelData = decoded.getChannelData(0);
    return extractAudioEnvelopeFromSamples(channelData, decoded.sampleRate, DEFAULT_ENVELOPE_HZ);
  } catch {
    return synthesizeEnvelopeFromCues(fallbackCues, fallbackDuration);
  } finally {
    if (ctx) {
      ctx.close().catch(() => {});
    }
  }
}

/**
 * Smoothly samples voiceover speech energy [0..1] at playback timestamp `timeSeconds`.
 */
export function sampleSpeechEnergy(
  envelope: number[] | undefined,
  timeSeconds: number,
  sampleRateHz = DEFAULT_ENVELOPE_HZ
): number {
  if (!envelope || envelope.length === 0) return 0;
  const exactIdx = Math.max(0, timeSeconds * sampleRateHz);
  const i0 = Math.min(envelope.length - 1, Math.floor(exactIdx));
  const i1 = Math.min(envelope.length - 1, i0 + 1);
  const frac = exactIdx - Math.floor(exactIdx);
  return envelope[i0] * (1 - frac) + envelope[i1] * frac;
}
