import {
  CharacterRole,
  EmotionTone,
  SceneSpec,
  StoryMotif,
  VisualStyle,
  WeatherType,
} from '../lib/storyCompiler';
import { CharacterProfile } from '../lib/storyIntelligence';
import { VisemePose } from '../lib/visemeEngine';
import { COLOR_PALETTES, ColorPaletteId } from '../lib/redesignAndStudio';
import { clamp01, drawMonsoonRain, drawSky, lerp } from './drawHelpers';
import { drawLifelikeHuman } from './humanRig';
import { resolveSceneActorProfile } from './assetCanvasRenderer';
import { getPortraitSafeLayout, springValue } from './motionEngine';

/**
 * Renders rich atmospheric effects (volumetric sunbeams, snow, embers, fireflies, stars, rain, dust)
 * on top of both AI-directed SVG scenes and procedural worlds.
 */
export function renderAtmosphericEffects(
  ctx: CanvasRenderingContext2D,
  weather: WeatherType,
  timeOfDay: SceneSpec['timeOfDay'],
  globalTime: number,
  width: number,
  height: number,
  speechEnergy = 0
): void {
  ctx.save();

  // Volumetric sunbeams during golden morning / sunset / dawn
  if ((timeOfDay === 'morning' || timeOfDay === 'sunset' || timeOfDay === 'dawn') && weather !== 'heavy-storm') {
    const beamAlpha = timeOfDay === 'sunset' ? 0.11 : 0.08;
    const beamColor = timeOfDay === 'sunset' ? '255, 194, 108' : '255, 236, 186';
    for (let i = 0; i < 3; i++) {
      const sway = Math.sin(globalTime * 0.35 + i * 1.4) * 32;
      const startX = width * (0.18 + i * 0.28) + sway;
      const grad = ctx.createLinearGradient(startX, 0, startX + width * 0.16, height * 0.85);
      grad.addColorStop(0, `rgba(${beamColor}, ${beamAlpha})`);
      grad.addColorStop(0.65, `rgba(${beamColor}, ${beamAlpha * 0.35})`);
      grad.addColorStop(1, `rgba(${beamColor}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(startX - 42, 0);
      ctx.lineTo(startX + 46, 0);
      ctx.lineTo(startX + width * 0.24, height);
      ctx.lineTo(startX + width * 0.05, height);
      ctx.closePath();
      ctx.fill();
    }
  }

  if (weather === 'rain' || weather === 'heavy-storm') {
    const intensity = weather === 'heavy-storm' ? 1.0 : 0.48;
    ctx.save();
    ctx.scale(width / 1280, height / 720);
    drawMonsoonRain(ctx, globalTime, intensity, 560);
    ctx.restore();
    if (weather === 'heavy-storm') {
      const flash = Math.pow(Math.max(0, Math.sin(globalTime * 1.9) * Math.sin(globalTime * 5.3)), 14);
      if (flash > 0.06) {
        ctx.fillStyle = `rgba(210, 232, 255, ${flash * 0.26})`;
        ctx.fillRect(0, 0, width, height);
      }
    }
  } else if (weather === 'fireflies') {
    const count = 26;
    for (let i = 0; i < count; i++) {
      const fx = ((i * 173 + globalTime * (16 + (i % 5) * 4)) % (width + 40)) - 20;
      const fy =
        height * (0.34 + ((i * 37) % 52) / 100) + Math.sin(globalTime * 1.6 + i * 1.3) * 18;
      const pulse = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(globalTime * 3.1 + i * 2.1));
      const r = (2.2 + (i % 3) * 0.9) * (1 + speechEnergy * 0.25);
      const glow = ctx.createRadialGradient(fx, fy, 0, fx, fy, r * 4.5);
      glow.addColorStop(0, `rgba(255, 224, 130, ${0.82 * pulse})`);
      glow.addColorStop(1, 'rgba(255, 188, 72, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(fx, fy, r * 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (weather === 'snow') {
    const count = 65;
    for (let i = 0; i < count; i++) {
      const speed = 38 + (i % 5) * 14;
      const sx = ((i * 97 + Math.sin(globalTime * 1.1 + i) * 24) % width + width) % width;
      const sy = ((i * 61 + globalTime * speed) % (height + 30)) - 15;
      const r = 1.4 + (i % 3) * 0.9;
      ctx.fillStyle = `rgba(240, 248, 255, ${0.42 + (i % 4) * 0.12})`;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (weather === 'embers') {
    const count = 34;
    for (let i = 0; i < count; i++) {
      const ex =
        ((i * 129 + Math.sin(globalTime * 1.8 + i * 0.9) * 34) % width + width) % width;
      const ey = height - (((i * 79 + globalTime * (44 + (i % 5) * 12)) % (height + 40)) - 20);
      const alpha = clamp01((ey / height) * 1.2) * (0.5 + 0.5 * Math.sin(globalTime * 5 + i));
      const r = 1.6 + (i % 3) * 0.8;
      const glow = ctx.createRadialGradient(ex, ey, 0, ex, ey, r * 4);
      glow.addColorStop(0, `rgba(255, 190, 86, ${alpha * 0.95})`);
      glow.addColorStop(0.5, `rgba(235, 96, 42, ${alpha * 0.55})`);
      glow.addColorStop(1, 'rgba(235, 96, 42, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(ex, ey, r * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (weather === 'stars') {
    for (let i = 0; i < 42; i++) {
      const sx = ((i * 131 + 29) % (width - 20)) + 10;
      const sy = ((i * 73 + 17) % Math.round(height * 0.65)) + 10;
      const tw = 0.25 + 0.75 * Math.abs(Math.sin(globalTime * (1.2 + (i % 4) * 0.4) + i));
      ctx.fillStyle = `rgba(235, 244, 255, ${tw * 0.8})`;
      ctx.beginPath();
      ctx.arc(sx, sy, i % 6 === 0 ? 2.1 : 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (weather === 'mist') {
    for (let i = 0; i < 4; i++) {
      const mx = ((globalTime * (12 + i * 4) + i * 320) % (width + 420)) - 210;
      const my = height * (0.56 + i * 0.08);
      const mist = ctx.createRadialGradient(mx, my, 10, mx, my, 240);
      mist.addColorStop(0, 'rgba(225, 235, 245, 0.14)');
      mist.addColorStop(1, 'rgba(225, 235, 245, 0)');
      ctx.fillStyle = mist;
      ctx.beginPath();
      ctx.ellipse(mx, my, 260, 58, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Subtle floating cinema dust motes for living depth in every clear scene
    for (let i = 0; i < 16; i++) {
      const dx = ((i * 191 + globalTime * 9) % (width + 20)) - 10;
      const dy = ((i * 83 + Math.sin(globalTime * 0.8 + i) * 22) % height + height) % height;
      ctx.fillStyle = 'rgba(255, 244, 214, 0.18)';
      ctx.beginPath();
      ctx.arc(dx, dy, 1.3 + (i % 2) * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * Applies the selected visual art-direction color grade + custom ColorPalette mood across the frame.
 */
export function renderVisualStyleGrade(
  ctx: CanvasRenderingContext2D,
  style: VisualStyle | undefined,
  width: number,
  height: number,
  colorPalette?: ColorPaletteId
): void {
  if (!style || style === 'storybook-warm') {
    const warm = ctx.createRadialGradient(
      width * 0.5,
      height * 0.35,
      width * 0.12,
      width * 0.5,
      height * 0.5,
      width * 0.75
    );
    warm.addColorStop(0, 'rgba(255, 206, 130, 0.05)');
    warm.addColorStop(1, 'rgba(18, 12, 8, 0.16)');
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, width, height);
  } else if (style === 'cinematic-anime') {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(54, 148, 224, 0.10)');
    grad.addColorStop(0.6, 'rgba(255, 166, 112, 0.06)');
    grad.addColorStop(1, 'rgba(14, 22, 42, 0.18)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (style === 'editorial-doc') {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, 'rgba(30, 44, 66, 0.08)');
    grad.addColorStop(1, 'rgba(12, 16, 24, 0.18)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (style === 'dramatic-noir') {
    const grad = ctx.createRadialGradient(
      width * 0.5,
      height * 0.45,
      width * 0.1,
      width * 0.5,
      height * 0.5,
      width * 0.7
    );
    grad.addColorStop(0, 'rgba(242, 178, 84, 0.08)');
    grad.addColorStop(1, 'rgba(4, 6, 12, 0.42)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  if (colorPalette && colorPalette !== 'heritage-gold') {
    const pal = COLOR_PALETTES[colorPalette];
    if (pal) {
      const pGrad = ctx.createLinearGradient(0, 0, width, height);
      pGrad.addColorStop(0, pal.tintTop);
      pGrad.addColorStop(1, pal.tintBottom);
      ctx.fillStyle = pGrad;
      ctx.fillRect(0, 0, width, height);

      if (colorPalette === 'monochrome-noir') {
        ctx.save();
        ctx.globalCompositeOperation = 'saturation';
        ctx.fillStyle = 'rgba(160, 168, 178, 0.58)';
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
    }
  }
}

/**
 * Scroll-stopping optical polish: soft depth-of-field foreground bokeh orbs and golden
 * anamorphic light-sweep bloom on scene openings / speech emphasis peaks.
 */
export function renderScrollStopperOverlays(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  globalTime: number,
  speechEnergy: number,
  hookBloom: number,
  accentColor = '#E5A93C'
): void {
  const isVertical = height > width;
  ctx.save();

  // 1. Soft drifting depth-of-field foreground bokeh orbs at edges (never blocking subject center)
  const bokehCount = isVertical ? 7 : 9;
  for (let i = 0; i < bokehCount; i++) {
    const side = i % 2 === 0 ? 0.08 + (i * 0.04) % 0.18 : 0.78 + (i * 0.05) % 0.18;
    const bx = width * side + Math.sin(globalTime * (0.45 + (i % 3) * 0.14) + i * 2.1) * 24;
    const by =
      ((i * 191 + globalTime * (14 + (i % 4) * 5)) % (height + 120)) - 60;
    const r = (isVertical ? 18 : 22) + (i % 4) * 11 + speechEnergy * 8;
    const alpha = 0.065 + (i % 3) * 0.025 + speechEnergy * 0.03;

    const grad = ctx.createRadialGradient(bx, by, 1, bx, by, r);
    grad.addColorStop(0, `rgba(255, 226, 158, ${alpha})`);
    grad.addColorStop(0.55, `rgba(229, 169, 60, ${alpha * 0.45})`);
    grad.addColorStop(1, 'rgba(229, 169, 60, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Anamorphic golden hook light-sweep during opening 1.1s & chapter cuts
  if (hookBloom > 0.015) {
    const sweepX = width * (0.15 + (1 - Math.min(1, hookBloom * 2.2)) * 0.72);
    const flare = ctx.createRadialGradient(
      sweepX,
      height * 0.34,
      8,
      sweepX,
      height * 0.34,
      Math.max(width, height) * 0.44
    );
    flare.addColorStop(0, `rgba(255, 238, 188, ${hookBloom * 0.52})`);
    flare.addColorStop(0.45, `rgba(229, 169, 60, ${hookBloom * 0.22})`);
    flare.addColorStop(1, 'rgba(229, 169, 60, 0)');
    ctx.fillStyle = flare;
    ctx.fillRect(0, 0, width, height);

    // Soft feathered anamorphic cinema lens glow (no hard edges)
    ctx.save();
    ctx.translate(sweepX, height * 0.34);
    ctx.scale(1, 0.09);
    const streakGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, width * 0.56);
    streakGrad.addColorStop(0, `rgba(255, 240, 194, ${hookBloom * 0.38})`);
    streakGrad.addColorStop(0.4, `rgba(229, 169, 60, ${hookBloom * 0.16})`);
    streakGrad.addColorStop(1, 'rgba(229, 169, 60, 0)');
    ctx.fillStyle = streakGrad;
    ctx.beginPath();
    ctx.arc(0, 0, width * 0.56, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 3. Subtle voice-reactive rim accent pulse at bottom edge
  if (speechEnergy > 0.22) {
    const pulseAlpha = Math.min(0.14, (speechEnergy - 0.22) * 0.18);
    const rim = ctx.createLinearGradient(0, height - 120, 0, height);
    rim.addColorStop(0, 'rgba(0,0,0,0)');
    rim.addColorStop(1, accentColor);
    ctx.globalAlpha = pulseAlpha;
    ctx.fillStyle = rim;
    ctx.fillRect(0, height - 120, width, 120);
  }

  ctx.restore();
}

/**
 * Draws tasteful animated visual motifs tied directly to concepts mentioned in the spoken SRT.
 */
export function renderStoryMotifOverlay(
  ctx: CanvasRenderingContext2D,
  motif: StoryMotif | undefined,
  globalTime: number,
  width: number,
  height: number,
  speechEnergy: number
): void {
  if (!motif || motif === 'none') return;
  const isVertical = height > width;
  const cx = isVertical ? width * 0.5 : width * 0.76;
  const cy = isVertical ? height * 0.25 : height * 0.28;

  ctx.save();
  if (motif === 'clock-time') {
    const r = isVertical ? 54 : 62;
    ctx.translate(cx, cy);
    ctx.strokeStyle = 'rgba(229, 169, 60, 0.34)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 226, 164, 0.22)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (r - 9), Math.sin(a) * (r - 9));
      ctx.lineTo(Math.cos(a) * (r - 2), Math.sin(a) * (r - 2));
      ctx.stroke();
    }

    // Animated clock hands
    ctx.strokeStyle = 'rgba(245, 206, 118, 0.65)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(globalTime * 0.22 - Math.PI / 2) * (r * 0.5), Math.sin(globalTime * 0.22 - Math.PI / 2) * (r * 0.5));
    ctx.stroke();

    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(globalTime * 1.4 - Math.PI / 2) * (r * 0.76), Math.sin(globalTime * 1.4 - Math.PI / 2) * (r * 0.76));
    ctx.stroke();
  } else if (motif === 'glowing-heart') {
    const pulse = 1 + Math.sin(globalTime * 2.8) * 0.08 + speechEnergy * 0.1;
    const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 92 * pulse);
    glow.addColorStop(0, 'rgba(242, 128, 118, 0.26)');
    glow.addColorStop(0.55, 'rgba(232, 168, 76, 0.11)');
    glow.addColorStop(1, 'rgba(232, 168, 76, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 92 * pulse, 0, Math.PI * 2);
    ctx.fill();
  } else if (motif === 'dream-orbs' || motif === 'floating-books') {
    for (let i = 0; i < 6; i++) {
      const ox = cx + Math.sin(globalTime * 0.7 + i * 1.4) * 78;
      const oy = cy + Math.cos(globalTime * 0.9 + i * 1.1) * 44;
      const r = 10 + (i % 3) * 7;
      const g = ctx.createRadialGradient(ox, oy, 1, ox, oy, r * 2);
      g.addColorStop(0, 'rgba(255, 224, 152, 0.36)');
      g.addColorStop(1, 'rgba(255, 224, 152, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(ox, oy, r * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/**
 * 1. Deep Space, Nebula, Planet Earth Horizon & Launching Rocket
 */
export function renderWorldSpaceCosmos(
  ctx: CanvasRenderingContext2D,
  sceneTime: number,
  globalTime: number,
  width: number,
  height: number,
  speechEnergy: number,
  portraitZoom = 1.38
): void {
  const safe = getPortraitSafeLayout(width, height, portraitZoom);
  const isVertical = safe.isVertical;
  drawSky(
    ctx,
    [
      [0, '#040610'],
      [0.45, '#0B132B'],
      [0.8, '#172549'],
      [1, '#1E335C'],
    ],
    width,
    height
  );

  // Luminous Nebula Clouds
  const neb1 = ctx.createRadialGradient(width * 0.26, height * 0.28, 12, width * 0.26, height * 0.28, width * 0.42);
  neb1.addColorStop(0, 'rgba(92, 156, 255, 0.24)');
  neb1.addColorStop(0.5, 'rgba(130, 88, 210, 0.11)');
  neb1.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = neb1;
  ctx.fillRect(0, 0, width, height);

  const neb2 = ctx.createRadialGradient(width * 0.78, height * 0.22, 10, width * 0.78, height * 0.22, width * 0.34);
  neb2.addColorStop(0, 'rgba(244, 174, 92, 0.16)');
  neb2.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = neb2;
  ctx.fillRect(0, 0, width, height);

  // Twinkling Deep Starfield
  for (let i = 0; i < 95; i++) {
    const sx = ((i * 157 + 23) % (width - 16)) + 8;
    const sy = ((i * 89 + 19) % Math.round(height * 0.78)) + 8;
    const tw = 0.35 + 0.65 * Math.abs(Math.sin(globalTime * (1.3 + (i % 5) * 0.35) + i));
    ctx.fillStyle = i % 7 === 0 ? `rgba(255, 224, 168, ${tw})` : `rgba(225, 238, 255, ${tw})`;
    ctx.beginPath();
    ctx.arc(sx, sy, i % 9 === 0 ? 2.2 : 1.15, 0, Math.PI * 2);
    ctx.fill();
  }

  // Shooting Star streak
  const meteorPhase = (globalTime * 0.42) % 1;
  if (meteorPhase < 0.35) {
    const p = meteorPhase / 0.35;
    const mx = lerp(width * 0.88, width * 0.56, p);
    const my = lerp(height * 0.1, height * 0.26, p);
    const mGrad = ctx.createLinearGradient(mx, my, mx + 84, my - 34);
    mGrad.addColorStop(0, 'rgba(255, 248, 220, 0.92)');
    mGrad.addColorStop(1, 'rgba(255, 248, 220, 0)');
    ctx.strokeStyle = mGrad;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(mx + 84, my - 34);
    ctx.stroke();
  }

  // Curved Glowing Planet Earth Horizon at Bottom
  const earthR = isVertical ? width * 1.35 : width * 0.92;
  const earthY = height + earthR - (isVertical ? height * 0.22 : height * 0.24);
  const atmoGlow = ctx.createRadialGradient(width * 0.5, earthY, earthR - 14, width * 0.5, earthY, earthR + 68);
  atmoGlow.addColorStop(0, 'rgba(84, 178, 255, 0.65)');
  atmoGlow.addColorStop(0.5, 'rgba(54, 128, 235, 0.22)');
  atmoGlow.addColorStop(1, 'rgba(54, 128, 235, 0)');
  ctx.fillStyle = atmoGlow;
  ctx.beginPath();
  ctx.arc(width * 0.5, earthY, earthR + 68, 0, Math.PI * 2);
  ctx.fill();

  const earthGrad = ctx.createLinearGradient(0, earthY - earthR, 0, height);
  earthGrad.addColorStop(0, '#3C92E8');
  earthGrad.addColorStop(0.32, '#1A5498');
  earthGrad.addColorStop(1, '#0A2146');
  ctx.fillStyle = earthGrad;
  ctx.beginPath();
  ctx.arc(width * 0.5, earthY, earthR, 0, Math.PI * 2);
  ctx.fill();

  // Animated Launching Rocket climbing upward diagonally with glowing exhaust
  const lift = clamp01(sceneTime / 14);
  const rScale = isVertical ? Math.min(1.62, 1.32 * safe.subjectScale) : 1.26;
  const rx = safe.clampX(
    lerp(width * (isVertical ? 0.44 : 0.42), width * (isVertical ? 0.56 : 0.58), lift),
    42 * rScale
  );
  const ry = lerp(height * (isVertical ? 0.58 : 0.64), height * (isVertical ? 0.34 : 0.28), lift) + Math.sin(globalTime * 14) * 1.6;

  // Dynamic hyper-speed starlight streaks rushing past the climbing rocket
  ctx.save();
  ctx.strokeStyle = 'rgba(180, 220, 255, 0.22)';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 10; i++) {
    const sx = ((i * 137 + 41) % width);
    const sy = ((i * 113 + globalTime * (210 + (i % 4) * 55)) % (height * 0.85));
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - 6, sy + 26 + (i % 3) * 12);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(rx, ry);
  ctx.rotate(0.22);
  ctx.scale(rScale, rScale);

  // Radiant engine plasma bloom halo
  const plasmaGlow = ctx.createRadialGradient(0, 56, 4, 0, 56, 86 + speechEnergy * 32);
  plasmaGlow.addColorStop(0, 'rgba(255, 232, 162, 0.55)');
  plasmaGlow.addColorStop(0.5, 'rgba(244, 134, 48, 0.22)');
  plasmaGlow.addColorStop(1, 'rgba(244, 134, 48, 0)');
  ctx.fillStyle = plasmaGlow;
  ctx.beginPath();
  ctx.arc(0, 56, 86 + speechEnergy * 32, 0, Math.PI * 2);
  ctx.fill();

  // Roaring Plasma Exhaust Flame (reacts to speech energy)
  const flameLen = 78 + Math.sin(globalTime * 28) * 16 + speechEnergy * 34;
  const flameGrad = ctx.createLinearGradient(0, 44, 0, 44 + flameLen);
  flameGrad.addColorStop(0, '#FFF8D6');
  flameGrad.addColorStop(0.32, '#FFB547');
  flameGrad.addColorStop(0.7, 'rgba(232, 82, 34, 0.65)');
  flameGrad.addColorStop(1, 'rgba(232, 82, 34, 0)');
  ctx.fillStyle = flameGrad;
  ctx.beginPath();
  ctx.moveTo(-14, 42);
  ctx.quadraticCurveTo(0, 44 + flameLen, 14, 42);
  ctx.closePath();
  ctx.fill();

  // Exhaust Cloud Puffs
  for (let i = 0; i < 6; i++) {
    const py = 54 + ((globalTime * 95 + i * 26) % 135);
    const px = Math.sin(globalTime * 4 + i * 1.7) * (8 + py * 0.14);
    const pr = 8 + (py / 135) * 20;
    ctx.fillStyle = `rgba(220, 232, 248, ${Math.max(0, 0.28 - (py / 135) * 0.26)})`;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rocket Fins
  ctx.fillStyle = '#C84B31';
  ctx.beginPath();
  ctx.moveTo(-16, 18);
  ctx.lineTo(-34, 46);
  ctx.lineTo(-14, 40);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(16, 18);
  ctx.lineTo(34, 46);
  ctx.lineTo(14, 40);
  ctx.closePath();
  ctx.fill();

  // Rocket Fuselage with metallic shading
  const bodyGrad = ctx.createLinearGradient(-20, 0, 20, 0);
  bodyGrad.addColorStop(0, '#CFD7E3');
  bodyGrad.addColorStop(0.45, '#F8FAFD');
  bodyGrad.addColorStop(1, '#8D9CB2');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(0, -68);
  ctx.quadraticCurveTo(22, -26, 18, 42);
  ctx.lineTo(-18, 42);
  ctx.quadraticCurveTo(-22, -26, 0, -68);
  ctx.closePath();
  ctx.fill();

  // Nose Cone Red Cap
  ctx.fillStyle = '#D44D36';
  ctx.beginPath();
  ctx.moveTo(0, -68);
  ctx.quadraticCurveTo(12, -46, 14, -34);
  ctx.lineTo(-14, -34);
  ctx.quadraticCurveTo(-12, -46, 0, -68);
  ctx.closePath();
  ctx.fill();

  // Glowing Porthole Window
  ctx.fillStyle = '#1E3A5F';
  ctx.beginPath();
  ctx.arc(0, -6, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8AD8FF';
  ctx.beginPath();
  ctx.arc(0, -6, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(-2.5, -8.5, 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 2. Open Ocean, Rolling Multi-Layer Waves, Lighthouse & Sailing Ship
 */
export function renderWorldOceanVoyage(
  ctx: CanvasRenderingContext2D,
  scene: SceneSpec,
  sceneTime: number,
  globalTime: number,
  width: number,
  height: number,
  portraitZoom = 1.38
): void {
  const safe = getPortraitSafeLayout(width, height, portraitZoom);
  const isVertical = safe.isVertical;
  const isStorm = scene.timeOfDay === 'storm';
  const horizonY = Math.round(height * 0.52);

  drawSky(
    ctx,
    isStorm
      ? [
          [0, '#0D1520'],
          [0.5, '#1B2A3B'],
          [1, '#31495E'],
        ]
      : [
          [0, '#162542'],
          [0.42, '#4A4E74'],
          [0.75, '#D47B56'],
          [1, '#F6C478'],
        ],
    width,
    height
  );

  // Sun / Moon reflection on ocean horizon
  if (!isStorm) {
    const sunX = width * 0.56;
    const sunGrad = ctx.createRadialGradient(sunX, horizonY - 26, 8, sunX, horizonY - 26, 140);
    sunGrad.addColorStop(0, 'rgba(255, 240, 194, 0.95)');
    sunGrad.addColorStop(0.35, 'rgba(246, 174, 88, 0.45)');
    sunGrad.addColorStop(1, 'rgba(246, 174, 88, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, horizonY - 26, 140, 0, Math.PI * 2);
    ctx.fill();
  }

  // Distant Sea Base
  const seaGrad = ctx.createLinearGradient(0, horizonY, 0, height);
  seaGrad.addColorStop(0, isStorm ? '#1B3447' : '#265378');
  seaGrad.addColorStop(0.5, isStorm ? '#0F2232' : '#123452');
  seaGrad.addColorStop(1, '#081624');
  ctx.fillStyle = seaGrad;
  ctx.fillRect(0, horizonY, width, height - horizonY);

  // Distant Island + Sweeping Lighthouse Beam
  const lhX = safe.clampX(width * 0.16, 48);
  ctx.fillStyle = '#121B28';
  ctx.beginPath();
  ctx.moveTo(lhX - 75, horizonY + 8);
  ctx.quadraticCurveTo(lhX, horizonY - 26, lhX + 68, horizonY + 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#D9D2C5';
  ctx.fillRect(lhX - 7, horizonY - 68, 14, 52);
  ctx.fillStyle = '#C7493A';
  ctx.fillRect(lhX - 8, horizonY - 76, 16, 10);

  const beamSweep = Math.sin(globalTime * 0.9) * 0.35;
  ctx.save();
  ctx.translate(lhX, horizonY - 72);
  ctx.rotate(beamSweep);
  const beam = ctx.createLinearGradient(0, 0, 340, 0);
  beam.addColorStop(0, 'rgba(255, 236, 162, 0.42)');
  beam.addColorStop(1, 'rgba(255, 236, 162, 0)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.lineTo(340, -44);
  ctx.lineTo(340, 44);
  ctx.lineTo(0, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Back Ocean Waves
  const drawWaveBand = (yBase: number, amp: number, speed: number, color: string, foamAlpha: number) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width + 24; x += 24) {
      const y = yBase + Math.sin(x * 0.012 + globalTime * speed) * amp + Math.cos(x * 0.025 - globalTime * speed * 0.7) * (amp * 0.45);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    if (foamAlpha > 0) {
      ctx.strokeStyle = `rgba(220, 240, 255, ${foamAlpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x <= width + 24; x += 24) {
        const y = yBase + Math.sin(x * 0.012 + globalTime * speed) * amp + Math.cos(x * 0.025 - globalTime * speed * 0.7) * (amp * 0.45);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  };

  drawWaveBand(horizonY + 34, 8, 1.4, isStorm ? '#152C3E' : '#1B496E', 0.14);

  // Animated Tall Sailing Ship rocking on the swell (safe-bounded close-up in 9:16)
  const sScale = isVertical ? Math.min(1.42, 1.12 * safe.subjectScale) : 1.24;
  const shipX = safe.clampX(
    lerp(width * (isVertical ? 0.44 : 0.42), width * (isVertical ? 0.56 : 0.58), clamp01(sceneTime / 14)),
    108 * sScale
  );
  const shipY = horizonY + (height - horizonY) * (isVertical ? 0.26 : 0.34) + Math.sin(globalTime * 2.1) * 7;
  const rock = Math.sin(globalTime * 1.9) * 0.065;

  // Shimmering golden sunset water reflection path
  if (!isStorm) {
    for (let i = 0; i < 8; i++) {
      const shimmerY = horizonY + 18 + i * 24;
      const shimmerW = (95 - i * 7) + Math.sin(globalTime * 3 + i) * 14;
      ctx.fillStyle = `rgba(255, 214, 132, ${0.28 - i * 0.028})`;
      ctx.beginPath();
      ctx.ellipse(width * 0.56 + Math.sin(globalTime * 2 + i) * 8, shimmerY, shimmerW, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.save();
  ctx.translate(shipX, shipY);
  ctx.rotate(rock);
  ctx.scale(sScale, sScale);

  // Wooden Hull
  ctx.fillStyle = '#3B2316';
  ctx.beginPath();
  ctx.moveTo(-105, -16);
  ctx.lineTo(116, -22);
  ctx.quadraticCurveTo(96, 26, 62, 34);
  ctx.lineTo(-78, 34);
  ctx.quadraticCurveTo(-102, 16, -105, -16);
  ctx.closePath();
  ctx.fill();

  // Warm cabin windows on stern
  ctx.fillStyle = '#F7CA6E';
  ctx.fillRect(-84, -8, 12, 9);
  ctx.fillRect(-66, -8, 12, 9);

  // Masts
  ctx.strokeStyle = '#5C3B24';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-16, -18);
  ctx.lineTo(-16, -172);
  ctx.moveTo(42, -20);
  ctx.lineTo(42, -138);
  ctx.stroke();

  // Wind-billowing Sails
  const billow = 18 + Math.sin(globalTime * 2.6) * 5;
  const sailGrad = ctx.createLinearGradient(-40, -160, 45, -20);
  sailGrad.addColorStop(0, '#FBF4E4');
  sailGrad.addColorStop(1, '#D7C4A2');
  ctx.fillStyle = sailGrad;
  ctx.beginPath();
  ctx.moveTo(-16, -162);
  ctx.quadraticCurveTo(-16 + billow * 2.6, -102, -16 + billow, -34);
  ctx.lineTo(-54, -44);
  ctx.quadraticCurveTo(-30, -102, -16, -162);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(42, -130);
  ctx.quadraticCurveTo(42 + billow * 2.1, -84, 42 + billow * 0.8, -32);
  ctx.lineTo(14, -40);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // Foreground Waves
  drawWaveBand(horizonY + (height - horizonY) * 0.44, 13, 2.2, isStorm ? '#0E1F2E' : '#123756', 0.24);
  drawWaveBand(horizonY + (height - horizonY) * 0.68, 16, 2.9, '#081726', 0.18);
}

/**
 * 3. Misty Mountain Summit & Climber at Sunrise
 */
export function renderWorldMountainSummit(
  ctx: CanvasRenderingContext2D,
  scene: SceneSpec,
  globalTime: number,
  width: number,
  height: number,
  speechEnergy: number,
  portraitZoom = 1.38,
  characterProfiles?: CharacterProfile[],
  viseme?: VisemePose
): void {
  const safe = getPortraitSafeLayout(width, height, portraitZoom);
  const isVertical = safe.isVertical;
  drawSky(
    ctx,
    [
      [0, '#13203A'],
      [0.42, '#4A6084'],
      [0.74, '#D98E66'],
      [1, '#F8D49A'],
    ],
    width,
    height
  );

  // Rising Sun behind distant Himalayan peaks
  const sunX = width * 0.54;
  const sunY = height * 0.44;
  const sunHalo = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, width * 0.34);
  sunHalo.addColorStop(0, 'rgba(255, 245, 210, 0.95)');
  sunHalo.addColorStop(0.35, 'rgba(246, 178, 96, 0.48)');
  sunHalo.addColorStop(1, 'rgba(246, 178, 96, 0)');
  ctx.fillStyle = sunHalo;
  ctx.beginPath();
  ctx.arc(sunX, sunY, width * 0.34, 0, Math.PI * 2);
  ctx.fill();

  // Layered Mountain Ridges
  const drawRidge = (pts: Array<[number, number]>, fill: string, snowHighlight?: string) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (const [px, py] of pts) ctx.lineTo(px * width, py * height);
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    if (snowHighlight) {
      ctx.strokeStyle = snowHighlight;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const [px, py] = pts[i];
        if (i === 0) ctx.moveTo(px * width, py * height);
        else ctx.lineTo(px * width, py * height);
      }
      ctx.stroke();
    }
  };

  drawRidge(
    [
      [0, 0.62],
      [0.18, 0.42],
      [0.36, 0.56],
      [0.54, 0.32],
      [0.74, 0.5],
      [0.88, 0.36],
      [1, 0.58],
    ],
    '#3B4A68',
    'rgba(255, 230, 198, 0.35)'
  );

  drawRidge(
    [
      [0, 0.72],
      [0.24, 0.52],
      [0.46, 0.66],
      [0.68, 0.46],
      [0.92, 0.62],
      [1, 0.7],
    ],
    '#243045',
    'rgba(242, 198, 152, 0.25)'
  );

  // Foreground Rocky Summit Cliff
  const cliffY = isVertical ? 0.74 : 0.76;
  drawRidge(
    [
      [0, cliffY + 0.08],
      [0.28, cliffY - 0.03],
      [0.54, cliffY],
      [0.78, cliffY + 0.09],
      [1, cliffY + 0.14],
    ],
    '#141A26'
  );

  // Animated Fluttering Flag on the Summit
  const flagX = safe.clampX(width * 0.54, 52);
  const flagBaseY = height * cliffY - 4;
  ctx.strokeStyle = '#C8C2B4';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(flagX, flagBaseY);
  ctx.lineTo(flagX, flagBaseY - 76);
  ctx.stroke();

  const wave = Math.sin(globalTime * 6.5) * 7;
  ctx.fillStyle = '#E5A93C';
  ctx.beginPath();
  ctx.moveTo(flagX, flagBaseY - 74);
  ctx.quadraticCurveTo(flagX + 24, flagBaseY - 78 + wave, flagX + 48, flagBaseY - 66 - wave * 0.6);
  ctx.lineTo(flagX + 46, flagBaseY - 46 - wave * 0.5);
  ctx.quadraticCurveTo(flagX + 22, flagBaseY - 54 + wave, flagX, flagBaseY - 48);
  ctx.closePath();
  ctx.fill();

  const heroRole = scene.primaryCharacter ?? 'youth-boy';
  const heroScale = isVertical ? Math.min(1.52, 1.24 * safe.subjectScale) : 1.24;
  // Hero Standing Proudly on the Summit (safe-bounded framing in 9:16)
  drawLifelikeHuman(ctx, {
    x: safe.clampX(isVertical ? width * 0.42 : width * 0.38, 62),
    y: height * cliffY + (isVertical ? 14 : 4),
    scale: heroScale,
    facing: 1,
    role: heroRole,
    emotion: scene.emotion ?? 'inspiring',
    pose: 'celebrating',
    time: globalTime,
    speechEnergy,
    isSpeaking: speechEnergy > 0.12,
    viseme: speechEnergy > 0.12 ? viseme : undefined,
    rimLightColor: 'rgba(255, 206, 128, 0.62)',
    profile: resolveSceneActorProfile(characterProfiles, heroRole, scene, 'primary'),
  });
}

/**
 * 4. Express Train Gliding Across Countryside Bridge at Sunset
 */
export function renderWorldTrainJourney(
  ctx: CanvasRenderingContext2D,
  sceneTime: number,
  globalTime: number,
  width: number,
  height: number
): void {
  const horizonY = Math.round(height * 0.58);
  drawSky(
    ctx,
    [
      [0, '#1B223C'],
      [0.45, '#68455C'],
      [0.78, '#DA7F52'],
      [1, '#F7CA7B'],
    ],
    width,
    height
  );

  // Rolling Hills
  ctx.fillStyle = '#2B3146';
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  for (let x = 0; x <= width; x += 40) {
    ctx.lineTo(x, horizonY - 26 - Math.sin(x * 0.006) * 28);
  }
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // Viaduct Railway Bridge
  const trackY = Math.round(height * 0.66);
  ctx.fillStyle = '#1C1E29';
  ctx.fillRect(0, trackY, width, height - trackY);
  // Bridge arches
  ctx.fillStyle = '#2C2A35';
  ctx.fillRect(0, trackY - 6, width, 16);
  const archSpacing = 170;
  for (let x = 20; x < width + archSpacing; x += archSpacing) {
    ctx.fillStyle = '#121520';
    ctx.beginPath();
    ctx.arc(x, trackY + 72, 54, Math.PI, 0);
    ctx.lineTo(x + 54, height);
    ctx.lineTo(x - 54, height);
    ctx.closePath();
    ctx.fill();
  }

  // Animated Moving Express Train with Warm Illuminated Windows (scaled closer on 9:16)
  const isVertical = height > width;
  const tScale = isVertical ? 1.38 : 1.05;
  ctx.save();
  ctx.translate(0, trackY);
  ctx.scale(tScale, tScale);
  const trainOffset = ((sceneTime * 115) % (width / tScale + 620)) - 340;
  const carY = -68;
  for (let c = 0; c < 4; c++) {
    const cx = trainOffset - c * 176;
    ctx.fillStyle = '#232B3A';
    ctx.beginPath();
    ctx.roundRect(cx, carY, 166, 62, c === 0 ? [10, 26, 4, 4] : 6);
    ctx.fill();

    // Accent Gold Stripe
    ctx.fillStyle = '#E5A93C';
    ctx.fillRect(cx + 4, carY + 42, 158, 5);

    // Warm Glowing Passenger Windows
    for (let w = 0; w < 4; w++) {
      ctx.fillStyle = '#FCE196';
      ctx.beginPath();
      ctx.roundRect(cx + 16 + w * 35, carY + 13, 24, 20, 3);
      ctx.fill();
    }

    // Headlight beam on lead locomotive
    if (c === 0) {
      const hl = ctx.createLinearGradient(cx + 166, carY + 34, cx + 380, carY + 48);
      hl.addColorStop(0, 'rgba(255, 244, 194, 0.78)');
      hl.addColorStop(1, 'rgba(255, 244, 194, 0)');
      ctx.fillStyle = hl;
      ctx.beginPath();
      ctx.moveTo(cx + 164, carY + 28);
      ctx.lineTo(cx + 380, carY - 8);
      ctx.lineTo(cx + 380, carY + 72);
      ctx.lineTo(cx + 164, carY + 42);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Steam / Cloud Puffs trailing behind locomotive
  for (let i = 0; i < 6; i++) {
    const sx = trainOffset + 90 - i * 38 - (globalTime * 22) % 38;
    const sy = carY - 14 - i * 11 + Math.sin(globalTime * 3 + i) * 4;
    ctx.fillStyle = `rgba(245, 232, 215, ${0.26 - i * 0.035})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 14 + i * 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * 5. Futuristic AI & Tech Lab with Animated Neural Network Hologram
 */
export function renderWorldTechAiLab(
  ctx: CanvasRenderingContext2D,
  scene: SceneSpec,
  sceneTime: number,
  globalTime: number,
  width: number,
  height: number,
  speechEnergy: number,
  portraitZoom = 1.38,
  characterProfiles?: CharacterProfile[],
  viseme?: VisemePose
): void {
  const safe = getPortraitSafeLayout(width, height, portraitZoom);
  const isVertical = safe.isVertical;
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#08101C');
  bg.addColorStop(0.6, '#0F1C2E');
  bg.addColorStop(1, '#09111B');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Subtle architectural grid lines
  ctx.strokeStyle = 'rgba(80, 200, 184, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Animated Holographic Neural Network Constellation with spring opening
  const enterSpring = Math.min(1.08, springValue(sceneTime, { stiffness: 130, damping: 16 }));
  const centerX = isVertical ? safe.centerX : width * 0.62;
  const centerY = isVertical ? height * 0.30 : height * 0.42;
  const radius = (isVertical ? Math.min(132, safe.safeWidth * 0.28) : 185) * enterSpring;

  const halo = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, Math.max(24, radius * 1.45));
  halo.addColorStop(0, 'rgba(80, 200, 184, 0.28)');
  halo.addColorStop(0.55, 'rgba(56, 132, 224, 0.12)');
  halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(centerX, centerY, Math.max(24, radius * 1.45), 0, Math.PI * 2);
  ctx.fill();

  const nodes: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + globalTime * 0.22;
    const dist = (i % 2 === 0 ? 0.92 : 0.54) * radius;
    nodes.push({
      x: centerX + Math.cos(angle) * dist,
      y: centerY + Math.sin(angle) * dist * 0.72,
    });
  }

  ctx.strokeStyle = 'rgba(110, 226, 212, 0.34)';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      if (Math.hypot(dx, dy) < radius * 0.95) {
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      }
    }
  }

  for (let i = 0; i < nodes.length; i++) {
    const pulse = 3.5 + Math.sin(globalTime * 4 + i) * 1.6 + speechEnergy * 2.5;
    ctx.fillStyle = i % 3 === 0 ? '#E5A93C' : '#7BF2E2';
    ctx.beginPath();
    ctx.arc(nodes[i].x, nodes[i].y, pulse, 0, Math.PI * 2);
    ctx.fill();
  }

  const techRole = scene.primaryCharacter === 'narrator' ? 'professional' : (scene.primaryCharacter ?? 'professional');
  // Expressive Engineer / Creator presenting closely alongside Hologram (never clipped)
  drawLifelikeHuman(ctx, {
    x: safe.clampX(isVertical ? safe.centerX : width * 0.28, 72),
    y: isVertical ? safe.safeBottom + 48 : height * 0.88,
    scale: isVertical ? Math.min(1.66, 1.38 * safe.subjectScale) : 1.54,
    facing: 1,
    role: techRole,
    emotion: scene.emotion ?? 'determined',
    pose: 'standing-speak',
    time: globalTime,
    speechEnergy,
    isSpeaking: speechEnergy > 0.1,
    viseme: speechEnergy > 0.1 ? viseme : undefined,
    prop: 'laptop',
    rimLightColor: 'rgba(110, 226, 212, 0.58)',
    profile: resolveSceneActorProfile(characterProfiles, techRole, scene, 'primary'),
  });
}

/**
 * 6. Business, Finance & Growth Studio with Animated Rising Golden Curve
 */
export function renderWorldFinanceGrowth(
  ctx: CanvasRenderingContext2D,
  scene: SceneSpec,
  sceneTime: number,
  globalTime: number,
  width: number,
  height: number,
  speechEnergy: number,
  portraitZoom = 1.38,
  characterProfiles?: CharacterProfile[],
  viseme?: VisemePose
): void {
  const safe = getPortraitSafeLayout(width, height, portraitZoom);
  const isVertical = safe.isVertical;
  drawSky(
    ctx,
    [
      [0, '#0D131E'],
      [0.55, '#192233'],
      [1, '#121620'],
    ],
    width,
    height
  );

  // Subtle City Skyline Silhouette Behind Glass
  ctx.fillStyle = 'rgba(10, 14, 22, 0.75)';
  const baseLine = Math.round(height * 0.76);
  for (let i = 0; i < 14; i++) {
    const bw = width / 13;
    const bh = 90 + ((i * 53) % 160);
    ctx.fillRect(i * bw - 4, baseLine - bh, bw - 8, bh);
  }

  // Animated Growth Bars & Luminous Golden Trajectory Curve bounded within safe zone
  const chartX = isVertical ? safe.safeLeft : width * 0.42;
  const chartY = isVertical ? height * 0.18 : height * 0.18;
  const chartW = isVertical ? safe.safeWidth : width * 0.5;
  const chartH = isVertical ? height * 0.25 : height * 0.46;

  const bars = [0.22, 0.34, 0.31, 0.48, 0.56, 0.74, 0.88, 0.96];
  const barGap = chartW / bars.length;

  for (let i = 0; i < bars.length; i++) {
    const barSpring = clamp01(springValue(Math.max(0, sceneTime - i * 0.11), { stiffness: 150, damping: 16 }));
    const h = chartH * bars[i] * Math.max(0.22, barSpring);
    const bx = chartX + i * barGap + 6;
    const by = chartY + chartH - h;
    const bGrad = ctx.createLinearGradient(bx, by, bx, chartY + chartH);
    bGrad.addColorStop(0, 'rgba(229, 169, 60, 0.65)');
    bGrad.addColorStop(1, 'rgba(229, 169, 60, 0.06)');
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.roundRect(bx, by, Math.max(10, barGap - 14), h, [5, 5, 0, 0]);
    ctx.fill();
  }

  // Glowing Line Curve across peaks
  ctx.strokeStyle = '#F7C968';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  for (let i = 0; i < bars.length; i++) {
    const barSpring = clamp01(springValue(Math.max(0, sceneTime - i * 0.11), { stiffness: 150, damping: 16 }));
    const px = chartX + i * barGap + barGap * 0.45;
    const py = chartY + chartH - chartH * bars[i] * Math.max(0.22, barSpring) - 10;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  const bizRole = scene.primaryCharacter === 'narrator' ? 'professional' : (scene.primaryCharacter ?? 'professional');
  // Presenter / Entrepreneur speaking with safe-framed close-up confidence
  drawLifelikeHuman(ctx, {
    x: safe.clampX(isVertical ? safe.centerX : width * 0.22, 68),
    y: isVertical ? safe.safeBottom + 48 : height * 0.9,
    scale: isVertical ? Math.min(1.66, 1.38 * safe.subjectScale) : 1.54,
    facing: 1,
    role: bizRole,
    emotion: scene.emotion ?? 'inspiring',
    pose: 'standing-speak',
    time: globalTime,
    speechEnergy,
    isSpeaking: speechEnergy > 0.1,
    viseme: speechEnergy > 0.1 ? viseme : undefined,
    rimLightColor: 'rgba(247, 201, 104, 0.58)',
    profile: resolveSceneActorProfile(characterProfiles, bizRole, scene, 'primary'),
  });
}

/**
 * 7. Floodlit Sports Stadium (Cricket / Football Match)
 */
export function renderWorldSportsArena(
  ctx: CanvasRenderingContext2D,
  scene: SceneSpec,
  globalTime: number,
  width: number,
  height: number,
  speechEnergy: number,
  portraitZoom = 1.38,
  characterProfiles?: CharacterProfile[],
  viseme?: VisemePose
): void {
  const safe = getPortraitSafeLayout(width, height, portraitZoom);
  const isVertical = safe.isVertical;
  const fieldY = Math.round(height * 0.6);

  drawSky(
    ctx,
    [
      [0, '#091020'],
      [0.6, '#152542'],
      [1, '#1E3352'],
    ],
    width,
    height
  );

  // Stadium Floodlight Towers & Volumetric Light Cones inside safe horizontal bounds
  const towers = [safe.clampX(width * 0.18, 28), safe.clampX(width * 0.82, 28)];
  for (const tx of towers) {
    ctx.fillStyle = '#1B2433';
    ctx.fillRect(tx - 6, height * 0.14, 12, fieldY - height * 0.14);
    ctx.fillStyle = '#FFF7DE';
    ctx.fillRect(tx - 24, height * 0.12, 48, 16);

    const cone = ctx.createLinearGradient(tx, height * 0.14, width * 0.5, fieldY + 120);
    cone.addColorStop(0, 'rgba(255, 248, 218, 0.3)');
    cone.addColorStop(1, 'rgba(255, 248, 218, 0)');
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(tx - 20, height * 0.14);
    ctx.lineTo(tx + 20, height * 0.14);
    ctx.lineTo(width * 0.5 + 240, fieldY + 120);
    ctx.lineTo(width * 0.5 - 240, fieldY + 120);
    ctx.closePath();
    ctx.fill();
  }

  // Stadium Stands Silhouette
  ctx.fillStyle = '#121926';
  ctx.beginPath();
  ctx.moveTo(0, fieldY);
  ctx.quadraticCurveTo(width * 0.5, fieldY - 120, width, fieldY);
  ctx.closePath();
  ctx.fill();

  // Lush Striped Green Pitch
  const turf = ctx.createLinearGradient(0, fieldY, 0, height);
  turf.addColorStop(0, '#2B7A4B');
  turf.addColorStop(1, '#14442A');
  ctx.fillStyle = turf;
  ctx.fillRect(0, fieldY, width, height - fieldY);

  // Pitch markings
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(width * 0.5, fieldY + (height - fieldY) * 0.45, width * 0.22, 34, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Animated Soaring Ball Trajectory Arc
  const arcT = (globalTime * 0.65) % 1;
  const bx = lerp(safe.safeLeft + 36, safe.safeRight - 36, arcT);
  const by = lerp(fieldY - 10, fieldY - 140, Math.sin(arcT * Math.PI));
  ctx.fillStyle = '#FFF9E8';
  ctx.beginPath();
  ctx.arc(bx, by, 7.5, 0, Math.PI * 2);
  ctx.fill();

  const sportRole = scene.primaryCharacter === 'narrator' ? 'youth-boy' : (scene.primaryCharacter ?? 'youth-boy');
  // Celebrating Player / Storyteller
  drawLifelikeHuman(ctx, {
    x: safe.centerX,
    y: isVertical ? safe.safeBottom + 44 : height * 0.88,
    scale: isVertical ? Math.min(1.60, 1.32 * safe.subjectScale) : 1.38,
    facing: 1,
    role: sportRole,
    emotion: scene.emotion ?? 'happy',
    pose: 'celebrating',
    time: globalTime,
    speechEnergy,
    isSpeaking: speechEnergy > 0.12,
    viseme: speechEnergy > 0.12 ? viseme : undefined,
    rimLightColor: 'rgba(255, 246, 210, 0.62)',
    profile: resolveSceneActorProfile(characterProfiles, sportRole, scene, 'primary'),
  });
}

/**
 * 8. Ancient Heritage Palace, Pointed Arches & Flickering Torchlight
 */
export function renderWorldAncientPalace(
  ctx: CanvasRenderingContext2D,
  scene: SceneSpec,
  globalTime: number,
  width: number,
  height: number,
  speechEnergy: number,
  portraitZoom = 1.38,
  characterProfiles?: CharacterProfile[],
  viseme?: VisemePose
): void {
  const safe = getPortraitSafeLayout(width, height, portraitZoom);
  const isVertical = safe.isVertical;
  drawSky(
    ctx,
    [
      [0, '#0B0C18'],
      [0.5, '#1D182C'],
      [1, '#362326'],
    ],
    width,
    height
  );

  // Glowing Crescent Moon
  ctx.fillStyle = '#FCE8B2';
  ctx.beginPath();
  ctx.arc(safe.clampX(width * 0.74, 34), height * 0.2, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#121120';
  ctx.beginPath();
  ctx.arc(safe.clampX(width * 0.74, 34) + 10, height * 0.2 - 5, 23, 0, Math.PI * 2);
  ctx.fill();

  // Grand Pointed Mughal Arch Colonnade inside safe frame
  const floorY = Math.round(height * 0.78);
  ctx.fillStyle = '#1B1418';
  ctx.fillRect(0, floorY, width, height - floorY);

  const archW = isVertical ? Math.min(safe.safeWidth * 0.84, width * 0.64) : width * 0.44;
  const archX = width * 0.5;
  ctx.strokeStyle = '#6A4A35';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(archX - archW / 2, floorY);
  ctx.lineTo(archX - archW / 2, height * 0.42);
  ctx.quadraticCurveTo(archX - archW * 0.36, height * 0.22, archX, height * 0.14);
  ctx.quadraticCurveTo(archX + archW * 0.36, height * 0.22, archX + archW / 2, height * 0.42);
  ctx.lineTo(archX + archW / 2, floorY);
  ctx.stroke();

  // Flickering Palace Torches safely inside frame
  const flicker = 0.86 + Math.sin(globalTime * 15) * 0.14;
  const torchPositions = [
    safe.clampX(archX - archW / 2 - 18, 16),
    safe.clampX(archX + archW / 2 + 18, 16),
  ];
  for (const tx of torchPositions) {
    const ty = height * 0.48;
    const tGlow = ctx.createRadialGradient(tx, ty, 4, tx, ty, 115 * flicker);
    tGlow.addColorStop(0, 'rgba(255, 210, 110, 0.62)');
    tGlow.addColorStop(0.5, 'rgba(232, 112, 42, 0.24)');
    tGlow.addColorStop(1, 'rgba(232, 112, 42, 0)');
    ctx.fillStyle = tGlow;
    ctx.beginPath();
    ctx.arc(tx, ty, 115 * flicker, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFB84C';
    ctx.beginPath();
    ctx.ellipse(tx, ty - 6, 8, 16 * flicker, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const palaceRole = scene.primaryCharacter ?? 'elder';
  drawLifelikeHuman(ctx, {
    x: safe.centerX,
    y: isVertical ? safe.safeBottom + 44 : floorY + 24,
    scale: isVertical ? Math.min(1.62, 1.34 * safe.subjectScale) : 1.42,
    facing: 1,
    role: palaceRole,
    emotion: scene.emotion ?? 'determined',
    pose: 'standing-speak',
    time: globalTime,
    speechEnergy,
    isSpeaking: speechEnergy > 0.1,
    viseme: speechEnergy > 0.1 ? viseme : undefined,
    prop: 'lantern',
    rimLightColor: 'rgba(255, 196, 102, 0.64)',
    profile: resolveSceneActorProfile(characterProfiles, palaceRole, scene, 'primary'),
  });
}

/**
 * 9. Keynote Auditorium Stage, Overhead Volumetric Spotlight & Audio Rings
 */
export function renderWorldStageSpotlight(
  ctx: CanvasRenderingContext2D,
  scene: SceneSpec,
  globalTime: number,
  width: number,
  height: number,
  speechEnergy: number,
  portraitZoom = 1.38,
  characterProfiles?: CharacterProfile[],
  viseme?: VisemePose
): void {
  const safe = getPortraitSafeLayout(width, height, portraitZoom);
  const isVertical = safe.isVertical;
  drawSky(
    ctx,
    [
      [0, '#07080D'],
      [0.65, '#111420'],
      [1, '#090A10'],
    ],
    width,
    height
  );

  // Volumetric Overhead Spotlight Cone
  const spotGrad = ctx.createLinearGradient(width * 0.5, 0, width * 0.5, height * 0.88);
  spotGrad.addColorStop(0, 'rgba(255, 224, 152, 0.34)');
  spotGrad.addColorStop(0.55, 'rgba(229, 169, 60, 0.13)');
  spotGrad.addColorStop(1, 'rgba(229, 169, 60, 0.02)');
  ctx.fillStyle = spotGrad;
  ctx.beginPath();
  ctx.moveTo(width * 0.44, 0);
  ctx.lineTo(width * 0.56, 0);
  ctx.lineTo(width * 0.78, height * 0.92);
  ctx.lineTo(width * 0.22, height * 0.92);
  ctx.closePath();
  ctx.fill();

  // Voice-Reactive Soundwave Rings behind Speaker (clamped cleanly inside 9:16 width)
  const ringY = isVertical ? height * 0.42 : height * 0.45;
  const maxRingR = isVertical ? safe.safeWidth * 0.46 : 220;
  for (let i = 0; i < 3; i++) {
    const rawR = (isVertical ? 66 : 82) + i * (isVertical ? 32 : 44) + speechEnergy * 24 + Math.sin(globalTime * 2.4 + i) * 6;
    const r = Math.min(maxRingR, rawR);
    ctx.strokeStyle = `rgba(229, 169, 60, ${0.22 - i * 0.055 + speechEnergy * 0.14})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(width * 0.5, ringY, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Polished Stage Floor
  const floorY = Math.round(height * 0.8);
  ctx.fillStyle = '#151722';
  ctx.fillRect(0, floorY, width, height - floorY);
  const floorPool = ctx.createRadialGradient(width * 0.5, floorY + 26, 12, width * 0.5, floorY + 26, width * 0.28);
  floorPool.addColorStop(0, 'rgba(229, 169, 60, 0.28)');
  floorPool.addColorStop(1, 'rgba(229, 169, 60, 0)');
  ctx.fillStyle = floorPool;
  ctx.beginPath();
  ctx.ellipse(width * 0.5, floorY + 26, width * 0.28, 32, 0, 0, Math.PI * 2);
  ctx.fill();

  const stageRole = scene.primaryCharacter ?? 'narrator';
  // Speaker with Lip-Sync & Expressive Gestures (charismatic close-up on 9:16)
  drawLifelikeHuman(ctx, {
    x: safe.centerX,
    y: isVertical ? safe.safeBottom + 48 : height * 0.89,
    scale: isVertical ? Math.min(1.74, 1.44 * safe.subjectScale) : 1.62,
    facing: 1,
    role: stageRole,
    emotion: scene.emotion ?? 'inspiring',
    pose: 'standing-speak',
    time: globalTime,
    speechEnergy,
    isSpeaking: speechEnergy > 0.09,
    viseme: speechEnergy > 0.09 ? viseme : undefined,
    rimLightColor: 'rgba(255, 222, 148, 0.68)',
    profile: resolveSceneActorProfile(characterProfiles, stageRole, scene, 'primary'),
  });
}

/**
 * Dispatcher for the 9 expanded cinematic worlds. Returns true if handled.
 */
export function renderExpandedWorld(
  ctx: CanvasRenderingContext2D,
  scene: SceneSpec,
  sceneTime: number,
  globalTime: number,
  width: number,
  height: number,
  speechEnergy: number,
  portraitZoom = 1.38,
  characterProfiles?: CharacterProfile[],
  viseme?: VisemePose
): boolean {
  switch (scene.setting) {
    case 'space-cosmos':
      renderWorldSpaceCosmos(ctx, sceneTime, globalTime, width, height, speechEnergy, portraitZoom);
      return true;
    case 'ocean-voyage':
      renderWorldOceanVoyage(ctx, scene, sceneTime, globalTime, width, height, portraitZoom);
      return true;
    case 'mountain-summit':
      renderWorldMountainSummit(ctx, scene, globalTime, width, height, speechEnergy, portraitZoom, characterProfiles, viseme);
      return true;
    case 'train-journey':
      renderWorldTrainJourney(ctx, sceneTime, globalTime, width, height);
      return true;
    case 'tech-ai-lab':
      renderWorldTechAiLab(ctx, scene, sceneTime, globalTime, width, height, speechEnergy, portraitZoom, characterProfiles, viseme);
      return true;
    case 'finance-growth':
      renderWorldFinanceGrowth(ctx, scene, sceneTime, globalTime, width, height, speechEnergy, portraitZoom, characterProfiles, viseme);
      return true;
    case 'sports-arena':
      renderWorldSportsArena(ctx, scene, globalTime, width, height, speechEnergy, portraitZoom, characterProfiles, viseme);
      return true;
    case 'ancient-palace':
      renderWorldAncientPalace(ctx, scene, globalTime, width, height, speechEnergy, portraitZoom, characterProfiles, viseme);
      return true;
    case 'stage-spotlight':
      renderWorldStageSpotlight(ctx, scene, globalTime, width, height, speechEnergy, portraitZoom, characterProfiles, viseme);
      return true;
    default:
      return false;
  }
}
