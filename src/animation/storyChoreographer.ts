import { SceneSpec, StoryProp } from '../lib/storyCompiler';
import { clamp01 } from './drawHelpers';
import { interpolateRange, springValue } from './motionEngine';

/**
 * Remotion-style deterministic frame choreography helpers:
 * Renders story-exact animated narrative props and spring-driven chapter stingers
 * so every spoken beat visually reinforces the exact words being narrated.
 */

export interface StoryChoreographyInput {
  scene: SceneSpec;
  sceneTime: number;
  sceneDuration: number;
  globalTime: number;
  width: number;
  height: number;
  speechEnergy: number;
  isThumbnail?: boolean;
}

/**
 * Computes the Remotion-style spring entrance & graceful exit for the subtle
 * editorial chapter beat stinger during the first ~2.1s of a scene.
 */
export function computeChapterStingerState(sceneTime: number, sceneDuration: number): {
  opacity: number;
  translateY: number;
  lineProgress: number;
} {
  if (sceneDuration < 2.2 || sceneTime > 2.35) {
    return { opacity: 0, translateY: -12, lineProgress: 0 };
  }
  const enter = springValue(sceneTime, { stiffness: 175, damping: 20, mass: 0.9 });
  const exit =
    sceneTime > 1.75
      ? interpolateRange(sceneTime, 1.75, 2.3, 1, 0, true)
      : 1;
  const opacity = clamp01(Math.min(enter, 1) * exit);
  const translateY = (1 - Math.min(1.06, enter)) * 18 - (1 - exit) * 8;
  const lineProgress = clamp01(springValue(Math.max(0, sceneTime - 0.12), { stiffness: 140, damping: 18 }));
  return { opacity, translateY, lineProgress };
}

/**
 * Renders a tasteful, spring-animated illustrated story prop badge/accent in the upper
 * story zone whenever the spoken sentence explicitly focuses on a concrete prop
 * (book/exam, money/fee, laptop/code, phone, lantern, umbrella, tea) and the scene
 * does not already have a full-screen custom motif.
 */
function drawAnimatedStoryPropAccent(
  ctx: CanvasRenderingContext2D,
  prop: StoryProp,
  sceneTime: number,
  globalTime: number,
  width: number,
  height: number,
  speechEnergy: number,
  accentColor: string
): void {
  if (prop === 'none') return;

  const isVertical = height > width;
  const enter = springValue(Math.max(0, sceneTime - 0.15), { stiffness: 150, damping: 18 });
  const floatY = Math.sin(globalTime * 2.1) * 5;
  const pulse = 1 + speechEnergy * 0.06;

  // Position cleanly in the upper safe zone so it never covers human faces or subtitles
  const cx = isVertical ? width * 0.8 : width * 0.85;
  const cy = isVertical ? height * 0.17 + floatY : height * 0.21 + floatY;
  const radius = (isVertical ? 40 : 44) * Math.min(1.05, enter) * pulse;

  if (radius < 4) return;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = clamp01(enter) * 0.92;

  // Soft warm optical glass medallion behind the illustrated story prop
  const halo = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius * 1.65);
  halo.addColorStop(0, 'rgba(229, 169, 60, 0.22)');
  halo.addColorStop(1, 'rgba(229, 169, 60, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.65, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(11, 13, 20, 0.68)';
  ctx.strokeStyle = accentColor || 'rgba(229, 169, 60, 0.55)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const s = radius / 42;
  ctx.scale(s, s);

  if (prop === 'book') {
    // Open storybook with turning page highlight
    const pageLift = Math.sin(globalTime * 2.8) * 3.5;
    ctx.fillStyle = '#F3E5C8';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.quadraticCurveTo(-12, -16, -22, -11);
    ctx.lineTo(-22, 13);
    ctx.quadraticCurveTo(-11, 9, 0, 15);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FAF2DE';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.quadraticCurveTo(12, -16 - pageLift * 0.4, 22, -11);
    ctx.lineTo(22, 13);
    ctx.quadraticCurveTo(11, 9, 0, 15);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#C98A3A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 15);
    ctx.stroke();
  } else if (prop === 'money') {
    // Stacked golden coins + rising shimmer
    for (let i = 0; i < 3; i++) {
      const yOff = 10 - i * 8;
      ctx.fillStyle = i === 2 ? '#F6C65B' : '#D49A3A';
      ctx.beginPath();
      ctx.ellipse(0, yOff, 17, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8F5F1A';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.fillStyle = '#FFF3C4';
    ctx.font = '700 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('৳', 0, -14 + Math.sin(globalTime * 3.4) * 2);
  } else if (prop === 'laptop') {
    // Sleek glowing laptop with animated code bars
    ctx.fillStyle = '#1E2A3B';
    ctx.strokeStyle = '#7CE0D3';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(-18, -14, 36, 22, 3);
    ctx.fill();
    ctx.stroke();

    const barPulse = 0.5 + 0.5 * Math.sin(globalTime * 4);
    ctx.fillStyle = '#50C8B8';
    ctx.fillRect(-13, -9, 14 + barPulse * 8, 3);
    ctx.fillStyle = '#F6C65B';
    ctx.fillRect(-13, -3, 18 - barPulse * 5, 3);
    ctx.fillStyle = '#9BC2EB';
    ctx.fillRect(-13, 3, 11 + barPulse * 6, 3);

    ctx.fillStyle = '#8E99AD';
    ctx.beginPath();
    ctx.roundRect(-23, 9, 46, 5, 2.5);
    ctx.fill();
  } else if (prop === 'phone') {
    // Glowing smartphone with gentle call wave
    ctx.fillStyle = '#192231';
    ctx.strokeStyle = '#9EC5FE';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(-11, -19, 22, 38, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#E5A93C';
    ctx.beginPath();
    ctx.arc(0, -3, 5 + speechEnergy * 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6EA8FE';
    ctx.fillRect(-6, 8, 12, 3);
  } else if (prop === 'tea') {
    // Steaming clay/ceramic tea cup
    ctx.fillStyle = '#D98E4E';
    ctx.beginPath();
    ctx.roundRect(-13, -4, 24, 18, [2, 2, 9, 9]);
    ctx.fill();
    ctx.strokeStyle = '#F2C185';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(11, 4, 5.5, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    // Rising steam wisps
    ctx.strokeStyle = 'rgba(255, 244, 224, 0.72)';
    ctx.lineWidth = 1.6;
    for (let i = -1; i <= 1; i++) {
      const sx = i * 6;
      const sway = Math.sin(globalTime * 3.2 + i) * 3;
      ctx.beginPath();
      ctx.moveTo(sx, -7);
      ctx.quadraticCurveTo(sx + sway, -14, sx - sway * 0.5, -21);
      ctx.stroke();
    }
  } else if (prop === 'umbrella') {
    // Sheltering monsoon umbrella
    ctx.fillStyle = '#4A8BB2';
    ctx.beginPath();
    ctx.arc(0, 2, 19, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#E5D5B5';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, -17);
    ctx.lineTo(0, 15);
    ctx.arc(-4, 15, 4, 0, Math.PI);
    ctx.stroke();
  } else if (prop === 'lantern') {
    // Warm flickering village hurricane lantern
    const flicker = 0.78 + 0.22 * Math.sin(globalTime * 9.5);
    ctx.strokeStyle = '#C9974B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -14, 6, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = `rgba(255, 206, 108, ${0.85 * flicker})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3B281A';
    ctx.fillRect(-10, 11, 20, 6);
    ctx.fillRect(-8, -14, 16, 4);
  } else if (prop === 'backpack') {
    // Student school backpack
    ctx.fillStyle = '#C86D4A';
    ctx.beginPath();
    ctx.roundRect(-14, -12, 28, 28, 7);
    ctx.fill();
    ctx.fillStyle = '#9E4F32';
    ctx.beginPath();
    ctx.roundRect(-10, 2, 20, 11, 3);
    ctx.fill();
    ctx.strokeStyle = '#F2C185';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -12, 6, Math.PI, 0);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Renders the Remotion-style kinetic narrative choreography overlays:
 * 1. Emotional atmosphere rim tint (subtle warm/cool tint aligned to the spoken emotion)
 * 2. Story-exact illustrated prop accent when a concrete prop is spoken about
 * 3. Smooth spring-animated chapter beat stinger during the opening 2s of each new chapter (16:9)
 */
export function renderStoryChoreographyOverlay(
  ctx: CanvasRenderingContext2D,
  input: StoryChoreographyInput
): void {
  const { scene, sceneTime, sceneDuration, globalTime, width, height, speechEnergy, isThumbnail } =
    input;
  const isVertical = height > width;

  // 1. Subtle emotion-aligned atmosphere lighting wash (makes sadness/joy/tension felt visually)
  if (scene.emotion === 'sad' || scene.emotion === 'worried') {
    ctx.save();
    const cool = ctx.createLinearGradient(0, 0, 0, height);
    cool.addColorStop(0, 'rgba(32, 62, 98, 0.14)');
    cool.addColorStop(1, 'rgba(12, 20, 36, 0.18)');
    ctx.fillStyle = cool;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  } else if (scene.emotion === 'emotional' || scene.emotion === 'inspiring' || scene.emotion === 'happy') {
    ctx.save();
    const warm = ctx.createRadialGradient(
      width * 0.5,
      height * 0.36,
      20,
      width * 0.5,
      height * 0.42,
      Math.max(width, height) * 0.65
    );
    warm.addColorStop(0, 'rgba(255, 212, 134, 0.09)');
    warm.addColorStop(1, 'rgba(255, 190, 96, 0)');
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  if (isThumbnail) return;

  // 2. Story-exact animated prop illustration when spoken text mentions a concrete object
  // (Skip when an expanded full-world motif already fills the sky)
  const hasBigWorldMotif =
    scene.motif === 'rocket-launch' ||
    scene.motif === 'sailing-ship' ||
    scene.motif === 'digital-network' ||
    scene.motif === 'growth-chart' ||
    scene.motif === 'stadium-ball' ||
    scene.motif === 'mountain-peak' ||
    scene.motif === 'train-express';

  if (scene.prop && scene.prop !== 'none' && !hasBigWorldMotif) {
    drawAnimatedStoryPropAccent(
      ctx,
      scene.prop,
      sceneTime,
      globalTime,
      width,
      height,
      speechEnergy,
      scene.accentColor
    );
  }

  // 3. Remotion-style spring chapter stinger on 16:9 during scene openings (non-blocking top-left editorial cue)
  if (!isVertical && sceneTime <= 2.35) {
    const stinger = computeChapterStingerState(sceneTime, sceneDuration);
    if (stinger.opacity > 0.02) {
      ctx.save();
      ctx.globalAlpha = stinger.opacity;
      const baseX = 48;
      const baseY = 52 + stinger.translateY;

      // Golden vertical accent bar
      ctx.fillStyle = scene.accentColor || '#E5A93C';
      ctx.fillRect(baseX, baseY, 3.5, 28 * stinger.lineProgress);

      // Bengali / Story beat title only (no SCENE / CH number)
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = '600 20px "Hind Siliguri", sans-serif';
      ctx.fillStyle = 'rgba(248, 246, 240, 0.95)';
      const shortBn = scene.titleBn.length > 36 ? `${scene.titleBn.slice(0, 36)}…` : scene.titleBn;
      ctx.fillText(shortBn, baseX + 14, baseY + 3);
      ctx.restore();
    }
  }
}
