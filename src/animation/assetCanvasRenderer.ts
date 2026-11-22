import {
  CharacterRole,
  SceneSpec,
  VisualStyle,
} from '../lib/storyCompiler';
import { CharacterProfile } from '../lib/storyIntelligence';
import { VisemePose } from '../lib/visemeEngine';
import { ColorPaletteId } from '../lib/redesignAndStudio';
import {
  StudioCharacterAsset,
  StudioEnvironmentAsset,
  buildCharacterProfileFromAsset,
  getCharacterAssetById,
  getEnvironmentAssetById,
} from '../lib/studioAssetLibrary';
import { clamp01, lerp } from './drawHelpers';
import { drawLifelikeHuman, HumanPose, LifelikeHumanOptions } from './humanRig';
import {
  computeCameraTransform,
  getPortraitSafeLayout,
  springValue,
} from './motionEngine';
import {
  renderAtmosphericEffects,
  renderStoryMotifOverlay,
  renderVisualStyleGrade,
} from './cinematicWorlds';

const loadedImageCache = new Map<string, HTMLImageElement>();
const pendingLoads = new Set<string>();
const assetLoadListeners = new Set<() => void>();

export function onStudioAssetLoaded(listener: () => void): () => void {
  assetLoadListeners.add(listener);
  return () => {
    assetLoadListeners.delete(listener);
  };
}

function notifyStudioAssetLoaded(): void {
  for (const fn of assetLoadListeners) {
    try {
      fn();
    } catch {
      // Ignore subscriber render errors safely
    }
  }
}

export function getLoadedStudioImage(url: string | undefined | null): HTMLImageElement | null {
  if (!url || typeof Image === 'undefined') return null;
  const cached = loadedImageCache.get(url);
  if (cached) {
    return cached.complete && cached.naturalWidth > 0 ? cached : null;
  }
  if (!pendingLoads.has(url)) {
    pendingLoads.add(url);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      pendingLoads.delete(url);
      notifyStudioAssetLoaded();
    };
    img.onerror = () => {
      pendingLoads.delete(url);
    };
    img.src = url;
    loadedImageCache.set(url, img);
  }
  return null;
}

export async function preloadStudioAssetsForScenes(scenes: SceneSpec[], profiles?: CharacterProfile[]): Promise<void> {
  if (typeof Image === 'undefined') return;
  const urls = new Set<string>();
  for (const sc of scenes) {
    if (sc.customBackgroundUrl) urls.add(sc.customBackgroundUrl);
    if (sc.customBackgroundAssetId) {
      const env = getEnvironmentAssetById(sc.customBackgroundAssetId);
      if (env) urls.add(env.url);
    }
    if (sc.primaryCharacterAssetId) {
      const ch = getCharacterAssetById(sc.primaryCharacterAssetId);
      if (ch) urls.add(ch.url);
    }
    if (sc.secondaryCharacterAssetId) {
      const ch = getCharacterAssetById(sc.secondaryCharacterAssetId);
      if (ch) urls.add(ch.url);
    }
  }
  if (profiles) {
    for (const p of profiles) {
      if (p.referenceSheetUrl) urls.add(p.referenceSheetUrl);
      if (p.sourceAssetId) {
        const ch = getCharacterAssetById(p.sourceAssetId);
        if (ch) urls.add(ch.url);
      }
    }
  }

  await Promise.all(
    Array.from(urls).map(
      (url) =>
        new Promise<void>((resolve) => {
          const ready = getLoadedStudioImage(url);
          if (ready) {
            resolve();
            return;
          }
          const img = loadedImageCache.get(url);
          if (!img) {
            resolve();
            return;
          }
          const finish = () => resolve();
          img.addEventListener('load', finish, { once: true });
          img.addEventListener('error', finish, { once: true });
        })
    )
  );
}

interface CutoutSpriteEntry {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

const cutoutSpriteCache = new Map<string, CutoutSpriteEntry>();

/**
 * Removes disconnected tiny alpha islands (floating sheet labels like "FRONT VIEW", arrows,
 * grid ticks, or color-palette dots) while preserving the main character silhouette and any
 * substantial attached props.
 */
export function stripDetachedSmallIslands(
  data: Uint8ClampedArray,
  width: number,
  height: number
): void {
  const total = width * height;
  if (total <= 0) return;

  const compIds = new Int32Array(total);
  compIds.fill(-1);
  const queue = new Int32Array(total);

  const compAreas: number[] = [];
  const compMinXs: number[] = [];
  const compMaxXs: number[] = [];
  const compMinYs: number[] = [];
  const compMaxYs: number[] = [];

  for (let i = 0; i < total; i++) {
    if (compIds[i] !== -1 || data[i * 4 + 3] <= 28) continue;

    const cid = compAreas.length;
    let area = 0;
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;

    let head = 0;
    let tail = 0;
    compIds[i] = cid;
    queue[tail++] = i;

    while (head < tail) {
      const cur = queue[head++];
      const cx = cur % width;
      const cy = (cur - cx) / width;
      area++;
      if (cx < minX) minX = cx;
      if (cx > maxX) maxX = cx;
      if (cy < minY) minY = cy;
      if (cy > maxY) maxY = cy;

      for (let dy = -1; dy <= 1; dy++) {
        const ny = cy + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = cx + dx;
          if (nx < 0 || nx >= width) continue;
          const nIdx = ny * width + nx;
          if (compIds[nIdx] === -1 && data[nIdx * 4 + 3] > 28) {
            compIds[nIdx] = cid;
            queue[tail++] = nIdx;
          }
        }
      }
    }

    compAreas.push(area);
    compMinXs.push(minX);
    compMaxXs.push(maxX);
    compMinYs.push(minY);
    compMaxYs.push(maxY);
  }

  if (compAreas.length <= 1) return;

  let mainId = 0;
  let mainArea = compAreas[0];
  for (let c = 1; c < compAreas.length; c++) {
    if (compAreas[c] > mainArea) {
      mainArea = compAreas[c];
      mainId = c;
    }
  }
  if (mainArea < 16) return;

  const mainMinX = compMinXs[mainId];
  const mainMaxX = compMaxXs[mainId];
  const mainMinY = compMinYs[mainId];
  const mainMaxY = compMaxYs[mainId];

  const removeComp = new Uint8Array(compAreas.length);
  let hasRemovals = false;
  for (let c = 0; c < compAreas.length; c++) {
    if (c === mainId) continue;
    const area = compAreas[c];
    const outsideMainBox =
      compMaxXs[c] < mainMinX - 4 ||
      compMinXs[c] > mainMaxX + 4 ||
      compMaxYs[c] < mainMinY - 4 ||
      compMinYs[c] > mainMaxY + 4;
    if (area < mainArea * 0.022 || (outsideMainBox && area < mainArea * 0.08)) {
      removeComp[c] = 1;
      hasRemovals = true;
    }
  }

  if (!hasRemovals) return;
  for (let i = 0; i < total; i++) {
    const cid = compIds[i];
    if (cid >= 0 && removeComp[cid]) {
      data[i * 4 + 3] = 0;
    }
  }
}

/**
 * Extracts a clean, crisp 2D character cutout from a Character Design Sheet image:
 * - For `isScenePortrait` images (e.g., Clinic Doctor photo-style backdrop), creates a soft feathered cinema card cutout.
 * - For 2D character sheets, crops the front-view bounding box and performs a safe 4-edge BFS flood-fill
 *   to knock out surrounding sheet cream/white paper and faint gridlines WITHOUT punching holes
 *   inside enclosed white coats, chef uniforms, spacesuits, or eyes!
 */
export function getCharacterCutoutCanvas(asset: StudioCharacterAsset): CutoutSpriteEntry | null {
  if (typeof document === 'undefined') return null;
  const cached = cutoutSpriteCache.get(asset.id);
  if (cached) return cached;

  const img = getLoadedStudioImage(asset.url);
  if (!img || !img.naturalWidth || !img.naturalHeight) return null;

  const srcX = Math.max(0, Math.round(asset.cutoutCrop.sx * img.naturalWidth));
  const srcY = Math.max(0, Math.round(asset.cutoutCrop.sy * img.naturalHeight));
  const srcW = Math.max(16, Math.min(img.naturalWidth - srcX, Math.round(asset.cutoutCrop.sw * img.naturalWidth)));
  const srcH = Math.max(16, Math.min(img.naturalHeight - srcY, Math.round(asset.cutoutCrop.sh * img.naturalHeight)));

  const targetH = Math.min(460, srcH);
  const scale = targetH / srcH;
  const targetW = Math.max(16, Math.round(srcW * scale));

  const workCanvas = document.createElement('canvas');
  workCanvas.width = targetW;
  workCanvas.height = targetH;
  const wCtx = workCanvas.getContext('2d', { willReadFrequently: true });
  if (!wCtx) return null;

  wCtx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, targetW, targetH);

  if (asset.isScenePortrait) {
    // Smooth oval cinema portrait vignette mask for scene-integrated doctor portrait
    const masked = document.createElement('canvas');
    masked.width = targetW;
    masked.height = targetH;
    const mCtx = masked.getContext('2d');
    if (mCtx) {
      mCtx.save();
      mCtx.beginPath();
      mCtx.roundRect(4, 4, targetW - 8, targetH - 8, Math.min(targetW, targetH) * 0.16);
      mCtx.clip();
      mCtx.drawImage(workCanvas, 0, 0);
      mCtx.restore();

      const grad = mCtx.createRadialGradient(
        targetW * 0.5,
        targetH * 0.45,
        Math.min(targetW, targetH) * 0.34,
        targetW * 0.5,
        targetH * 0.5,
        Math.max(targetW, targetH) * 0.62
      );
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.45)');
      mCtx.globalCompositeOperation = 'destination-out';
      mCtx.fillStyle = grad;
      mCtx.fillRect(0, 0, targetW, targetH);
      mCtx.globalCompositeOperation = 'source-over';

      const entry: CutoutSpriteEntry = { canvas: masked, width: targetW, height: targetH };
      cutoutSpriteCache.set(asset.id, entry);
      return entry;
    }
  }

  const imgData = wCtx.getImageData(0, 0, targetW, targetH);
  const data = imgData.data;

  // Estimate sheet paper RGB from corners of crop region
  const sampleCorners = [
    0,
    (targetW - 1) * 4,
    (targetH - 1) * targetW * 4,
    ((targetH - 1) * targetW + (targetW - 1)) * 4,
  ];
  let refR = 0;
  let refG = 0;
  let refB = 0;
  for (const idx of sampleCorners) {
    refR += data[idx];
    refG += data[idx + 1];
    refB += data[idx + 2];
  }
  refR /= 4;
  refG /= 4;
  refB /= 4;

  const totalPixels = targetW * targetH;
  const visited = new Uint8Array(totalPixels);
  const cleared = new Uint8Array(totalPixels);
  const queue = new Int32Array(totalPixels);
  let qHead = 0;
  let qTail = 0;

  const isBgLike = (pixIdx: number): boolean => {
    const o = pixIdx * 4;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const chroma = maxC - minC;
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    const dr = r - refR;
    const dg = g - refG;
    const db = b - refB;
    const distSq = dr * dr + dg * dg + db * db;
    // Matches warm sheet paper + faint neutral gray construction grid lines without touching saturated or dark ink lines
    return distSq <= 48 * 48 || (luma > 176 && chroma < 30);
  };

  const enqueue = (pixIdx: number) => {
    if (visited[pixIdx]) return;
    visited[pixIdx] = 1;
    if (isBgLike(pixIdx)) {
      cleared[pixIdx] = 1;
      queue[qTail++] = pixIdx;
    }
  };

  // Seed all 4 border edges
  for (let x = 0; x < targetW; x++) {
    enqueue(x);
    enqueue((targetH - 1) * targetW + x);
  }
  for (let y = 1; y < targetH - 1; y++) {
    enqueue(y * targetW);
    enqueue(y * targetW + (targetW - 1));
  }

  while (qHead < qTail) {
    const cur = queue[qHead++];
    const cx = cur % targetW;
    const cy = (cur - cx) / targetW;
    if (cx > 0) enqueue(cur - 1);
    if (cx + 1 < targetW) enqueue(cur + 1);
    if (cy > 0) enqueue(cur - targetW);
    if (cy + 1 < targetH) enqueue(cur + targetW);
  }

  // Knock out cleared background pixels & feather immediate edge pixels softly
  for (let i = 0; i < totalPixels; i++) {
    if (cleared[i]) {
      data[i * 4 + 3] = 0;
      continue;
    }
    const cx = i % targetW;
    const cy = (i - cx) / targetW;
    let adjBg = 0;
    if (cx > 0 && cleared[i - 1]) adjBg++;
    if (cx + 1 < targetW && cleared[i + 1]) adjBg++;
    if (cy > 0 && cleared[i - targetW]) adjBg++;
    if (cy + 1 < targetH && cleared[i + targetW]) adjBg++;
    if (adjBg > 0) {
      const o = i * 4;
      const luma = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
      if (luma > 185) {
        data[o + 3] = Math.min(data[o + 3], adjBg >= 2 ? 90 : 165);
      }
    }
  }

  stripDetachedSmallIslands(data, targetW, targetH);

  wCtx.putImageData(imgData, 0, 0);

  // Trim outer transparent padding so feet anchor flush on y=0
  let minX = targetW;
  let minY = targetH;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const alpha = data[(y * targetW + x) * 4 + 3];
      if (alpha > 24) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX <= minX || maxY <= minY) {
    const fallbackEntry: CutoutSpriteEntry = { canvas: workCanvas, width: targetW, height: targetH };
    cutoutSpriteCache.set(asset.id, fallbackEntry);
    return fallbackEntry;
  }

  const trimW = Math.max(12, maxX - minX + 1);
  const trimH = Math.max(12, maxY - minY + 1);
  const trimmed = document.createElement('canvas');
  trimmed.width = trimW;
  trimmed.height = trimH;
  const tCtx = trimmed.getContext('2d');
  if (!tCtx) {
    const fallbackEntry: CutoutSpriteEntry = { canvas: workCanvas, width: targetW, height: targetH };
    cutoutSpriteCache.set(asset.id, fallbackEntry);
    return fallbackEntry;
  }
  tCtx.drawImage(workCanvas, minX, minY, trimW, trimH, 0, 0, trimW, trimH);

  const entry: CutoutSpriteEntry = { canvas: trimmed, width: trimW, height: trimH };
  cutoutSpriteCache.set(asset.id, entry);
  return entry;
}

/**
 * Resolves the exact actor profile for a given scene slot, prioritizing scene-specific
 * 2D Character Sheet selections and render-mode overrides while maintaining full
 * backwards compatibility with locked custom characters and 10-role defaults.
 */
export function resolveSceneActorProfile(
  profiles: CharacterProfile[] | undefined,
  role: CharacterRole,
  scene?: Pick<
    SceneSpec,
    'characterIds' | 'primaryCharacterAssetId' | 'secondaryCharacterAssetId' | 'characterRenderMode'
  >,
  slot: 'primary' | 'secondary' = 'primary'
): Partial<CharacterProfile> | undefined {
  const overrideAssetId =
    slot === 'primary' ? scene?.primaryCharacterAssetId : scene?.secondaryCharacterAssetId;

  if (overrideAssetId) {
    const existingForAsset = profiles?.find((p) => p.sourceAssetId === overrideAssetId);
    if (existingForAsset) {
      return scene?.characterRenderMode
        ? { ...existingForAsset, renderMode: scene.characterRenderMode }
        : existingForAsset;
    }
    const asset = getCharacterAssetById(overrideAssetId);
    if (asset) {
      return buildCharacterProfileFromAsset(
        asset,
        scene?.characterRenderMode ?? 'rig-sync'
      );
    }
  }

  if (!profiles || profiles.length === 0) return undefined;

  let resolved: CharacterProfile | undefined;
  const ids = scene?.characterIds;
  if (ids && ids.length > 0) {
    resolved = profiles.find((p) => ids.includes(p.characterId) && p.role === role);
    if (!resolved && slot === 'primary') {
      resolved = profiles.find((p) => ids.includes(p.characterId));
    }
  }
  if (!resolved) {
    resolved = profiles.find((p) => p.role === role);
  }
  if (!resolved) return undefined;

  if (scene?.characterRenderMode && resolved.sourceAssetId) {
    return { ...resolved, renderMode: scene.characterRenderMode };
  }
  return resolved;
}

/**
 * Draws an uploaded 2D Character Sheet character cutout with grounded shadow,
 * speech-energy animation, walking/running stride bounce, desk/portrait framing,
 * and subtle speaker glow halo.
 */
export function drawIllustratedCharacterCutout(
  ctx: CanvasRenderingContext2D,
  opts: LifelikeHumanOptions,
  asset: StudioCharacterAsset
): void {
  const {
    x,
    y,
    scale = 1,
    facing = 1,
    pose,
    time,
    speechEnergy = 0,
    isSpeaking = false,
    isWet = false,
    rimLightColor = 'rgba(255, 224, 166, 0.36)',
  } = opts;

  const sprite = getCharacterCutoutCanvas(asset);
  const targetStandingH = 190 * scale;
  const energy = isSpeaking ? Math.max(0.08, speechEnergy) : speechEnergy * 0.25;

  const breathScaleY = 1 + Math.sin(time * 2.3 + x * 0.01) * 0.012 + (isSpeaking ? energy * 0.025 : 0);
  const breathScaleX = 1 - Math.sin(time * 2.3 + x * 0.01) * 0.008;
  const walkSpeed = pose === 'running' ? 9.2 : pose === 'walking' ? 5.2 : 0;
  const strideBounce =
    walkSpeed > 0 ? Math.abs(Math.sin(time * walkSpeed)) * (pose === 'running' ? 11 : 6) * scale : 0;
  const walkTilt =
    walkSpeed > 0
      ? Math.sin(time * walkSpeed) * 0.045
      : isSpeaking
        ? Math.sin(time * 4.4) * (0.018 * energy + 0.006)
        : Math.sin(time * 1.4) * 0.008;

  const isPortrait = pose === 'portrait-speak';
  const isDesk = pose === 'sitting-desk';

  ctx.save();
  ctx.translate(x, y);

  // Soft ground shadow beneath character feet
  if (!isPortrait) {
    ctx.fillStyle = isWet ? 'rgba(8, 14, 22, 0.44)' : 'rgba(10, 9, 12, 0.34)';
    ctx.beginPath();
    ctx.ellipse(0, 3, 30 * scale, 8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.translate(0, -strideBounce);
  ctx.scale(facing, 1);
  ctx.rotate(walkTilt);
  ctx.scale(breathScaleX, breathScaleY);

  if (!sprite) {
    // Graceful silhouette placeholder during the brief millisecond image decode
    ctx.fillStyle = asset.outfitColor;
    ctx.beginPath();
    ctx.roundRect(-24 * scale, -targetStandingH * 0.8, 48 * scale, targetStandingH * 0.8, 14 * scale);
    ctx.fill();
    ctx.restore();
    return;
  }

  const aspect = sprite.width / sprite.height;
  const drawH = isPortrait ? targetStandingH * 1.25 : isDesk ? targetStandingH * 0.92 : targetStandingH;
  const drawW = drawH * aspect;

  // Subtle rim halo when actively speaking
  if (isSpeaking && energy > 0.14) {
    const aura = ctx.createRadialGradient(
      0,
      -drawH * 0.56,
      10 * scale,
      0,
      -drawH * 0.52,
      Math.max(drawW, drawH) * 0.62
    );
    aura.addColorStop(0, rimLightColor);
    aura.addColorStop(1, 'rgba(255, 224, 166, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, -drawH * 0.52, Math.max(drawW, drawH) * 0.62, 0, Math.PI * 2);
    ctx.fill();
  }

  if (isDesk) {
    // Crop lower legs cleanly when seated behind a foreground desk
    const clipSrcH = Math.round(sprite.height * 0.66);
    const clipDrawH = drawH * 0.66;
    ctx.drawImage(
      sprite.canvas,
      0,
      0,
      sprite.width,
      clipSrcH,
      -drawW / 2,
      -clipDrawH - 36 * scale,
      drawW,
      clipDrawH
    );
  } else if (isPortrait) {
    // Frame upper torso + head gracefully for close-up portrait
    const clipSrcH = Math.round(sprite.height * 0.72);
    ctx.drawImage(
      sprite.canvas,
      0,
      0,
      sprite.width,
      clipSrcH,
      -drawW / 2,
      -drawH * 0.74,
      drawW,
      drawH * 0.72
    );
  } else {
    ctx.drawImage(sprite.canvas, -drawW / 2, -drawH, drawW, drawH);
  }

  ctx.restore();
}

export interface IllustratedSceneRenderOptions {
  ctx: CanvasRenderingContext2D;
  scene: SceneSpec;
  envAsset: StudioEnvironmentAsset | null;
  sceneTime: number;
  globalTime: number;
  width: number;
  height: number;
  speechEnergy: number;
  visualStyle?: VisualStyle;
  portraitZoom: number;
  characterProfiles?: CharacterProfile[];
  paletteId?: ColorPaletteId;
  parallaxDepth?: number;
  viseme?: VisemePose;
}

function getIllustratedCharacterPose(scene: SceneSpec): HumanPose {
  if (scene.cameraShot === 'close-up-portrait' && scene.action === 'speaking-narrator') {
    return 'portrait-speak';
  }
  switch (scene.action) {
    case 'walking-away':
      return 'walking';
    case 'running-rain':
      return 'running';
    case 'praying-reflecting':
      return 'praying';
    case 'celebrating-proud':
      return 'celebrating';
    case 'studying':
    case 'working-desk':
      return 'sitting-desk';
    case 'family-together':
    case 'home-meal':
      return 'sitting-floor';
    default:
      return 'standing-speak';
  }
}

/**
 * Renders any of the 27 uploaded 2D Environment Artworks as a dynamic cinematic
 * stage in both 16:9 Landscape and 9:16 Vertical with Ken Burns motion, weather,
 * visual grade, and both animated rig OR 2D cutout characters standing cleanly inside.
 */
export function renderIllustratedEnvironmentScene(opts: IllustratedSceneRenderOptions): void {
  const {
    ctx,
    scene,
    envAsset,
    sceneTime,
    globalTime,
    width,
    height,
    speechEnergy,
    visualStyle = 'storybook-warm',
    portraitZoom,
    characterProfiles,
    paletteId = 'heritage-gold',
    parallaxDepth = 1.0,
    viseme,
  } = opts;

  const duration = Math.max(1, scene.endTime - scene.startTime);
  const progress = clamp01(sceneTime / duration);
  const isVertical = height > width;
  const safe = getPortraitSafeLayout(width, height, portraitZoom);

  const bgUrl = scene.customBackgroundUrl || envAsset?.url;
  const bgImg = getLoadedStudioImage(bgUrl);

  const cam = computeCameraTransform({
    width,
    height,
    sceneTime,
    sceneDuration: duration,
    globalTime,
    cameraMotion: scene.cameraMotion ?? 'dolly-in',
    cameraShot: scene.cameraShot ?? 'medium-two-shot',
    focalPointX: scene.focalPointX ?? 0.5,
    portraitZoom,
    speechEnergy,
  });

  // 1. Background 2D Environment Artwork (Cover-fitted + Gentle Ken Burns Motion)
  ctx.save();
  if (bgImg) {
    const overscan = 1.08;
    const baseScale = Math.max(width / bgImg.naturalWidth, height / bgImg.naturalHeight) * overscan;
    const zoomScale = baseScale * (0.98 + (cam.zoom - 1) * 0.45);
    const drawW = bgImg.naturalWidth * zoomScale;
    const drawH = bgImg.naturalHeight * zoomScale;
    const focalX = clamp01(scene.focalPointX ?? 0.5);
    const extraW = Math.max(0, drawW - width);
    const extraH = Math.max(0, drawH - height);
    const panShift = cam.panX * 0.45 * parallaxDepth;
    const drawX = -extraW * focalX + panShift;
    const drawY = -extraH * 0.42 + cam.panY * 0.35 * parallaxDepth;

    ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#1D2434');
    grad.addColorStop(0.6, '#2B354A');
    grad.addColorStop(1, '#12161F');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // Subtle lower floor-plane depth gradient so foreground characters read sharply against bright illustrations
  const groundFade = ctx.createLinearGradient(0, height * 0.52, 0, height);
  groundFade.addColorStop(0, 'rgba(10, 12, 18, 0)');
  groundFade.addColorStop(0.65, 'rgba(10, 12, 18, 0.16)');
  groundFade.addColorStop(1, 'rgba(8, 10, 16, 0.38)');
  ctx.fillStyle = groundFade;
  ctx.fillRect(0, height * 0.52, width, height * 0.48);
  ctx.restore();

  // 2. Expressive Characters in Foreground Stage (Supports BOTH Lip-Sync Rig AND 2D Sheet Cutout)
  const enterSpring = Math.min(1, springValue(sceneTime, { stiffness: 135, damping: 18 }));
  const enterOffsetY = (1 - enterSpring) * 14;
  const primaryRole: CharacterRole = scene.primaryCharacter ?? 'narrator';
  const secondaryRole: CharacterRole | null = scene.secondaryCharacter ?? null;
  const hasSecondary = Boolean(secondaryRole || scene.secondaryCharacterAssetId);

  const primaryProfile = resolveSceneActorProfile(characterProfiles, primaryRole, scene, 'primary');
  const secondaryProfile = hasSecondary
    ? resolveSceneActorProfile(
        characterProfiles,
        secondaryRole ?? 'friend',
        scene,
        'secondary'
      )
    : undefined;

  const groundY = isVertical ? height * 0.78 : height * 0.87;
  const pose = getIllustratedCharacterPose(scene);
  const isSpeaking = speechEnergy > 0.11;
  const isWet = scene.weather === 'rain' || scene.weather === 'heavy-storm';
  const seed = scene.visualSeed ?? 1;
  const walkDir: 1 | -1 = seed % 2 === 0 ? 1 : -1;
  const unitScale = isVertical ? Math.min(1.62, 1.24 * safe.subjectScale) : 1.44;
  const rimLight = 'rgba(255, 224, 166, 0.42)';

  let primaryX = safe.clampX(width * (scene.focalPointX ?? 0.5), 62);
  if (pose === 'walking' || pose === 'running') {
    const xA = safe.clampX(width * 0.28, 62);
    const xB = safe.clampX(width * 0.72, 62);
    primaryX = walkDir === 1 ? lerp(xA, xB, progress) : lerp(xB, xA, progress);
  } else if (hasSecondary) {
    primaryX = safe.clampX(isVertical ? width * 0.36 : width * 0.39, 58);
  }

  drawLifelikeHuman(ctx, {
    x: primaryX,
    y: groundY + enterOffsetY,
    scale: pose === 'portrait-speak' ? unitScale * 1.18 : unitScale,
    facing: hasSecondary ? 1 : walkDir,
    role: primaryProfile?.role ?? primaryRole,
    emotion: scene.emotion ?? 'calm',
    pose,
    time: globalTime,
    speechEnergy,
    isSpeaking,
    viseme: isSpeaking ? viseme : undefined,
    isWet,
    prop: scene.prop ?? 'none',
    rimLightColor: rimLight,
    profile: primaryProfile,
  });

  if (hasSecondary && pose !== 'portrait-speak') {
    const secX =
      pose === 'walking' || pose === 'running'
        ? safe.clampX(primaryX - walkDir * (isVertical ? 82 : 112), 54)
        : safe.clampX(isVertical ? width * 0.65 : width * 0.62, 58);
    drawLifelikeHuman(ctx, {
      x: secX,
      y: groundY + 3 + enterOffsetY,
      scale: unitScale * 0.94,
      facing: pose === 'walking' || pose === 'running' ? walkDir : -1,
      role: secondaryProfile?.role ?? secondaryRole ?? 'friend',
      emotion: scene.emotion === 'sad' ? 'emotional' : 'calm',
      pose: pose === 'walking' ? 'walking' : pose === 'celebrating' ? 'celebrating' : 'listening',
      time: globalTime + 0.45,
      speechEnergy: 0,
      isSpeaking: false,
      isWet,
      rimLightColor: rimLight,
      profile: secondaryProfile,
    });
  }

  // 3. Weather, Motif & Cinema Grade Overlays
  if (scene.motif && scene.motif !== 'none') {
    renderStoryMotifOverlay(ctx, scene.motif, globalTime, width, height, speechEnergy);
  }
  renderAtmosphericEffects(ctx, scene.weather, scene.timeOfDay, globalTime, width, height, speechEnergy);
  renderVisualStyleGrade(ctx, visualStyle, width, height, paletteId);
}
