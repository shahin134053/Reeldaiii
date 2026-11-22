/**
 * Pure utilities for the In-Browser Voiceover Recorder.
 * Handles timer formatting, MIME negotiation, live waveform bar extraction,
 * deterministic recorded file naming, and PCM16 WAV encoding.
 */

export const PREFERRED_RECORDER_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
] as const;

export function formatRecorderTimer(totalSeconds: number): string {
  const safe = Math.max(0, Number.isFinite(totalSeconds) ? totalSeconds : 0);
  const mins = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function selectSupportedRecorderMimeType(
  isTypeSupported?: (mimeType: string) => boolean
): string | undefined {
  if (!isTypeSupported) return undefined;
  for (const mime of PREFERRED_RECORDER_MIME_TYPES) {
    try {
      if (isTypeSupported(mime)) return mime;
    } catch {
      // Continue trying fallback MIME types
    }
  }
  return undefined;
}

export function buildRecordedFileName(date: Date = new Date(), mimeType = 'audio/wav'): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const lower = mimeType.toLowerCase();
  const ext = lower.includes('wav')
    ? 'wav'
    : lower.includes('mp4')
      ? 'm4a'
      : lower.includes('ogg')
        ? 'ogg'
        : 'webm';
  return `voiceover-${yyyy}${mm}${dd}-${hh}${min}.${ext}`;
}

/**
 * Downsamples Web Audio time-domain bytes (0..255 centered at 128) into normalized
 * [0.08..1.0] vertical meter bar heights for smooth live recording feedback.
 */
export function computeWaveformBars(
  timeDomainBytes: ArrayLike<number>,
  barCount = 24
): number[] {
  const count = Math.max(4, Math.min(64, Math.floor(barCount)));
  const len = timeDomainBytes.length;
  if (len === 0) {
    return Array.from({ length: count }, () => 0.08);
  }
  const bucketSize = Math.max(1, Math.floor(len / count));
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    const start = i * bucketSize;
    const end = Math.min(len, start + bucketSize);
    let peak = 0;
    for (let j = start; j < end; j++) {
      const normalized = Math.abs(timeDomainBytes[j] - 128) / 128;
      if (normalized > peak) peak = normalized;
    }
    const boosted = Math.min(1, peak * 1.85);
    bars.push(Number(Math.max(0.08, boosted).toFixed(3)));
  }
  return bars;
}

/**
 * Encodes mono Float32 PCM samples [-1..1] into a standard 16-bit PCM RIFF WAV ArrayBuffer.
 * Ensures accurate duration metadata across all browsers and clean export compatibility.
 */
export function encodePcmToWavArrayBuffer(
  samples: Float32Array,
  sampleRate = 44100
): ArrayBuffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // AudioFormat = 1 (PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    const int16 = clamped < 0 ? Math.round(clamped * 32768) : Math.round(clamped * 32767);
    view.setInt16(offset, int16, true);
    offset += 2;
  }

  return buffer;
}
