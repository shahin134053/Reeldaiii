import { AspectRatio, CameraMotion, CameraShot } from '../lib/storyCompiler';

export type ExportQuality = '4k' | '1080p' | '720p';

export interface QualityPreset {
  id: ExportQuality;
  label: string;
  shortLabel: string;
  description: string;
  dimensions: Record<AspectRatio, { width: number; height: number }>;
  videoBitsPerSecond: number;
}

export const EXPORT_QUALITY_PRESETS: Record<ExportQuality, QualityPreset> = {
  '4k': {
    id: '4k',
    label: '4K Ultra HD',
    shortLabel: '4K UHD',
    description: '3840×2160 / 2160×3840 · Cinema Master',
    dimensions: {
      '16:9': { width: 3840, height: 2160 },
      '9:16': { width: 2160, height: 3840 },
    },
    videoBitsPerSecond: 22_000_000,
  },
  '1080p': {
    id: '1080p',
    label: 'Full HD 1080p',
    shortLabel: '1080p HD',
    description: '1920×1080 / 1080×1920 · Recommended',
    dimensions: {
      '16:9': { width: 1920, height: 1080 },
      '9:16': { width: 1080, height: 1920 },
    },
    videoBitsPerSecond: 10_000_000,
  },
  '720p': {
    id: '720p',
    label: 'HD 720p (Fast)',
    shortLabel: '720p Fast',
    description: '1280×720 / 720×1280 · Fast Share',
    dimensions: {
      '16:9': { width: 1280, height: 720 },
      '9:16': { width: 720, height: 1280 },
    },
    videoBitsPerSecond: 5_000_000,
  },
};

export interface SpringConfig {
  stiffness?: number;
  damping?: number;
  mass?: number;
}

/**
 * Remotion-compatible damped harmonic spring solver.
 * Produces crisp, natural physical overshoot & settle curves driven by exact elapsed time.
 */
export function springValue(
  elapsedSeconds: number,
  config: SpringConfig = {}
): number {
  if (elapsedSeconds <= 0) return 0;
  const stiffness = config.stiffness ?? 140;
  const damping = config.damping ?? 16;
  const mass = config.mass ?? 1;

  const omega0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const t = Math.min(elapsedSeconds, 6);

  if (zeta < 1) {
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
    const envelope = Math.exp(-zeta * omega0 * t);
    return (
      1 -
      envelope *
        (Math.cos(omegaD * t) + (zeta * omega0 / omegaD) * Math.sin(omegaD * t))
    );
  }
  if (Math.abs(zeta - 1) < 1e-4) {
    return 1 - Math.exp(-omega0 * t) * (1 + omega0 * t);
  }
  const r1 = -omega0 * (zeta - Math.sqrt(zeta * zeta - 1));
  const r2 = -omega0 * (zeta + Math.sqrt(zeta * zeta - 1));
  const c1 = r2 / (r2 - r1);
  const c2 = -r1 / (r2 - r1);
  return 1 - (c1 * Math.exp(r1 * t) + c2 * Math.exp(r2 * t));
}

export function interpolateRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  clamp = true
): number {
  if (inMax === inMin) return outMin;
  let t = (value - inMin) / (inMax - inMin);
  if (clamp) t = Math.max(0, Math.min(1, t));
  return outMin + (outMax - outMin) * t;
}

export interface PortraitSafeLayout {
  isVertical: boolean;
  safeLeft: number;
  safeRight: number;
  safeWidth: number;
  safeTop: number;
  safeBottom: number;
  safeHeight: number;
  centerX: number;
  subjectScale: number;
  /** Clamps an X coordinate cleanly inside the safe horizontal zone with optional half-width padding */
  clampX: (x: number, halfItemWidth?: number) => number;
}

/**
 * Computes responsive 9:16 Portrait & 16:9 Landscape safe-zone layout bounds.
 * Ensures characters, dialogue pairs, props, and furniture remain 100% inside the visible frame
 * (clear of side edges, top chapter header, and bottom subtitle zone) instead of blindly cropping.
 */
export function getPortraitSafeLayout(
  width: number,
  height: number,
  portraitZoom = 1.38
): PortraitSafeLayout {
  const isVertical = height > width;
  const safeLeft = isVertical ? width * 0.14 : width * 0.08;
  const safeRight = isVertical ? width * 0.86 : width * 0.92;
  const safeTop = isVertical ? height * 0.14 : height * 0.08;
  const safeBottom = isVertical ? height * 0.78 : height * 0.88;
  const safePortrait = Math.max(1.0, Math.min(1.8, portraitZoom));

  // Scale characters/props responsively inside 9:16 rather than cropping the whole canvas edge-to-edge
  const subjectScale = isVertical
    ? 1.04 + (safePortrait - 1.0) * 0.48
    : 1.0;

  return {
    isVertical,
    safeLeft,
    safeRight,
    safeWidth: safeRight - safeLeft,
    safeTop,
    safeBottom,
    safeHeight: safeBottom - safeTop,
    centerX: width * 0.5,
    subjectScale,
    clampX: (x: number, halfItemWidth = 0) => {
      const minX = safeLeft + halfItemWidth;
      const maxX = safeRight - halfItemWidth;
      if (minX >= maxX) return width * 0.5;
      return Math.max(minX, Math.min(maxX, x));
    },
  };
}

export interface CameraTransformInput {
  width: number;
  height: number;
  sceneTime: number;
  sceneDuration: number;
  globalTime: number;
  cameraMotion?: CameraMotion;
  cameraShot?: CameraShot;
  focalPointX?: number;
  /** User-configurable 9:16 portrait subject framing multiplier (1.0 = wide, 1.38 = balanced close-up, 1.8 = tight) */
  portraitZoom?: number;
  speechEnergy?: number;
  isOpeningScene?: boolean;
  isDramaticBeat?: boolean;
}

export interface CameraTransformResult {
  zoom: number;
  subjectScale: number;
  panX: number;
  panY: number;
  anchorX: number;
  anchorY: number;
  hookBloom: number;
}

/**
 * Computes frame-accurate camera choreography for 16:9 and 9:16 canvases.
 * In 9:16 Portrait mode, keeps canvas zoom gentle (<= 1.15x) and shifts subject framing to `subjectScale`
 * + safe pan limits so zero characters or foreground props get cut off at the left/right sides.
 */
export function computeCameraTransform(
  input: CameraTransformInput
): CameraTransformResult {
  const {
    width,
    height,
    sceneTime,
    sceneDuration,
    globalTime,
    cameraMotion = 'dolly-in',
    cameraShot = 'medium-two-shot',
    focalPointX = 0.5,
    portraitZoom = 1.38,
    speechEnergy = 0,
    isOpeningScene = false,
    isDramaticBeat = false,
  } = input;

  const isVertical = height > width;
  const duration = Math.max(0.8, sceneDuration);
  const progress = Math.max(0, Math.min(1, sceneTime / duration));
  const ease = progress * progress * (3 - 2 * progress);

  // Remotion-style spring entrance punch-in during the first 1.1s of each scene
  const entrySpring = springValue(sceneTime, {
    stiffness: isOpeningScene ? 120 : 95,
    damping: 17,
    mass: 1,
  });
  const hookZoomPulse = isOpeningScene
    ? (1 - entrySpring) * (isVertical ? 0.05 : 0.12)
    : (1 - entrySpring) * 0.03;
  const hookBloom = isOpeningScene
    ? Math.max(0, 1 - sceneTime / 1.15) * 0.42
    : Math.max(0, 1 - sceneTime / 0.55) * 0.22;

  // Base camera motion curve (sleek cinematic drift without clipping edges in 9:16)
  let motionZoom = isVertical ? 1.01 : 1.03;
  let panX = 0;
  let panY = 0;
  const panSpanX = isVertical ? width * 0.014 : width * 0.028;

  if (cameraMotion === 'dolly-in') {
    motionZoom = interpolateRange(ease, 0, 1, 1.01, isVertical ? 1.06 : 1.12);
  } else if (cameraMotion === 'dolly-out') {
    motionZoom = interpolateRange(ease, 0, 1, isVertical ? 1.07 : 1.12, 1.01);
  } else if (cameraMotion === 'pan-left') {
    motionZoom = isVertical ? 1.03 : 1.08;
    panX = interpolateRange(ease, 0, 1, panSpanX, -panSpanX);
  } else if (cameraMotion === 'pan-right' || cameraMotion === 'tracking') {
    motionZoom = isVertical ? 1.03 : 1.08;
    panX = interpolateRange(ease, 0, 1, -panSpanX, panSpanX);
  } else if (cameraMotion === 'tilt-up') {
    motionZoom = isVertical ? 1.03 : 1.08;
    panY = interpolateRange(ease, 0, 1, height * 0.02, -height * 0.02);
  }

  // Gentle safe camera adjustment + subject framing scale for 9:16
  const safePortraitZoom = Math.max(1.0, Math.min(1.85, portraitZoom));
  const shotSubjectFactor =
    cameraShot === 'close-up-portrait'
      ? 1.12
      : cameraShot === 'medium-two-shot'
        ? 1.02
        : cameraShot === 'tracking-pan'
          ? 0.98
          : 0.92;

  const subjectScale = isVertical
    ? (1.02 + (safePortraitZoom - 1.0) * 0.44) * shotSubjectFactor
    : 1.0;

  let shotCameraMultiplier = 1.0;
  if (isVertical) {
    // Never exceed subtle 1.0..1.07 camera zoom boost in portrait mode so safe-zone objects never clip
    shotCameraMultiplier = 1.0 + Math.max(0, safePortraitZoom - 1.0) * 0.08;
  } else if (cameraShot === 'close-up-portrait') {
    shotCameraMultiplier = 1.07;
  }

  // Subtle voice-reactive push + cinematic handheld micro-drift
  const voicePush = speechEnergy * (isVertical ? 0.015 : 0.018);
  const breathX = Math.sin(globalTime * 0.95) * (isVertical ? 1.4 : 2.0);
  const breathY = Math.cos(globalTime * 1.25) * (isVertical ? 2.0 : 2.2);

  const shakeAmp = isDramaticBeat ? 2.0 + speechEnergy * 2.8 : 0;
  const shakeX = shakeAmp > 0 ? Math.sin(globalTime * 27.3) * shakeAmp : 0;
  const shakeY = shakeAmp > 0 ? Math.cos(globalTime * 31.7) * shakeAmp : 0;

  const clampedFocalX = Math.max(0.32, Math.min(0.68, focalPointX));
  const anchorX = isVertical ? width * 0.5 : width * clampedFocalX;
  const anchorY = isVertical ? height * 0.50 : height * 0.5;

  const rawZoom = motionZoom * shotCameraMultiplier + hookZoomPulse + voicePush;
  const zoom = isVertical ? Math.max(1.0, Math.min(1.14, rawZoom)) : Math.max(1.0, rawZoom);

  return {
    zoom,
    subjectScale,
    panX: panX + breathX + shakeX,
    panY: panY + breathY + shakeY,
    anchorX,
    anchorY,
    hookBloom,
  };
}

export type SceneTransitionStyle = 'light-leak' | 'iris-glow' | 'film-dissolve';

export interface SceneTransitionState {
  style: SceneTransitionStyle;
  darknessAlpha: number;
  flareAlpha: number;
  wipeProgress: number;
}

/**
 * Computes scroll-stopping cinematic transition intensity at scene boundaries
 * while keeping frame t=0 of the opening scene bright and immediately gripping.
 */
export function computeTransitionState(
  sceneStartTime: number,
  sceneTime: number,
  sceneDuration: number,
  chapterIndex: number
): SceneTransitionState {
  const styles: SceneTransitionStyle[] = ['light-leak', 'iris-glow', 'film-dissolve'];
  const style = styles[Math.abs(chapterIndex) % styles.length];

  const isFirstScene = sceneStartTime <= 0.1;
  const inFrac = isFirstScene ? 1 : Math.max(0, Math.min(1, sceneTime / 0.45));
  const outFrac = Math.max(0, Math.min(1, (sceneDuration - sceneTime) / 0.38));

  const edge = Math.min(inFrac, outFrac);
  const inverseEdge = 1 - edge;

  return {
    style,
    darknessAlpha: inverseEdge * (style === 'film-dissolve' ? 0.56 : 0.32),
    flareAlpha:
      !isFirstScene && sceneTime < 0.55
        ? Math.sin((sceneTime / 0.55) * Math.PI) * 0.48
        : 0,
    wipeProgress: inFrac,
  };
}
