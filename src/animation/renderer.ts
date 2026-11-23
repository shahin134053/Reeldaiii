import { SubtitleCue, getActiveCue } from '../lib/srtParser';
import { sampleSpeechEnergy } from '../lib/audioAnalyzer';
import { sampleVisemePose } from '../lib/visemeEngine';
import {
  AnimationProject,
  AspectRatio,
  SceneSpec,
  getProjectSceneAtTime,
} from '../lib/storyCompiler';
import { SceneId } from '../lib/storyboard';
import { CANVAS_W, CANVAS_H, clamp01 } from './drawHelpers';
import {
  renderSceneMorningDropoff,
  renderSceneFajrGamchha,
  renderSceneTeastallHurt,
  renderSceneExamDinner,
} from './scenesPart1';
import {
  renderSceneStormWindow,
  renderSceneRainArrival,
  renderSceneMirrorRide,
  renderSceneSunsetEpilogue,
} from './scenesPart2';
import { renderProceduralScene } from './proceduralRenderer';
import { renderBespokeSvgScene } from './svgMotionRenderer';
import { renderVisualStyleGrade } from './cinematicWorlds';
import { renderIllustratedEnvironmentScene } from './assetCanvasRenderer';
import { getEnvironmentAssetById } from '../lib/studioAssetLibrary';
import { computeTransitionState } from './motionEngine';
import { renderStoryChoreographyOverlay } from './storyChoreographer';
import {
  BrandingConfig,
  COLOR_PALETTES,
  DEFAULT_BRANDING_CONFIG,
  DEFAULT_DESIGN_CONFIG,
  DEFAULT_SUBTITLE_CONFIG,
  LayoutMode,
  SubtitleConfig,
  resolveSubtitleFontCss,
} from '../lib/redesignAndStudio';
import { REELDAIII_BRAND } from '../lib/brandAssets';

export type SubtitleMode = 'bn' | 'bilingual' | 'off';
export type SubtitleStyle = 'kinetic' | 'cinema' | 'bold-pop';

export const DIMENSIONS_BY_RATIO: Record<AspectRatio, { width: number; height: number }> = {
  '16:9': { width: 1280, height: 720 },
  '9:16': { width: 720, height: 1280 },
};

export interface RenderProjectFrameOptions {
  project: AnimationProject;
  time: number;
  aspectRatio: AspectRatio;
  subtitleMode: SubtitleMode;
  subtitleStyle?: SubtitleStyle;
  /** 9:16 portrait subject close-up zoom multiplier (default 1.38 for intimate Reels/Shorts framing) */
  portraitZoom?: number;
  /** Optional physical output pixel width (e.g., 3840 for 4K UHD) for crisp native vector scaling */
  outputWidth?: number;
  /** Optional physical output pixel height (e.g., 2160 for 4K UHD) */
  outputHeight?: number;
  /** When true on >720p exports, renders scene gradients at base canvas resolution and upscales smoothly while keeping subtitles/headers at full native 4K vector sharpness */
  fastHighResComposite?: boolean;
  showLetterbox?: boolean;
  isThumbnail?: boolean;
}

let cachedOffscreenCanvas: HTMLCanvasElement | null = null;
let cachedCompositeCanvas: HTMLCanvasElement | null = null;
let cachedOutgoingCanvas: HTMLCanvasElement | null = null;

function getOffscreen16x9Canvas(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (!cachedOffscreenCanvas) {
    cachedOffscreenCanvas = document.createElement('canvas');
    cachedOffscreenCanvas.width = CANVAS_W;
    cachedOffscreenCanvas.height = CANVAS_H;
  }
  return cachedOffscreenCanvas;
}

function getCompositeCanvas(width: number, height: number): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (!cachedCompositeCanvas) {
    cachedCompositeCanvas = document.createElement('canvas');
  }
  if (cachedCompositeCanvas.width !== width || cachedCompositeCanvas.height !== height) {
    cachedCompositeCanvas.width = width;
    cachedCompositeCanvas.height = height;
  }
  return cachedCompositeCanvas;
}

function getOutgoingCanvas(width: number, height: number): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (!cachedOutgoingCanvas) {
    cachedOutgoingCanvas = document.createElement('canvas');
  }
  if (cachedOutgoingCanvas.width !== width || cachedOutgoingCanvas.height !== height) {
    cachedOutgoingCanvas.width = width;
    cachedOutgoingCanvas.height = height;
  }
  return cachedOutgoingCanvas;
}

const cachedWatermarkImages = new Map<string, HTMLImageElement>();
export function getWatermarkImage(dataUrl: string): HTMLImageElement | null {
  if (typeof Image === 'undefined' || !dataUrl) return null;
  const existing = cachedWatermarkImages.get(dataUrl);
  if (existing) {
    return existing.complete && existing.naturalWidth > 0 ? existing : null;
  }
  const img = new Image();
  img.src = dataUrl;
  cachedWatermarkImages.set(dataUrl, img);
  return img.complete && img.naturalWidth > 0 ? img : null;
}

function renderPresetScene(
  ctx: CanvasRenderingContext2D,
  sceneId: SceneId,
  sceneTime: number,
  globalTime: number
): void {
  switch (sceneId) {
    case 'morning-dropoff':
      renderSceneMorningDropoff(ctx, sceneTime, globalTime);
      break;
    case 'fajr-gamchha':
      renderSceneFajrGamchha(ctx, sceneTime, globalTime);
      break;
    case 'teastall-hurt':
      renderSceneTeastallHurt(ctx, sceneTime, globalTime);
      break;
    case 'exam-dinner':
      renderSceneExamDinner(ctx, sceneTime, globalTime);
      break;
    case 'storm-window':
      renderSceneStormWindow(ctx, sceneTime, globalTime);
      break;
    case 'rain-arrival':
      renderSceneRainArrival(ctx, sceneTime, globalTime);
      break;
    case 'mirror-ride':
      renderSceneMirrorRide(ctx, sceneTime, globalTime);
      break;
    case 'sunset-epilogue':
      renderSceneSunsetEpilogue(ctx, sceneTime, globalTime);
      break;
  }
}

function getVerticalFocalX(sceneId: SceneId, sceneTime: number): number {
  switch (sceneId) {
    case 'morning-dropoff':
      return sceneTime < 8 ? 0.36 : sceneTime < 18 ? 0.56 : 0.42;
    case 'fajr-gamchha':
      return sceneTime < 10 ? 0.48 : sceneTime < 17 ? 0.34 : sceneTime < 22 ? 0.74 : 0.48;
    case 'teastall-hurt':
      return sceneTime < 18 ? 0.3 : 0.72;
    case 'exam-dinner':
      return 0.5;
    case 'storm-window':
      return 0.52;
    case 'rain-arrival':
      return sceneTime < 24 ? 0.52 : 0.46;
    case 'mirror-ride':
      return sceneTime < 16 ? 0.4 : 0.72;
    case 'sunset-epilogue':
      return 0.5;
  }
}

function getVerticalBackdropColors(scene: SceneSpec): [string, string] {
  switch (scene.timeOfDay) {
    case 'dawn':
      return ['#141E33', '#191C22'];
    case 'morning':
      return ['#44729C', '#222227'];
    case 'afternoon':
      return ['#4C7294', '#20242C'];
    case 'storm':
      return ['#131C26', '#101A24'];
    case 'sunset':
      return ['#191E35', '#100C12'];
    case 'night':
      return ['#120E0D', '#16100C'];
  }
}

/**
 * Renders a complete animated film frame for any AnimationProject in either 16:9 (1280×720)
 * or 9:16 (720×1280), prioritizing bespoke 2.5D multi-layer AI SVG art, then showcase presets,
 * then the 22-world adaptive cinema engine—with smooth transitions and kinetic word-synced subtitles.
 */
export function renderProjectFrame(
  ctx: CanvasRenderingContext2D,
  options: RenderProjectFrameOptions
): void {
  const {
    project,
    time,
    aspectRatio,
    subtitleMode,
    subtitleStyle = 'kinetic',
    portraitZoom = 1.38,
    outputWidth,
    outputHeight,
    fastHighResComposite = false,
    showLetterbox = true,
    isThumbnail = false,
  } = options;

  const { width, height } = DIMENSIONS_BY_RATIO[aspectRatio];
  const isVertical = aspectRatio === '9:16';
  const hasOutputScale = Boolean(
    outputWidth && outputHeight && (outputWidth !== width || outputHeight !== height)
  );

  const designCfg = project.designConfig ?? DEFAULT_DESIGN_CONFIG;
  const subCfg = project.subtitleConfig ?? DEFAULT_SUBTITLE_CONFIG;
  const brandCfg = project.brandingConfig ?? DEFAULT_BRANDING_CONFIG;
  const palette = COLOR_PALETTES[designCfg.colorPalette] ?? COLOR_PALETTES['heritage-gold'];
  const layoutMode: LayoutMode = isThumbnail ? 'full-bleed' : designCfg.layoutMode;

  // Render world into base-HD offscreen composite when upscaling 4K exports OR framing into editorial-frame / split-focus
  const needsComposite =
    (fastHighResComposite && hasOutputScale) ||
    layoutMode === 'editorial-frame' ||
    layoutMode === 'split-focus';
  const compositeCanvas = needsComposite ? getCompositeCanvas(width, height) : null;
  const worldCtx = compositeCanvas
    ? compositeCanvas.getContext('2d', { alpha: false }) ?? ctx
    : ctx;
  const usingComposite = Boolean(compositeCanvas && worldCtx !== ctx);

  ctx.save();
  if (hasOutputScale && outputWidth && outputHeight) {
    if (!usingComposite || layoutMode !== 'full-bleed') {
      ctx.clearRect(0, 0, outputWidth, outputHeight);
    }
    ctx.scale(outputWidth / width, outputHeight / height);
  } else if (!usingComposite || layoutMode !== 'full-bleed') {
    ctx.clearRect(0, 0, width, height);
  }

  const activeScene = getProjectSceneAtTime(project, time);
  const sceneIndex = Math.max(0, project.scenes.findIndex((s) => s.id === activeScene.id));
  const sceneTime = Math.max(0, time - activeScene.startTime);
  const sceneDuration = Math.max(0.5, activeScene.endTime - activeScene.startTime);
  const speechEnergy = sampleSpeechEnergy(
    project.audioEnvelope,
    time,
    project.audioEnvelopeHz ?? 10
  );
  const viseme = sampleVisemePose({
    cues: project.cues,
    phoneticFrames: project.phoneticFrames,
    phoneticHz: project.phoneticHz,
    audioEnvelope: project.audioEnvelope,
    audioEnvelopeHz: project.audioEnvelopeHz,
    time,
    speechEnergy,
  });

  if (usingComposite) {
    worldCtx.clearRect(0, 0, width, height);
  }

  const renderWorldInto = (
    targetCtx: CanvasRenderingContext2D,
    targetScene: SceneSpec,
    targetSceneTime: number,
    targetSceneDuration: number
  ) => {
    const hasExplicitCharacterAsset = Boolean(
      targetScene.primaryCharacterAssetId || targetScene.secondaryCharacterAssetId
    );
    const hasCustomLockedActor = Boolean(
      project.characterProfiles?.some(
        (p) => p.isCustom && (targetScene.characterIds ?? []).includes(p.characterId)
      )
    );
    const hasSceneMediaOverride = Boolean(
      hasExplicitCharacterAsset ||
        targetScene.customBackgroundAssetId ||
        targetScene.customBackgroundUrl ||
        hasCustomLockedActor
    );

    // Priority 1: Bespoke Gemini AI Director 2.5D Multi-Layer Animated Vector Cinema Scene
    const renderedBespokeSvg =
      targetScene.customSvg && !hasSceneMediaOverride
        ? renderBespokeSvgScene(
            targetCtx,
            targetScene,
            targetSceneTime,
            time,
            width,
            height,
            speechEnergy,
            project.visualStyle,
            portraitZoom
          )
        : false;

    const designCfg = project.designConfig ?? DEFAULT_DESIGN_CONFIG;
    const activePaletteId = designCfg.colorPalette;
    const parallaxDepth = designCfg.parallaxDepth ?? 1.0;

    if (!renderedBespokeSvg && targetScene.presetSceneId && !hasSceneMediaOverride) {
      // Priority 2: Built-in Hand-Directed Showcase Film
      if (!isVertical) {
        renderPresetScene(targetCtx, targetScene.presetSceneId, targetSceneTime, time);
      } else {
        const [topColor, bottomColor] = getVerticalBackdropColors(targetScene);
        const bgGrad = targetCtx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, topColor);
        bgGrad.addColorStop(0.35, topColor);
        bgGrad.addColorStop(0.75, bottomColor);
        bgGrad.addColorStop(1, '#09090D');
        targetCtx.fillStyle = bgGrad;
        targetCtx.fillRect(0, 0, width, height);

        const offscreen = getOffscreen16x9Canvas();
        if (offscreen) {
          const offCtx = offscreen.getContext('2d');
          if (offCtx) {
            offCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
            renderPresetScene(offCtx, targetScene.presetSceneId, targetSceneTime, time);

            // Gentle, safe 9:16 showcase crop so subjects & companions never slice on the sides
            const gentleZoom = 0.94 + Math.max(0, Math.min(0.85, portraitZoom - 1)) * 0.28;
            const drawH = Math.round(height * Math.min(0.92, 0.72 * gentleZoom));
            const scale = drawH / CANVAS_H;
            const srcW = Math.min(CANVAS_W, Math.round(width / scale));
            const focalX = getVerticalFocalX(targetScene.presetSceneId, targetSceneTime);
            const srcX = Math.max(0, Math.min(CANVAS_W - srcW, Math.round(focalX * CANVAS_W - srcW / 2)));
            const destY = Math.round((height - drawH) * 0.44);

            targetCtx.drawImage(offscreen, srcX, 0, srcW, CANVAS_H, 0, destY, width, drawH);

            if (destY > 0) {
              const topBlend = targetCtx.createLinearGradient(0, destY, 0, destY + 110);
              topBlend.addColorStop(0, topColor);
              topBlend.addColorStop(1, 'rgba(0, 0, 0, 0)');
              targetCtx.fillStyle = topBlend;
              targetCtx.fillRect(0, destY, width, 110);
            }

            const botBlend = targetCtx.createLinearGradient(0, destY + drawH - 120, 0, destY + drawH + 10);
            botBlend.addColorStop(0, 'rgba(0, 0, 0, 0)');
            botBlend.addColorStop(1, bottomColor);
            targetCtx.fillStyle = botBlend;
            targetCtx.fillRect(0, destY + drawH - 120, width, 130);
          }
        }
      }
      if (activePaletteId !== 'heritage-gold' || project.visualStyle) {
        renderVisualStyleGrade(targetCtx, project.visualStyle, width, height, activePaletteId);
      }
    } else if (!renderedBespokeSvg && (targetScene.customBackgroundAssetId || targetScene.customBackgroundUrl)) {
      // Priority 3: Uploaded 2D Illustrated Environment Artwork + Dual-Mode 2D Cast
      const envAsset = getEnvironmentAssetById(targetScene.customBackgroundAssetId);
      renderIllustratedEnvironmentScene({
        ctx: targetCtx,
        scene: targetScene,
        envAsset,
        sceneTime: targetSceneTime,
        globalTime: time,
        width,
        height,
        speechEnergy,
        visualStyle: project.visualStyle,
        portraitZoom,
        characterProfiles: project.characterProfiles,
        paletteId: activePaletteId,
        parallaxDepth,
        viseme,
      });
    } else if (!renderedBespokeSvg) {
      // Priority 4: Upgraded 32+ World Adaptive Cinema Engine with Voice-Synced Human Acting & Character Consistency
      renderProceduralScene(
        targetCtx,
        targetScene,
        targetSceneTime,
        time,
        width,
        height,
        speechEnergy,
        project.visualStyle,
        portraitZoom,
        project.characterProfiles,
        activePaletteId,
        parallaxDepth,
        viseme
      );
    } else if (activePaletteId !== 'heritage-gold') {
      renderVisualStyleGrade(targetCtx, project.visualStyle, width, height, activePaletteId);
    }

    // Apply uploaded Reference Animation Image/Video atmospheric grade & optional backdrop blend
    if (project.referenceMedia) {
      const refMedia = project.referenceMedia;
      if (refMedia.applyMode === 'backdrop-overlay' && refMedia.thumbnailDataUrl) {
        const refImg = getWatermarkImage(refMedia.thumbnailDataUrl);
        if (refImg) {
          targetCtx.save();
          targetCtx.globalAlpha = 0.24;
          targetCtx.globalCompositeOperation = 'screen';
          const driftX = Math.sin(time * 0.25) * 14;
          const driftY = Math.cos(time * 0.18) * 8;
          targetCtx.drawImage(
            refImg,
            -20 + driftX,
            -14 + driftY,
            width + 40,
            height + 28
          );
          targetCtx.restore();
        }
      }

      const [shadowHex, , accentHex] = refMedia.dominantSwatches;
      if (shadowHex && accentHex) {
        targetCtx.save();
        const refGrad = targetCtx.createLinearGradient(0, 0, width, height);
        refGrad.addColorStop(0, `${accentHex}1A`);
        refGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
        refGrad.addColorStop(1, `${shadowHex}2E`);
        targetCtx.fillStyle = refGrad;
        targetCtx.fillRect(0, 0, width, height);
        targetCtx.restore();
      }
    }

    renderStoryChoreographyOverlay(targetCtx, {
      scene: targetScene,
      sceneTime: targetSceneTime,
      sceneDuration: targetSceneDuration,
      globalTime: time,
      width,
      height,
      speechEnergy,
      isThumbnail,
    });
  };

  const transitionWindow = 0.46;
  const hasAdjacentBlend = !isThumbnail && sceneIndex > 0 && sceneTime < transitionWindow;

  if (hasAdjacentBlend) {
    const prevScene = project.scenes[sceneIndex - 1];
    const prevDur = Math.max(0.5, prevScene.endTime - prevScene.startTime);
    const prevSceneTime = Math.max(0, time - prevScene.startTime);
    const outCanvas = getOutgoingCanvas(width, height);
    const outCtx = outCanvas?.getContext('2d');

    if (outCanvas && outCtx) {
      outCtx.clearRect(0, 0, width, height);
      renderWorldInto(outCtx, prevScene, prevSceneTime, prevDur);

      const t = clamp01(sceneTime / transitionWindow);
      const easeT = t * t * (3 - 2 * t);
      const transitionKind = prevScene.transitionToNext ?? 'cross-dissolve';

      // Render incoming scene into worldCtx first, then composite cleanly with outgoing scene
      const inCanvas = getOffscreen16x9Canvas();
      // For exact width/height preservation, draw outgoing onto worldCtx, then draw incoming over it
      renderWorldInto(worldCtx, activeScene, sceneTime, sceneDuration);

      if (transitionKind === 'directional-wipe') {
        // Reveal outgoing on left side shrinking away while incoming fills right-to-left
        const splitX = Math.round(width * easeT);
        worldCtx.save();
        worldCtx.beginPath();
        worldCtx.rect(splitX, 0, width - splitX, height);
        worldCtx.clip();
        worldCtx.drawImage(outCanvas, 0, 0, width, height);
        worldCtx.restore();
        worldCtx.fillStyle = 'rgba(246, 198, 91, 0.35)';
        worldCtx.fillRect(splitX - 2, 0, 4, height);
      } else {
        // Cross-dissolve or light-leak blend: overlay fading outgoing scene onto crisp incoming world
        worldCtx.save();
        worldCtx.globalAlpha = 1 - easeT;
        worldCtx.drawImage(outCanvas, 0, 0, width, height);
        worldCtx.restore();
      }
      void inCanvas;
    } else {
      renderWorldInto(worldCtx, activeScene, sceneTime, sceneDuration);
    }
  } else {
    renderWorldInto(worldCtx, activeScene, sceneTime, sceneDuration);
  }

  // Remotion-style cinema flare accents at scene cuts (no harsh black dips when blending scenes)
  if (!isThumbnail) {
    const trans = computeTransitionState(
      activeScene.startTime,
      sceneTime,
      sceneDuration,
      sceneIndex
    );
    if (!hasAdjacentBlend && sceneTime < 0.25 && trans.darknessAlpha > 0.01 && sceneIndex === 0) {
      worldCtx.fillStyle = `rgba(8, 8, 12, ${Math.min(0.28, trans.darknessAlpha)})`;
      worldCtx.fillRect(0, 0, width, height);
    }
    if (trans.flareAlpha > 0.01) {
      const flareGrad = worldCtx.createRadialGradient(
        width * (trans.style === 'light-leak' ? 0.28 : 0.5),
        height * 0.42,
        10,
        width * 0.5,
        height * 0.45,
        Math.max(width, height) * 0.65
      );
      flareGrad.addColorStop(0, `rgba(255, 232, 168, ${trans.flareAlpha * 0.52})`);
      flareGrad.addColorStop(0.5, `rgba(229, 169, 60, ${trans.flareAlpha * 0.22})`);
      flareGrad.addColorStop(1, 'rgba(229, 169, 60, 0)');
      worldCtx.fillStyle = flareGrad;
      worldCtx.fillRect(0, 0, width, height);
    }
  }

  // Adaptive cinema vignette
  const vig = worldCtx.createRadialGradient(
    width * 0.5,
    height * 0.46,
    Math.min(width, height) * 0.3,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.74
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, `rgba(6, 7, 10, ${isThumbnail ? 0.28 : 0.38})`);
  worldCtx.fillStyle = vig;
  worldCtx.fillRect(0, 0, width, height);

  // Blit base-HD scene onto high-res output canvas OR apply Redesign Layout Mode framing
  if (layoutMode === 'editorial-frame' || layoutMode === 'split-focus') {
    ctx.fillStyle = palette.frameBg;
    ctx.fillRect(0, 0, width, height);

    if (compositeCanvas) {
      applyLayoutComposition(
        ctx,
        compositeCanvas,
        layoutMode,
        palette,
        project.title,
        activeScene,
        width,
        height,
        isVertical
      );
    }
  } else if (usingComposite && compositeCanvas) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'medium';
    ctx.drawImage(compositeCanvas, 0, 0, width, height);
  }

  // Subtle letterbox bars for 16:9 cinema mode or deeper Documentary Wide framing
  if (!isThumbnail && layoutMode === 'doc-minimal') {
    const barH = isVertical ? 96 : 44;
    ctx.fillStyle = '#06070A';
    ctx.fillRect(0, 0, width, barH);
    ctx.fillRect(0, height - barH, width, barH);
  } else if (showLetterbox && !isThumbnail && !isVertical && layoutMode === 'full-bleed') {
    ctx.fillStyle = '#070709';
    ctx.fillRect(0, 0, width, 24);
    ctx.fillRect(0, height - 30, width, 30);
  }

  // Official Reeldaiii Promotional Watermark (bottom-right) + Paid User Custom Brand
  if (!isThumbnail) {
    const isPaidUser = Boolean(brandCfg.customAccessUnlocked);
    const hasCustomBrand = Boolean(
      isPaidUser &&
        brandCfg.enabled &&
        (brandCfg.logoDataUrl || brandCfg.brandName.trim())
    );
    const shouldHideOfficial =
      isPaidUser &&
      (Boolean(brandCfg.hideOfficialWatermark) ||
        (hasCustomBrand && brandCfg.position === 'bottom-right'));

    if (!shouldHideOfficial) {
      drawOfficialReeldaiiiWatermark(
        ctx,
        width,
        height,
        isVertical,
        layoutMode,
        hasCustomBrand ? 0.3 : 0.92
      );
    }
    if (hasCustomBrand) {
      drawBrandingWatermark(ctx, brandCfg, palette.accent, width, height, isVertical, layoutMode);
    }
  }

  // Burned-in Viral Kinetic / Cinema / Bold-Pop Subtitles synced to SRT timestamps & user SubtitleConfig
  if (!isThumbnail && subtitleMode !== 'off') {
    const cue = getActiveCue(project.cues, time);
    if (cue) {
      const enText =
        subtitleMode === 'bilingual' ? project.englishTranslations[cue.index] : undefined;
      drawAdaptiveSubtitle(
        ctx,
        cue,
        time,
        enText,
        width,
        height,
        isVertical,
        subtitleStyle,
        subCfg,
        palette.accent
      );
    }
  }

  ctx.restore();
}

function applyLayoutComposition(
  ctx: CanvasRenderingContext2D,
  stageCanvas: HTMLCanvasElement,
  layoutMode: LayoutMode,
  palette: (typeof COLOR_PALETTES)['heritage-gold'],
  projectTitle: string,
  scene: SceneSpec,
  width: number,
  height: number,
  isVertical: boolean
): void {
  ctx.save();
  if (layoutMode === 'editorial-frame') {
    const padX = isVertical ? 38 : 54;
    const padTop = isVertical ? 112 : 68;
    const padBottom = isVertical ? 180 : 62;
    const innerW = width - padX * 2;
    const innerH = height - padTop - padBottom;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(padX, padTop, innerW, innerH, 16);
    ctx.clip();
    ctx.drawImage(stageCanvas, 0, 0, width, height, padX, padTop, innerW, innerH);
    ctx.restore();

    ctx.strokeStyle = palette.frameBorder;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(padX, padTop, innerW, innerH, 16);
    ctx.stroke();

    // Top editorial header (story title only — no CH number badge)
    ctx.fillStyle = palette.subtitlePrimary;
    ctx.font = `600 ${isVertical ? 21 : 19}px "Noto Serif Bengali", serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const shortTitle = projectTitle.length > 28 ? `${projectTitle.slice(0, 28)}…` : projectTitle;
    ctx.fillText(shortTitle, width - padX - 4, padTop * 0.54);
  } else if (layoutMode === 'split-focus') {
    if (!isVertical) {
      const stageW = Math.round(width * 0.68);
      const panelX = stageW + 18;
      const panelW = width - panelX - 28;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(24, 24, stageW - 24, height - 48, 14);
      ctx.clip();
      ctx.drawImage(stageCanvas, 0, 0, width, height, 24, 24, stageW - 24, height - 48);
      ctx.restore();

      ctx.strokeStyle = palette.frameBorder;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(24, 24, stageW - 24, height - 48, 14);
      ctx.stroke();

      // Side Story Card (strictly clipped with clean left alignment)
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.beginPath();
      ctx.roundRect(panelX, 24, panelW, height - 48, 14);
      ctx.fill();
      ctx.strokeStyle = palette.frameBorder;
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(panelX + 2, 26, panelW - 4, height - 52, 12);
      ctx.clip();

      const textX = panelX + 24;
      const textMaxW = Math.max(120, panelW - 48);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      ctx.fillStyle = palette.subtitlePrimary;
      ctx.font = '700 24px "Noto Serif Bengali", serif';
      const titleLines = wrapText(ctx, scene.titleBn, textMaxW).slice(0, 3);
      titleLines.forEach((line, i) => {
        ctx.fillText(line, textX, 64 + i * 34);
      });

      const moodY = 64 + Math.max(1, titleLines.length) * 34 + 14;
      ctx.fillStyle = palette.secondary;
      ctx.font = '500 14px "Hind Siliguri", sans-serif';
      ctx.fillText(
        `${scene.emotion ?? 'calm'} · ${scene.timeOfDay}`,
        textX,
        moodY
      );

      ctx.fillStyle = 'rgba(244, 243, 239, 0.80)';
      ctx.font = '400 15px "Hind Siliguri", sans-serif';
      const summaryLines = wrapText(ctx, scene.spokenExcerpt || scene.summary, textMaxW).slice(0, 6);
      summaryLines.forEach((line, i) => {
        ctx.fillText(line, textX, moodY + 38 + i * 26);
      });
      ctx.restore();
    } else {
      // 9:16 vertical split: Top Story Card + Main Cinema Frame below
      const topCardH = 220;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.roundRect(32, 36, width - 64, topCardH, 16);
      ctx.fill();
      ctx.strokeStyle = palette.frameBorder;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.fillStyle = palette.accent;
      ctx.font = '600 18px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText((scene.emotion ?? 'calm').toUpperCase(), width / 2, 84);

      ctx.fillStyle = palette.subtitlePrimary;
      ctx.font = '700 30px "Noto Serif Bengali", serif';
      const shortHead = scene.titleBn.length > 26 ? `${scene.titleBn.slice(0, 26)}…` : scene.titleBn;
      ctx.fillText(shortHead, width / 2, 146);

      ctx.fillStyle = palette.secondary;
      ctx.font = '400 19px "Hind Siliguri", sans-serif';
      const subText = scene.titleEn.length > 36 ? `${scene.titleEn.slice(0, 36)}…` : scene.titleEn;
      ctx.fillText(subText, width / 2, 200);

      const stageY = topCardH + 58;
      const stageH = height - stageY - 40;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(32, stageY, width - 64, stageH, 16);
      ctx.clip();
      ctx.drawImage(stageCanvas, 0, 0, width, height, 32, stageY, width - 64, stageH);
      ctx.restore();

      ctx.strokeStyle = palette.frameBorder;
      ctx.beginPath();
      ctx.roundRect(32, stageY, width - 64, stageH, 16);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawBrandingWatermark(
  ctx: CanvasRenderingContext2D,
  brand: BrandingConfig,
  accentColor: string,
  width: number,
  height: number,
  isVertical: boolean,
  layoutMode: LayoutMode = 'full-bleed'
): void {
  ctx.save();
  ctx.globalAlpha = Math.max(0.15, Math.min(1, brand.opacity));

  let stageLeft = 0;
  let stageRight = width;
  let stageTop = 0;
  let stageBottom = height;

  if (layoutMode === 'editorial-frame') {
    const padX = isVertical ? 38 : 54;
    const padTop = isVertical ? 112 : 68;
    const padBottom = isVertical ? 180 : 62;
    stageLeft = padX;
    stageRight = width - padX;
    stageTop = padTop;
    stageBottom = height - padBottom;
  } else if (layoutMode === 'split-focus') {
    if (!isVertical) {
      stageLeft = 24;
      stageRight = Math.round(width * 0.68);
      stageTop = 24;
      stageBottom = height - 24;
    } else {
      stageLeft = 32;
      stageRight = width - 32;
      stageTop = 278;
      stageBottom = height - 40;
    }
  } else if (layoutMode === 'doc-minimal') {
    const barH = isVertical ? 96 : 44;
    stageTop = barH;
    stageBottom = height - barH;
  }

  const insetX = (isVertical ? 22 : 24) + 20;
  const insetTop = (layoutMode === 'full-bleed' && isVertical ? 114 : 20) + 20;
  const insetBottom = (layoutMode === 'full-bleed' ? (isVertical ? 94 : 44) : 20) + 20;

  const img = brand.logoDataUrl ? getWatermarkImage(brand.logoDataUrl) : null;
  const logoSize = Math.round((isVertical ? 46 : 40) * Math.max(0.6, Math.min(1.5, brand.scale)));
  const fontSize = Math.round((isVertical ? 18 : 15) * Math.max(0.6, Math.min(1.5, brand.scale)));

  ctx.font = `600 ${fontSize}px "Hind Siliguri", sans-serif`;
  const text = brand.brandName.trim();
  const textW = text ? ctx.measureText(text).width : 0;
  const gap = img && text ? 10 : 0;
  const boxW = (img ? logoSize : 0) + gap + textW + 22;
  const boxH = Math.max(img ? logoSize : 24, fontSize + 10) + 12;

  // Paid user's custom brand placement (supports all 4 corners with +20px clean inset)
  let bx = stageRight - insetX - boxW;
  let by = stageTop + insetTop;
  if (brand.position === 'top-left' || brand.position === 'bottom-left') {
    bx = stageLeft + insetX;
  }
  if (brand.position === 'bottom-right' || brand.position === 'bottom-left') {
    by = stageBottom - insetBottom - boxH;
  }

  ctx.fillStyle = 'rgba(9, 10, 14, 0.58)';
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(bx, by, boxW, boxH, 10);
  ctx.fill();
  ctx.stroke();

  let cursorX = bx + 11;
  if (img) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cursorX, by + (boxH - logoSize) / 2, logoSize, logoSize, 6);
    ctx.clip();
    ctx.drawImage(img, cursorX, by + (boxH - logoSize) / 2, logoSize, logoSize);
    ctx.restore();
    cursorX += logoSize + gap;
  }

  if (text) {
    ctx.fillStyle = '#FAF8F3';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cursorX, by + boxH / 2);
  }

  ctx.restore();
}

function drawOfficialReeldaiiiWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  isVertical: boolean,
  layoutMode: LayoutMode,
  opacity: number
): void {
  ctx.save();
  ctx.globalAlpha = Math.max(0.25, Math.min(1, opacity));

  let stageRight = width;
  let stageBottom = height;

  if (layoutMode === 'editorial-frame') {
    const padX = isVertical ? 38 : 54;
    const padBottom = isVertical ? 180 : 62;
    stageRight = width - padX;
    stageBottom = height - padBottom;
  } else if (layoutMode === 'split-focus') {
    if (!isVertical) {
      stageRight = width - 24;
      stageBottom = height - 24;
    } else {
      stageRight = width - 32;
      stageBottom = height - 40;
    }
  } else if (layoutMode === 'doc-minimal') {
    const barH = isVertical ? 96 : 44;
    stageBottom = height - barH;
  }

  const insetRight = isVertical ? 18 : 22;
  const insetBottom = (layoutMode === 'full-bleed' ? (isVertical ? 14 : 34) : 14) + 30;

  const iconImg = getWatermarkImage(REELDAIII_BRAND.faviconUrl);
  const iconSize = isVertical ? 26 : 24;
  const fontSize = isVertical ? 15 : 14;

  ctx.font = `800 ${fontSize}px "Hind Siliguri", sans-serif`;
  const reeldText = 'REELD';
  const aiText = 'AI';
  const reeldW = ctx.measureText(reeldText).width;
  const aiW = ctx.measureText(aiText).width;
  const barsW = 11;
  const textTotalW = reeldW + aiW + barsW;

  const padX = 11;
  const gap = 7;
  const boxW = padX * 2 + iconSize + gap + textTotalW;
  const boxH = isVertical ? 36 : 34;

  const bx = stageRight - insetRight - boxW;
  const by = stageBottom - insetBottom - boxH;

  // Sleek dark obsidian badge with Reeldaiii golden border
  ctx.fillStyle = 'rgba(10, 10, 12, 0.78)';
  ctx.strokeStyle = 'rgba(255, 172, 28, 0.55)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(bx, by, boxW, boxH, 9);
  ctx.fill();
  ctx.stroke();

  const iconX = bx + padX;
  const iconY = by + (boxH - iconSize) / 2;

  if (iconImg) {
    ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize);
  } else {
    // Instant vector fallback matching Icon-Transparent-Favicon_a85ca1c4.png while PNG preloads
    ctx.strokeStyle = REELDAIII_BRAND.primaryColor;
    ctx.lineWidth = 2;
    const c = 5;
    // 4 viewfinder corners
    ctx.beginPath();
    ctx.moveTo(iconX + 2, iconY + 2 + c);
    ctx.lineTo(iconX + 2, iconY + 2);
    ctx.lineTo(iconX + 2 + c, iconY + 2);
    ctx.moveTo(iconX + iconSize - 2 - c, iconY + 2);
    ctx.lineTo(iconX + iconSize - 2, iconY + 2);
    ctx.lineTo(iconX + iconSize - 2, iconY + 2 + c);
    ctx.moveTo(iconX + 2, iconY + iconSize - 2 - c);
    ctx.lineTo(iconX + 2, iconY + iconSize - 2);
    ctx.lineTo(iconX + 2 + c, iconY + iconSize - 2);
    ctx.moveTo(iconX + iconSize - 2 - c, iconY + iconSize - 2);
    ctx.lineTo(iconX + iconSize - 2, iconY + iconSize - 2);
    ctx.lineTo(iconX + iconSize - 2, iconY + iconSize - 2 - c);
    ctx.stroke();
    // Center play triangle
    ctx.fillStyle = REELDAIII_BRAND.primaryColor;
    ctx.beginPath();
    ctx.moveTo(iconX + iconSize * 0.36, iconY + iconSize * 0.28);
    ctx.lineTo(iconX + iconSize * 0.72, iconY + iconSize * 0.5);
    ctx.lineTo(iconX + iconSize * 0.36, iconY + iconSize * 0.72);
    ctx.closePath();
    ctx.fill();
  }

  // Wordmark: REELD (white) + AI (amber #FFAC1C) + 3 rising audio bars
  const textX = iconX + iconSize + gap;
  const textMidY = by + boxH / 2 + 0.5;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FAF8F3';
  ctx.fillText(reeldText, textX, textMidY);

  ctx.fillStyle = REELDAIII_BRAND.primaryColor;
  ctx.fillText(aiText, textX + reeldW, textMidY);

  const barBaseX = textX + reeldW + aiW + 2;
  const barBottomY = by + boxH / 2 + 6;
  const barHeights = [4, 7.5, 11];
  for (let i = 0; i < 3; i++) {
    const bh = barHeights[i];
    ctx.beginPath();
    ctx.roundRect(barBaseX + i * 3.4, barBottomY - bh, 2.2, bh, 1);
    ctx.fill();
  }

  ctx.restore();
}

function drawAdaptiveSubtitle(
  ctx: CanvasRenderingContext2D,
  cue: SubtitleCue,
  time: number,
  secondaryText: string | undefined,
  width: number,
  height: number,
  isVertical: boolean,
  style: SubtitleStyle,
  subCfg: SubtitleConfig,
  paletteAccent: string
): void {
  ctx.save();
  const scale = Math.max(0.75, Math.min(1.4, subCfg.fontSizeScale || 1));
  const fontCss = resolveSubtitleFontCss(subCfg.fontFamily);
  const maxWidth = isVertical ? width - 92 : 960;
  const primarySize = Math.round(
    (style === 'bold-pop' ? (isVertical ? 34 : 30) : isVertical ? 30 : 26) * scale
  );
  const secondarySize = Math.round((isVertical ? 19 : 17) * scale);

  const cueDur = Math.max(0.25, cue.endTime - cue.startTime);
  const cueProgress = clamp01((time - cue.startTime) / cueDur);

  ctx.font = `${style === 'bold-pop' ? '700' : '600'} ${primarySize}px ${fontCss}`;
  const primaryLines = wrapText(ctx, cue.text, maxWidth);

  ctx.font = `400 ${secondarySize}px ${fontCss}`;
  const secondaryLines = secondaryText ? wrapText(ctx, secondaryText, maxWidth) : [];

  const lineH1 = primarySize + 11;
  const lineH2 = secondarySize + 8;
  const padX = isVertical ? 24 : 28;
  const padY = isVertical ? 16 : 14;
  const gap = secondaryLines.length > 0 ? 8 : 0;
  const boxH = primaryLines.length * lineH1 + secondaryLines.length * lineH2 + padY * 2 + gap;

  let widest = 320;
  ctx.font = `${style === 'bold-pop' ? '700' : '600'} ${primarySize}px ${fontCss}`;
  for (const line of primaryLines) widest = Math.max(widest, ctx.measureText(line).width);
  ctx.font = `400 ${secondarySize}px ${fontCss}`;
  for (const line of secondaryLines) widest = Math.max(widest, ctx.measureText(line).width);

  const boxW = Math.min(maxWidth + padX * 2, widest + padX * 2);
  const boxX = (width - boxW) / 2;

  let boxY: number;
  if (subCfg.position === 'top') {
    boxY = isVertical ? 132 : 46;
  } else if (subCfg.position === 'middle') {
    boxY = Math.round((height - boxH) / 2);
  } else {
    const bottomMargin = isVertical ? 160 : 42;
    boxY = height - bottomMargin - boxH;
  }

  const boxAlpha = Math.max(0, Math.min(0.95, subCfg.boxOpacity ?? 0.82));
  if (style !== 'bold-pop' && boxAlpha > 0.02) {
    ctx.fillStyle = `rgba(8, 10, 16, ${boxAlpha})`;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 10);
    ctx.fill();
    if (style === 'kinetic') {
      ctx.strokeStyle = paletteAccent;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  ctx.textBaseline = 'top';
  ctx.font = `${style === 'bold-pop' ? '700' : '600'} ${primarySize}px ${fontCss}`;

  const allWords = cue.text.trim().split(/\s+/).filter(Boolean);
  const activeWordIdx = Math.min(allWords.length - 1, Math.floor(cueProgress * allWords.length));

  const primaryCol = subCfg.primaryColor || '#FAF8F3';
  const highlightCol = subCfg.highlightColor || paletteAccent || '#F6C65B';

  let curY = boxY + padY;
  let runningWordIdx = 0;

  for (const line of primaryLines) {
    const lineWords = line.split(' ');
    if (style === 'kinetic' || style === 'bold-pop') {
      const lineWidth = ctx.measureText(line).width;
      let cursorX = width / 2 - lineWidth / 2;
      ctx.textAlign = 'left';

      for (let wi = 0; wi < lineWords.length; wi++) {
        const w = lineWords[wi];
        const piece = wi < lineWords.length - 1 ? `${w} ` : w;
        const isCurrent = runningWordIdx === activeWordIdx;
        const isSpoken = runningWordIdx < activeWordIdx;

        if (style === 'bold-pop') {
          ctx.lineWidth = 6;
          ctx.strokeStyle = 'rgba(7, 8, 12, 0.94)';
          ctx.lineJoin = 'round';
          ctx.strokeText(piece, cursorX, curY);
        }

        ctx.fillStyle = isCurrent
          ? highlightCol
          : isSpoken
            ? primaryCol
            : style === 'bold-pop'
              ? primaryCol
              : 'rgba(244, 242, 236, 0.78)';
        ctx.fillText(piece, cursorX, curY);
        cursorX += ctx.measureText(piece).width;
        runningWordIdx += 1;
      }
    } else {
      ctx.textAlign = 'center';
      ctx.fillStyle = primaryCol;
      ctx.fillText(line, width / 2, curY);
      runningWordIdx += lineWords.length;
    }
    curY += lineH1;
  }

  if (secondaryLines.length > 0) {
    curY += gap;
    ctx.textAlign = 'center';
    ctx.font = `400 ${secondarySize}px ${fontCss}`;
    ctx.fillStyle = '#E5D5B5';
    for (const line of secondaryLines) {
      if (style === 'bold-pop') {
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(7, 8, 12, 0.9)';
        ctx.strokeText(line, width / 2, curY);
      }
      ctx.fillText(line, width / 2, curY);
      curY += lineH2;
    }
  }

  ctx.restore();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}
