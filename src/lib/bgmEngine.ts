import { sampleSpeechEnergy } from './audioAnalyzer';
import type { BgmConfig, BgmPresetId } from './redesignAndStudio';
import type { EmotionTone, SceneSpec } from './storyCompiler';

const EMOTION_CHORDS: Record<EmotionTone, number[]> = {
  calm: [220.0, 261.63, 329.63, 392.0], // Am7 warm
  happy: [261.63, 329.63, 392.0, 493.88], // Cmaj7 bright
  inspiring: [293.66, 369.99, 440.0, 523.25], // D7/9 uplift
  determined: [196.0, 246.94, 293.66, 392.0], // Gsus / fifths
  sad: [174.61, 207.65, 261.63, 311.13], // Fm7 tender
  emotional: [220.0, 261.63, 329.63, 440.0], // Am expressive
  worried: [185.0, 220.0, 277.18, 329.63], // F#m7 suspense
  angry: [164.81, 196.0, 246.94, 329.63], // Em tension
};

function findEmotionAtTime(scenes: SceneSpec[], t: number): EmotionTone {
  const found = scenes.find((s) => t >= s.startTime && t < s.endTime);
  return found?.emotion ?? scenes[0]?.emotion ?? 'calm';
}

/**
 * Pure gain-envelope calculation with smooth Auto-Ducking when voiceover speech is active.
 */
export function computeBgmGainAtTime(
  bgm: BgmConfig,
  speechEnergy: number
): number {
  if (!bgm.enabled || bgm.preset === 'off') return 0;
  const base = Math.max(0, Math.min(0.65, bgm.volume));
  if (!bgm.autoDucking) return base;
  // Smoothly duck to 32% of base volume during strong speech syllables
  const duckFactor = 1 - Math.min(0.68, Math.max(0, speechEnergy - 0.08) * 1.15);
  return Number((base * duckFactor).toFixed(4));
}

/**
 * Synthesizes stereo ambient BGM (with emotion-adaptive chord progression and voiceover auto-ducking)
 * directly into Float32 stereo PCM arrays — usable both for live Web Audio playback and offline MP4/WebM export!
 */
export function synthesizeEmotionBgmChannels(params: {
  duration: number;
  startTime?: number;
  sampleRate: number;
  preset: BgmPresetId;
  volume: number;
  autoDucking: boolean;
  scenes: SceneSpec[];
  audioEnvelope?: number[];
  audioEnvelopeHz?: number;
}): { left: Float32Array; right: Float32Array } {
  const {
    duration,
    startTime = 0,
    sampleRate,
    preset,
    volume,
    autoDucking,
    scenes,
    audioEnvelope,
    audioEnvelopeHz = 10,
  } = params;

  const totalFrames = Math.max(1, Math.ceil(duration * sampleRate));
  const left = new Float32Array(totalFrames);
  const right = new Float32Array(totalFrames);

  if (preset === 'off' || volume <= 0.001) {
    return { left, right };
  }

  const bgmCfg: BgmConfig = { enabled: true, preset, volume, autoDucking };
  const noteInterval = preset === 'epic-pulse' ? 0.5 : preset === 'warm-piano' ? 0.85 : 1.3;

  // Render in 512-sample blocks for fast, click-free synthesis
  for (let i = 0; i < totalFrames; i++) {
    const localT = i / sampleRate;
    const globalT = startTime + localT;
    const emotion =
      preset === 'auto-emotion'
        ? findEmotionAtTime(scenes, globalT)
        : preset === 'warm-piano'
          ? 'calm'
          : preset === 'cinematic-strings'
            ? 'emotional'
            : preset === 'epic-pulse'
              ? 'determined'
              : 'happy';

    const chord = EMOTION_CHORDS[emotion] ?? EMOTION_CHORDS.calm;
    const barPos = (globalT % noteInterval) / noteInterval;
    const arpIdx = Math.floor(globalT / noteInterval) % chord.length;
    const arpFreq = chord[arpIdx];

    // Warm stereo pad (root + fifth + soft octave shimmer)
    const padL =
      Math.sin(2 * Math.PI * chord[0] * 0.5 * globalT) * 0.28 +
      Math.sin(2 * Math.PI * chord[1] * globalT) * 0.16;
    const padR =
      Math.sin(2 * Math.PI * chord[0] * 0.5 * globalT + 0.35) * 0.28 +
      Math.sin(2 * Math.PI * chord[2] * globalT) * 0.16;

    // Gentle plucked / piano / pulse arpeggio
    const arpEnv = Math.exp(-barPos * (preset === 'epic-pulse' ? 5.2 : 3.4));
    const arpTone =
      (Math.sin(2 * Math.PI * arpFreq * globalT) +
        0.25 * Math.sin(2 * Math.PI * arpFreq * 2 * globalT)) *
      arpEnv *
      (preset === 'lofi-ambient' ? 0.18 : 0.26);

    const speechEnergy = sampleSpeechEnergy(audioEnvelope, globalT, audioEnvelopeHz);
    const gain = computeBgmGainAtTime(bgmCfg, speechEnergy);
    const fadeInOut =
      localT < 0.45
        ? localT / 0.45
        : localT > duration - 0.6
          ? Math.max(0, (duration - localT) / 0.6)
          : 1;

    left[i] = Math.max(-0.85, Math.min(0.85, (padL + arpTone * 0.9) * gain * fadeInOut));
    right[i] = Math.max(-0.85, Math.min(0.85, (padR + arpTone * 1.05) * gain * fadeInOut));
  }

  return { left, right };
}

/**
 * Lightweight live Web Audio controller for synchronized emotion BGM preview during playback.
 */
export class LiveBgmPlayer {
  private ctx: AudioContext | null = null;
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private cacheKey = '';
  private isPlaying = false;

  prepare(params: {
    duration: number;
    bgm: BgmConfig;
    scenes: SceneSpec[];
    audioEnvelope?: number[];
    audioEnvelopeHz?: number;
  }): void {
    if (!params.bgm.enabled || params.bgm.preset === 'off') {
      this.stop();
      this.buffer = null;
      this.cacheKey = '';
      return;
    }

    const nextKey = `${params.duration.toFixed(1)}:${params.bgm.preset}:${params.bgm.volume.toFixed(2)}:${params.bgm.autoDucking}:${params.scenes.map((s) => s.emotion).join(',')}`;
    if (nextKey === this.cacheKey && this.buffer) return;
    this.cacheKey = nextKey;

    if (typeof window === 'undefined') return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }

    // Use lightweight 22.05kHz synthesis for instant live preview preparation
    const sampleRate = 22050;
    const { left, right } = synthesizeEmotionBgmChannels({
      duration: Math.min(params.duration, 360),
      sampleRate,
      preset: params.bgm.preset,
      volume: params.bgm.volume,
      autoDucking: params.bgm.autoDucking,
      scenes: params.scenes,
      audioEnvelope: params.audioEnvelope,
      audioEnvelopeHz: params.audioEnvelopeHz,
    });

    const buf = this.ctx.createBuffer(2, left.length, sampleRate);
    buf.getChannelData(0).set(left);
    buf.getChannelData(1).set(right);
    this.buffer = buf;

    if (this.isPlaying) {
      this.stop();
    }
  }

  start(offsetSeconds: number, muted: boolean, masterVolume: number): void {
    if (!this.ctx || !this.buffer) return;
    this.stop();

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer;
    src.loop = false;

    const gain = this.ctx.createGain();
    gain.gain.value = muted ? 0 : Math.max(0, Math.min(1, masterVolume));

    src.connect(gain);
    gain.connect(this.ctx.destination);

    const safeOffset = Math.max(0, Math.min(offsetSeconds, Math.max(0, this.buffer.duration - 0.05)));
    src.start(0, safeOffset);

    this.source = src;
    this.gainNode = gain;
    this.isPlaying = true;
  }

  setOutputVolume(muted: boolean, masterVolume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = muted ? 0 : Math.max(0, Math.min(1, masterVolume));
    }
  }

  stop(): void {
    if (this.source) {
      try {
        this.source.stop();
      } catch {
        // Already stopped
      }
      this.source.disconnect();
      this.source = null;
    }
    this.isPlaying = false;
  }

  dispose(): void {
    this.stop();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
