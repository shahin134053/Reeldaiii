import { SubtitleCue } from './srtParser';
import type {
  AnimationProject,
  CameraMotion,
  CameraShot,
  SceneSetting,
  SceneSpec,
  SceneTransitionName,
  StoryMotif,
  TimeOfDay,
  VisualStyle,
  WeatherType,
} from './storyCompiler';

export type LayoutMode = 'full-bleed' | 'editorial-frame' | 'split-focus' | 'doc-minimal';

export type ColorPaletteId =
  | 'heritage-gold'
  | 'midnight-neon'
  | 'pastel-watercolor'
  | 'emerald-earth'
  | 'crimson-drama'
  | 'monochrome-noir';

export interface ColorPaletteTheme {
  id: ColorPaletteId;
  label: string;
  labelBn: string;
  desc: string;
  accent: string;
  secondary: string;
  frameBg: string;
  frameBorder: string;
  tintTop: string;
  tintBottom: string;
  subtitlePrimary: string;
  subtitleHighlight: string;
  subtitleBoxBg: string;
  swatches: [string, string, string];
}

export const COLOR_PALETTES: Record<ColorPaletteId, ColorPaletteTheme> = {
  'heritage-gold': {
    id: 'heritage-gold',
    label: 'Heritage Gold',
    labelBn: 'সোনালি ঐতিহ্য',
    desc: 'Warm golden amber glow & timeless cinema contrast',
    accent: '#E5A93C',
    secondary: '#F6C65B',
    frameBg: '#0E0D11',
    frameBorder: 'rgba(229, 169, 60, 0.36)',
    tintTop: 'rgba(255, 206, 130, 0.06)',
    tintBottom: 'rgba(18, 12, 8, 0.16)',
    subtitlePrimary: '#FAF8F3',
    subtitleHighlight: '#F6C65B',
    subtitleBoxBg: 'rgba(8, 10, 16, 0.82)',
    swatches: ['#0E0D11', '#E5A93C', '#FAF8F3'],
  },
  'midnight-neon': {
    id: 'midnight-neon',
    label: 'Midnight Cyan',
    labelBn: 'নিয়ন মিডনাইট',
    desc: 'Electric cyan rim lights & deep midnight blue shadow',
    accent: '#38BDF8',
    secondary: '#818CF8',
    frameBg: '#070B16',
    frameBorder: 'rgba(56, 189, 248, 0.42)',
    tintTop: 'rgba(56, 189, 248, 0.14)',
    tintBottom: 'rgba(15, 23, 42, 0.30)',
    subtitlePrimary: '#F0F9FF',
    subtitleHighlight: '#38BDF8',
    subtitleBoxBg: 'rgba(7, 11, 22, 0.86)',
    swatches: ['#070B16', '#38BDF8', '#818CF8'],
  },
  'pastel-watercolor': {
    id: 'pastel-watercolor',
    label: 'Pastel Storybook',
    labelBn: 'প্যাস্টেল জলরঙ',
    desc: 'Soft peach, lavender sky & gentle storybook paper mat',
    accent: '#F4847A',
    secondary: '#F9C784',
    frameBg: '#1D1821',
    frameBorder: 'rgba(244, 132, 122, 0.38)',
    tintTop: 'rgba(255, 204, 188, 0.14)',
    tintBottom: 'rgba(128, 90, 150, 0.14)',
    subtitlePrimary: '#FFF8F4',
    subtitleHighlight: '#F9C784',
    subtitleBoxBg: 'rgba(29, 24, 33, 0.80)',
    swatches: ['#1D1821', '#F4847A', '#F9C784'],
  },
  'emerald-earth': {
    id: 'emerald-earth',
    label: 'Emerald Earth',
    labelBn: 'সবুজ প্রকৃতি',
    desc: 'Lush forest jade highlights & calm organic warmth',
    accent: '#34D399',
    secondary: '#FBBF24',
    frameBg: '#091310',
    frameBorder: 'rgba(52, 211, 153, 0.38)',
    tintTop: 'rgba(52, 211, 153, 0.11)',
    tintBottom: 'rgba(6, 28, 22, 0.24)',
    subtitlePrimary: '#ECFDF5',
    subtitleHighlight: '#34D399',
    subtitleBoxBg: 'rgba(9, 19, 16, 0.84)',
    swatches: ['#091310', '#34D399', '#FBBF24'],
  },
  'crimson-drama': {
    id: 'crimson-drama',
    label: 'Crimson Drama',
    labelBn: 'রক্তিম নাটকীয়',
    desc: 'High-impact crimson accent & emotional theatrical tone',
    accent: '#F43F5E',
    secondary: '#FB923C',
    frameBg: '#14090C',
    frameBorder: 'rgba(244, 63, 94, 0.42)',
    tintTop: 'rgba(244, 63, 94, 0.12)',
    tintBottom: 'rgba(20, 6, 12, 0.28)',
    subtitlePrimary: '#FFF1F2',
    subtitleHighlight: '#FB7185',
    subtitleBoxBg: 'rgba(20, 9, 12, 0.86)',
    swatches: ['#14090C', '#F43F5E', '#FB923C'],
  },
  'monochrome-noir': {
    id: 'monochrome-noir',
    label: 'Silver Noir',
    labelBn: 'ক্ল্যাসিক নয়ার',
    desc: 'Silver-slate editorial contrast & crisp documentary ink',
    accent: '#E2E8F0',
    secondary: '#94A3B8',
    frameBg: '#090A0D',
    frameBorder: 'rgba(226, 232, 240, 0.30)',
    tintTop: 'rgba(148, 163, 184, 0.08)',
    tintBottom: 'rgba(2, 6, 23, 0.38)',
    subtitlePrimary: '#F8FAFC',
    subtitleHighlight: '#E2E8F0',
    subtitleBoxBg: 'rgba(9, 10, 13, 0.88)',
    swatches: ['#090A0D', '#E2E8F0', '#64748B'],
  },
};

export const LAYOUT_MODE_META: Record<
  LayoutMode,
  { id: LayoutMode; label: string; labelBn: string; desc: string }
> = {
  'full-bleed': {
    id: 'full-bleed',
    label: 'Full-Bleed Cinema',
    labelBn: 'ফুল-স্ক্রিন সিনেমা',
    desc: 'Edge-to-edge full animation canvas with cinema vignette',
  },
  'editorial-frame': {
    id: 'editorial-frame',
    label: 'Editorial Frame',
    labelBn: 'এডিটোরিয়াল ফ্রেম',
    desc: 'Stylized art-gallery mat, chapter badge & crisp border',
  },
  'split-focus': {
    id: 'split-focus',
    label: 'Split Story Panel',
    labelBn: 'স্প্লিট স্টোরি কার্ড',
    desc: 'Stage canvas paired with live chapter & emotion card',
  },
  'doc-minimal': {
    id: 'doc-minimal',
    label: 'Documentary Wide',
    labelBn: 'ডকুমেন্টারি মিনিমাল',
    desc: 'Widescreen letterbox framing with top-left slate header',
  },
};

export interface DesignConfig {
  layoutMode: LayoutMode;
  colorPalette: ColorPaletteId;
  remixSeed: number;
  parallaxDepth: number; // 0..1.5
}

export type SubtitleFontId = 'hind-siliguri' | 'noto-serif' | 'fraunces' | 'jetbrains-mono';
export type SubtitlePosition = 'bottom' | 'middle' | 'top';

export interface SubtitleConfig {
  fontFamily: SubtitleFontId;
  fontSizeScale: number; // 0.8..1.35
  position: SubtitlePosition;
  primaryColor: string;
  highlightColor: string;
  boxOpacity: number; // 0..0.95
}

export type WatermarkPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface BrandingConfig {
  enabled: boolean;
  brandName: string;
  logoDataUrl: string | null;
  position: WatermarkPosition;
  opacity: number; // 0.2..1.0
  scale: number; // 0.6..1.5
  /** Whether the user has unlocked Paid User status via Secret Access Code (e.g. 830973) */
  customAccessUnlocked?: boolean;
  /** Paid users can optionally hide the default bottom-right Reeldaiii watermark completely */
  hideOfficialWatermark?: boolean;
}

export type BgmPresetId =
  | 'off'
  | 'auto-emotion'
  | 'warm-piano'
  | 'cinematic-strings'
  | 'lofi-ambient'
  | 'epic-pulse';

export interface BgmConfig {
  enabled: boolean;
  preset: BgmPresetId;
  volume: number; // 0..0.6
  autoDucking: boolean;
}

export const BGM_PRESET_LABELS: Record<BgmPresetId, { label: string; desc: string }> = {
  'auto-emotion': { label: 'Auto Emotion Match', desc: 'Adapts chords dynamically to each scene emotion' },
  'warm-piano': { label: 'Warm Story Piano', desc: 'Gentle acoustic piano & harmonic warmth' },
  'cinematic-strings': { label: 'Cinematic Pad Strings', desc: 'Lush wide atmospheric emotional strings' },
  'lofi-ambient': { label: 'Calm Lo-Fi Ambient', desc: 'Soft minimalist underscore for explainers' },
  'epic-pulse': { label: 'Inspiring Pulse', desc: 'Uplifting rhythmic drive for heroic journeys' },
  off: { label: 'No Background Music', desc: 'Voiceover audio only' },
};

export const DEFAULT_DESIGN_CONFIG: DesignConfig = {
  layoutMode: 'full-bleed',
  colorPalette: 'heritage-gold',
  remixSeed: 1,
  parallaxDepth: 1.0,
};

export const DEFAULT_SUBTITLE_CONFIG: SubtitleConfig = {
  fontFamily: 'hind-siliguri',
  fontSizeScale: 1.0,
  position: 'bottom',
  primaryColor: '#FAF8F3',
  highlightColor: '#FFAC1C',
  boxOpacity: 0.82,
};

export const DEFAULT_BRANDING_CONFIG: BrandingConfig = {
  enabled: false,
  brandName: '',
  logoDataUrl: null,
  position: 'top-right',
  opacity: 0.88,
  scale: 1.0,
  customAccessUnlocked: false,
  hideOfficialWatermark: false,
};

export const DEFAULT_BGM_CONFIG: BgmConfig = {
  enabled: false,
  preset: 'auto-emotion',
  volume: 0.22,
  autoDucking: true,
};

export interface DesignSnapshot {
  id: string;
  createdAt: string;
  label: string;
  visualStyle: VisualStyle;
  designConfig: DesignConfig;
  subtitleConfig: SubtitleConfig;
  scenes: SceneSpec[];
}

export function resolveSubtitleFontCss(fontId: SubtitleFontId): string {
  switch (fontId) {
    case 'noto-serif':
      return '"Noto Serif Bengali", Georgia, serif';
    case 'fraunces':
      return '"Fraunces", "Noto Serif Bengali", Georgia, serif';
    case 'jetbrains-mono':
      return '"JetBrains Mono", "Hind Siliguri", monospace';
    case 'hind-siliguri':
    default:
      return '"Hind Siliguri", -apple-system, BlinkMacSystemFont, sans-serif';
  }
}

export function captureDesignSnapshot(
  project: AnimationProject,
  label: string
): DesignSnapshot {
  return {
    id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    label,
    visualStyle: project.visualStyle ?? 'storybook-warm',
    designConfig: { ...(project.designConfig ?? DEFAULT_DESIGN_CONFIG) },
    subtitleConfig: { ...(project.subtitleConfig ?? DEFAULT_SUBTITLE_CONFIG) },
    scenes: project.scenes.map((sc) => ({
      ...sc,
      importantProps: sc.importantProps ? [...sc.importantProps] : undefined,
      characterIds: sc.characterIds ? [...sc.characterIds] : undefined,
      matchedSignals: sc.matchedSignals ? [...sc.matchedSignals] : undefined,
    })),
  };
}

export function restoreDesignSnapshot(
  project: AnimationProject,
  snapshot: DesignSnapshot
): AnimationProject {
  return {
    ...project,
    visualStyle: snapshot.visualStyle,
    designConfig: { ...snapshot.designConfig },
    subtitleConfig: { ...snapshot.subtitleConfig },
    scenes: snapshot.scenes.map((sc) => ({ ...sc })),
  };
}

const LAYOUT_ORDER: LayoutMode[] = [
  'full-bleed',
  'editorial-frame',
  'split-focus',
  'doc-minimal',
];

const PALETTE_ORDER: ColorPaletteId[] = [
  'heritage-gold',
  'midnight-neon',
  'pastel-watercolor',
  'emerald-earth',
  'crimson-drama',
  'monochrome-noir',
];

const STYLE_ORDER: VisualStyle[] = [
  'storybook-warm',
  'cinematic-anime',
  'editorial-doc',
  'dramatic-noir',
];

const SHOT_ROTATION: CameraShot[] = [
  'wide-establishing',
  'medium-two-shot',
  'close-up-portrait',
  'tracking-pan',
];

const MOTION_ROTATION: CameraMotion[] = [
  'dolly-in',
  'pan-right',
  'tilt-up',
  'dolly-out',
  'pan-left',
  'tracking',
];

const TRANSITION_ROTATION: SceneTransitionName[] = [
  'cross-dissolve',
  'light-leak',
  'iris-glow',
  'directional-wipe',
];

const TIME_VARIATIONS: Record<TimeOfDay, TimeOfDay[]> = {
  dawn: ['dawn', 'morning', 'sunset'],
  morning: ['morning', 'afternoon', 'dawn'],
  afternoon: ['afternoon', 'sunset', 'morning'],
  storm: ['storm', 'night', 'sunset'],
  sunset: ['sunset', 'dawn', 'night'],
  night: ['night', 'dawn', 'sunset'],
};

const WEATHER_VARIATIONS: WeatherType[] = ['clear', 'mist', 'fireflies', 'stars', 'embers'];

export interface RemixDesignOptions {
  layoutMode?: LayoutMode;
  colorPalette?: ColorPaletteId;
  visualStyle?: VisualStyle;
  remixSeed?: number;
  /** If true, also clears bespoke AI SVG overrides so scenes render fresh in the new palette & layout */
  clearCustomSvg?: boolean;
}

/**
 * Performs a comprehensive visual redesign across the entire AnimationProject:
 * updates LayoutMode, ColorPalette, VisualStyle, camera shots, camera motions,
 * transitions, subtle lighting/weather variations, and subtitle accent colors.
 */
export function remixProjectDesign(
  project: AnimationProject,
  options: RemixDesignOptions = {}
): AnimationProject {
  const prevDesign = project.designConfig ?? DEFAULT_DESIGN_CONFIG;
  const nextSeed = options.remixSeed ?? prevDesign.remixSeed + 1;

  const currentLayoutIdx = LAYOUT_ORDER.indexOf(prevDesign.layoutMode);
  const nextLayout =
    options.layoutMode ?? LAYOUT_ORDER[(Math.max(0, currentLayoutIdx) + 1) % LAYOUT_ORDER.length];

  const currentPaletteIdx = PALETTE_ORDER.indexOf(prevDesign.colorPalette);
  const nextPalette =
    options.colorPalette ??
    PALETTE_ORDER[(Math.max(0, currentPaletteIdx) + 1) % PALETTE_ORDER.length];

  const currentStyleIdx = STYLE_ORDER.indexOf(project.visualStyle ?? 'storybook-warm');
  const nextStyle =
    options.visualStyle ?? STYLE_ORDER[(Math.max(0, currentStyleIdx) + 1) % STYLE_ORDER.length];

  const palette = COLOR_PALETTES[nextPalette];

  const remixedScenes: SceneSpec[] = project.scenes.map((sc, idx) => {
    const hash = nextSeed * 31 + idx * 17;
    const nextShot = SHOT_ROTATION[(SHOT_ROTATION.indexOf(sc.cameraShot ?? 'medium-two-shot') + nextSeed + idx) % SHOT_ROTATION.length];
    const nextMotion = MOTION_ROTATION[(MOTION_ROTATION.indexOf(sc.cameraMotion ?? 'dolly-in') + nextSeed + idx) % MOTION_ROTATION.length];
    const nextTrans = TRANSITION_ROTATION[(TRANSITION_ROTATION.indexOf(sc.transitionToNext ?? 'cross-dissolve') + nextSeed + idx) % TRANSITION_ROTATION.length];

    const timePool = TIME_VARIATIONS[sc.timeOfDay] ?? ['morning', 'sunset', 'night'];
    const nextTime = timePool[(idx + nextSeed) % timePool.length];
    const keepStorm = sc.weather === 'rain' || sc.weather === 'heavy-storm' || sc.weather === 'snow';
    const nextWeather = keepStorm ? sc.weather : WEATHER_VARIATIONS[hash % WEATHER_VARIATIONS.length];

    const nextFocal = Number(
      Math.max(0.32, Math.min(0.68, 0.4 + (((hash % 7) - 3) * 0.04))).toFixed(2)
    );

    const motifOptions: StoryMotif[] = [
      sc.motif ?? 'none',
      'dream-orbs',
      'clock-time',
      'glowing-heart',
    ];
    const nextMotif = sc.motif && sc.motif !== 'none' ? sc.motif : motifOptions[nextSeed % motifOptions.length];

    return {
      ...sc,
      presetSceneId: options.clearCustomSvg ? undefined : sc.presetSceneId,
      customSvg: options.clearCustomSvg ? undefined : sc.customSvg,
      cameraShot: nextShot,
      cameraMotion: nextMotion,
      transitionToNext: nextTrans,
      timeOfDay: nextTime,
      weather: nextWeather,
      focalPointX: nextFocal,
      motif: nextMotif,
      accentColor: idx % 2 === 0 ? palette.accent : palette.secondary,
      lightingColor: palette.accent,
    };
  });

  const prevSub = project.subtitleConfig ?? DEFAULT_SUBTITLE_CONFIG;

  return {
    ...project,
    visualStyle: nextStyle,
    designConfig: {
      ...prevDesign,
      layoutMode: nextLayout,
      colorPalette: nextPalette,
      remixSeed: nextSeed,
    },
    subtitleConfig: {
      ...prevSub,
      primaryColor: palette.subtitlePrimary,
      highlightColor: palette.subtitleHighlight,
    },
    scenes: remixedScenes,
  };
}

// === TIMELINE EDITOR PURE HELPERS ===

export function renumberScenes(scenes: SceneSpec[]): SceneSpec[] {
  return scenes.map((sc, idx) => ({
    ...sc,
    chapterNumber: String(idx + 1).padStart(2, '0'),
  }));
}

export function adjustSceneBoundary(
  scenes: SceneSpec[],
  sceneId: string,
  edge: 'start' | 'end',
  deltaSec: number,
  totalDuration: number
): SceneSpec[] {
  const idx = scenes.findIndex((s) => s.id === sceneId);
  if (idx === -1) return scenes;
  const minSceneDur = 2.0;
  const copy = scenes.map((s) => ({ ...s }));
  const target = copy[idx];

  if (edge === 'start') {
    if (idx === 0) return scenes; // first scene starts at 0
    const prev = copy[idx - 1];
    const minStart = prev.startTime + minSceneDur;
    const maxStart = target.endTime - minSceneDur;
    const clampedStart = Number(Math.max(minStart, Math.min(maxStart, target.startTime + deltaSec)).toFixed(2));
    prev.endTime = clampedStart;
    target.startTime = clampedStart;
  } else {
    if (idx === copy.length - 1) return scenes; // last scene ends at totalDuration
    const next = copy[idx + 1];
    const minEnd = target.startTime + minSceneDur;
    const maxEnd = Math.min(totalDuration, next.endTime - minSceneDur);
    const clampedEnd = Number(Math.max(minEnd, Math.min(maxEnd, target.endTime + deltaSec)).toFixed(2));
    target.endTime = clampedEnd;
    next.startTime = clampedEnd;
  }

  return copy;
}

export function splitSceneAtMidpoint(scenes: SceneSpec[], sceneId: string): SceneSpec[] {
  const idx = scenes.findIndex((s) => s.id === sceneId);
  if (idx === -1) return scenes;
  const target = scenes[idx];
  const dur = target.endTime - target.startTime;
  if (dur < 4.0) return scenes;

  const mid = Number(((target.startTime + target.endTime) / 2).toFixed(2));
  const altShots: CameraShot[] = ['close-up-portrait', 'medium-two-shot', 'wide-establishing', 'tracking-pan'];
  const altMotions: CameraMotion[] = ['dolly-in', 'pan-right', 'dolly-out', 'tilt-up'];

  const firstHalf: SceneSpec = {
    ...target,
    endTime: mid,
  };
  const secondHalf: SceneSpec = {
    ...target,
    id: `${target.id}-split-${Date.now().toString(36)}`,
    titleBn: `${target.titleBn} (পর্ব ২)`,
    titleEn: `${target.titleEn} (Part 2)`,
    startTime: mid,
    endTime: target.endTime,
    presetSceneId: undefined,
    customSvg: undefined,
    cameraShot: altShots[(altShots.indexOf(target.cameraShot ?? 'medium-two-shot') + 1) % altShots.length],
    cameraMotion: altMotions[(altMotions.indexOf(target.cameraMotion ?? 'dolly-in') + 1) % altMotions.length],
  };

  const next = [...scenes.slice(0, idx), firstHalf, secondHalf, ...scenes.slice(idx + 1)];
  return renumberScenes(next);
}

export function mergeSceneWithNext(scenes: SceneSpec[], sceneId: string): SceneSpec[] {
  const idx = scenes.findIndex((s) => s.id === sceneId);
  if (idx === -1 || idx >= scenes.length - 1) return scenes;
  const a = scenes[idx];
  const b = scenes[idx + 1];

  const merged: SceneSpec = {
    ...a,
    endTime: b.endTime,
    summary: a.summary === b.summary ? a.summary : `${a.summary} ${b.summary}`.trim(),
    spokenExcerpt:
      a.spokenExcerpt && b.spokenExcerpt && a.spokenExcerpt !== b.spokenExcerpt
        ? `${a.spokenExcerpt} ${b.spokenExcerpt}`.trim()
        : a.spokenExcerpt || b.spokenExcerpt,
  };

  const next = [...scenes.slice(0, idx), merged, ...scenes.slice(idx + 2)];
  return renumberScenes(next);
}

export function shiftSrtCuesOffset(cues: SubtitleCue[], deltaSeconds: number): SubtitleCue[] {
  return cues.map((cue) => {
    const dur = Math.max(0.4, cue.endTime - cue.startTime);
    const nextStart = Math.max(0, Number((cue.startTime + deltaSeconds).toFixed(3)));
    const nextEnd = Number((nextStart + dur).toFixed(3));
    return {
      ...cue,
      startTime: nextStart,
      endTime: nextEnd,
    };
  });
}

/**
 * Generates a realistic 10Hz speech cadence amplitude envelope for Script-Only Quick Preview mode
 * when no voiceover audio file was uploaded yet.
 */
export function createScriptPreviewEnvelope(cues: SubtitleCue[], durationSeconds: number): number[] {
  const hz = 10;
  const totalSamples = Math.max(40, Math.ceil(durationSeconds * hz));
  const out = new Array<number>(totalSamples).fill(0.06);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / hz;
    const active = cues.find((c) => t >= c.startTime && t <= c.endTime);
    if (active) {
      const local = t - active.startTime;
      const phrase = 0.42 + 0.36 * Math.abs(Math.sin(local * 4.7)) + 0.14 * Math.cos(local * 11.3);
      out[i] = Number(Math.min(0.95, Math.max(0.18, phrase)).toFixed(3));
    }
  }
  return out;
}

// === BROWSER AUTO-SAVE DRAFTS & PROJECT LIBRARY ===

const DRAFTS_STORAGE_KEY = 'chitrakatha_studio_drafts_v1';

export interface SavedDraftRecord {
  id: string;
  title: string;
  subtitle: string;
  updatedAt: string;
  duration: number;
  sceneCount: number;
  visualStyle: VisualStyle;
  layoutMode: LayoutMode;
  colorPalette: ColorPaletteId;
  projectSnapshot: AnimationProject;
}

export function listSavedDrafts(): SavedDraftRecord[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveProjectDraft(project: AnimationProject): SavedDraftRecord[] {
  if (typeof window === 'undefined' || !window.localStorage || project.isDemo) {
    return listSavedDrafts();
  }
  try {
    // Strip volatile blob: audio URLs (unreachable across reloads) & trim huge envelopes cleanly
    const serializable: AnimationProject = {
      ...project,
      audioUrl: project.audioUrl?.startsWith('blob:') ? null : project.audioUrl,
      audioEnvelope: project.audioEnvelope ? project.audioEnvelope.slice(0, 6000) : undefined,
      phoneticFrames: undefined,
      scenes: project.scenes.map((sc) => ({
        ...sc,
        // Keep lightweight scenes; preserve customSvg only if small so localStorage stays healthy
        customSvg: sc.customSvg && sc.customSvg.length < 18000 ? sc.customSvg : undefined,
      })),
    };

    const design = serializable.designConfig ?? DEFAULT_DESIGN_CONFIG;
    const entry: SavedDraftRecord = {
      id: serializable.id,
      title: serializable.title,
      subtitle: serializable.subtitle,
      updatedAt: new Date().toISOString(),
      duration: serializable.duration,
      sceneCount: serializable.scenes.length,
      visualStyle: serializable.visualStyle ?? 'storybook-warm',
      layoutMode: design.layoutMode,
      colorPalette: design.colorPalette,
      projectSnapshot: serializable,
    };

    const existing = listSavedDrafts().filter((d) => d.id !== entry.id);
    const next = [entry, ...existing].slice(0, 8);
    window.localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return listSavedDrafts();
  }
}

export function deleteSavedDraft(draftId: string): SavedDraftRecord[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const next = listSavedDrafts().filter((d) => d.id !== draftId);
    window.localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return listSavedDrafts();
  }
}

// Re-export SceneSetting type helper usage check
export type { SceneSetting };
