import {
  CharacterRole,
  SceneSpec,
  TimeOfDay,
} from '../lib/storyCompiler';
import { DynamicStoryElement } from '../lib/storySceneDirector';
import { CharacterProfile } from '../lib/storyIntelligence';
import { VisemePose } from '../lib/visemeEngine';
import { clamp01, drawSky, drawSun, drawTree, lerp } from './drawHelpers';
import { drawLifelikeHuman, HumanPose } from './humanRig';
import { resolveSceneActorProfile } from './assetCanvasRenderer';
import { getPortraitSafeLayout, springValue } from './motionEngine';

function getCharacterPose(scene: SceneSpec): HumanPose {
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
    default:
      return 'standing-speak';
  }
}

function drawWorldCast(
  ctx: CanvasRenderingContext2D,
  scene: SceneSpec,
  sceneTime: number,
  globalTime: number,
  width: number,
  height: number,
  groundY: number,
  speechEnergy: number,
  portraitZoom: number,
  rimLight: string,
  characterProfiles?: CharacterProfile[],
  viseme?: VisemePose
): void {
  const safe = getPortraitSafeLayout(width, height, portraitZoom);
  const isVertical = safe.isVertical;
  const duration = Math.max(1, scene.endTime - scene.startTime);
  const progress = clamp01(sceneTime / duration);
  const enterSpring = Math.min(1, springValue(sceneTime, { stiffness: 135, damping: 18 }));
  const enterOffsetY = (1 - enterSpring) * 14;
  const seed = scene.visualSeed ?? 1;
  const dir: 1 | -1 = seed % 2 === 0 ? 1 : -1;

  const primaryRole: CharacterRole = scene.primaryCharacter ?? 'narrator';
  const secondaryRole: CharacterRole | null = scene.secondaryCharacter ?? null;
  const isSpeaking = speechEnergy > 0.11;
  const pose = getCharacterPose(scene);
  const unitScale = isVertical ? Math.min(1.48, 1.08 * safe.subjectScale) : 1.3;

  if (pose === 'portrait-speak') {
    drawLifelikeHuman(ctx, {
      x: safe.clampX(width * (scene.focalPointX ?? 0.5), 54),
      y: (isVertical ? height * 0.78 : height * 0.87) + enterOffsetY,
      scale: isVertical ? Math.min(2.05, 1.7 * safe.subjectScale) : 1.98,
      facing: dir,
      role: primaryRole,
      emotion: scene.emotion ?? 'calm',
      pose: 'portrait-speak',
      time: globalTime,
      speechEnergy,
      isSpeaking,
      viseme: isSpeaking ? viseme : undefined,
      prop: scene.prop ?? 'none',
      rimLightColor: rimLight,
      profile: resolveSceneActorProfile(characterProfiles, primaryRole, scene, 'primary'),
    });
    return;
  }

  let primaryX = safe.clampX(width * (scene.focalPointX ?? 0.5), 54);
  if (pose === 'walking' || pose === 'running') {
    const xA = safe.clampX(width * 0.28, 54);
    const xB = safe.clampX(width * 0.72, 54);
    primaryX = dir === 1 ? lerp(xA, xB, progress) : lerp(xB, xA, progress);
  } else if (secondaryRole || scene.secondaryCharacterAssetId) {
    primaryX = safe.clampX(isVertical ? width * 0.37 : width * 0.41, 52);
  }

  drawLifelikeHuman(ctx, {
    x: primaryX,
    y: groundY + enterOffsetY,
    scale: unitScale,
    facing: secondaryRole || scene.secondaryCharacterAssetId ? 1 : dir,
    role: primaryRole,
    emotion: scene.emotion ?? 'calm',
    pose,
    time: globalTime,
    speechEnergy,
    isSpeaking,
    viseme: isSpeaking ? viseme : undefined,
    prop: scene.prop ?? 'none',
    rimLightColor: rimLight,
    profile: resolveSceneActorProfile(characterProfiles, primaryRole, scene, 'primary'),
  });

  if (secondaryRole || scene.secondaryCharacterAssetId) {
    const secRole = secondaryRole ?? 'friend';
    const secX =
      pose === 'walking'
        ? safe.clampX(primaryX - dir * (isVertical ? 66 : 92), 46)
        : safe.clampX(isVertical ? width * 0.64 : width * 0.61, 52);
    drawLifelikeHuman(ctx, {
      x: secX,
      y: groundY + 2 + enterOffsetY,
      scale: unitScale * 0.95,
      facing: pose === 'walking' ? dir : -1,
      role: secRole,
      emotion: scene.emotion === 'sad' ? 'emotional' : 'calm',
      pose: pose === 'walking' ? 'walking' : pose === 'celebrating' ? 'celebrating' : 'listening',
      time: globalTime + 0.45,
      speechEnergy: 0,
      isSpeaking: false,
      rimLightColor: rimLight,
      profile: resolveSceneActorProfile(characterProfiles, secRole, scene, 'secondary'),
    });
  }
}

function getAtmosphericSky(timeOfDay: TimeOfDay, variant: 'forest' | 'desert' | 'winter' | 'battle' | 'village'): Array<[number, string]> {
  if (variant === 'desert') {
    if (timeOfDay === 'night') return [[0, '#090D1E'], [0.55, '#1A2442'], [1, '#2D354F']];
    return [[0, '#2B1F36'], [0.32, '#8F4838'], [0.68, '#DF8B44'], [1, '#F6CA7E']];
  }
  if (variant === 'winter') {
    if (timeOfDay === 'night') return [[0, '#091322'], [0.55, '#192F48'], [1, '#2C4966']];
    return [[0, '#284561'], [0.46, '#648CA8'], [0.8, '#B8D4E4'], [1, '#E6F2F8']];
  }
  if (variant === 'battle') {
    return [[0, '#160B10'], [0.36, '#4B1D1F'], [0.7, '#9C3E2B'], [1, '#E08843']];
  }
  if (variant === 'forest') {
    if (timeOfDay === 'night') return [[0, '#071117'], [0.55, '#10242B'], [1, '#1B3A39']];
    if (timeOfDay === 'sunset') return [[0, '#1C2234'], [0.45, '#594248'], [0.8, '#B8724B'], [1, '#E2A96B']];
    return [[0, '#1C3F44'], [0.45, '#3E756B'], [0.8, '#8FB996'], [1, '#D2E2B8']];
  }
  // village
  if (timeOfDay === 'night') return [[0, '#0B1020'], [0.55, '#19223A'], [1, '#26263A']];
  if (timeOfDay === 'morning' || timeOfDay === 'dawn') return [[0, '#2B4C73'], [0.48, '#8EB4CE'], [0.82, '#F0CAA0'], [1, '#F9E1BC']];
  return [[0, '#1D1E38'], [0.35, '#663B4D'], [0.68, '#CC6F44'], [1, '#F5C473']];
}

/**
 * 1. Deep Forest & Wildlife Trail (`forest-wild`)
 */
function renderForestWild(
  ctx: CanvasRenderingContext2D,
  scene: SceneSpec,
  sceneTime: number,
  globalTime: number,
  width: number,
  height: number,
  speechEnergy: number,
  portraitZoom: number,
  characterProfiles?: CharacterProfile[],
  viseme?: VisemePose
): void {
  const isVertical = height > width;
  const horizonY = Math.round(height * (isVertical ? 0.54 : 0.6));
  const groundY = Math.round(height * (isVertical ? 0.78 : 0.85));
  drawSky(ctx, getAtmosphericSky(scene.timeOfDay, 'forest'), width, height);

  // Volumetric forest shafts
  for (let i = 0; i < 4; i++) {
    const bx = width * (0.14 + i * 0.24) + Math.sin(globalTime * 0.4 + i) * 18;
    const beam = ctx.createLinearGradient(bx, 0, bx + 90, groundY);
    beam.addColorStop(0, scene.timeOfDay === 'night' ? 'rgba(170, 214, 240, 0.14)' : 'rgba(255, 244, 198, 0.16)');
    beam.addColorStop(1, 'rgba(255, 244, 198, 0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(bx - 24, 0);
    ctx.lineTo(bx + 36, 0);
    ctx.lineTo(bx + 140, groundY);
    ctx.lineTo(bx + 20, groundY);
    ctx.closePath();
    ctx.fill();
  }

  // Far pine ridge silhouette
  ctx.fillStyle = scene.timeOfDay === 'night' ? '#0C1E1E' : '#1E3D31';
  ctx.beginPath();
  ctx.moveTo(0, horizonY + 12);
  for (let x = 0; x <= width + 36; x += 36) {
    const h = 38 + ((x * 19 + (scene.visualSeed ?? 3)) % 46);
    ctx.lineTo(x, horizonY - h);
    ctx.lineTo(x + 18, horizonY + 4);
  }
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // Forest floor & dirt trail
  const floorGrad = ctx.createLinearGradient(0, horizonY, 0, height);
  floorGrad.addColorStop(0, scene.timeOfDay === 'night' ? '#122620' : '#264930');
  floorGrad.addColorStop(1, '#0D1C14');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, horizonY, width, height - horizonY);

  ctx.fillStyle = scene.timeOfDay === 'night' ? '#2A2520' : '#6A523B';
  ctx.beginPath();
  ctx.moveTo(width * 0.42, horizonY + 10);
  ctx.lineTo(width * 0.58, horizonY + 10);
  ctx.lineTo(width * 0.88, height);
  ctx.lineTo(width * 0.12, height);
  ctx.closePath();
  ctx.fill();

  // Grazing deer silhouette in background clearing
  const deerX = width * (isVertical ? 0.78 : 0.76) + Math.sin(globalTime * 0.5) * 6;
  const deerY = horizonY + 34;
  ctx.save();
  ctx.translate(deerX, deerY);
  ctx.fillStyle = scene.timeOfDay === 'night' ? '#172926' : '#3B2C1E';
  ctx.beginPath();
  ctx.ellipse(0, -14, 18, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-12, -8, 3.5, 16);
  ctx.fillRect(8, -8, 3.5, 16);
  // Head & antlers
  ctx.beginPath();
  ctx.ellipse(16, -26, 6, 4.5, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(14, -29);
  ctx.lineTo(10, -40);
  ctx.moveTo(18, -29);
  ctx.lineTo(24, -40);
  ctx.stroke();
  ctx.restore();

  // Towering flanking forest trees
  const treeScale = isVertical ? 0.92 : 1.05;
  drawTree(ctx, width * 0.1, horizonY + 46, treeScale, globalTime, '#143222', '#2B5B3A', '#2B1B12');
  drawTree(ctx, width * 0.9, horizonY + 48, treeScale * 1.05, globalTime + 1.1, '#143222', '#2B5B3A', '#2B1B12');

  // Optional warm campfire glow at night
  if (scene.timeOfDay === 'night' || scene.sceneElements?.includes('campfire')) {
    const fx = width * (isVertical ? 0.26 : 0.24);
    const fy = groundY - 12;
    const flick = 0.88 + Math.sin(globalTime * 11) * 0.12;
    const fireGlow = ctx.createRadialGradient(fx, fy - 12, 4, fx, fy - 12, 92 * flick);
    fireGlow.addColorStop(0, 'rgba(255, 206, 108, 0.72)');
    fireGlow.addColorStop(0.5, 'rgba(235, 106, 38, 0.26)');
    fireGlow.addColorStop(1, 'rgba(235, 106, 38, 0)');
    ctx.fillStyle = fireGlow;
    ctx.beginPath();
    ctx.arc(fx, fy - 12, 92 * flick, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FF9F38';
    ctx.beginPath();
    ctx.moveTo(fx - 12, fy);
    ctx.quadraticCurveTo(fx, fy - 34 * flick, fx + 12, fy);
    ctx.closePath();
    ctx.fill();
  }

  drawWorldCast(ctx, scene, sceneTime, globalTime, width, height, groundY, speechEnergy, portraitZoom, 'rgba(180, 232, 165, 0.42)', characterProfiles, viseme);
}

/**
 * 2. Golden Desert Dunes & Caravan (`desert-dunes`)
 */
function renderDesertDunes(
  ctx: CanvasRenderingContext2D,
  scene: SceneSpec,
  sceneTime: number,
  globalTime: number,
  width: number,
  height: number,
  speechEnergy: number,
  portraitZoom: number,
  characterProfiles?: CharacterProfile[],
  viseme?: VisemePose
): void {
  const isVertical = height > width;
  const horizonY = Math.round(height * (isVertical ? 0.52 : 0.58));
  const groundY = Math.round(height * (isVertical ? 0.78 : 0.85));
  drawSky(ctx, getAtmosphericSky(scene.timeOfDay, 'desert'), width, height);

  if (scene.timeOfDay === 'night') {
    ctx.fillStyle = '#FFF3D1';
    ctx.beginPath();
    ctx.arc(width * 0.76, height * 0.18, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0D142A';
    ctx.beginPath();
    ctx.arc(width * 0.76 + 11, height * 0.18 - 5, 24, 0, Math.PI * 2);
    ctx.fill();
  } else {
    drawSun(ctx, width * 0.66, horizonY - 42, isVertical ? 50 : 64, '#FFF2C6', 'rgba(255, 190, 96, 0.52)');
  }

  // Far layered sand dunes
  const duneColors =
    scene.timeOfDay === 'night'
      ? ['#2A2B42', '#1F2034', '#161726']
      : ['#C57A3D', '#A9602D', '#7C411F'];
  for (let d = 0; d < 3; d++) {
    const baseY = horizonY + d * 42;
    ctx.fillStyle = duneColors[d];
    ctx.beginPath();
    ctx.moveTo(0, baseY + 18);
    ctx.quadraticCurveTo(width * (0.28 + d * 0.08), baseY - 46 + d * 12, width * 0.56, baseY + 8);
    ctx.quadraticCurveTo(width * 0.82, baseY - 34 + d * 8, width, baseY + 16);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
  }

  // Distant animated camel caravan on dune ridge
  const caravanBaseX = ((globalTime * 14) % (width + 180)) - 90;
  for (let c = 0; c < 3; c++) {
    const cx = caravanBaseX - c * 46;
    const cy = horizonY + 4 + Math.sin((cx / width) * Math.PI * 2) * 8;
    ctx.fillStyle = scene.timeOfDay === 'night' ? '#0D0E18' : '#4C2412';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 8, 12, 7, 0, 0, Math.PI * 2);
    ctx.arc(cx - 2, cy - 15, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - 8, cy - 3, 2.5, 11);
    ctx.fillRect(cx + 5, cy - 3, 2.5, 11);
    ctx.fillRect(cx + 9, cy - 16, 3, 10);
  }

  // Swaying oasis palm silhouettes on edge
  const palmX = width * 0.14;
  const palmY = horizonY + 44;
  const sway = Math.sin(globalTime * 1.4) * 5;
  ctx.strokeStyle = '#3F2314';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(palmX, palmY + 26);
  ctx.quadraticCurveTo(palmX - 8, palmY - 32, palmX + sway, palmY - 82);
  ctx.stroke();
  ctx.fillStyle = '#2B4A2E';
  for (let f = -2; f <= 2; f++) {
    ctx.beginPath();
    ctx.ellipse(palmX + sway + f * 16, palmY - 82 + Math.abs(f) * 6, 22, 5, f * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  drawWorldCast(ctx, scene, sceneTime, globalTime, width, height, groundY, speechEnergy, portraitZoom, 'rgba(255, 206, 126, 0.56)', characterProfiles, viseme);
}

/**
 * 3. Courtroom & Hall of Justice (`court-justice`)
 */
function renderCourtJustice(
  ctx: CanvasRenderingContext2D,
  scene: SceneSpec,
  sceneTime: number,
  globalTime: number,
  width: number,
  height: number,
  speechEnergy: number,
  portraitZoom: number,
  characterProfiles?: CharacterProfile[],
  viseme?: VisemePose
): void {
  const isVertical = height > width;
  const floorY = Math.round(height * (isVertical ? 0.72 : 0.78));
  drawSky(ctx, [[0, '#1B1614'], [0.5, '#2A201B'], [1, '#1A1411']], width, height);

  // Tall neoclassical arched windows with warm afternoon shafts
  const winCount = isVertical ? 2 : 3;
  for (let i = 0; i < winCount; i++) {
    const wx = width * ((i + 1) / (winCount + 1));
    ctx.fillStyle = '#E8D1A3';
    ctx.beginPath();
    ctx.roundRect(wx - 34, height * 0.12, 68, height * 0.42, [34, 34, 4, 4]);
    ctx.fill();

    const shaft = ctx.createLinearGradient(wx, height * 0.14, wx + 60, floorY);
    shaft.addColorStop(0, 'rgba(255, 226, 166, 0.22)');
    shaft.addColorStop(1, 'rgba(255, 226, 166, 0)');
    ctx.fillStyle = shaft;
    ctx.beginPath();
    ctx.moveTo(wx - 32, height * 0.14);
    ctx.lineTo(wx + 32, height * 0.14);
    ctx.lineTo(wx + 120, floorY);
    ctx.lineTo(wx - 40, floorY);
    ctx.closePath();
    ctx.fill();
  }

  // Wood paneled columns & Judge's bench
  ctx.fillStyle = '#3C271B';
  for (const px of [width * 0.08, width * 0.92]) {
    ctx.fillRect(px - 22, 0, 44, floorY);
  }
  ctx.fillStyle = '#4B3021';
  ctx.fillRect(width * 0.2, height * 0.52, width * 0.6, floorY - height * 0.52);
  ctx.fillStyle = '#6A442D';
  ctx.fillRect(width * 0.18, height * 0.5, width * 0.64, 16);

  // Golden Scales of Justice emblem above bench
  const sx = width * 0.5;
  const sy = height * 0.28;
  const tilt = Math.sin(globalTime * 1.4) * 0.08;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.strokeStyle = '#E5A93C';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.lineTo(0, 32);
  ctx.moveTo(-22, 32);
  ctx.lineTo(22, 32);
  ctx.stroke();
  ctx.rotate(tilt);
  ctx.beginPath();
  ctx.moveTo(-42, -16);
  ctx.lineTo(42, -16);
  ctx.stroke();
  for (const side of [-42, 42]) {
    ctx.beginPath();
    ctx.moveTo(side, -16);
    ctx.lineTo(side - 10, 6);
    ctx.lineTo(side + 10, 6);
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();

  // Polished marble floor
  ctx.fillStyle = '#241C18';
  ctx.fillRect(0, floorY, width, height - floorY);

  drawWorldCast(ctx, scene, sceneTime, globalTime, width, height, Math.round(height * (isVertical ? 0.8 : 0.86)), speechEnergy, portraitZoom, 'rgba(248, 212, 146, 0.45)', characterProfiles, viseme);
}

/**
 * 4. Festival Lights & Celebration (`festival-celebration`)
 */
function renderFestivalCelebration(
  ctx: CanvasRenderingContext2D,
  scene: SceneSpec,
  sceneTime: number,
  globalTime: number,
  width: number,
  height: number,
  speechEnergy: number,
  portraitZoom: number,
  characterProfiles?: CharacterProfile[],
  viseme?: VisemePose
): void {
  const isVertical = height > width;
  const groundY = Math.round(height * (isVertical ? 0.78 : 0.85));
  drawSky(ctx, [[0, '#0D0B1F'], [0.5, '#251738'], [1, '#3D2234']], width, height);

  // Animated blooming fireworks in sky
  for (let f = 0; f < 3; f++) {
    const cycle = (globalTime * 0.55 + f * 0.34) % 1;
    const fx = width * (0.22 + f * 0.28);
    const fy = height * (0.18 + (f % 2) * 0.11);
    const radius = cycle * (isVertical ? 62 : 78);
    const alpha = Math.max(0, 1 - cycle * 1.15);
    const colors = ['#FFD166', '#FF6B8A', '#7CE8C4'];
    ctx.strokeStyle = colors[f % colors.length];
    ctx.globalAlpha = alpha * 0.85;
    ctx.lineWidth = 2.2;
    for (let r = 0; r < 12; r++) {
      const a = (r / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(fx + Math.cos(a) * radius * 0.35, fy + Math.sin(a) * radius * 0.35);
      ctx.lineTo(fx + Math.cos(a) * radius, fy + Math.sin(a) * radius);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Festive hanging fairy lights & marigold festoons
  for (let row = 0; row < 2; row++) {
    const y0 = height * (0.12 + row * 0.13);
    ctx.strokeStyle = 'rgba(255, 224, 150, 0.45)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, y0);
    ctx.quadraticCurveTo(width * 0.5, y0 + 54, width, y0);
    ctx.stroke();

    const bulbs = 14;
    for (let b = 1; b < bulbs; b++) {
      const t = b / bulbs;
      const bx = width * t;
      const by = y0 + 4 * t * (1 - t) * 54;
      const pulse = 0.7 + 0.3 * Math.sin(globalTime * 4 + b + row);
      const col = b % 3 === 0 ? '255, 198, 92' : b % 3 === 1 ? '255, 128, 146' : '255, 240, 178';
      const glow = ctx.createRadialGradient(bx, by, 1, bx, by, 16 * pulse);
      glow.addColorStop(0, `rgba(${col}, 0.95)`);
      glow.addColorStop(1, `rgba(${col}, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(bx, by, 16 * pulse, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Festive courtyard floor
  ctx.fillStyle = '#241826';
  ctx.fillRect(0, height * 0.64, width, height * 0.36);

  drawWorldCast(ctx, scene, sceneTime, globalTime, width, height, groundY, speechEnergy, portraitZoom, 'rgba(255, 212, 130, 0.62)', characterProfiles, viseme);
}

/**
 * 5. Misty Moonlit Mystery Alley (`mystery-night`)
 */
function renderMysteryNight(
  ctx: CanvasRenderingContext2D,
  scene: SceneSpec,
  sceneTime: number,
  globalTime: number,
  width: number,
  height: number,
  speechEnergy: number,
  portraitZoom: number,
  characterProfiles?: CharacterProfile[],
  viseme?: VisemePose
): void {
  const isVertical = height > width;
  const horizonY = Math.round(height * (isVertical ? 0.56 : 0.62));
  const groundY = Math.round(height * (isVertical ? 0.79 : 0.86));
  drawSky(ctx, [[0, '#050711'], [0.48, '#10182E'], [1, '#1B253E']], width, height);

  // Full luminous moon with eerie halo
  const mx = width * 0.74;
  const my = height * 0.19;
  const moonHalo = ctx.createRadialGradient(mx, my, 18, mx, my, 120);
  moonHalo.addColorStop(0, 'rgba(220, 234, 255, 0.52)');
  moonHalo.addColorStop(0.5, 'rgba(126, 152, 210, 0.16)');
  moonHalo.addColorStop(1, 'rgba(126, 152, 210, 0)');
  ctx.fillStyle = moonHalo;
  ctx.beginPath();
  ctx.arc(mx, my, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#EEF5FF';
  ctx.beginPath();
  ctx.arc(mx, my, isVertical ? 28 : 34, 0, Math.PI * 2);
  ctx.fill();

  // Old Victorian/colonial alley silhouettes flanking left & right
  ctx.fillStyle = '#0D1220';
  ctx.fillRect(0, height * 0.16, width * 0.24, horizonY - height * 0.16 + 40);
  ctx.fillRect(width * 0.78, height * 0.22, width * 0.22, horizonY - height * 0.22 + 40);
  // Distant lone lit mystery window
  ctx.fillStyle = 'rgba(244, 192, 92, 0.78)';
  ctx.fillRect(width * 0.12, height * 0.34, 18, 28);

  // Wet cobblestone road
  ctx.fillStyle = '#121622';
  ctx.fillRect(0, horizonY, width, height - horizonY);

  // Flickering wrought-iron gas lantern
  const lx = width * 0.24;
  const ly = horizonY - 120;
  const flick = 0.85 + 0.15 * Math.sin(globalTime * 7.5);
  ctx.strokeStyle = '#1B2230';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(lx, horizonY + 18);
  ctx.lineTo(lx, ly);
  ctx.lineTo(lx + 22, ly);
  ctx.stroke();

  const lampGlow = ctx.createRadialGradient(lx + 22, ly + 8, 3, lx + 22, ly + 8, 95 * flick);
  lampGlow.addColorStop(0, 'rgba(255, 224, 140, 0.78)');
  lampGlow.addColorStop(0.5, 'rgba(229, 169, 60, 0.22)');
  lampGlow.addColorStop(1, 'rgba(229, 169, 60, 0)');
  ctx.fillStyle = lampGlow;
  ctx.beginPath();
  ctx.arc(lx + 22, ly + 8, 95 * flick, 0, Math.PI * 2);
  ctx.fill();

  // Rolling ground fog
  for (let i = 0; i < 4; i++) {
    const fx = ((globalTime * (14 + i * 4) + i * 280) % (width + 360)) - 180;
    const fy = horizonY + 35 + i * 24;
    const fog = ctx.createRadialGradient(fx, fy, 12, fx, fy, 200);
    fog.addColorStop(0, 'rgba(182, 204, 232, 0.16)');
    fog.addColorStop(1, 'rgba(182, 204, 232, 0)');
    ctx.fillStyle = fog;
    ctx.beginPath();
    ctx.ellipse(fx, fy, 210, 48, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawWorldCast(ctx, scene, sceneTime, globalTime, width, height, groundY, speechEnergy, portraitZoom, 'rgba(164, 198, 255, 0.52)', characterProfiles, viseme);
}

/**
 * 6. Grand Library & Reading Desk (`library-study`)
 */
function renderLibraryStudy(
  ctx: CanvasRenderingContext2D,
  scene: SceneSpec,
  sceneTime: number,
  globalTime: number,
  width: number,
  height: number,
  speechEnergy: number,
  portraitZoom: number,
  characterProfiles?: CharacterProfile[],
  viseme?: VisemePose
): void {
  const isVertical = height > width;
  const floorY = Math.round(height * (isVertical ? 0.74 : 0.8));
  drawSky(ctx, [[0, '#18110E'], [0.55, '#261A14'], [1, '#1A120E']], width, height);

  // Tall mahogany bookshelves filled with colorful book spines
  const shelfCols = isVertical ? 3 : 5;
  const bookPalette = ['#8D3B32', '#3B5C78', '#3F6B4E', '#A87932', '#6C4B6E', '#7D5435'];
  for (let c = 0; c < shelfCols; c++) {
    const sx = (width / shelfCols) * c + 12;
    const sw = width / shelfCols - 24;
    ctx.fillStyle = '#2B1B13';
    ctx.fillRect(sx, height * 0.08, sw, floorY - height * 0.08);
    for (let r = 0; r < 5; r++) {
      const sy = height * 0.12 + r * ((floorY - height * 0.16) / 5);
      ctx.fillStyle = '#4B3020';
      ctx.fillRect(sx, sy + 28, sw, 6);
      let bx = sx + 6;
      let idx = c * 17 + r * 7;
      while (bx < sx + sw - 14) {
        const bw = 9 + (idx % 7);
        const bh = 22 + (idx % 8);
        ctx.fillStyle = bookPalette[idx % bookPalette.length];
        ctx.fillRect(bx, sy + 28 - bh, bw, bh);
        bx += bw + 2;
        idx++;
      }
    }
  }

  // Warm reading lamp pool
  const lampX = width * 0.5;
  const lampY = height * 0.42;
  const pool = ctx.createRadialGradient(lampX, lampY, 12, lampX, lampY, width * 0.45);
  pool.addColorStop(0, 'rgba(255, 212, 128, 0.28)');
  pool.addColorStop(0.6, 'rgba(229, 169, 60, 0.08)');
  pool.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = pool;
  ctx.fillRect(0, 0, width, height);

  // Warm wooden reading floor
  ctx.fillStyle = '#231712';
  ctx.fillRect(0, floorY, width, height - floorY);

  drawWorldCast(ctx, scene, sceneTime, globalTime, width, height, Math.round(height * (isVertical ? 0.8 : 0.86)), speechEnergy, portraitZoom, 'rgba(255, 214, 138, 0.54)', characterProfiles, viseme);
}

/**
 * 7. Suspension Bridge & Highway (`highway-bridge`)
 */
function renderHighwayBridge(
  ctx: CanvasRenderingContext2D,
  scene: SceneSpec,
  sceneTime: number,
  globalTime: number,
  width: number,
  height: number,
  speechEnergy: number,
  portraitZoom: number,
  characterProfiles?: CharacterProfile[],
  viseme?: VisemePose
): void {
  const isVertical = height > width;
  const waterY = Math.round(height * (isVertical ? 0.5 : 0.54));
  const roadY = Math.round(height * (isVertical ? 0.62 : 0.66));
  const groundY = Math.round(height * (isVertical ? 0.79 : 0.86));

  drawSky(ctx, getAtmosphericSky(scene.timeOfDay, 'village'), width, height);

  // Distant city skyline across river
  ctx.fillStyle = scene.timeOfDay === 'night' ? '#141A2C' : '#35384B';
  for (let i = 0; i < 18; i++) {
    const bw = width / 18;
    const bh = 28 + ((i * 37) % 66);
    ctx.fillRect(i * bw, waterY - bh, bw - 3, bh);
  }

  // Shimmering water below bridge
  const wGrad = ctx.createLinearGradient(0, waterY, 0, roadY);
  wGrad.addColorStop(0, scene.timeOfDay === 'night' ? '#16253C' : '#6A7B96');
  wGrad.addColorStop(1, '#121D2D');
  ctx.fillStyle = wGrad;
  ctx.fillRect(0, waterY, width, roadY - waterY);

  // Suspension Bridge Towers & Sweeping Cables
  const towerXs = [width * 0.24, width * 0.76];
  ctx.strokeStyle = '#C9CDD8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, roadY - 20);
  ctx.quadraticCurveTo(width * 0.12, roadY - 60, towerXs[0], height * 0.22);
  ctx.quadraticCurveTo(width * 0.5, roadY - 36, towerXs[1], height * 0.22);
  ctx.quadraticCurveTo(width * 0.88, roadY - 60, width, roadY - 20);
  ctx.stroke();

  ctx.fillStyle = '#394052';
  for (const tx of towerXs) {
    ctx.fillRect(tx - 10, height * 0.2, 20, roadY - height * 0.2);
  }

  // Highway deck + animated moving cars / headlight streaks
  ctx.fillStyle = '#252934';
  ctx.fillRect(0, roadY, width, height - roadY);

  for (let c = 0; c < 4; c++) {
    const speed = 135 + c * 32;
    const cx = ((globalTime * speed + c * 290) % (width + 200)) - 100;
    const cy = roadY + 26 + (c % 2) * 24;
    ctx.fillStyle = c % 2 === 0 ? '#D95D4E' : '#4C7FB5';
    ctx.beginPath();
    ctx.roundRect(cx, cy - 16, 48, 16, 5);
    ctx.fill();
    // Glowing headlight beam
    const hl = ctx.createLinearGradient(cx + 48, cy - 8, cx + 110, cy - 8);
    hl.addColorStop(0, 'rgba(255, 240, 180, 0.55)');
    hl.addColorStop(1, 'rgba(255, 240, 180, 0)');
    ctx.fillStyle = hl;
    ctx.beginPath();
    ctx.moveTo(cx + 48, cy - 12);
    ctx.lineTo(cx + 110, cy - 22);
    ctx.lineTo(cx + 110, cy + 4);
    ctx.lineTo(cx + 48, cy - 4);
    ctx.closePath();
    ctx.fill();
  }

  drawWorldCast(ctx, scene, sceneTime, globalTime, width, height, groundY, speechEnergy, portraitZoom, 'rgba(255, 212, 146, 0.48)', characterProfiles, viseme);
}

/**
 * 8. Village Courtyard & Thatched Cottage (`village-cottage`)
 */
function renderVillageCottage(
  ctx: CanvasRenderingContext2D,
  scene: SceneSpec,
  sceneTime: number,
  globalTime: number,
  width: number,
  height: number,
  speechEnergy: number,
  portraitZoom: number,
  characterProfiles?: CharacterProfile[],
  viseme?: VisemePose
): void {
  const isVertical = height > width;
  const horizonY = Math.round(height * (isVertical ? 0.54 : 0.58));
  const groundY = Math.round(height * (isVertical ? 0.78 : 0.85));
  drawSky(ctx, getAtmosphericSky(scene.timeOfDay, 'village'), width, height);

  if (scene.timeOfDay !== 'night') {
    drawSun(ctx, width * 0.72, horizonY - 28, isVertical ? 44 : 54, '#FFF2C8', 'rgba(255, 192, 98, 0.46)');
  }

  // Golden paddy meadow & village courtyard
  const fieldGrad = ctx.createLinearGradient(0, horizonY, 0, height);
  fieldGrad.addColorStop(0, scene.timeOfDay === 'night' ? '#1B2D22' : '#6A8344');
  fieldGrad.addColorStop(0.55, scene.timeOfDay === 'night' ? '#241E19' : '#7A6147');
  fieldGrad.addColorStop(1, '#2D221A');
  ctx.fillStyle = fieldGrad;
  ctx.fillRect(0, horizonY, width, height - horizonY);

  // Authentic Bengal Mud/Thatch Cottage (কুঁড়েঘর) on left-midground
  const hx = width * (isVertical ? 0.14 : 0.16);
  const hy = horizonY + 58;
  const hw = isVertical ? 148 : 210;
  const hh = isVertical ? 84 : 108;

  // Cottage wall
  ctx.fillStyle = '#B89B78';
  ctx.fillRect(hx, hy - hh, hw, hh);
  // Warm glowing doorway
  ctx.fillStyle = '#2B1A12';
  ctx.fillRect(hx + hw * 0.36, hy - hh * 0.65, hw * 0.24, hh * 0.65);
  const doorGlow = ctx.createRadialGradient(hx + hw * 0.48, hy - hh * 0.36, 4, hx + hw * 0.48, hy - hh * 0.36, 56);
  doorGlow.addColorStop(0, 'rgba(255, 206, 114, 0.75)');
  doorGlow.addColorStop(1, 'rgba(255, 180, 72, 0)');
  ctx.fillStyle = doorGlow;
  ctx.fillRect(hx + hw * 0.2, hy - hh * 0.75, hw * 0.6, hh * 0.75);

  // Curved thatched roof (চাল)
  ctx.fillStyle = '#7C5832';
  ctx.beginPath();
  ctx.moveTo(hx - 22, hy - hh + 8);
  ctx.quadraticCurveTo(hx + hw * 0.5, hy - hh - 62, hx + hw + 22, hy - hh + 8);
  ctx.closePath();
  ctx.fill();

  // Sprawling banyan tree on right
  drawTree(ctx, width * 0.86, horizonY + 52, isVertical ? 0.92 : 1.15, globalTime, '#1E4226', '#3A6B39', '#382518');

  drawWorldCast(ctx, scene, sceneTime, globalTime, width, height, groundY, speechEnergy, portraitZoom, 'rgba(255, 208, 130, 0.52)', characterProfiles, viseme);
}

/**
 * 9. Winter Snow Valley & Cabin (`snow-valley`)
 */
function renderSnowValley(
  ctx: CanvasRenderingContext2D,
  scene: SceneSpec,
  sceneTime: number,
  globalTime: number,
  width: number,
  height: number,
  speechEnergy: number,
  portraitZoom: number,
  characterProfiles?: CharacterProfile[],
  viseme?: VisemePose
): void {
  const isVertical = height > width;
  const horizonY = Math.round(height * (isVertical ? 0.54 : 0.58));
  const groundY = Math.round(height * (isVertical ? 0.78 : 0.85));
  drawSky(ctx, getAtmosphericSky(scene.timeOfDay, 'winter'), width, height);

  // Snow-capped peaks
  ctx.fillStyle = '#9BB8CC';
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  ctx.lineTo(width * 0.24, horizonY - 120);
  ctx.lineTo(width * 0.48, horizonY - 26);
  ctx.lineTo(width * 0.72, horizonY - 140);
  ctx.lineTo(width, horizonY - 14);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // Snow valley floor
  const snowGrad = ctx.createLinearGradient(0, horizonY, 0, height);
  snowGrad.addColorStop(0, '#DCEAF4');
  snowGrad.addColorStop(1, '#9CB5C9');
  ctx.fillStyle = snowGrad;
  ctx.fillRect(0, horizonY, width, height - horizonY);

  // Cozy wooden cabin with warm glowing window
  const cx = width * 0.72;
  const cy = horizonY + 42;
  ctx.fillStyle = '#4B3224';
  ctx.fillRect(cx - 48, cy - 52, 96, 52);
  ctx.fillStyle = '#EEF6FC';
  ctx.beginPath();
  ctx.moveTo(cx - 58, cy - 48);
  ctx.lineTo(cx, cy - 84);
  ctx.lineTo(cx + 58, cy - 48);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#FFCE6B';
  ctx.fillRect(cx - 26, cy - 36, 20, 18);
  ctx.fillRect(cx + 8, cy - 36, 20, 18);

  // Snow-dusted pine trees
  for (const px of [width * 0.12, width * 0.22, width * 0.9]) {
    ctx.fillStyle = '#244248';
    ctx.beginPath();
    ctx.moveTo(px, horizonY - 68);
    ctx.lineTo(px - 28, horizonY + 34);
    ctx.lineTo(px + 28, horizonY + 34);
    ctx.closePath();
    ctx.fill();
  }

  drawWorldCast(ctx, scene, sceneTime, globalTime, width, height, groundY, speechEnergy, portraitZoom, 'rgba(216, 238, 255, 0.56)', characterProfiles, viseme);
}

/**
 * 10. Historic Battlefield & Banners (`battle-camp`)
 */
function renderBattleCamp(
  ctx: CanvasRenderingContext2D,
  scene: SceneSpec,
  sceneTime: number,
  globalTime: number,
  width: number,
  height: number,
  speechEnergy: number,
  portraitZoom: number,
  characterProfiles?: CharacterProfile[],
  viseme?: VisemePose
): void {
  const isVertical = height > width;
  const horizonY = Math.round(height * (isVertical ? 0.55 : 0.6));
  const groundY = Math.round(height * (isVertical ? 0.79 : 0.85));
  drawSky(ctx, getAtmosphericSky(scene.timeOfDay, 'battle'), width, height);

  // Smoky sunset ridge
  ctx.fillStyle = '#2A1416';
  ctx.beginPath();
  ctx.moveTo(0, horizonY + 8);
  ctx.quadraticCurveTo(width * 0.35, horizonY - 48, width * 0.68, horizonY - 12);
  ctx.lineTo(width, horizonY - 34);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // Waving battle banners in the wind
  for (const bx of [width * 0.18, width * 0.82]) {
    ctx.strokeStyle = '#3B231A';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(bx, horizonY + 26);
    ctx.lineTo(bx, horizonY - 120);
    ctx.stroke();

    const wave = Math.sin(globalTime * 4.2 + bx) * 10;
    ctx.fillStyle = '#B8332A';
    ctx.beginPath();
    ctx.moveTo(bx, horizonY - 118);
    ctx.quadraticCurveTo(bx + 36, horizonY - 110 + wave, bx + 66, horizonY - 104 - wave * 0.6);
    ctx.lineTo(bx + 54, horizonY - 82 - wave * 0.4);
    ctx.lineTo(bx, horizonY - 76);
    ctx.closePath();
    ctx.fill();
  }

  // Earthy ground
  ctx.fillStyle = '#1B1110';
  ctx.fillRect(0, horizonY + 20, width, height - horizonY);

  drawWorldCast(ctx, scene, sceneTime, globalTime, width, height, groundY, speechEnergy, portraitZoom, 'rgba(255, 168, 88, 0.64)', characterProfiles, viseme);
}

/**
 * Renders any of the 10 newly added story worlds. Returns true if handled.
 */
export function renderExtraWorld(
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
    case 'forest-wild':
      renderForestWild(ctx, scene, sceneTime, globalTime, width, height, speechEnergy, portraitZoom, characterProfiles, viseme);
      return true;
    case 'desert-dunes':
      renderDesertDunes(ctx, scene, sceneTime, globalTime, width, height, speechEnergy, portraitZoom, characterProfiles, viseme);
      return true;
    case 'court-justice':
      renderCourtJustice(ctx, scene, sceneTime, globalTime, width, height, speechEnergy, portraitZoom, characterProfiles, viseme);
      return true;
    case 'festival-celebration':
      renderFestivalCelebration(ctx, scene, sceneTime, globalTime, width, height, speechEnergy, portraitZoom, characterProfiles, viseme);
      return true;
    case 'mystery-night':
      renderMysteryNight(ctx, scene, sceneTime, globalTime, width, height, speechEnergy, portraitZoom, characterProfiles, viseme);
      return true;
    case 'library-study':
      renderLibraryStudy(ctx, scene, sceneTime, globalTime, width, height, speechEnergy, portraitZoom, characterProfiles, viseme);
      return true;
    case 'highway-bridge':
      renderHighwayBridge(ctx, scene, sceneTime, globalTime, width, height, speechEnergy, portraitZoom, characterProfiles, viseme);
      return true;
    case 'village-cottage':
      renderVillageCottage(ctx, scene, sceneTime, globalTime, width, height, speechEnergy, portraitZoom, characterProfiles, viseme);
      return true;
    case 'snow-valley':
      renderSnowValley(ctx, scene, sceneTime, globalTime, width, height, speechEnergy, portraitZoom, characterProfiles, viseme);
      return true;
    case 'battle-camp':
      renderBattleCamp(ctx, scene, sceneTime, globalTime, width, height, speechEnergy, portraitZoom, characterProfiles, viseme);
      return true;
    default:
      return false;
  }
}

/**
 * Renders animated story-specific dynamic elements (birds, drifting blossoms, rising lanterns,
 * moon glow) extracted directly from the scene's spoken Bengali/English words.
 */
export function renderDynamicStoryElements(
  ctx: CanvasRenderingContext2D,
  elements: DynamicStoryElement[] | undefined,
  globalTime: number,
  width: number,
  height: number,
  visualSeed = 1
): void {
  if (!elements || elements.length === 0) return;

  ctx.save();
  if (elements.includes('birds')) {
    ctx.strokeStyle = 'rgba(28, 32, 42, 0.65)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const bx = ((globalTime * (34 + i * 7) + i * 190 + (visualSeed % 120)) % (width + 80)) - 40;
      const by = height * (0.14 + (i % 3) * 0.06) + Math.sin(globalTime * 2.4 + i) * 10;
      const flap = Math.sin(globalTime * 7.5 + i * 1.4) * 6;
      ctx.beginPath();
      ctx.moveTo(bx - 10, by - flap);
      ctx.quadraticCurveTo(bx - 4, by - 4, bx, by);
      ctx.quadraticCurveTo(bx + 4, by - 4, bx + 10, by - flap);
      ctx.stroke();
    }
  }

  if (elements.includes('flowers')) {
    for (let i = 0; i < 14; i++) {
      const px = ((i * 113 + globalTime * (18 + (i % 4) * 5)) % (width + 40)) - 20;
      const py = ((i * 79 + globalTime * (22 + (i % 3) * 6)) % (height * 0.85)) + 10;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 184, 198, 0.62)' : 'rgba(255, 224, 146, 0.56)';
      ctx.beginPath();
      ctx.ellipse(px, py, 5, 2.5, globalTime + i, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (elements.includes('lantern') && !elements.includes('fireworks')) {
    for (let i = 0; i < 3; i++) {
      const lx = width * (0.18 + i * 0.32) + Math.sin(globalTime * 0.7 + i) * 14;
      const ly = height * 0.28 - ((globalTime * 12 + i * 42) % 90);
      const glow = ctx.createRadialGradient(lx, ly, 2, lx, ly, 22);
      glow.addColorStop(0, 'rgba(255, 214, 128, 0.65)');
      glow.addColorStop(1, 'rgba(255, 178, 68, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(lx, ly, 22, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
