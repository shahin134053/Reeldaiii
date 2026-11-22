import type {
  AnimationProject,
  CameraMotion,
  TimeOfDay,
  VisualStyle,
} from './storyCompiler';
import {
  COLOR_PALETTES,
  ColorPaletteId,
  DEFAULT_DESIGN_CONFIG,
  LayoutMode,
} from './redesignAndStudio';

export type ReferenceMediaType = 'image' | 'video';

export type ReferenceApplyMode = 'style-and-palette' | 'backdrop-overlay';

export interface ReferenceMediaProfile {
  id: string;
  fileName: string;
  mediaType: ReferenceMediaType;
  thumbnailDataUrl: string;
  videoObjectUrl?: string | null;
  width: number;
  height: number;
  durationSec?: number;
  /** [dark/shadow hex, midtone hex, vibrant accent hex] */
  dominantSwatches: [string, string, string];
  averageLuminance: number; // 0..1
  averageSaturation: number; // 0..1
  warmthScore: number; // -1 (cool) .. +1 (warm)
  matchedVisualStyle: VisualStyle;
  matchedColorPalette: ColorPaletteId;
  matchedTimeOfDay: TimeOfDay;
  recommendedLayoutMode: LayoutMode;
  recommendedCameraMotion: CameraMotion;
  recommendedParallaxDepth: number;
  applyMode: ReferenceApplyMode;
  summaryEn: string;
  summaryBn: string;
}

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

export function rgbToHex(r: number, g: number, b: number): string {
  const hr = clampByte(r).toString(16).padStart(2, '0');
  const hg = clampByte(g).toString(16).padStart(2, '0');
  const hb = clampByte(b).toString(16).padStart(2, '0');
  return `#${hr}${hg}${hb}`.toUpperCase();
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s, l };
}

/**
 * Pure deterministic pixel analyzer that inspects RGBA pixel buffers from a
 * reference image or video frame and derives dominant swatches, visual style,
 * studio color palette, time of day, and camera motion.
 */
export function analyzeReferencePixels(
  rgba: Uint8ClampedArray | number[],
  width: number,
  height: number,
  options?: {
    fileName?: string;
    mediaType?: ReferenceMediaType;
    thumbnailDataUrl?: string;
    videoObjectUrl?: string | null;
    durationSec?: number;
    applyMode?: ReferenceApplyMode;
  }
): ReferenceMediaProfile {
  const totalPixels = Math.max(1, Math.floor(rgba.length / 4));

  let sumLum = 0;
  let sumSat = 0;
  let sumWarmth = 0;

  let darkR = 20,
    darkG = 22,
    darkB = 30,
    darkCount = 0;
  let midR = 90,
    midG = 110,
    midB = 135,
    midCount = 0;
  let accR = 245,
    accG = 172,
    accB = 28,
    bestAccentScore = -1;

  let greenDominantCount = 0;
  let redCrimsonCount = 0;
  let cyanBlueCount = 0;
  let goldAmberCount = 0;

  for (let i = 0; i < rgba.length - 3; i += 4) {
    const a = rgba[i + 3];
    if (a < 32) continue;

    const r = rgba[i];
    const g = rgba[i + 1];
    const b = rgba[i + 2];

    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const { h, s } = rgbToHsl(r, g, b);
    const warmth = (r - b) / 255; // +warm (red/gold), -cool (blue/cyan)

    sumLum += lum;
    sumSat += s;
    sumWarmth += warmth;

    if (lum < 0.34) {
      darkR += r;
      darkG += g;
      darkB += b;
      darkCount++;
    } else if (lum < 0.72) {
      midR += r;
      midG += g;
      midB += b;
      midCount++;
    }

    // Vibrant accent candidate
    const accentScore = s * 1.4 + (1 - Math.abs(lum - 0.58)) * 0.6;
    if (accentScore > bestAccentScore && lum > 0.22 && lum < 0.92) {
      bestAccentScore = accentScore;
      accR = r;
      accG = g;
      accB = b;
    }

    if (s > 0.2) {
      if (h >= 85 && h <= 165) greenDominantCount++;
      else if (h >= 330 || h <= 22) redCrimsonCount++;
      else if (h >= 180 && h <= 255) cyanBlueCount++;
      else if (h > 22 && h < 70) goldAmberCount++;
    }
  }

  const avgLum = Number((sumLum / totalPixels).toFixed(3));
  const avgSat = Number((sumSat / totalPixels).toFixed(3));
  const warmthScore = Number((sumWarmth / totalPixels).toFixed(3));

  const finalDarkHex =
    darkCount > 0
      ? rgbToHex(darkR / (darkCount + 1), darkG / (darkCount + 1), darkB / (darkCount + 1))
      : '#12131A';
  const finalMidHex =
    midCount > 0
      ? rgbToHex(midR / (midCount + 1), midG / (midCount + 1), midB / (midCount + 1))
      : '#4A5568';
  const finalAccentHex = rgbToHex(accR, accG, accB);

  // Match studio color palette from pixel statistics
  let matchedColorPalette: ColorPaletteId = 'heritage-gold';
  if (avgSat < 0.14) {
    matchedColorPalette = 'monochrome-noir';
  } else if (
    greenDominantCount >= cyanBlueCount &&
    greenDominantCount >= redCrimsonCount &&
    greenDominantCount >= goldAmberCount &&
    greenDominantCount > totalPixels * 0.08
  ) {
    matchedColorPalette = 'emerald-earth';
  } else if (
    redCrimsonCount >= cyanBlueCount &&
    redCrimsonCount >= goldAmberCount &&
    redCrimsonCount > totalPixels * 0.08
  ) {
    matchedColorPalette = 'crimson-drama';
  } else if (cyanBlueCount > goldAmberCount && warmthScore < -0.04) {
    matchedColorPalette = 'midnight-neon';
  } else if (avgLum > 0.62 && avgSat < 0.45) {
    matchedColorPalette = 'pastel-watercolor';
  } else {
    matchedColorPalette = 'heritage-gold';
  }

  // Match visual animation style
  let matchedVisualStyle: VisualStyle = 'storybook-warm';
  if (matchedColorPalette === 'monochrome-noir' || (avgLum < 0.28 && avgSat < 0.28)) {
    matchedVisualStyle = 'dramatic-noir';
  } else if (
    avgSat >= 0.42 ||
    matchedColorPalette === 'midnight-neon' ||
    matchedColorPalette === 'crimson-drama'
  ) {
    matchedVisualStyle = 'cinematic-anime';
  } else if (warmthScore >= 0.04 || matchedColorPalette === 'heritage-gold') {
    matchedVisualStyle = 'storybook-warm';
  } else {
    matchedVisualStyle = 'editorial-doc';
  }

  // Match time of day / lighting atmosphere
  let matchedTimeOfDay: TimeOfDay = 'morning';
  if (avgLum < 0.28) {
    matchedTimeOfDay = warmthScore < -0.05 ? 'storm' : 'night';
  } else if (avgLum < 0.48) {
    matchedTimeOfDay = warmthScore >= 0 ? 'sunset' : 'dawn';
  } else if (avgLum > 0.68) {
    matchedTimeOfDay = 'afternoon';
  } else {
    matchedTimeOfDay = 'morning';
  }

  const mediaType: ReferenceMediaType = options?.mediaType ?? 'image';
  const durationSec = options?.durationSec;
  const recommendedCameraMotion: CameraMotion =
    mediaType === 'video'
      ? durationSec && durationSec < 10
        ? 'dolly-in'
        : 'pan-right'
      : avgSat > 0.4
        ? 'dolly-in'
        : 'tracking';

  const recommendedLayoutMode: LayoutMode = 'full-bleed';
  const recommendedParallaxDepth = mediaType === 'video' ? 1.25 : 1.15;

  const paletteMeta = COLOR_PALETTES[matchedColorPalette];
  const styleNameEn =
    matchedVisualStyle === 'cinematic-anime'
      ? 'Cinematic Anime'
      : matchedVisualStyle === 'dramatic-noir'
        ? 'Dramatic Noir'
        : matchedVisualStyle === 'editorial-doc'
          ? 'Editorial Documentary'
          : 'Warm Storybook';
  const styleNameBn =
    matchedVisualStyle === 'cinematic-anime'
      ? 'সিনেমাটিক অ্যানিমে'
      : matchedVisualStyle === 'dramatic-noir'
        ? 'ড্রামাটিক নয়ার'
        : matchedVisualStyle === 'editorial-doc'
          ? 'এডিটোরিয়াল ডকুমেন্টারি'
          : 'ওয়ার্ম স্টোরিবুক';

  return {
    id: `ref-${Date.now().toString(36)}`,
    fileName: options?.fileName || 'reference-media',
    mediaType,
    thumbnailDataUrl: options?.thumbnailDataUrl || '',
    videoObjectUrl: options?.videoObjectUrl ?? null,
    width: Math.max(1, width),
    height: Math.max(1, height),
    durationSec,
    dominantSwatches: [finalDarkHex, finalMidHex, finalAccentHex],
    averageLuminance: avgLum,
    averageSaturation: avgSat,
    warmthScore,
    matchedVisualStyle,
    matchedColorPalette,
    matchedTimeOfDay,
    recommendedLayoutMode,
    recommendedCameraMotion,
    recommendedParallaxDepth,
    applyMode: options?.applyMode ?? 'style-and-palette',
    summaryEn: `${styleNameEn} · ${paletteMeta.label} Palette · ${matchedTimeOfDay} lighting`,
    summaryBn: `${styleNameBn} · ${paletteMeta.labelBn} প্যালেট · ${matchedTimeOfDay} লাইটিং`,
  };
}

/**
 * Applies a ReferenceMediaProfile to an AnimationProject so that every scene
 * adopts the reference's extracted visual style, color palette, accent color,
 * lighting mood, and optional reference backdrop layer.
 */
export function applyReferenceMediaToProject(
  project: AnimationProject,
  reference: ReferenceMediaProfile
): AnimationProject {
  const accentHex = reference.dominantSwatches[2] || '#FFAC1C';
  const currentDesign = project.designConfig ?? DEFAULT_DESIGN_CONFIG;

  const updatedScenes = project.scenes.map((scene, idx) => {
    const motionCycle: CameraMotion[] = [
      reference.recommendedCameraMotion,
      'tracking',
      'dolly-in',
      'pan-right',
    ];
    return {
      ...scene,
      accentColor: accentHex,
      lightingColor: reference.dominantSwatches[1] || scene.lightingColor,
      cameraMotion: motionCycle[idx % motionCycle.length],
      // Remove locked demo presetSceneId if backdrop-overlay is chosen so procedural/reference world renders
      presetSceneId:
        reference.applyMode === 'backdrop-overlay' ? undefined : scene.presetSceneId,
    };
  });

  return {
    ...project,
    visualStyle: reference.matchedVisualStyle,
    referenceMedia: reference,
    designConfig: {
      ...currentDesign,
      colorPalette: reference.matchedColorPalette,
      layoutMode: reference.recommendedLayoutMode,
      parallaxDepth: reference.recommendedParallaxDepth,
    },
    scenes: updatedScenes,
  };
}

/**
 * Extracts a ReferenceMediaProfile from an uploaded browser Image or Video File.
 */
export async function analyzeReferenceMediaFile(
  file: File,
  applyMode: ReferenceApplyMode = 'style-and-palette'
): Promise<ReferenceMediaProfile> {
  const lower = file.name.toLowerCase();
  const isVideo =
    file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|ogv)$/i.test(lower);

  if (isVideo) {
    return analyzeReferenceVideoFile(file, applyMode);
  }
  return analyzeReferenceImageFile(file, applyMode);
}

async function analyzeReferenceImageFile(
  file: File,
  applyMode: ReferenceApplyMode
): Promise<ReferenceMediaProfile> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Unable to read reference image file.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Invalid reference image format.'));
    el.src = dataUrl;
  });

  const sampleW = 64;
  const sampleH = 64;
  const canvas = document.createElement('canvas');
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable.');
  }
  ctx.drawImage(img, 0, 0, sampleW, sampleH);
  const imageData = ctx.getImageData(0, 0, sampleW, sampleH);

  // Create compact preview thumbnail data URL (max 640px wide)
  const thumbW = Math.min(640, img.naturalWidth || 640);
  const thumbH = Math.max(
    1,
    Math.round((thumbW * (img.naturalHeight || 360)) / Math.max(1, img.naturalWidth || 640))
  );
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = thumbW;
  thumbCanvas.height = thumbH;
  const thumbCtx = thumbCanvas.getContext('2d');
  thumbCtx?.drawImage(img, 0, 0, thumbW, thumbH);
  const thumbnailDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.84);

  return analyzeReferencePixels(
    imageData.data,
    img.naturalWidth || thumbW,
    img.naturalHeight || thumbH,
    {
      fileName: file.name,
      mediaType: 'image',
      thumbnailDataUrl,
      applyMode,
    }
  );
}

async function analyzeReferenceVideoFile(
  file: File,
  applyMode: ReferenceApplyMode
): Promise<ReferenceMediaProfile> {
  const videoUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.src = videoUrl;
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => resolve(), 3500);
    video.onloadeddata = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    video.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error('Unable to decode reference video file.'));
    };
    video.load();
  });

  const durationSec =
    Number.isFinite(video.duration) && video.duration > 0
      ? Number(video.duration.toFixed(1))
      : 8;

  // Seek to a representative frame (25% or 1.0s)
  const targetTime = Math.min(1.2, Math.max(0.1, durationSec * 0.25));
  await new Promise<void>((resolve) => {
    const timeout = window.setTimeout(() => resolve(), 1500);
    video.onseeked = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    try {
      video.currentTime = targetTime;
    } catch {
      window.clearTimeout(timeout);
      resolve();
    }
  });

  const vidW = video.videoWidth || 640;
  const vidH = video.videoHeight || 360;

  const sampleW = 64;
  const sampleH = 64;
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = sampleW;
  sampleCanvas.height = sampleH;
  const sampleCtx = sampleCanvas.getContext('2d');
  sampleCtx?.drawImage(video, 0, 0, sampleW, sampleH);
  const pixelData =
    sampleCtx?.getImageData(0, 0, sampleW, sampleH).data ??
    new Uint8ClampedArray(sampleW * sampleH * 4);

  const thumbW = Math.min(640, vidW);
  const thumbH = Math.max(1, Math.round((thumbW * vidH) / Math.max(1, vidW)));
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = thumbW;
  thumbCanvas.height = thumbH;
  const thumbCtx = thumbCanvas.getContext('2d');
  thumbCtx?.drawImage(video, 0, 0, thumbW, thumbH);
  const thumbnailDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.84);

  return analyzeReferencePixels(pixelData, vidW, vidH, {
    fileName: file.name,
    mediaType: 'video',
    thumbnailDataUrl,
    videoObjectUrl: videoUrl,
    durationSec,
    applyMode,
  });
}

/**
 * Generates a built-in synthetic sample ReferenceMediaProfile so users can also
 * test 1-click reference style matching immediately in the browser.
 */
export function createSampleReferenceProfile(
  preset: 'anime-sunset' | 'emerald-folklore' | 'midnight-cyber' = 'anime-sunset',
  applyMode: ReferenceApplyMode = 'style-and-palette'
): ReferenceMediaProfile {
  const sampleW = 32;
  const sampleH = 32;
  const buf = new Uint8ClampedArray(sampleW * sampleH * 4);

  for (let y = 0; y < sampleH; y++) {
    for (let x = 0; x < sampleW; x++) {
      const idx = (y * sampleW + x) * 4;
      const t = y / sampleH;
      if (preset === 'emerald-folklore') {
        buf[idx] = Math.round(18 + t * 40);
        buf[idx + 1] = Math.round(65 + t * 145);
        buf[idx + 2] = Math.round(45 + t * 80);
      } else if (preset === 'midnight-cyber') {
        buf[idx] = Math.round(12 + t * 30);
        buf[idx + 1] = Math.round(40 + t * 150);
        buf[idx + 2] = Math.round(95 + t * 155);
      } else {
        // anime-sunset
        buf[idx] = Math.round(45 + t * 200);
        buf[idx + 1] = Math.round(24 + t * 115);
        buf[idx + 2] = Math.round(38 + (1 - t) * 70);
      }
      buf[idx + 3] = 255;
    }
  }

  let thumbnailDataUrl = '';
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = 320;
    c.height = 180;
    const ctx = c.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, 180);
      if (preset === 'emerald-folklore') {
        grad.addColorStop(0, '#092218');
        grad.addColorStop(0.55, '#1B5E43');
        grad.addColorStop(1, '#34D399');
      } else if (preset === 'midnight-cyber') {
        grad.addColorStop(0, '#070B19');
        grad.addColorStop(0.55, '#133B6E');
        grad.addColorStop(1, '#38BDF8');
      } else {
        grad.addColorStop(0, '#1A0E24');
        grad.addColorStop(0.5, '#8E2A49');
        grad.addColorStop(1, '#FF9E2C');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 320, 180);

      // Draw stylized reference horizon & sun/moon silhouette
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.beginPath();
      ctx.arc(230, 62, 26, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(8, 10, 16, 0.55)';
      ctx.beginPath();
      ctx.moveTo(0, 145);
      ctx.lineTo(75, 118);
      ctx.lineTo(155, 138);
      ctx.lineTo(240, 112);
      ctx.lineTo(320, 136);
      ctx.lineTo(320, 180);
      ctx.lineTo(0, 180);
      ctx.closePath();
      ctx.fill();

      thumbnailDataUrl = c.toDataURL('image/jpeg', 0.85);
    }
  }

  return analyzeReferencePixels(buf, 320, 180, {
    fileName: `${preset}-reference.png`,
    mediaType: 'image',
    thumbnailDataUrl,
    applyMode,
  });
}
