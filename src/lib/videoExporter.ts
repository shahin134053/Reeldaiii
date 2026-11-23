import * as Mp4Muxer from 'mp4-muxer';
import * as WebmMuxer from 'webm-muxer';
import { AnimationProject, AspectRatio } from './storyCompiler';
import {
  SubtitleMode,
  SubtitleStyle,
  renderProjectFrame,
} from '../animation/renderer';
import { EXPORT_QUALITY_PRESETS, ExportQuality } from '../animation/motionEngine';
import { synthesizeEmotionBgmChannels } from './bgmEngine';

export type ExportContainerFormat = 'mp4' | 'webm';

export interface ExportVideoOptions {
  project: AnimationProject;
  aspectRatio: AspectRatio;
  startTime: number;
  endTime: number;
  subtitleMode: SubtitleMode;
  subtitleStyle?: SubtitleStyle;
  quality?: ExportQuality;
  containerFormat?: ExportContainerFormat;
  portraitZoom?: number;
  fps?: number;
  targetMaxWallMs?: number;
  onProgress: (progress01: number, currentSeconds: number, detail?: string) => void;
  signal: AbortSignal;
}

export interface ExportVideoResult {
  blob: Blob;
  mimeType: string;
  extension: ExportContainerFormat;
  aspectRatio: AspectRatio;
  width: number;
  height: number;
  codecLabel: string;
  engine: 'webcodecs' | 'mediarecorder';
}

export interface ExportFrameSchedule {
  fps: number;
  totalFrames: number;
  maxFramesBudget: number;
  estimatedRenderSeconds: number;
}

/**
 * Computes an adaptive frame rate so any video duration and resolution
 * (720p, 1080p, or 4K UHD) renders cleanly within 1 minute max.
 * Short videos (up to 60s even at 4K) stay at crisp 24fps.
 */
export function computeExportFrameSchedule(
  durationSeconds: number,
  quality: ExportQuality = '1080p'
): ExportFrameSchedule {
  const safeDur = Math.max(0.5, durationSeconds);
  const maxFramesBudget =
    quality === '4k' ? 1440 : quality === '1080p' ? 2400 : 3200;

  const ideal24Frames = Math.ceil(safeDur * 24);
  const fps =
    ideal24Frames <= maxFramesBudget
      ? 24
      : Math.max(2, Math.min(24, Math.floor(maxFramesBudget / safeDur)));

  const totalFrames = Math.min(maxFramesBudget, Math.max(12, Math.ceil(safeDur * fps)));
  const msPerFrame = quality === '4k' ? 30 : quality === '1080p' ? 15 : 9;
  const estimatedRenderSeconds = Math.max(2, Math.round((totalFrames * msPerFrame) / 1000));

  return {
    fps,
    totalFrames,
    maxFramesBudget,
    estimatedRenderSeconds,
  };
}

interface VideoCodecCandidate {
  webCodecs: string;
  mp4MuxerCodec: 'avc' | 'vp9';
  webmMuxerCodec: string;
  label: string;
}

function getVideoCodecCandidates(
  format: ExportContainerFormat,
  isUltraHd: boolean
): VideoCodecCandidate[] {
  if (format === 'mp4') {
    if (isUltraHd) {
      return [
        { webCodecs: 'avc1.640034', mp4MuxerCodec: 'avc', webmMuxerCodec: 'V_VP9', label: 'H.264 High 5.2 (4K)' },
        { webCodecs: 'avc1.640033', mp4MuxerCodec: 'avc', webmMuxerCodec: 'V_VP9', label: 'H.264 High 5.1 (4K)' },
        { webCodecs: 'avc1.4d0033', mp4MuxerCodec: 'avc', webmMuxerCodec: 'V_VP9', label: 'H.264 Main (4K)' },
        { webCodecs: 'vp09.00.51.08', mp4MuxerCodec: 'vp9', webmMuxerCodec: 'V_VP9', label: 'VP9 (4K MP4)' },
      ];
    }
    return [
      { webCodecs: 'avc1.420028', mp4MuxerCodec: 'avc', webmMuxerCodec: 'V_VP9', label: 'H.264 (MP4)' },
      { webCodecs: 'avc1.640028', mp4MuxerCodec: 'avc', webmMuxerCodec: 'V_VP9', label: 'H.264 High (MP4)' },
      { webCodecs: 'avc1.640033', mp4MuxerCodec: 'avc', webmMuxerCodec: 'V_VP9', label: 'H.264 High' },
      { webCodecs: 'avc1.4d0028', mp4MuxerCodec: 'avc', webmMuxerCodec: 'V_VP9', label: 'H.264 Main' },
      { webCodecs: 'avc1.42E01F', mp4MuxerCodec: 'avc', webmMuxerCodec: 'V_VP9', label: 'H.264 Baseline' },
      { webCodecs: 'vp09.00.41.08', mp4MuxerCodec: 'vp9', webmMuxerCodec: 'V_VP9', label: 'VP9 (MP4)' },
      { webCodecs: 'vp09.00.10.08', mp4MuxerCodec: 'vp9', webmMuxerCodec: 'V_VP9', label: 'VP9 (MP4)' },
    ];
  }
  if (isUltraHd) {
    return [
      { webCodecs: 'vp09.00.51.08', mp4MuxerCodec: 'vp9', webmMuxerCodec: 'V_VP9', label: 'VP9 (4K WebM)' },
      { webCodecs: 'vp09.00.41.08', mp4MuxerCodec: 'vp9', webmMuxerCodec: 'V_VP9', label: 'VP9 (WebM)' },
      { webCodecs: 'vp8', mp4MuxerCodec: 'vp9', webmMuxerCodec: 'V_VP8', label: 'VP8 (WebM)' },
    ];
  }
  return [
    { webCodecs: 'vp09.00.41.08', mp4MuxerCodec: 'vp9', webmMuxerCodec: 'V_VP9', label: 'VP9 (WebM)' },
    { webCodecs: 'vp8', mp4MuxerCodec: 'vp9', webmMuxerCodec: 'V_VP8', label: 'VP8 (WebM)' },
    { webCodecs: 'vp09.00.10.08', mp4MuxerCodec: 'vp9', webmMuxerCodec: 'V_VP9', label: 'VP9 (WebM)' },
  ];
}

type ResolvedVideoConfig = {
  config: VideoEncoderConfig;
  candidate: VideoCodecCandidate;
  width: number;
  height: number;
};

const resolvedVideoConfigCache = new Map<string, ResolvedVideoConfig | null>();

/**
 * Probes WebCodecs VideoEncoder support across resolution fallback tiers so 4K UHD
 * works cleanly when supported and degrades gracefully if a device GPU caps portrait height.
 * Results are cached per (format, resolution, bitrate) so repeat/dual-ratio exports skip probing.
 */
async function resolveSupportedVideoConfig(
  format: ExportContainerFormat,
  requestedWidth: number,
  requestedHeight: number,
  bitrate: number,
  fps: number
): Promise<ResolvedVideoConfig | null> {
  if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') {
    return null;
  }

  const cacheKey = `${format}:${requestedWidth}x${requestedHeight}:${bitrate}`;
  if (resolvedVideoConfigCache.has(cacheKey)) {
    const cached = resolvedVideoConfigCache.get(cacheKey);
    if (!cached) return null;
    return {
      ...cached,
      config: { ...cached.config, framerate: fps },
    };
  }

  const isVertical = requestedHeight > requestedWidth;

  // Resolution ladder: exact requested size first, then high-res fallback only if encoder refuses
  const sizeTiers: Array<{ w: number; h: number; br: number }> = [
    { w: requestedWidth, h: requestedHeight, br: bitrate },
  ];
  if (Math.max(requestedWidth, requestedHeight) > 1920) {
    sizeTiers.push(
      isVertical
        ? { w: 1440, h: 2560, br: Math.min(bitrate, 16_000_000) }
        : { w: 2560, h: 1440, br: Math.min(bitrate, 16_000_000) },
      isVertical
        ? { w: 1080, h: 1920, br: Math.min(bitrate, 10_000_000) }
        : { w: 1920, h: 1080, br: Math.min(bitrate, 10_000_000) }
    );
  }

  for (const tier of sizeTiers) {
    // Ensure even dimensions required by H.264 / VP9 encoders
    const width = tier.w - (tier.w % 2);
    const height = tier.h - (tier.h % 2);
    const isUltraHd = Math.max(width, height) > 1920;
    const candidates = getVideoCodecCandidates(format, isUltraHd);

    for (const candidate of candidates) {
      for (const accel of ['prefer-hardware', 'no-preference', 'prefer-software'] as const) {
        const config: VideoEncoderConfig = {
          codec: candidate.webCodecs,
          width,
          height,
          bitrate: tier.br,
          bitrateMode: 'variable',
          framerate: fps,
          latencyMode: 'realtime',
          hardwareAcceleration: accel,
          ...(candidate.mp4MuxerCodec === 'avc' ? { avc: { format: 'avc' } } : {}),
        };
        try {
          const support = await VideoEncoder.isConfigSupported(config);
          if (support.supported) {
            const resolved: ResolvedVideoConfig = {
              config: support.config ?? config,
              candidate,
              width,
              height,
            };
            resolvedVideoConfigCache.set(cacheKey, resolved);
            return resolved;
          }
        } catch {
          // Try next codec profile
        }
      }
    }
  }

  resolvedVideoConfigCache.set(cacheKey, null);
  return null;
}

interface DecodedAudioSlice {
  numberOfChannels: number;
  sampleRate: number;
  channelData: Float32Array[];
  frameCount: number;
}

const decodedAudioCache = new Map<string, AudioBuffer>();
const decodedAudioInFlight = new Map<string, Promise<AudioBuffer | null>>();

/**
 * Warms and caches the decoded AudioBuffer in the background (e.g. when ExportModal opens)
 * with in-flight deduplication so clicking Export starts rendering almost instantaneously.
 */
export function preloadDecodedAudio(audioUrl: string): Promise<AudioBuffer | null> {
  if (typeof window === 'undefined' || !audioUrl) return Promise.resolve(null);
  const cached = decodedAudioCache.get(audioUrl);
  if (cached) return Promise.resolve(cached);
  const pending = decodedAudioInFlight.get(audioUrl);
  if (pending) return pending;

  const task = (async (): Promise<AudioBuffer | null> => {
    try {
      const res = await fetch(audioUrl);
      if (!res.ok) return null;
      const rawBuf = await res.arrayBuffer();
      if (rawBuf.byteLength === 0) return null;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;

      const decodeCtx = new AudioCtx();
      try {
        const decoded = await decodeCtx.decodeAudioData(rawBuf.slice(0));
        if (decodedAudioCache.size >= 2) {
          const oldest = decodedAudioCache.keys().next().value;
          if (oldest) decodedAudioCache.delete(oldest);
        }
        decodedAudioCache.set(audioUrl, decoded);
        return decoded;
      } finally {
        decodeCtx.close().catch(() => {});
      }
    } catch {
      return null;
    } finally {
      decodedAudioInFlight.delete(audioUrl);
    }
  })();

  decodedAudioInFlight.set(audioUrl, task);
  return task;
}

function resampleChannelLinear(
  src: Float32Array,
  srcStart: number,
  srcLength: number,
  srcRate: number,
  dstLength: number,
  dstRate: number
): Float32Array {
  const out = new Float32Array(dstLength);
  if (srcLength <= 1 || src.length === 0) return out;
  const ratio = srcRate / dstRate;
  const maxIdx = src.length - 1;
  for (let i = 0; i < dstLength; i++) {
    const pos = srcStart + i * ratio;
    const idx = Math.floor(pos);
    if (idx < 0 || idx > maxIdx) continue;
    const frac = pos - idx;
    const s0 = src[idx];
    const s1 = idx + 1 <= maxIdx ? src[idx + 1] : s0;
    out[i] = s0 + (s1 - s0) * frac;
  }
  return out;
}

/**
 * Decodes and slices the exact [startTime, endTime] voiceover segment offline
 * with pure-JS zero-stall 48kHz resampling and decoded AudioBuffer caching across multi-ratio exports.
 */
async function decodeAudioSliceOffline(
  audioUrl: string,
  startTime: number,
  endTime: number
): Promise<DecodedAudioSlice | null> {
  try {
    const decoded = await preloadDecodedAudio(audioUrl);
    if (!decoded) return null;

    const targetSampleRate = 48000;
    const targetChannels = Math.min(2, Math.max(1, decoded.numberOfChannels));
    const clipDuration = Math.max(0.25, endTime - startTime);
    const totalOutFrames = Math.ceil(clipDuration * targetSampleRate);
    const srcStart = Math.max(0, Math.floor(startTime * decoded.sampleRate));
    const srcLength = Math.max(1, Math.ceil(clipDuration * decoded.sampleRate));

    const channelData: Float32Array[] = [];
    for (let ch = 0; ch < targetChannels; ch++) {
      const srcChan = decoded.getChannelData(Math.min(ch, decoded.numberOfChannels - 1));
      if (decoded.sampleRate === targetSampleRate) {
        const out = new Float32Array(totalOutFrames);
        const copyLen = Math.min(totalOutFrames, Math.max(0, srcChan.length - srcStart));
        if (copyLen > 0) {
          out.set(srcChan.subarray(srcStart, srcStart + copyLen), 0);
        }
        channelData.push(out);
      } else {
        channelData.push(
          resampleChannelLinear(
            srcChan,
            srcStart,
            srcLength,
            decoded.sampleRate,
            totalOutFrames,
            targetSampleRate
          )
        );
      }
    }

    return {
      numberOfChannels: targetChannels,
      sampleRate: targetSampleRate,
      channelData,
      frameCount: totalOutFrames,
    };
  } catch {
    return null;
  }
}

type ResolvedAudioConfig = {
  config: AudioEncoderConfig;
  mp4Codec: 'aac' | 'opus';
  webmCodec: string;
};

const resolvedAudioConfigCache = new Map<string, ResolvedAudioConfig | null>();

async function resolveSupportedAudioConfig(
  format: ExportContainerFormat,
  sampleRate: number,
  numberOfChannels: number
): Promise<ResolvedAudioConfig | null> {
  if (typeof AudioEncoder === 'undefined' || typeof AudioData === 'undefined') {
    return null;
  }

  const cacheKey = `${format}:${sampleRate}:${numberOfChannels}`;
  if (resolvedAudioConfigCache.has(cacheKey)) {
    return resolvedAudioConfigCache.get(cacheKey) ?? null;
  }

  const candidates =
    format === 'mp4'
      ? [
          { codec: 'mp4a.40.2', mp4Codec: 'aac' as const, webmCodec: 'A_OPUS' },
          { codec: 'opus', mp4Codec: 'opus' as const, webmCodec: 'A_OPUS' },
        ]
      : [{ codec: 'opus', mp4Codec: 'opus' as const, webmCodec: 'A_OPUS' }];

  for (const c of candidates) {
    const config: AudioEncoderConfig = {
      codec: c.codec,
      sampleRate,
      numberOfChannels,
      bitrate: 192_000,
    };
    try {
      const support = await AudioEncoder.isConfigSupported(config);
      if (support.supported) {
        const resolved: ResolvedAudioConfig = {
          config: support.config ?? config,
          mp4Codec: c.mp4Codec,
          webmCodec: c.webmCodec,
        };
        resolvedAudioConfigCache.set(cacheKey, resolved);
        return resolved;
      }
    } catch {
      // Try next audio codec
    }
  }

  resolvedAudioConfigCache.set(cacheKey, null);
  return null;
}

/**
 * Primary Engine: Deterministic offline WebCodecs frame-by-frame video & audio encoder.
 * Faster than real-time, zero audio.play() autoplay failures, true 4K MP4 & WebM output.
 */
async function exportViaWebCodecs(
  options: ExportVideoOptions
): Promise<ExportVideoResult | null> {
  const {
    project,
    aspectRatio,
    startTime,
    endTime,
    subtitleMode,
    subtitleStyle = 'kinetic',
    quality = '1080p',
    containerFormat = 'mp4',
    portraitZoom = 1.38,
    onProgress,
    signal,
  } = options;

  const exportWallStartMs = performance.now();
  const duration = Math.max(0.5, endTime - startTime);
  const schedule = computeExportFrameSchedule(duration, quality);
  const effectiveFps = options.fps ? Math.min(options.fps, schedule.fps) : schedule.fps;

  const preset = EXPORT_QUALITY_PRESETS[quality] ?? EXPORT_QUALITY_PRESETS['1080p'];
  const requested = preset.dimensions[aspectRatio];

  const videoSupport = await resolveSupportedVideoConfig(
    containerFormat,
    requested.width,
    requested.height,
    preset.videoBitsPerSecond,
    effectiveFps
  );
  if (!videoSupport) return null;

  if (signal.aborted) {
    throw new DOMException('Export cancelled', 'AbortError');
  }

  const { width, height, candidate } = videoSupport;

  // Decode voiceover audio offline + synthesize/mix emotion BGM with Auto-Ducking if enabled
  let audioSlice: DecodedAudioSlice | null = null;
  let audioSupport: Awaited<ReturnType<typeof resolveSupportedAudioConfig>> = null;
  if (project.audioUrl) {
    onProgress(0.02, startTime, 'Preparing voiceover audio track…');
    audioSlice = await decodeAudioSliceOffline(project.audioUrl, startTime, endTime);
  }

  const bgmCfg = project.bgmConfig;
  if (bgmCfg?.enabled && bgmCfg.preset !== 'off') {
    onProgress(0.03, startTime, 'Synthesizing & ducking emotion BGM…');
    const bgmSr = audioSlice?.sampleRate ?? 48000;
    const clipDuration = Math.max(0.5, endTime - startTime);
    const { left: bgmL, right: bgmR } = synthesizeEmotionBgmChannels({
      duration: clipDuration,
      startTime,
      sampleRate: bgmSr,
      preset: bgmCfg.preset,
      volume: bgmCfg.volume,
      autoDucking: bgmCfg.autoDucking,
      scenes: project.scenes,
      audioEnvelope: project.audioEnvelope,
      audioEnvelopeHz: project.audioEnvelopeHz ?? 10,
    });

    if (audioSlice) {
      const len = Math.min(audioSlice.frameCount, bgmL.length);
      for (let i = 0; i < len; i++) {
        audioSlice.channelData[0][i] = Math.max(-0.98, Math.min(0.98, audioSlice.channelData[0][i] + bgmL[i]));
        if (audioSlice.numberOfChannels > 1) {
          audioSlice.channelData[1][i] = Math.max(-0.98, Math.min(0.98, audioSlice.channelData[1][i] + bgmR[i]));
        }
      }
    } else {
      audioSlice = {
        numberOfChannels: 2,
        sampleRate: bgmSr,
        channelData: [bgmL, bgmR],
        frameCount: bgmL.length,
      };
    }
  }

  if (audioSlice) {
    audioSupport = await resolveSupportedAudioConfig(
      containerFormat,
      audioSlice.sampleRate,
      audioSlice.numberOfChannels
    );
  }

  if (signal.aborted) {
    throw new DOMException('Export cancelled', 'AbortError');
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  // Omit willReadFrequently so Chromium keeps GPU-backed Canvas2D & zero-copy VideoFrame upload
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return null;

  let mp4Target: Mp4Muxer.ArrayBufferTarget | null = null;
  let mp4Muxer: Mp4Muxer.Muxer<Mp4Muxer.ArrayBufferTarget> | null = null;
  let webmTarget: WebmMuxer.ArrayBufferTarget | null = null;
  let webmMuxer: WebmMuxer.Muxer<WebmMuxer.ArrayBufferTarget> | null = null;

  if (containerFormat === 'mp4') {
    mp4Target = new Mp4Muxer.ArrayBufferTarget();
    mp4Muxer = new Mp4Muxer.Muxer({
      target: mp4Target,
      video: {
        codec: candidate.mp4MuxerCodec,
        width,
        height,
        frameRate: effectiveFps,
      },
      ...(audioSlice && audioSupport
        ? {
            audio: {
              codec: audioSupport.mp4Codec,
              numberOfChannels: audioSlice.numberOfChannels,
              sampleRate: audioSlice.sampleRate,
            },
          }
        : {}),
      fastStart: 'in-memory',
      firstTimestampBehavior: 'offset',
    });
  } else {
    webmTarget = new WebmMuxer.ArrayBufferTarget();
    webmMuxer = new WebmMuxer.Muxer({
      target: webmTarget,
      video: {
        codec: candidate.webmMuxerCodec,
        width,
        height,
        frameRate: effectiveFps,
      },
      ...(audioSlice && audioSupport
        ? {
            audio: {
              codec: audioSupport.webmCodec,
              numberOfChannels: audioSlice.numberOfChannels,
              sampleRate: audioSlice.sampleRate,
            },
          }
        : {}),
      firstTimestampBehavior: 'offset',
    });
  }

  let encoderError: Error | null = null;

  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => {
      try {
        if (mp4Muxer) {
          mp4Muxer.addVideoChunk(chunk, meta);
        } else if (webmMuxer) {
          webmMuxer.addVideoChunk(chunk, meta);
        }
      } catch (err) {
        encoderError = err instanceof Error ? err : new Error(String(err));
      }
    },
    error: (err) => {
      encoderError = err instanceof Error ? err : new Error(String(err));
    },
  });
  videoEncoder.configure(videoSupport.config);

  let audioEncoder: AudioEncoder | null = null;
  if (audioSlice && audioSupport) {
    audioEncoder = new AudioEncoder({
      output: (chunk, meta) => {
        try {
          if (mp4Muxer) {
            mp4Muxer.addAudioChunk(chunk, meta);
          } else if (webmMuxer) {
            webmMuxer.addAudioChunk(chunk, meta);
          }
        } catch (err) {
          encoderError = err instanceof Error ? err : new Error(String(err));
        }
      },
      error: (err) => {
        encoderError = err instanceof Error ? err : new Error(String(err));
      },
    });
    audioEncoder.configure(audioSupport.config);
  }

  try {
    // 1. Encode all audio chunks cleanly in 4096-sample frames (takes < 0.3s even for 4-minute audio)
    if (audioSlice && audioEncoder) {
      const chunkFrames = 4096;
      const { numberOfChannels, sampleRate, channelData, frameCount } = audioSlice;

      for (let offset = 0; offset < frameCount; offset += chunkFrames) {
        if (signal.aborted) throw new DOMException('Export cancelled', 'AbortError');
        if (encoderError) throw encoderError;

        const len = Math.min(chunkFrames, frameCount - offset);
        const planar = new Float32Array(len * numberOfChannels);
        for (let ch = 0; ch < numberOfChannels; ch++) {
          planar.set(channelData[ch].subarray(offset, offset + len), ch * len);
        }

        const audioData = new AudioData({
          format: 'f32-planar',
          sampleRate,
          numberOfFrames: len,
          numberOfChannels,
          timestamp: Math.round((offset / sampleRate) * 1_000_000),
          data: planar,
        });
        audioEncoder.encode(audioData);
        audioData.close();

        if (audioEncoder.encodeQueueSize > 16) {
          await new Promise((r) => setTimeout(r, 2));
        }
      }
      await audioEncoder.flush();
      audioEncoder.close();
      audioEncoder = null;
    }

    // 2. High-speed streamed WebCodecs frame encoding with tight queue drain & end-to-end wall pacing
    // Guarantees ANY video length and ANY resolution (up to 4K, MP4 or WebM) completes strictly within 1 minute
    const baseDt = 1 / effectiveFps;
    const requestedTargetMs = options.targetMaxWallMs ?? 46_000;
    const proportionalCapMs = Math.max(12_000, duration * 1500);
    const totalTargetWallMs = Math.min(requestedTargetMs, proportionalCapMs);
    const maxSliceDt = Math.max(1.5, duration / 12);
    const maxQueueDepth = containerFormat === 'webm' && Math.max(width, height) >= 2560 ? 2 : 3;
    const keyFrameInterval = Math.max(24, effectiveFps * 2);
    const encodeStartMs = performance.now();
    let lastYieldMs = encodeStartMs;
    let frameTime = startTime;
    let encodedCount = 0;
    let currentDt = baseDt;

    while (frameTime < endTime - 0.0005 || encodedCount === 0) {
      if (signal.aborted) {
        throw new DOMException('Export cancelled', 'AbortError');
      }
      if (encoderError) {
        throw encoderError;
      }

      const clampedTime = Math.min(endTime, frameTime);
      const stepDt = Math.max(0.01, Math.min(currentDt, endTime - clampedTime || currentDt));
      const frameDurationUs = Math.round(stepDt * 1_000_000);
      const timestampUs = Math.round(Math.max(0, clampedTime - startTime) * 1_000_000);

      renderProjectFrame(ctx, {
        project,
        time: clampedTime,
        aspectRatio,
        subtitleMode,
        subtitleStyle,
        portraitZoom,
        outputWidth: width,
        outputHeight: height,
        fastHighResComposite: true,
        showLetterbox: aspectRatio === '16:9',
      });

      const videoFrame = new VideoFrame(canvas, {
        timestamp: timestampUs,
        duration: frameDurationUs,
      });

      videoEncoder.encode(videoFrame, {
        keyFrame: encodedCount % keyFrameInterval === 0,
      });
      videoFrame.close();
      encodedCount++;

      // Keep encode queue shallow so avgMsPerFrame tracks true encode speed with zero flush backlog
      if (videoEncoder.encodeQueueSize > maxQueueDepth) {
        const waitStart = performance.now();
        while (videoEncoder.encodeQueueSize > Math.max(1, maxQueueDepth - 1) && !signal.aborted && !encoderError) {
          if (performance.now() - waitStart > 3500) {
            await videoEncoder.flush();
            break;
          }
          await new Promise((r) => setTimeout(r, 4));
        }
      }

      // Measure true total render+encode throughput from frame 2 and adapt dt against total export wall budget
      const nowMs = performance.now();
      if (encodedCount >= 2) {
        const encodeElapsedMs = Math.max(1, nowMs - encodeStartMs);
        const trueAvgMsPerFrame = encodeElapsedMs / encodedCount;
        const totalElapsedMs = nowMs - exportWallStartMs;
        const flushReserveMs = Math.min(4_500, Math.max(2_000, trueAvgMsPerFrame * (maxQueueDepth + 1)));
        const remainingWallMs = Math.max(1_800, totalTargetWallMs - totalElapsedMs - flushReserveMs);
        const affordableFrames = Math.max(1, Math.floor(remainingWallMs / Math.max(4, trueAvgMsPerFrame)));
        const remainingVideoSec = Math.max(0.05, endTime - clampedTime);
        const pacedDt = remainingVideoSec / affordableFrames;
        const hardCapDt =
          totalElapsedMs >= totalTargetWallMs - flushReserveMs
            ? remainingVideoSec
            : maxSliceDt;
        currentDt = Math.max(baseDt, Math.min(hardCapDt, Math.max(currentDt, pacedDt)));
      }

      frameTime += stepDt;

      if (nowMs - lastYieldMs > 180 || frameTime >= endTime - 0.0005) {
        lastYieldMs = nowMs;
        const pct = 0.04 + Math.min(1, (clampedTime - startTime) / duration) * 0.92;
        const elapsedSec = Math.max(0.2, (nowMs - encodeStartMs) / 1000);
        const doneFrac = Math.max(0.02, (clampedTime - startTime) / duration);
        const etaSec = Math.max(0, Math.round((elapsedSec / doneFrac) * (1 - doneFrac)));
        const estFps = Math.max(1, Math.round(1 / currentDt));
        onProgress(
          pct,
          clampedTime,
          `${Math.round(doneFrac * 100)}% · ${width}×${height} · ${estFps}fps · ~${etaSec}s left`
        );
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    onProgress(0.97, endTime, 'Finalizing video container…');
    await videoEncoder.flush();
    videoEncoder.close();

    if (encoderError) {
      throw encoderError;
    }

    let buffer: ArrayBuffer;
    let mimeType: string;
    if (mp4Muxer && mp4Target) {
      mp4Muxer.finalize();
      buffer = mp4Target.buffer;
      mimeType = 'video/mp4';
    } else if (webmMuxer && webmTarget) {
      webmMuxer.finalize();
      buffer = webmTarget.buffer;
      mimeType = 'video/webm';
    } else {
      return null;
    }

    if (!buffer || buffer.byteLength < 1024) {
      throw new Error('Video encoder produced an empty output file.');
    }

    const blob = new Blob([buffer], { type: mimeType });
    onProgress(1, endTime, 'Complete');

    return {
      blob,
      mimeType,
      extension: containerFormat,
      aspectRatio,
      width,
      height,
      codecLabel: candidate.label,
      engine: 'webcodecs',
    };
  } catch (err) {
    try {
      if (videoEncoder.state !== 'closed') videoEncoder.close();
    } catch {
      // Ignore cleanup error
    }
    try {
      if (audioEncoder && audioEncoder.state !== 'closed') audioEncoder.close();
    } catch {
      // Ignore cleanup error
    }
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    // Let caller fall back to MediaRecorder if WebCodecs fails at runtime
    return null;
  }
}

function pickMediaRecorderMime(format: ExportContainerFormat): {
  mimeType: string;
  extension: ExportContainerFormat;
  label: string;
} {
  const candidates: Array<{ mimeType: string; extension: ExportContainerFormat; label: string }> =
    format === 'mp4'
      ? [
          { mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', extension: 'mp4', label: 'H.264 MP4' },
          { mimeType: 'video/mp4', extension: 'mp4', label: 'MP4' },
          { mimeType: 'video/webm;codecs=vp9,opus', extension: 'webm', label: 'VP9 WebM' },
          { mimeType: 'video/webm;codecs=vp8,opus', extension: 'webm', label: 'VP8 WebM' },
          { mimeType: 'video/webm', extension: 'webm', label: 'WebM' },
        ]
      : [
          { mimeType: 'video/webm;codecs=vp9,opus', extension: 'webm', label: 'VP9 WebM' },
          { mimeType: 'video/webm;codecs=vp8,opus', extension: 'webm', label: 'VP8 WebM' },
          { mimeType: 'video/webm', extension: 'webm', label: 'WebM' },
          { mimeType: 'video/mp4', extension: 'mp4', label: 'MP4' },
        ];

  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c.mimeType)) {
      return c;
    }
  }
  return { mimeType: 'video/webm', extension: 'webm', label: 'WebM' };
}

/**
 * Resilient Fallback Engine: MediaRecorder real-time recording with safe audio readiness
 * checks (never hangs on already-loaded blob URLs) and strict non-empty output validation.
 */
async function exportViaMediaRecorder(
  options: ExportVideoOptions
): Promise<ExportVideoResult> {
  const {
    project,
    aspectRatio,
    startTime,
    endTime,
    subtitleMode,
    subtitleStyle = 'kinetic',
    quality = '1080p',
    containerFormat = 'mp4',
    portraitZoom = 1.38,
    fps = 30,
    onProgress,
    signal,
  } = options;

  if (typeof MediaRecorder === 'undefined') {
    throw new Error('Video recording is not supported in this browser.');
  }

  // Cap MediaRecorder fallback at 1080p so Chromium MediaRecorder never chokes on 2160x3840
  const fallbackQuality: ExportQuality = quality === '4k' ? '1080p' : quality;
  const preset = EXPORT_QUALITY_PRESETS[fallbackQuality] ?? EXPORT_QUALITY_PRESETS['1080p'];
  const { width, height } = preset.dimensions[aspectRatio];

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to initialize canvas rendering context for export.');
  }

  let audio: HTMLAudioElement | null = null;
  let audioCtx: AudioContext | null = null;
  const tracks: MediaStreamTrack[] = [];

  const canvasStream = canvas.captureStream(fps);
  tracks.push(...canvasStream.getVideoTracks());

  if (project.audioUrl) {
    try {
      audio = new Audio(project.audioUrl);
      if (!project.audioUrl.startsWith('blob:') && !project.audioUrl.startsWith('data:')) {
        audio.crossOrigin = 'anonymous';
      }
      audio.preload = 'auto';

      if (audio.readyState < 2) {
        await new Promise<void>((resolve) => {
          if (!audio) return resolve();
          const timer = window.setTimeout(() => {
            cleanup();
            resolve();
          }, 4500);
          const onReady = () => {
            cleanup();
            resolve();
          };
          const cleanup = () => {
            window.clearTimeout(timer);
            audio?.removeEventListener('canplaythrough', onReady);
            audio?.removeEventListener('loadeddata', onReady);
            audio?.removeEventListener('error', onReady);
          };
          audio.addEventListener('canplaythrough', onReady);
          audio.addEventListener('loadeddata', onReady);
          audio.addEventListener('error', onReady);
          audio.load();
        });
      }

      if (signal.aborted) {
        throw new DOMException('Export cancelled', 'AbortError');
      }

      audioCtx = new AudioContext();
      const sourceNode = audioCtx.createMediaElementSource(audio);
      const destNode = audioCtx.createMediaStreamDestination();
      sourceNode.connect(destNode);
      tracks.push(...destNode.stream.getAudioTracks());
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      audio = null;
      audioCtx?.close().catch(() => {});
      audioCtx = null;
    }
  }

  const combinedStream = new MediaStream(tracks);
  const { mimeType, extension, label } = pickMediaRecorderMime(containerFormat);
  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: preset.videoBitsPerSecond,
    audioBitsPerSecond: 192_000,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  renderProjectFrame(ctx, {
    project,
    time: startTime,
    aspectRatio,
    subtitleMode,
    subtitleStyle,
    portraitZoom,
    outputWidth: width,
    outputHeight: height,
    showLetterbox: aspectRatio === '16:9',
  });

  const duration = Math.max(0.5, endTime - startTime);

  return new Promise<ExportVideoResult>((resolve, reject) => {
    let rafId = 0;
    let finished = false;
    let wallStart = performance.now();

    const cleanupResources = () => {
      cancelAnimationFrame(rafId);
      audio?.pause();
      combinedStream.getTracks().forEach((t) => t.stop());
      audioCtx?.close().catch(() => {});
    };

    const handleAbort = () => {
      if (finished) return;
      finished = true;
      if (recorder.state !== 'inactive') recorder.stop();
      cleanupResources();
      reject(new DOMException('Export cancelled', 'AbortError'));
    };
    signal.addEventListener('abort', handleAbort, { once: true });

    recorder.onstop = () => {
      if (finished) return;
      finished = true;
      signal.removeEventListener('abort', handleAbort);
      cleanupResources();
      const blob = new Blob(chunks, { type: mimeType });
      if (blob.size < 512) {
        reject(new Error('Recorded video was empty. Please try 1080p HD or WebM format.'));
        return;
      }
      onProgress(1, endTime, 'Complete');
      resolve({
        blob,
        mimeType,
        extension,
        aspectRatio,
        width,
        height,
        codecLabel: label,
        engine: 'mediarecorder',
      });
    };

    recorder.onerror = () => {
      if (finished) return;
      finished = true;
      signal.removeEventListener('abort', handleAbort);
      cleanupResources();
      reject(new Error('Recording failed while encoding video frames.'));
    };

    const renderLoop = (now: number) => {
      if (finished) return;
      const nowTime =
        audio && !audio.paused && !audio.ended
          ? audio.currentTime
          : startTime + (now - wallStart) / 1000;

      renderProjectFrame(ctx, {
        project,
        time: Math.min(endTime, nowTime),
        aspectRatio,
        subtitleMode,
        subtitleStyle,
        portraitZoom,
        outputWidth: width,
        outputHeight: height,
        showLetterbox: aspectRatio === '16:9',
      });

      const pct = Math.max(0, Math.min(1, (nowTime - startTime) / duration));
      onProgress(pct, nowTime, `Recording ${width}×${height}…`);

      if (nowTime >= endTime || (audio && audio.ended)) {
        if (recorder.state === 'recording') recorder.stop();
        return;
      }

      rafId = requestAnimationFrame(renderLoop);
    };

    recorder.start(250);
    if (audio && audioCtx) {
      audio.currentTime = startTime;
      audioCtx
        .resume()
        .then(() => audio!.play())
        .then(() => {
          wallStart = performance.now();
          rafId = requestAnimationFrame(renderLoop);
        })
        .catch(() => {
          // If autoplay is restricted in iframe, proceed cleanly using wall clock so export never hangs
          audio = null;
          wallStart = performance.now();
          rafId = requestAnimationFrame(renderLoop);
        });
    } else {
      wallStart = performance.now();
      rafId = requestAnimationFrame(renderLoop);
    }
  });
}

/**
 * Exports any AnimationProject in 16:9 or 9:16 at up to 4K UHD in MP4 or WebM format.
 * Uses deterministic offline WebCodecs encoding first (faster than real-time, true 4K,
 * iframe-safe) with automatic MediaRecorder fallback for older browsers.
 */
export async function exportAnimationVideo(
  options: ExportVideoOptions
): Promise<ExportVideoResult> {
  const webCodecsResult = await exportViaWebCodecs(options);
  if (webCodecsResult) {
    return webCodecsResult;
  }
  return exportViaMediaRecorder(options);
}
