import { SubtitleCue } from './srtParser';

export type VisemeId =
  | 'rest'
  | 'MBP'
  | 'FV'
  | 'TH'
  | 'L'
  | 'SSZ'
  | 'AA'
  | 'EE'
  | 'OH'
  | 'OO';

/**
 * Acoustic spectral & temporal features extracted directly from voiceover PCM samples
 * at `phoneticHz` (default 20 Hz = 50ms buckets).
 */
export interface PhoneticAudioFrame {
  /** Normalized RMS loudness [0..1] */
  energy: number;
  /** Zero-crossing rate [0..1], high for unvoiced sibilants / fricatives (s, sh, ch, f) */
  zcr: number;
  /** Energy concentration below ~700 Hz [0..1], strong in voiced vowels (o, u, m) */
  lowBandRatio: number;
  /** Energy concentration ~700–2400 Hz [0..1], separates wide/front vowels (ee/aa) from rounded (oh/oo) */
  midBandRatio: number;
}

/**
 * Continuous articulatory pose for the character mouth & jaw rig, blended smoothly
 * between adjacent phonemes for natural co-articulation.
 */
export interface VisemePose {
  id: VisemeId;
  /** Vertical jaw & lip aperture [0..1] */
  openness: number;
  /** Horizontal mouth corner stretch [0..1] (0 = pursed O, 1 = wide E/S) */
  width: number;
  /** Lip rounding / pucker factor [0..1] */
  roundness: number;
  /** Bilabial lip compression [0..1] (M / B / P press) */
  lipPress: number;
  /** Upper teeth visibility [0..1] */
  teethUpper: number;
  /** Lower teeth visibility [0..1] */
  teethLower: number;
  /** Tongue tip / blade visibility [0..1] */
  tongueTip: number;
  /** Lower jaw vertical drop [0..1] */
  jawDrop: number;
}

export interface VisemeToken {
  id: VisemeId;
  weight: number;
}

const DEFAULT_PHONETIC_HZ = 20;

export const VISEME_TARGETS: Record<VisemeId, Omit<VisemePose, 'id'>> = {
  rest: {
    openness: 0,
    width: 0.48,
    roundness: 0,
    lipPress: 0,
    teethUpper: 0,
    teethLower: 0,
    tongueTip: 0,
    jawDrop: 0,
  },
  MBP: {
    openness: 0.02,
    width: 0.44,
    roundness: 0.08,
    lipPress: 0.96,
    teethUpper: 0,
    teethLower: 0,
    tongueTip: 0,
    jawDrop: 0.04,
  },
  FV: {
    openness: 0.16,
    width: 0.54,
    roundness: 0.05,
    lipPress: 0.35,
    teethUpper: 0.85,
    teethLower: 0,
    tongueTip: 0,
    jawDrop: 0.12,
  },
  TH: {
    openness: 0.28,
    width: 0.56,
    roundness: 0.06,
    lipPress: 0,
    teethUpper: 0.65,
    teethLower: 0.35,
    tongueTip: 0.88,
    jawDrop: 0.24,
  },
  L: {
    openness: 0.46,
    width: 0.52,
    roundness: 0.12,
    lipPress: 0,
    teethUpper: 0.55,
    teethLower: 0.2,
    tongueTip: 0.94,
    jawDrop: 0.38,
  },
  SSZ: {
    openness: 0.2,
    width: 0.82,
    roundness: 0.02,
    lipPress: 0,
    teethUpper: 0.92,
    teethLower: 0.82,
    tongueTip: 0.1,
    jawDrop: 0.14,
  },
  AA: {
    openness: 0.92,
    width: 0.64,
    roundness: 0.22,
    lipPress: 0,
    teethUpper: 0.72,
    teethLower: 0.46,
    tongueTip: 0.48,
    jawDrop: 0.92,
  },
  EE: {
    openness: 0.42,
    width: 0.94,
    roundness: 0.04,
    lipPress: 0,
    teethUpper: 0.88,
    teethLower: 0.52,
    tongueTip: 0.24,
    jawDrop: 0.34,
  },
  OH: {
    openness: 0.68,
    width: 0.34,
    roundness: 0.78,
    lipPress: 0,
    teethUpper: 0.28,
    teethLower: 0.14,
    tongueTip: 0.18,
    jawDrop: 0.62,
  },
  OO: {
    openness: 0.34,
    width: 0.16,
    roundness: 0.98,
    lipPress: 0.08,
    teethUpper: 0.06,
    teethLower: 0.04,
    tongueTip: 0,
    jawDrop: 0.28,
  },
};

const BENGALI_VOWEL_SIGNS = new Set([
  'া',
  'ি',
  'ী',
  'ু',
  'ূ',
  'ৃ',
  'ে',
  'ৈ',
  'ো',
  'ৌ',
  '্',
]);

const BENGALI_CHAR_MAP: Record<string, { id: VisemeId; weight: number; isConsonant?: boolean }> = {
  // Independent vowels
  'অ': { id: 'AA', weight: 2.1 },
  'আ': { id: 'AA', weight: 2.4 },
  'ই': { id: 'EE', weight: 2.1 },
  'ঈ': { id: 'EE', weight: 2.3 },
  'উ': { id: 'OO', weight: 2.1 },
  'ঊ': { id: 'OO', weight: 2.3 },
  'ঋ': { id: 'L', weight: 1.5 },
  'এ': { id: 'EE', weight: 2.2 },
  'ঐ': { id: 'EE', weight: 2.1 },
  'ও': { id: 'OH', weight: 2.2 },
  'ঔ': { id: 'OH', weight: 2.2 },
  // Dependent vowel signs (কার)
  'া': { id: 'AA', weight: 2.4 },
  'ি': { id: 'EE', weight: 2.0 },
  'ী': { id: 'EE', weight: 2.2 },
  'ু': { id: 'OO', weight: 2.1 },
  'ূ': { id: 'OO', weight: 2.2 },
  'ৃ': { id: 'L', weight: 1.5 },
  'ে': { id: 'EE', weight: 2.2 },
  'ৈ': { id: 'EE', weight: 2.1 },
  'ো': { id: 'OH', weight: 2.3 },
  'ৌ': { id: 'OH', weight: 2.2 },
  // Bilabial consonants (প ব ভ ম) & labiodental ফ
  'প': { id: 'MBP', weight: 1.15, isConsonant: true },
  'ফ': { id: 'FV', weight: 1.15, isConsonant: true },
  'ব': { id: 'MBP', weight: 1.15, isConsonant: true },
  'ভ': { id: 'MBP', weight: 1.15, isConsonant: true },
  'ম': { id: 'MBP', weight: 1.25, isConsonant: true },
  // Dental & retroflex stops / nasals
  'ত': { id: 'TH', weight: 1.05, isConsonant: true },
  'থ': { id: 'TH', weight: 1.05, isConsonant: true },
  'দ': { id: 'TH', weight: 1.05, isConsonant: true },
  'ধ': { id: 'TH', weight: 1.05, isConsonant: true },
  'ন': { id: 'TH', weight: 1.1, isConsonant: true },
  'ট': { id: 'TH', weight: 1.0, isConsonant: true },
  'ঠ': { id: 'TH', weight: 1.0, isConsonant: true },
  'ড': { id: 'TH', weight: 1.0, isConsonant: true },
  'ঢ': { id: 'TH', weight: 1.0, isConsonant: true },
  'ণ': { id: 'TH', weight: 1.0, isConsonant: true },
  // Sibilants & affricates
  'চ': { id: 'SSZ', weight: 1.1, isConsonant: true },
  'ছ': { id: 'SSZ', weight: 1.1, isConsonant: true },
  'জ': { id: 'SSZ', weight: 1.1, isConsonant: true },
  'ঝ': { id: 'SSZ', weight: 1.1, isConsonant: true },
  'শ': { id: 'SSZ', weight: 1.25, isConsonant: true },
  'ষ': { id: 'SSZ', weight: 1.2, isConsonant: true },
  'স': { id: 'SSZ', weight: 1.25, isConsonant: true },
  // Liquids / taps
  'র': { id: 'L', weight: 1.1, isConsonant: true },
  'ল': { id: 'L', weight: 1.2, isConsonant: true },
  'ড়': { id: 'L', weight: 1.05, isConsonant: true },
  'ড়': { id: 'L', weight: 1.05, isConsonant: true },
  'ঢ়': { id: 'L', weight: 1.05, isConsonant: true },
  'ঢ়': { id: 'L', weight: 1.05, isConsonant: true },
  // Velar / glottal / approximant glides
  'ক': { id: 'AA', weight: 0.95, isConsonant: true },
  'খ': { id: 'AA', weight: 0.95, isConsonant: true },
  'গ': { id: 'AA', weight: 0.95, isConsonant: true },
  'ঘ': { id: 'AA', weight: 0.95, isConsonant: true },
  'ঙ': { id: 'TH', weight: 0.95 },
  'ঞ': { id: 'TH', weight: 0.95 },
  'য': { id: 'SSZ', weight: 1.0, isConsonant: true },
  'য়': { id: 'EE', weight: 1.05 },
  'য়': { id: 'EE', weight: 1.05 },
  'হ': { id: 'AA', weight: 1.0, isConsonant: true },
  'ং': { id: 'TH', weight: 0.95 },
  'ঃ': { id: 'AA', weight: 0.85 },
  'ঁ': { id: 'OH', weight: 0.6 },
};

const ENGLISH_DIGRAPH_MAP: Array<[string, VisemeId, number]> = [
  ['th', 'TH', 1.15],
  ['sh', 'SSZ', 1.3],
  ['ch', 'SSZ', 1.25],
  ['zh', 'SSZ', 1.2],
  ['ph', 'FV', 1.2],
  ['ng', 'TH', 1.0],
  ['oo', 'OO', 2.3],
  ['ew', 'OO', 2.1],
  ['ou', 'OH', 2.1],
  ['ow', 'OH', 2.0],
  ['oa', 'OH', 2.2],
  ['aw', 'OH', 2.1],
  ['au', 'OH', 2.0],
  ['ee', 'EE', 2.3],
  ['ea', 'EE', 2.2],
  ['ie', 'EE', 2.0],
  ['ei', 'EE', 2.0],
  ['ai', 'EE', 2.0],
  ['ey', 'EE', 2.0],
  ['oi', 'OH', 2.1],
  ['oy', 'OH', 2.1],
];

const ENGLISH_SINGLE_MAP: Record<string, [VisemeId, number]> = {
  a: ['AA', 2.2],
  e: ['EE', 2.0],
  i: ['EE', 2.0],
  y: ['EE', 1.6],
  o: ['OH', 2.2],
  u: ['OO', 2.1],
  w: ['OO', 1.35],
  q: ['OO', 1.15],
  m: ['MBP', 1.2],
  b: ['MBP', 1.15],
  p: ['MBP', 1.15],
  f: ['FV', 1.2],
  v: ['FV', 1.2],
  s: ['SSZ', 1.25],
  z: ['SSZ', 1.2],
  c: ['SSZ', 1.1],
  x: ['SSZ', 1.2],
  j: ['SSZ', 1.15],
  t: ['TH', 1.05],
  d: ['TH', 1.05],
  n: ['TH', 1.1],
  l: ['L', 1.2],
  r: ['L', 1.1],
  k: ['AA', 0.9],
  g: ['AA', 0.9],
  h: ['AA', 0.95],
};

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function blendPose(a: VisemePose, b: VisemePose, t: number, id?: VisemeId): VisemePose {
  const k = clamp01(t);
  return {
    id: id ?? (k >= 0.5 ? b.id : a.id),
    openness: lerp(a.openness, b.openness, k),
    width: lerp(a.width, b.width, k),
    roundness: lerp(a.roundness, b.roundness, k),
    lipPress: lerp(a.lipPress, b.lipPress, k),
    teethUpper: lerp(a.teethUpper, b.teethUpper, k),
    teethLower: lerp(a.teethLower, b.teethLower, k),
    tongueTip: lerp(a.tongueTip, b.tongueTip, k),
    jawDrop: lerp(a.jawDrop, b.jawDrop, k),
  };
}

export function poseForViseme(id: VisemeId): VisemePose {
  return {
    id,
    ...VISEME_TARGETS[id],
  };
}

/**
 * Converts mixed Bengali & English spoken text into an ordered weighted sequence of mouth visemes.
 * Preserves syllable nuclei, Bengali inherent vowels, English digraphs, and brief inter-word rests.
 */
export function textToVisemeSequence(text: string): VisemeToken[] {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return [];

  const tokens: VisemeToken[] = [];
  const words = normalized.split(/\s+/).filter(Boolean);

  for (let wIdx = 0; wIdx < words.length; wIdx++) {
    const word = words[wIdx];
    const chars = Array.from(word);
    let i = 0;

    while (i < chars.length) {
      // Check two-character English digraphs first
      if (i + 1 < chars.length && /^[a-z]$/.test(chars[i]) && /^[a-z]$/.test(chars[i + 1])) {
        const pair = chars[i] + chars[i + 1];
        const digraph = ENGLISH_DIGRAPH_MAP.find(([pat]) => pat === pair);
        if (digraph) {
          tokens.push({ id: digraph[1], weight: digraph[2] });
          i += 2;
          continue;
        }
      }

      const ch = chars[i];
      const next = i + 1 < chars.length ? chars[i + 1] : '';

      // Skip virama/hasant and nukta directly, let next consonant join tightly
      if (ch === '্' || ch === '়') {
        i += 1;
        continue;
      }

      const bn = BENGALI_CHAR_MAP[ch];
      if (bn) {
        tokens.push({ id: bn.id, weight: bn.weight });
        // If Bengali consonant has no explicit vowel sign / hasant following it and isn't word-final,
        // insert the natural inherent 'OH' vowel nucleus so syllables open between consonants.
        const isLastChar = i === chars.length - 1 || !BENGALI_CHAR_MAP[next];
        if (bn.isConsonant && !BENGALI_VOWEL_SIGNS.has(next) && !isLastChar) {
          tokens.push({ id: 'OH', weight: 1.05 });
        }
        i += 1;
        continue;
      }

      const en = ENGLISH_SINGLE_MAP[ch];
      if (en) {
        // Avoid trailing silent 'e' on longer English words
        if (ch === 'e' && i === chars.length - 1 && chars.length > 3 && chars[i - 1] !== 'e') {
          i += 1;
          continue;
        }
        tokens.push({ id: en[0], weight: en[1] });
        i += 1;
        continue;
      }

      if (/[.,!?;:।]/.test(ch)) {
        tokens.push({ id: 'rest', weight: 0.7 });
      }
      i += 1;
    }

    // Subtle micro-transition pause between words when multiple words exist
    if (wIdx < words.length - 1) {
      tokens.push({ id: 'rest', weight: 0.28 });
    }
  }

  return tokens;
}

/**
 * Pure O(N) DSP extractor computing 20Hz phonetic spectral/temporal frames directly from
 * raw PCM audio samples (zero AudioContext overhead, 100% deterministic and Node-testable).
 */
export function extractPhoneticTrackFromSamples(
  samples: Float32Array | number[],
  pcmSampleRate: number,
  phoneticHz = DEFAULT_PHONETIC_HZ
): { frames: PhoneticAudioFrame[]; phoneticHz: number } {
  const totalSamples = samples.length;
  const safeRate = Math.max(1000, pcmSampleRate);
  const bucketSize = Math.max(1, Math.floor(safeRate / phoneticHz));
  const bucketCount = Math.max(1, Math.ceil(totalSamples / bucketSize));

  // Simple 1-pole low-pass (<700 Hz) & mid-pass (~700-2400 Hz) IIR coefficients
  const alphaLow = clamp01((2 * Math.PI * 700) / (safeRate + 2 * Math.PI * 700));
  const alphaMidHigh = clamp01((2 * Math.PI * 2400) / (safeRate + 2 * Math.PI * 2400));

  const rawRms = new Float32Array(bucketCount);
  const rawZcr = new Float32Array(bucketCount);
  const rawLowRatio = new Float32Array(bucketCount);
  const rawMidRatio = new Float32Array(bucketCount);

  let lpLow = 0;
  let lpMid = 0;
  let prevSample = 0;
  let maxRms = 0.0001;

  for (let b = 0; b < bucketCount; b++) {
    const start = b * bucketSize;
    const end = Math.min(totalSamples, start + bucketSize);
    const len = Math.max(1, end - start);

    let sumSq = 0;
    let lowSq = 0;
    let midSq = 0;
    let zeroCrossings = 0;

    for (let i = start; i < end; i++) {
      const s = samples[i] || 0;
      sumSq += s * s;

      if ((s >= 0 && prevSample < 0) || (s < 0 && prevSample >= 0)) {
        zeroCrossings++;
      }
      prevSample = s;

      lpLow = lpLow + alphaLow * (s - lpLow);
      lpMid = lpMid + alphaMidHigh * (s - lpMid);
      const midBand = lpMid - lpLow;

      lowSq += lpLow * lpLow;
      midSq += midBand * midBand;
    }

    const rms = Math.sqrt(sumSq / len);
    if (rms > maxRms) maxRms = rms;

    rawRms[b] = rms;
    // Expected sibilant ZCR > ~3kHz -> crossings/sec >= 6000; map crossings/sample to [0..1]
    const crossingsPerSec = (zeroCrossings / len) * safeRate;
    rawZcr[b] = clamp01(crossingsPerSec / 6500);

    const safeTotal = Math.max(1e-8, sumSq);
    rawLowRatio[b] = clamp01(lowSq / safeTotal);
    rawMidRatio[b] = clamp01(midSq / safeTotal);
  }

  const frames: PhoneticAudioFrame[] = new Array(bucketCount);
  for (let b = 0; b < bucketCount; b++) {
    const linear = Math.min(1, rawRms[b] / (maxRms * 0.85));
    const energy = Number(Math.min(1, Math.pow(linear, 0.72)).toFixed(3));
    frames[b] = {
      energy,
      zcr: Number(rawZcr[b].toFixed(3)),
      lowBandRatio: Number(rawLowRatio[b].toFixed(3)),
      midBandRatio: Number(rawMidRatio[b].toFixed(3)),
    };
  }

  return { frames, phoneticHz };
}

/**
 * Generates deterministic 20Hz phonetic audio frames aligned to SRT / script cue text
 * for Script-Only Preview, Showcase Demo, or offline fallback.
 */
export function synthesizePhoneticTrackFromCues(
  cues: SubtitleCue[],
  duration: number,
  phoneticHz = DEFAULT_PHONETIC_HZ
): { frames: PhoneticAudioFrame[]; phoneticHz: number } {
  const safeDur = Math.max(4, duration);
  const count = Math.max(20, Math.ceil(safeDur * phoneticHz));
  const frames: PhoneticAudioFrame[] = new Array(count);

  const cueTokensCache = new Map<number, { tokens: VisemeToken[]; totalWeight: number }>();

  for (let i = 0; i < count; i++) {
    const t = i / phoneticHz;
    const cue = cues.find((c) => t >= c.startTime && t <= c.endTime);
    if (!cue) {
      frames[i] = { energy: 0.04, zcr: 0.05, lowBandRatio: 0.2, midBandRatio: 0.2 };
      continue;
    }

    let cached = cueTokensCache.get(cue.index);
    if (!cached) {
      const tokens = textToVisemeSequence(cue.text);
      const totalWeight = tokens.reduce((s, tok) => s + tok.weight, 0) || 1;
      cached = { tokens, totalWeight };
      cueTokensCache.set(cue.index, cached);
    }

    const cueDur = Math.max(0.25, cue.endTime - cue.startTime);
    const localProgress = clamp01((t - cue.startTime) / cueDur);
    const targetWeight = localProgress * cached.totalWeight;
    let acc = 0;
    let activeId: VisemeId = 'AA';
    for (const tok of cached.tokens) {
      acc += tok.weight;
      if (targetWeight <= acc) {
        activeId = tok.id;
        break;
      }
    }

    const edgeFade = Math.min(1, (t - cue.startTime) / 0.12, (cue.endTime - t) / 0.12);
    const baseEnergy =
      activeId === 'rest'
        ? 0.08
        : activeId === 'MBP'
          ? 0.26
          : activeId === 'SSZ' || activeId === 'FV'
            ? 0.48
            : 0.72;

    const zcr = activeId === 'SSZ' ? 0.76 : activeId === 'FV' ? 0.62 : activeId === 'TH' ? 0.38 : 0.16;
    const lowBandRatio =
      activeId === 'OO' || activeId === 'OH' ? 0.76 : activeId === 'MBP' ? 0.65 : 0.42;
    const midBandRatio =
      activeId === 'EE' ? 0.56 : activeId === 'AA' ? 0.48 : activeId === 'OH' ? 0.24 : 0.16;

    frames[i] = {
      energy: Number(clamp01(baseEnergy * Math.max(0.25, edgeFade)).toFixed(3)),
      zcr,
      lowBandRatio,
      midBandRatio,
    };
  }

  return { frames, phoneticHz };
}

/**
 * Classifies pure acoustic voiceover spectral/temporal features into a distinct VisemeId
 * (also serves as the sole classifier when no SRT/script text exists).
 */
export function classifyAcousticViseme(
  frame: PhoneticAudioFrame,
  prevFrame?: PhoneticAudioFrame
): VisemeId {
  if (frame.energy < 0.09) return 'rest';

  // Crisp negative amplitude dip -> bilabial or stop consonant closure
  if (prevFrame && prevFrame.energy - frame.energy > 0.22 && frame.energy < 0.42) {
    return frame.lowBandRatio > 0.45 ? 'MBP' : 'TH';
  }

  // High zero-crossing rate + low fundamental energy -> unvoiced fricative / sibilant
  if (frame.zcr > 0.48 && frame.lowBandRatio < 0.42) {
    return frame.energy > 0.34 ? 'SSZ' : 'FV';
  }

  // Voiced vowel formant differentiation
  if (frame.lowBandRatio > 0.54 && frame.midBandRatio < 0.24) {
    return frame.energy > 0.5 ? 'OH' : 'OO';
  }
  if (frame.midBandRatio > 0.44 && frame.energy < 0.62) {
    return 'EE';
  }
  if (frame.energy > 0.56) {
    return 'AA';
  }
  if (frame.zcr > 0.3) {
    return 'L';
  }
  return frame.lowBandRatio > 0.44 ? 'OH' : 'AA';
}

const cueTokenCache = new WeakMap<SubtitleCue, { tokens: VisemeToken[]; totalWeight: number }>();

function getCuePhonemes(cue: SubtitleCue): { tokens: VisemeToken[]; totalWeight: number } {
  const existing = cueTokenCache.get(cue);
  if (existing) return existing;
  const tokens = textToVisemeSequence(cue.text);
  const totalWeight = tokens.reduce((sum, tok) => sum + tok.weight, 0) || 1;
  const entry = { tokens, totalWeight };
  cueTokenCache.set(cue, entry);
  return entry;
}

function resolveCueVisemeAtTime(cue: SubtitleCue, time: number): VisemeId | null {
  const { tokens, totalWeight } = getCuePhonemes(cue);
  if (tokens.length === 0) return null;

  const cueDur = Math.max(0.2, cue.endTime - cue.startTime);
  const progress = clamp01((time - cue.startTime) / cueDur);
  const target = progress * totalWeight;
  let acc = 0;

  for (let i = 0; i < tokens.length; i++) {
    acc += tokens[i].weight;
    if (target <= acc) {
      return tokens[i].id;
    }
  }
  return tokens[tokens.length - 1].id;
}

export interface SampleVisemeOptions {
  cues?: SubtitleCue[];
  phoneticFrames?: PhoneticAudioFrame[];
  phoneticHz?: number;
  audioEnvelope?: number[];
  audioEnvelopeHz?: number;
  time: number;
  speechEnergy: number;
}

function resolveRawVisemeAtTime(opts: SampleVisemeOptions, t: number): { id: VisemeId; energy: number } {
  const { cues, phoneticFrames, phoneticHz = DEFAULT_PHONETIC_HZ, speechEnergy } = opts;
  const activeCue = cues?.find((c) => t >= c.startTime && t <= c.endTime);

  let acousticFrame: PhoneticAudioFrame | undefined;
  let prevAcousticFrame: PhoneticAudioFrame | undefined;
  if (phoneticFrames && phoneticFrames.length > 0) {
    const idx = Math.max(0, Math.min(phoneticFrames.length - 1, Math.floor(t * phoneticHz)));
    acousticFrame = phoneticFrames[idx];
    prevAcousticFrame = idx > 0 ? phoneticFrames[idx - 1] : undefined;
  }

  const localEnergy = acousticFrame ? acousticFrame.energy : speechEnergy;

  // Hard silence gate forces rest closure
  if (localEnergy < 0.08 && !activeCue) {
    return { id: 'rest', energy: 0 };
  }
  if (localEnergy < 0.065) {
    return { id: 'rest', energy: 0 };
  }

  const textViseme = activeCue ? resolveCueVisemeAtTime(activeCue, t) : null;
  const acousticViseme = acousticFrame
    ? classifyAcousticViseme(acousticFrame, prevAcousticFrame)
    : null;

  // Dual-modal phonetic fusion:
  // 1) Acoustic sibilant bursts ('SSZ'/'FV') or crisp stop closures override blurred cue timing immediately.
  // 2) Otherwise during voiced speech aligned with SRT text, use the exact spoken text phoneme.
  // 3) Without SRT cues (voiceover audio only), use pure acoustic classification.
  let chosen: VisemeId;
  if (textViseme && acousticViseme) {
    if (acousticViseme === 'SSZ' && textViseme !== 'SSZ' && acousticFrame && acousticFrame.zcr > 0.56) {
      chosen = 'SSZ';
    } else if (textViseme === 'rest' && acousticFrame && acousticFrame.energy > 0.24) {
      chosen = acousticViseme;
    } else {
      chosen = textViseme;
    }
  } else {
    chosen = textViseme ?? acousticViseme ?? visemeFromEnergyPhase(localEnergy, t);
  }

  return { id: chosen, energy: localEnergy };
}

function visemeFromEnergyPhase(energy: number, time: number): VisemeId {
  if (energy < 0.08) return 'rest';
  const phase = (time * 6.4) % 4;
  if (energy > 0.65) return phase < 2 ? 'AA' : 'OH';
  if (energy > 0.35) return phase < 1.3 ? 'EE' : phase < 2.7 ? 'L' : 'OH';
  return phase < 2 ? 'MBP' : 'TH';
}

/**
 * Samples a co-articulated, energy-scaled VisemePose at timestamp `time`.
 * Blends 3 points (-40ms, 0ms, +40ms) for smooth natural lip transitions without mechanical snapping.
 */
export function sampleVisemePose(opts: SampleVisemeOptions): VisemePose {
  const { time, speechEnergy } = opts;

  if (speechEnergy < 0.06 && (!opts.phoneticFrames || opts.phoneticFrames.length === 0)) {
    return poseForViseme('rest');
  }

  const dt = 0.04;
  const prevSample = resolveRawVisemeAtTime(opts, Math.max(0, time - dt));
  const currSample = resolveRawVisemeAtTime(opts, Math.max(0, time));
  const nextSample = resolveRawVisemeAtTime(opts, Math.max(0, time + dt));

  if (currSample.id === 'rest' && prevSample.id === 'rest' && nextSample.id === 'rest') {
    return poseForViseme('rest');
  }

  const pPrev = poseForViseme(prevSample.id);
  const pCurr = poseForViseme(currSample.id);
  const pNext = poseForViseme(nextSample.id);

  // Co-articulation blend: 20% previous, 58% current, 22% upcoming
  const preMix = blendPose(pCurr, pPrev, 0.22, currSample.id);
  const coArticulated = blendPose(preMix, pNext, 0.24, currSample.id);

  // Modulate jaw & mouth aperture cleanly with real vocal amplitude while preserving phoneme shape
  const amp = clamp01(Math.max(speechEnergy, currSample.energy) * 1.15);
  const ampScale = currSample.id === 'rest' ? 0 : 0.45 + 0.55 * amp;

  return {
    id: currSample.id,
    openness: clamp01(coArticulated.openness * ampScale),
    width: coArticulated.width,
    roundness: coArticulated.roundness,
    lipPress: currSample.id === 'MBP' ? clamp01(coArticulated.lipPress * Math.max(0.55, amp)) : coArticulated.lipPress,
    teethUpper: clamp01(coArticulated.teethUpper * Math.max(0.4, ampScale)),
    teethLower: clamp01(coArticulated.teethLower * Math.max(0.35, ampScale)),
    tongueTip: clamp01(coArticulated.tongueTip * Math.max(0.4, ampScale)),
    jawDrop: clamp01(coArticulated.jawDrop * ampScale),
  };
}
