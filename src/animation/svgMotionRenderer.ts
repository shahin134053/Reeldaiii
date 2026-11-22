import { SceneSpec, VisualStyle } from '../lib/storyCompiler';
import { getCachedSvgScene } from '../lib/svgSanitizer';
import {
  renderAtmosphericEffects,
  renderScrollStopperOverlays,
  renderVisualStyleGrade,
} from './cinematicWorlds';
import { computeCameraTransform } from './motionEngine';

/**
 * Composites a bespoke multi-layered AI-directed SVG scene onto a 16:9 or 9:16 canvas
 * with 2.5D independent depth parallax, Remotion-style spring camera choreography,
 * intimate 9:16 vertical close-up framing, and live atmospheric particle effects.
 */
export function renderBespokeSvgScene(
  ctx: CanvasRenderingContext2D,
  scene: SceneSpec,
  sceneTime: number,
  globalTime: number,
  width: number,
  height: number,
  speechEnergy: number,
  visualStyle?: VisualStyle,
  portraitZoom = 1.38
): boolean {
  if (!scene.customSvg) return false;
  const cached = getCachedSvgScene(scene.customSvg);
  if (!cached || !cached.ready || !cached.fullImg) return false;

  const duration = Math.max(1, scene.endTime - scene.startTime);
  const isVertical = height > width;
  const focalX = Math.max(0.25, Math.min(0.75, scene.focalPointX ?? 0.5));

  const cam = computeCameraTransform({
    width,
    height,
    sceneTime,
    sceneDuration: duration,
    globalTime,
    cameraMotion: scene.cameraMotion ?? 'dolly-in',
    cameraShot: scene.cameraShot ?? 'medium-two-shot',
    focalPointX: focalX,
    portraitZoom: isVertical ? Math.max(1.0, Math.min(1.12, 1 + (portraitZoom - 1) * 0.16)) : 1.0,
    speechEnergy,
    isOpeningScene: scene.startTime <= 0.1,
  });

  const breathY = Math.sin(globalTime * 1.45) * 2.0;
  const voicePulse = 1 + speechEnergy * 0.018;

  const drawLayer = (
    img: HTMLImageElement | null,
    parallaxFactor: number,
    extraScale = 1,
    extraY = 0
  ) => {
    if (!img || img.naturalWidth === 0) return;
    ctx.save();
    const scale = 1 + (cam.zoom - 1) * parallaxFactor;
    const tx = cam.panX * parallaxFactor;
    const ty = cam.panY * parallaxFactor + extraY;

    ctx.translate(width / 2 + tx, height / 2 + ty);
    ctx.scale(scale * extraScale, scale * extraScale);
    ctx.translate(-width / 2, -height / 2);

    if (!isVertical) {
      ctx.drawImage(img, 0, 0, width, height);
    } else {
      // Safe 9:16 framing showing full 560px hero band cleanly inside 720px portrait frame
      const imgRatio = 1280 / 720;
      const clampedZoom = Math.max(0.95, Math.min(1.18, 0.96 + (portraitZoom - 1) * 0.24));
      const drawH = Math.round(height * 0.78 * clampedZoom);
      const drawW = Math.round(drawH * imgRatio);
      const destY = Math.round((height - drawH) * 0.44);
      const maxOffset = Math.max(0, drawW - width);
      const safeFocal = Math.max(0.32, Math.min(0.68, focalX));
      const offsetX = -Math.round(maxOffset * safeFocal);
      ctx.drawImage(img, offsetX, destY, drawW, drawH);
    }
    ctx.restore();
  };

  ctx.save();
  if (isVertical) {
    ctx.fillStyle = '#090B11';
    ctx.fillRect(0, 0, width, height);
  }
  if (cached.hasLayers && cached.skyImg) {
    drawLayer(cached.skyImg, 0.35, 1, 0);
    drawLayer(cached.midImg, 0.75, 1, breathY * 0.4);
    drawLayer(cached.heroImg, 1.08, voicePulse, breathY * 1.15);
    drawLayer(cached.fgImg, 1.32, 1.01, breathY * 0.7);
  } else {
    drawLayer(cached.fullImg, 1.0, voicePulse, breathY);
  }

  renderAtmosphericEffects(ctx, scene.weather, scene.timeOfDay, globalTime, width, height, speechEnergy);
  renderScrollStopperOverlays(ctx, width, height, globalTime, speechEnergy, cam.hookBloom, scene.accentColor);
  renderVisualStyleGrade(ctx, visualStyle, width, height);

  ctx.restore();
  return true;
}
