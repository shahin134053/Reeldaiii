import {
  CharacterRole,
  EmotionTone,
  SceneSpec,
  TimeOfDay,
  VisualStyle,
  WeatherType,
} from '../lib/storyCompiler';
import { CharacterProfile } from '../lib/storyIntelligence';
import { VisemePose } from '../lib/visemeEngine';
import { ColorPaletteId } from '../lib/redesignAndStudio';
import {
  clamp01,
  lerp,
  smoothstep,
  drawSky,
  drawSun,
  drawClouds,
  drawTownSilhouette,
  drawTree,
  drawSchoolGate,
  drawRickshaw,
  drawMonsoonRain,
} from './drawHelpers';
import { drawLifelikeHuman, HumanPose } from './humanRig';
import {
  renderAtmosphericEffects,
  renderExpandedWorld,
  renderScrollStopperOverlays,
  renderStoryMotifOverlay,
  renderVisualStyleGrade,
} from './cinematicWorlds';
import { renderDynamicStoryElements, renderExtraWorld } from './extraWorlds';
import { resolveSceneActorProfile } from './assetCanvasRenderer';
import { computeCameraTransform, getPortraitSafeLayout, PortraitSafeLayout, springValue } from './motionEngine';

function getSkyPalette(timeOfDay: TimeOfDay): Array<[number, string]> {
  switch (timeOfDay) {
    case 'dawn':
      return [
        [0, '#16223A'],
        [0.4, '#364A6C'],
        [0.72, '#A26D6E'],
        [1, '#E8AB7E'],
      ];
    case 'morning':
      return [
        [0, '#4C7BA6'],
        [0.44, '#9DC3DC'],
        [0.76, '#F4D4A4'],
        [1, '#F8E3BE'],
      ];
    case 'afternoon':
      return [
        [0, '#5E8AB2'],
        [0.48, '#B8D0DF'],
        [0.8, '#ECCE9F'],
        [1, '#F4DFB8'],
      ];
    case 'storm':
      return [
        [0, '#141E29'],
        [0.48, '#263646'],
        [0.82, '#3C4F60'],
        [1, '#4C6070'],
      ];
    case 'sunset':
      return [
        [0, '#1A2038'],
        [0.34, '#5B3951'],
        [0.66, '#C86D4A'],
        [0.88, '#ECA554'],
        [1, '#F6CE7B'],
      ];
    case 'night':
      return [
        [0, '#0D111C'],
        [0.5, '#192133'],
        [1, '#1E1A24'],
      ];
  }
}

function getRimLight(timeOfDay: TimeOfDay): string {
  switch (timeOfDay) {
    case 'dawn':
      return 'rgba(248, 184, 134, 0.42)';
    case 'sunset':
      return 'rgba(255, 198, 108, 0.52)';
    case 'storm':
      return 'rgba(156, 202, 236, 0.34)';
    case 'night':
      return 'rgba(255, 224, 152, 0.38)';
    default:
      return 'rgba(255, 240, 200, 0.36)';
  }
}

function drawRiverBoat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  time: number,
  role: CharacterRole,
  emotion: EmotionTone,
  speechEnergy: number,
  viseme?: VisemePose
): void {
  const bob = Math.sin(time * 2.3) * 3.5 * scale;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(scale, scale);

  // Water reflection shadow
  ctx.fillStyle = 'rgba(10, 22, 32, 0.34)';
  ctx.beginPath();
  ctx.ellipse(0, 14, 96, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Expressive passenger seated gently inside boat
  drawLifelikeHuman(ctx, {
    x: -18,
    y: 4,
    scale: 0.72,
    facing: 1,
    role,
    emotion,
    pose: 'sitting-floor',
    time,
    speechEnergy,
    isSpeaking: speechEnergy > 0.14,
    viseme: speechEnergy > 0.14 ? viseme : undefined,
  });

  // Curved wooden hull
  ctx.fillStyle = '#3B2518';
  ctx.beginPath();
  ctx.moveTo(-98, -6);
  ctx.quadraticCurveTo(0, 28, 102, -10);
  ctx.lineTo(80, 12);
  ctx.quadraticCurveTo(0, 24, -78, 10);
  ctx.closePath();
  ctx.fill();

  // Bamboo canopy (ছই)
  ctx.fillStyle = '#9E7346';
  ctx.beginPath();
  ctx.moveTo(-42, -6);
  ctx.quadraticCurveTo(-8, -56, 30, -6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#6E4B28';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Boatman at stern with animated oar
  drawLifelikeHuman(ctx, {
    x: 62,
    y: 6,
    scale: 0.68,
    facing: -1,
    role: 'father',
    emotion: 'calm',
    pose: 'sitting-floor',
    time,
    speechEnergy: 0,
    isSpeaking: false,
  });

  const oarAngle = Math.sin(time * 2.1) * 0.28;
  ctx.save();
  ctx.translate(64, -10);
  ctx.rotate(oarAngle);
  ctx.strokeStyle = '#5B3E26';
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(-8, -14);
  ctx.lineTo(26, 38);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

/**
 * Renders any analyzed SceneSpec natively at ANY canvas dimension (16:9 or 9:16),
 * with lifelike articulated human characters synced to real voiceover speech energy.
 */
export function renderProceduralScene(
  ctx: CanvasRenderingContext2D,
  scene: SceneSpec,
  sceneTime: number,
  globalTime: number,
  width: number,
  height: number,
  speechEnergy = 0,
  visualStyle?: VisualStyle,
  portraitZoom = 1.38,
  characterProfiles?: CharacterProfile[],
  colorPalette?: ColorPaletteId,
  parallaxDepth = 1.0,
  viseme?: VisemePose
): void {
  const safe = getPortraitSafeLayout(width, height, portraitZoom);
  const isVertical = safe.isVertical;
  const duration = Math.max(1, scene.endTime - scene.startTime);
  const progress = clamp01(sceneTime / duration);

  const primaryRole: CharacterRole = scene.primaryCharacter ?? 'narrator';
  const secondaryRole: CharacterRole | null = scene.secondaryCharacter ?? null;
  const emotion: EmotionTone = scene.emotion ?? 'calm';
  const rimLight = getRimLight(scene.timeOfDay);
  const isSpeaking = speechEnergy > 0.12;

  const isExpanded =
    scene.setting === 'space-cosmos' ||
    scene.setting === 'ocean-voyage' ||
    scene.setting === 'mountain-summit' ||
    scene.setting === 'train-journey' ||
    scene.setting === 'tech-ai-lab' ||
    scene.setting === 'finance-growth' ||
    scene.setting === 'sports-arena' ||
    scene.setting === 'ancient-palace' ||
    scene.setting === 'stage-spotlight';

  // Remotion-inspired spring camera choreography + safe 9:16 portrait subject framing (zero edge clipping)
  const cam = computeCameraTransform({
    width,
    height,
    sceneTime,
    sceneDuration: duration,
    globalTime,
    cameraMotion: scene.cameraMotion ?? (scene.cameraShot === 'tracking-pan' ? 'tracking' : 'dolly-in'),
    cameraShot: scene.cameraShot ?? 'medium-two-shot',
    focalPointX: scene.focalPointX ?? 0.5,
    portraitZoom: isExpanded ? Math.max(1.0, 1 + (portraitZoom - 1) * 0.45) : portraitZoom,
    speechEnergy,
    isOpeningScene: scene.startTime <= 0.1,
    isDramaticBeat:
      scene.weather === 'heavy-storm' ||
      scene.setting === 'space-cosmos' ||
      scene.emotion === 'angry',
  });

  const parallaxPanX = cam.panX * Math.max(0, Math.min(1.6, parallaxDepth));

  ctx.save();
  ctx.translate(cam.anchorX + cam.panX, cam.anchorY + cam.panY);
  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-cam.anchorX, -cam.anchorY);

  // 1. Expanded Cinematic Worlds (Space, Ocean, Mountain, Train, Tech AI, Finance, Sports, Palace, Stage)
  if (renderExpandedWorld(ctx, scene, sceneTime, globalTime, width, height, speechEnergy, portraitZoom, characterProfiles, viseme)) {
    renderDynamicStoryElements(ctx, scene.sceneElements, globalTime, width, height, scene.visualSeed);
    renderAtmosphericEffects(ctx, scene.weather, scene.timeOfDay, globalTime, width, height, speechEnergy);
    ctx.save();
    ctx.translate(parallaxPanX * 0.45, 0);
    renderScrollStopperOverlays(ctx, width, height, globalTime, speechEnergy, cam.hookBloom, scene.accentColor);
    ctx.restore();
    renderVisualStyleGrade(ctx, visualStyle, width, height, colorPalette);
    ctx.restore();
    return;
  }

  // 1B. 10 New Narrative Worlds (Forest, Desert, Courtroom, Festival, Mystery, Library, Highway Bridge, Village Cottage, Snow Valley, Battle Camp)
  if (renderExtraWorld(ctx, scene, sceneTime, globalTime, width, height, speechEnergy, portraitZoom, characterProfiles, viseme)) {
    renderDynamicStoryElements(ctx, scene.sceneElements, globalTime, width, height, scene.visualSeed);
    renderAtmosphericEffects(ctx, scene.weather, scene.timeOfDay, globalTime, width, height, speechEnergy);
    renderStoryMotifOverlay(ctx, scene.motif, globalTime, width, height, speechEnergy);
    ctx.save();
    ctx.translate(parallaxPanX * 0.45, 0);
    renderScrollStopperOverlays(ctx, width, height, globalTime, speechEnergy, cam.hookBloom, scene.accentColor);
    ctx.restore();
    renderVisualStyleGrade(ctx, visualStyle, width, height, colorPalette);
    ctx.restore();
    return;
  }

  // 2. Dedicated Interior Environments
  if (scene.setting === 'home-night') {
    renderInteriorHome(ctx, scene, sceneTime, globalTime, width, height, isVertical, safe, primaryRole, secondaryRole, emotion, speechEnergy, rimLight, characterProfiles, viseme);
    renderStoryMotifOverlay(ctx, scene.motif, globalTime, width, height, speechEnergy);
    renderScrollStopperOverlays(ctx, width, height, globalTime, speechEnergy, cam.hookBloom, scene.accentColor);
    renderVisualStyleGrade(ctx, visualStyle, width, height, colorPalette);
    ctx.restore();
    return;
  }
  if (scene.setting === 'classroom') {
    renderInteriorClassroom(ctx, scene, sceneTime, globalTime, width, height, isVertical, safe, primaryRole, secondaryRole, emotion, speechEnergy, rimLight, characterProfiles, viseme);
    renderStoryMotifOverlay(ctx, scene.motif, globalTime, width, height, speechEnergy);
    renderScrollStopperOverlays(ctx, width, height, globalTime, speechEnergy, cam.hookBloom, scene.accentColor);
    renderVisualStyleGrade(ctx, visualStyle, width, height, colorPalette);
    ctx.restore();
    return;
  }
  if (scene.setting === 'office-studio') {
    renderInteriorOffice(ctx, scene, sceneTime, globalTime, width, height, isVertical, safe, primaryRole, secondaryRole, emotion, speechEnergy, rimLight, characterProfiles, viseme);
    renderStoryMotifOverlay(ctx, scene.motif, globalTime, width, height, speechEnergy);
    renderScrollStopperOverlays(ctx, width, height, globalTime, speechEnergy, cam.hookBloom, scene.accentColor);
    renderVisualStyleGrade(ctx, visualStyle, width, height, colorPalette);
    ctx.restore();
    return;
  }
  if (scene.setting === 'hospital-care') {
    renderInteriorHospital(ctx, scene, sceneTime, globalTime, width, height, isVertical, safe, primaryRole, secondaryRole, emotion, speechEnergy, rimLight, characterProfiles, viseme);
    renderStoryMotifOverlay(ctx, scene.motif, globalTime, width, height, speechEnergy);
    renderScrollStopperOverlays(ctx, width, height, globalTime, speechEnergy, cam.hookBloom, scene.accentColor);
    renderVisualStyleGrade(ctx, visualStyle, width, height, colorPalette);
    ctx.restore();
    return;
  }

  // Outdoor Environments (safe responsive framing on 9:16 portrait)
  const horizonY = isVertical ? Math.round(height * 0.53) : Math.round(height * 0.60);
  const roadTopY = horizonY + (isVertical ? 34 : 30);
  const subjectY = isVertical ? Math.round(height * 0.77) : Math.round(height * 0.85);
  const unitScale = isVertical ? Math.min(1.42, 1.04 * safe.subjectScale) : 1.26;

  // 1. Sky
  drawSky(ctx, getSkyPalette(scene.timeOfDay), width, height);

  // 2. Celestial lighting
  if (scene.timeOfDay === 'night') {
    ctx.fillStyle = '#FFF5D9';
    ctx.beginPath();
    ctx.arc(width * 0.78, height * 0.16, isVertical ? 26 : 30, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 36; i++) {
      const sx = ((i * 97 + 31) % (width - 40)) + 20;
      const sy = ((i * 53 + 23) % Math.round(horizonY * 0.75)) + 20;
      const twinkle = 0.35 + 0.55 * Math.sin(globalTime * 2 + i);
      ctx.fillStyle = `rgba(255, 248, 224, ${twinkle})`;
      ctx.beginPath();
      ctx.arc(sx, sy, (i % 2) + 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (scene.timeOfDay === 'dawn') {
    drawSun(ctx, width * 0.72, horizonY - 22, 42, '#FFE3B0', 'rgba(244, 165, 102, 0.38)');
    ctx.fillStyle = '#FFF5D9';
    ctx.beginPath();
    ctx.arc(width * 0.22, height * 0.15, 19, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#243554';
    ctx.beginPath();
    ctx.arc(width * 0.22 + 8, height * 0.15 - 4, 16, 0, Math.PI * 2);
    ctx.fill();
  } else if (scene.timeOfDay === 'sunset') {
    drawSun(ctx, width * 0.5, horizonY - 32, isVertical ? 54 : 62, '#FFF2C8', 'rgba(255, 186, 86, 0.52)');
  } else if (scene.timeOfDay !== 'storm') {
    drawSun(ctx, width * 0.76, height * 0.2, 36, '#FFF7DE', 'rgba(255, 206, 118, 0.45)');
  }

  // 3. Clouds
  const cloudColor =
    scene.timeOfDay === 'storm'
      ? 'rgba(24, 32, 42, 0.82)'
      : scene.timeOfDay === 'sunset'
        ? 'rgba(255, 206, 146, 0.36)'
        : scene.timeOfDay === 'night'
          ? 'rgba(34, 44, 66, 0.5)'
          : 'rgba(255, 248, 234, 0.7)';

  ctx.save();
  // Far-sky multi-layer parallax drift opposite to foreground camera pan
  ctx.translate(-parallaxPanX * 0.65, 0);
  drawClouds(ctx, globalTime, cloudColor, isVertical ? 5 : 6, height * 0.08, horizonY * 0.58, scene.timeOfDay === 'storm' ? 22 : 9);
  ctx.restore();

  // 4. Setting Background Layer
  const silhouetteColor =
    scene.timeOfDay === 'sunset'
      ? '#2C1F2B'
      : scene.timeOfDay === 'dawn'
        ? '#252E44'
        : scene.timeOfDay === 'storm'
          ? '#222F3D'
          : scene.timeOfDay === 'night'
            ? '#121726'
            : '#8697AA';

  const scroll =
    scene.action === 'rickshaw-ride' || scene.action === 'boat-glide' || scene.action === 'walking-away'
      ? sceneTime * 48
      : 0;

  if (scene.setting === 'river-village') {
    // Distant hills & green treeline
    ctx.fillStyle = scene.timeOfDay === 'sunset' ? '#2A332A' : '#3B6340';
    ctx.fillRect(0, horizonY - 22, width, 28);
    drawTree(ctx, width * 0.14, horizonY + 4, 0.72, globalTime, '#254A2C', '#3F7040', '#2E2018');
    drawTree(ctx, width * 0.86, horizonY + 6, 0.78, globalTime, '#254A2C', '#3F7040', '#2E2018');

    // Shimmering river
    const riverGrad = ctx.createLinearGradient(0, horizonY, 0, height);
    if (scene.timeOfDay === 'sunset') {
      riverGrad.addColorStop(0, '#D48252');
      riverGrad.addColorStop(0.5, '#6B434F');
      riverGrad.addColorStop(1, '#241B29');
    } else if (scene.timeOfDay === 'storm') {
      riverGrad.addColorStop(0, '#364A5B');
      riverGrad.addColorStop(1, '#1A2734');
    } else {
      riverGrad.addColorStop(0, '#6BA3C4');
      riverGrad.addColorStop(0.55, '#467FA2');
      riverGrad.addColorStop(1, '#26506D');
    }
    ctx.fillStyle = riverGrad;
    ctx.fillRect(0, horizonY, width, height - horizonY);

    ctx.strokeStyle = 'rgba(255, 245, 224, 0.25)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      const rx = ((i * 140 - globalTime * 28) % (width + 140) + (width + 140)) % (width + 140) - 70;
      const ry = horizonY + 34 + (i % 5) * Math.round((height - horizonY) * 0.13);
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + 46, ry);
      ctx.stroke();
    }

    if (scene.action === 'boat-glide') {
      const boatX = safe.clampX(lerp(safe.safeLeft + 74, safe.safeRight - 74, progress), 78);
      drawRiverBoat(ctx, boatX, subjectY - 56, unitScale * 0.92, globalTime, primaryRole, emotion, speechEnergy, viseme);
    } else {
      // Mud riverbank foreground with expressive standing/walking human
      ctx.fillStyle = '#3B4D36';
      ctx.beginPath();
      ctx.moveTo(0, subjectY - 40);
      ctx.quadraticCurveTo(width * 0.5, subjectY - 70, width, subjectY - 30);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();
      drawSceneHumans(ctx, scene, sceneTime, globalTime, width, height, subjectY, unitScale, progress, primaryRole, secondaryRole, emotion, speechEnergy, isSpeaking, rimLight, isVertical, safe, characterProfiles, viseme);
    }
  } else if (scene.setting === 'park-nature') {
    // Rolling hills + sunny park meadow + warm pathway
    ctx.fillStyle = scene.timeOfDay === 'sunset' ? '#363235' : '#58825E';
    ctx.beginPath();
    ctx.moveTo(0, horizonY + 12);
    ctx.quadraticCurveTo(width * 0.28, horizonY - 48, width * 0.62, horizonY - 8);
    ctx.quadraticCurveTo(width * 0.84, horizonY - 34, width, horizonY + 6);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    const grassGrad = ctx.createLinearGradient(0, horizonY, 0, height);
    grassGrad.addColorStop(0, scene.timeOfDay === 'sunset' ? '#3B422E' : '#4E7B47');
    grassGrad.addColorStop(1, scene.timeOfDay === 'sunset' ? '#1E231D' : '#2C4A2B');
    ctx.fillStyle = grassGrad;
    ctx.fillRect(0, horizonY, width, height - horizonY);

    // Park walkway
    ctx.fillStyle = scene.timeOfDay === 'sunset' ? '#5A4A42' : '#B9A88F';
    ctx.beginPath();
    ctx.moveTo(width * 0.34, horizonY + 12);
    ctx.lineTo(width * 0.66, horizonY + 12);
    ctx.lineTo(width * 0.96, height);
    ctx.lineTo(width * 0.04, height);
    ctx.closePath();
    ctx.fill();

    // Lush framing park trees + warm wooden bench safely inside frame
    drawTree(ctx, safe.clampX(width * 0.14, 24), horizonY + 42, unitScale * 0.86, globalTime, '#234C2C', '#487F46', '#3A261A', '#E58E52');
    drawTree(ctx, safe.clampX(width * 0.86, 24), horizonY + 46, unitScale * 0.88, globalTime, '#234C2C', '#487F46', '#3A261A');

    // Park bench
    const benchW = isVertical ? 96 : 120;
    const benchX = safe.clampX(width * 0.66, benchW * 0.5) - benchW * 0.5;
    ctx.fillStyle = '#5D3C24';
    ctx.fillRect(benchX, subjectY - 68, benchW, 12);
    ctx.fillRect(benchX, subjectY - 46, benchW, 10);
    ctx.fillStyle = '#2B2B30';
    ctx.fillRect(benchX + 10, subjectY - 68, 7, 46);
    ctx.fillRect(benchX + benchW - 16, subjectY - 68, 7, 46);

    drawSceneHumans(ctx, scene, sceneTime, globalTime, width, height, subjectY, unitScale, progress, primaryRole, secondaryRole, emotion, speechEnergy, isSpeaking, rimLight, isVertical, safe, characterProfiles, viseme);
  } else {
    // Town / Mosque / School / Bazaar / Tea Stall / Evening Road
    drawTownSilhouette(ctx, horizonY, silhouetteColor, scroll * 0.25, scene.setting === 'fajr-mosque' || scene.setting === 'school-street');

    if (scene.setting === 'school-street' || scene.setting === 'monsoon-rain') {
      drawSchoolGate(
        ctx,
        safe.clampX(isVertical ? width * 0.58 : width * 0.76, 62),
        horizonY + 24,
        isVertical ? 0.64 : 0.74,
        scene.timeOfDay === 'storm'
      );
    }

    // Grass verge & road
    ctx.fillStyle =
      scene.timeOfDay === 'sunset'
        ? '#261D23'
        : scene.timeOfDay === 'storm'
          ? '#293D38'
          : scene.timeOfDay === 'night'
            ? '#17221E'
            : '#4D6E43';
    ctx.fillRect(0, horizonY, width, roadTopY - horizonY + 8);

    const roadGrad = ctx.createLinearGradient(0, roadTopY, 0, height);
    if (scene.timeOfDay === 'storm' || scene.weather === 'rain' || scene.weather === 'heavy-storm') {
      roadGrad.addColorStop(0, '#2E3F4E');
      roadGrad.addColorStop(1, '#16222E');
    } else if (scene.timeOfDay === 'sunset') {
      roadGrad.addColorStop(0, '#36262C');
      roadGrad.addColorStop(1, '#120E14');
    } else {
      roadGrad.addColorStop(0, '#56555A');
      roadGrad.addColorStop(1, '#29292E');
    }
    ctx.fillStyle = roadGrad;
    ctx.fillRect(0, roadTopY, width, height - roadTopY);

    // Road markings
    ctx.strokeStyle = 'rgba(244, 232, 202, 0.26)';
    ctx.lineWidth = 3.5;
    for (let i = -1; i < 12; i++) {
      const dx = ((i * 125 - scroll * 1.1) % (width + 125) + (width + 125)) % (width + 125) - 60;
      ctx.beginPath();
      ctx.moveTo(dx, roadTopY + (height - roadTopY) * 0.42);
      ctx.lineTo(dx + 50, roadTopY + (height - roadTopY) * 0.42);
      ctx.stroke();
    }

    if (scene.setting === 'tea-stall') {
      const stallScale = isVertical ? 0.68 : 0.96;
      const stallX = isVertical ? safe.safeLeft + 8 : width * 0.08;
      drawSimpleTeaStall(ctx, stallX, roadTopY + 14, stallScale, globalTime);
    } else if (scene.setting === 'market-bazaar') {
      const awScale = isVertical ? 0.64 : 0.95;
      drawBazaarAwning(ctx, safe.safeLeft + 6, roadTopY + 14, awScale);
      drawBazaarAwning(ctx, Math.min(safe.safeRight - 216 * awScale, width * 0.66), roadTopY + 14, awScale * 0.95);
    } else if (scene.setting === 'city-evening' && (scene.timeOfDay === 'sunset' || scene.timeOfDay === 'night')) {
      drawWarmStreetLamp(ctx, safe.clampX(width * 0.16, 20), roadTopY + 14, isVertical ? 0.86 : 1.0, 1);
      drawWarmStreetLamp(ctx, safe.clampX(width * 0.84, 20), roadTopY + 14, isVertical ? 0.86 : 1.0, -1);
    }

    // Framing Trees
    const foliageDark = scene.timeOfDay === 'sunset' ? '#201821' : '#284D2E';
    const foliageLight = scene.timeOfDay === 'sunset' ? '#31232C' : '#457445';
    drawTree(ctx, safe.clampX(width * 0.09, 20), roadTopY + 6, unitScale * 0.78, globalTime, foliageDark, foliageLight, '#332218', scene.setting === 'school-street' ? '#D8432E' : undefined);
    drawTree(ctx, safe.clampX(width * 0.91, 20), roadTopY + 8, unitScale * 0.74, globalTime, foliageDark, foliageLight, '#332218');

    // Primary Characters & Action
    const isWet = scene.weather === 'rain' || scene.weather === 'heavy-storm';

    if (scene.action === 'rickshaw-ride') {
      const rickshawScale = unitScale * 0.86;
      const halfRickshawW = Math.round(148 * rickshawScale);
      const minRx = safe.safeLeft + halfRickshawW + (isVertical ? 6 : 28);
      const maxRx = safe.safeRight - halfRickshawW - (isVertical ? 6 : 28);
      const rx = minRx >= maxRx ? safe.centerX : safe.clampX(lerp(minRx, maxRx, progress), halfRickshawW);
      drawRickshaw(ctx, {
        x: rx,
        y: subjectY,
        scale: rickshawScale,
        facing: 1,
        wheelAngle: sceneTime * 4.2,
        pedalPhase: sceneTime * 4.2,
        hoodUp: true,
        hasGamchhaOnSeat: true,
        hasPolytheneOnSeat: true,
        isWet,
        showFather: true,
        fatherState: isWet ? 'drenched' : 'pedaling',
        showRafiSeated: true,
      });
    } else {
      drawSceneHumans(ctx, scene, sceneTime, globalTime, width, height, subjectY, unitScale, progress, primaryRole, secondaryRole, emotion, speechEnergy, isSpeaking, rimLight, isVertical, safe, characterProfiles, viseme);
    }
  }

  // 5. Weather Layers & Story Motif + Dynamic Story Elements + Visual Style Grade
  renderDynamicStoryElements(ctx, scene.sceneElements, globalTime, width, height, scene.visualSeed);
  renderWeatherOverlay(ctx, scene.weather, globalTime, width, height, roadTopY);
  renderAtmosphericEffects(ctx, scene.weather, scene.timeOfDay, globalTime, width, height, speechEnergy);
  renderStoryMotifOverlay(ctx, scene.motif, globalTime, width, height, speechEnergy);

  // 6. Calligraphic Quote Card for Quote Epilogue scenes
  if (scene.setting === 'quote-epilogue' || scene.action === 'quote-card') {
    const cardAlpha = smoothstep(0.35, 1.4, sceneTime);
    if (cardAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = cardAlpha;
      const cardW = Math.min(width - 72, 760);
      const cardH = isVertical ? 186 : 144;
      const cardX = (width - cardW) / 2;
      const cardY = isVertical ? height * 0.14 : height * 0.11;

      ctx.fillStyle = 'rgba(12, 10, 16, 0.68)';
      ctx.strokeStyle = 'rgba(229, 169, 60, 0.52)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#E5A93C';
      ctx.font = '500 15px "Hind Siliguri", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(scene.titleEn, width / 2, cardY + 36);

      ctx.fillStyle = '#FAF4E8';
      ctx.font = `700 ${isVertical ? 23 : 27}px "Noto Serif Bengali", serif`;
      const quote = scene.headlineText || scene.titleBn;
      const displayQuote = quote.length > 44 ? `${quote.slice(0, 44)}…` : quote;
      ctx.fillText(displayQuote, width / 2, cardY + (isVertical ? 94 : 84));

      ctx.fillStyle = '#D5C7B0';
      ctx.font = '400 14px "Hind Siliguri", sans-serif';
      const sub = scene.summary.length > 68 ? `${scene.summary.slice(0, 68)}…` : scene.summary;
      ctx.fillText(sub, width / 2, cardY + (isVertical ? 138 : 118));
      ctx.restore();
    }
  }

  ctx.save();
  // Foreground optical bokeh shifts faster for 2.5D parallax depth
  ctx.translate(parallaxPanX * 0.55, 0);
  renderScrollStopperOverlays(ctx, width, height, globalTime, speechEnergy, cam.hookBloom, scene.accentColor);
  ctx.restore();
  renderVisualStyleGrade(ctx, visualStyle, width, height, colorPalette);
  ctx.restore();
}

function drawSceneHumans(
  ctx: CanvasRenderingContext2D,
  scene: SceneSpec,
  sceneTime: number,
  globalTime: number,
  width: number,
  height: number,
  subjectY: number,
  unitScale: number,
  progress: number,
  primaryRole: CharacterRole,
  secondaryRole: CharacterRole | null,
  emotion: EmotionTone,
  speechEnergy: number,
  isSpeaking: boolean,
  rimLight: string,
  isVertical: boolean,
  safe: PortraitSafeLayout,
  characterProfiles?: CharacterProfile[],
  viseme?: VisemePose
): void {
  const isWet = scene.weather === 'rain' || scene.weather === 'heavy-storm';
  const enterSpring = Math.min(1, springValue(sceneTime, { stiffness: 135, damping: 18 }));
  const enterOffsetY = (1 - enterSpring) * 14;
  const pProf = resolveSceneActorProfile(characterProfiles, primaryRole, scene, 'primary');
  const sProf = (secondaryRole || scene.secondaryCharacterAssetId)
    ? resolveSceneActorProfile(characterProfiles, secondaryRole ?? 'friend', scene, 'secondary')
    : undefined;

  // Close-up expressive storytelling portrait (shows realistic human face, blinking, lip-sync & hand gestures up close!)
  if (scene.cameraShot === 'close-up-portrait' && (scene.action === 'speaking-narrator' || scene.action === 'quote-card')) {
    const portraitScale = isVertical ? Math.min(2.1, 1.75 * safe.subjectScale) : 2.05;
    const anchorY = isVertical ? height * 0.77 : height * 0.86;
    drawLifelikeHuman(ctx, {
      x: safe.centerX,
      y: anchorY + enterOffsetY,
      scale: portraitScale,
      facing: 1,
      role: primaryRole,
      emotion,
      pose: 'portrait-speak',
      time: globalTime,
      speechEnergy,
      isSpeaking,
      viseme: isSpeaking ? viseme : undefined,
      isWet,
      prop: scene.prop ?? 'none',
      rimLightColor: rimLight,
      profile: pProf,
    });
    return;
  }

  if (scene.action === 'walking-away') {
    const walkDir: 1 | -1 = (scene.visualSeed ?? 0) % 2 === 1 ? -1 : 1;
    const startX = safe.clampX(width * (walkDir === 1 ? 0.28 : 0.72), 54);
    const endX = safe.clampX(width * (walkDir === 1 ? 0.72 : 0.28), 54);
    const walkX = lerp(startX, endX, progress);
    drawLifelikeHuman(ctx, {
      x: walkX,
      y: subjectY + enterOffsetY,
      scale: unitScale,
      facing: walkDir,
      role: primaryRole,
      emotion,
      pose: 'walking',
      time: globalTime,
      speechEnergy,
      isSpeaking,
      viseme: isSpeaking ? viseme : undefined,
      isWet,
      prop: scene.prop ?? 'none',
      rimLightColor: rimLight,
      profile: pProf,
    });
    if (secondaryRole) {
      drawLifelikeHuman(ctx, {
        x: safe.clampX(walkX - walkDir * (isVertical ? 68 : 96), 44),
        y: subjectY - 6 + enterOffsetY,
        scale: unitScale * 0.94,
        facing: walkDir,
        role: secondaryRole,
        emotion: 'calm',
        pose: 'walking',
        time: globalTime + 0.4,
        speechEnergy: 0,
        isSpeaking: false,
        isWet,
        rimLightColor: rimLight,
        profile: sProf,
      });
    }
    return;
  }

  if (scene.action === 'running-rain') {
    const runX = safe.clampX(lerp(width * 0.22, width * 0.46, clamp01(progress * 1.45)), 52);
    drawLifelikeHuman(ctx, {
      x: runX,
      y: subjectY + 4 + enterOffsetY,
      scale: unitScale,
      facing: 1,
      role: primaryRole,
      emotion,
      pose: progress < 0.72 ? 'running' : 'standing-speak',
      time: globalTime,
      speechEnergy,
      isSpeaking,
      viseme: isSpeaking ? viseme : undefined,
      isWet: true,
      prop: scene.prop ?? 'umbrella',
      rimLightColor: rimLight,
      profile: pProf,
    });
    if (secondaryRole) {
      drawLifelikeHuman(ctx, {
        x: safe.clampX(width * 0.68, 52),
        y: subjectY + 2 + enterOffsetY,
        scale: unitScale * 0.98,
        facing: -1,
        role: secondaryRole,
        emotion: 'emotional',
        pose: 'standing-speak',
        time: globalTime,
        speechEnergy: speechEnergy * 0.5,
        isSpeaking: false,
        isWet: true,
        prop: 'money',
        rimLightColor: rimLight,
        profile: sProf,
      });
    }
    return;
  }

  if (scene.action === 'conversation' || scene.action === 'family-together') {
    const leftX = safe.clampX(isVertical ? width * 0.36 : width * 0.40, 50);
    const rightX = safe.clampX(isVertical ? width * 0.64 : width * 0.62, 50);
    const turnToggle = Math.floor(sceneTime / 4) % 2 === 0;
    drawLifelikeHuman(ctx, {
      x: leftX,
      y: subjectY + enterOffsetY,
      scale: unitScale * (isVertical ? 0.98 : 1.06),
      facing: 1,
      role: primaryRole,
      emotion,
      pose: turnToggle ? 'standing-speak' : 'listening',
      time: globalTime,
      speechEnergy,
      isSpeaking: turnToggle && isSpeaking,
      viseme: turnToggle && isSpeaking ? viseme : undefined,
      isWet,
      prop: scene.prop ?? 'none',
      rimLightColor: rimLight,
      profile: pProf,
    });
    drawLifelikeHuman(ctx, {
      x: rightX,
      y: subjectY + 2 + enterOffsetY,
      scale: unitScale * (isVertical ? 0.96 : 1.04),
      facing: -1,
      role: secondaryRole ?? 'friend',
      emotion: emotion === 'sad' ? 'emotional' : 'calm',
      pose: !turnToggle ? 'standing-speak' : 'listening',
      time: globalTime + 0.5,
      speechEnergy,
      isSpeaking: !turnToggle && isSpeaking,
      viseme: !turnToggle && isSpeaking ? viseme : undefined,
      isWet,
      rimLightColor: rimLight,
      profile: secondaryRole
        ? sProf
        : resolveSceneActorProfile(characterProfiles, 'friend', scene, 'secondary'),
    });
    return;
  }

  // Praying / Celebrating / Expressive Speaking Standing
  const pose: HumanPose =
    scene.action === 'praying-reflecting'
      ? 'praying'
      : scene.action === 'celebrating-proud'
        ? 'celebrating'
        : 'standing-speak';

  drawLifelikeHuman(ctx, {
    x: secondaryRole ? safe.clampX(width * 0.38, 50) : safe.centerX,
    y: subjectY + enterOffsetY,
    scale: unitScale * (isVertical ? 1.04 : 1.12),
    facing: 1,
    role: primaryRole,
    emotion,
    pose,
    time: globalTime,
    speechEnergy,
    isSpeaking,
    viseme: isSpeaking ? viseme : undefined,
    isWet,
    prop: scene.prop ?? 'none',
    rimLightColor: rimLight,
    profile: pProf,
  });

  if (secondaryRole) {
    drawLifelikeHuman(ctx, {
      x: safe.clampX(width * 0.64, 50),
      y: subjectY + 4 + enterOffsetY,
      scale: unitScale * (isVertical ? 0.96 : 1.02),
      facing: -1,
      role: secondaryRole,
      emotion: emotion === 'happy' ? 'happy' : 'calm',
      pose: pose === 'celebrating' ? 'celebrating' : 'listening',
      time: globalTime + 0.6,
      speechEnergy: 0,
      isSpeaking: false,
      isWet,
      rimLightColor: rimLight,
      profile: sProf,
    });
  }
}

function drawWarmStreetLamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  scale: number,
  armDirection: 1 | -1 = 1
): void {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scale * armDirection, scale);

  ctx.strokeStyle = '#252932';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -190);
  ctx.lineTo(26, -196);
  ctx.stroke();

  const glow = ctx.createRadialGradient(26, -190, 4, 26, -180, 92);
  glow.addColorStop(0, 'rgba(255, 224, 146, 0.72)');
  glow.addColorStop(0.5, 'rgba(240, 178, 84, 0.18)');
  glow.addColorStop(1, 'rgba(240, 178, 84, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(26, -180, 92, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFF0BE';
  ctx.beginPath();
  ctx.arc(26, -192, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBazaarAwning(ctx: CanvasRenderingContext2D, x: number, groundY: number, scale: number): void {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#4B3222';
  ctx.fillRect(0, -146, 9, 146);
  ctx.fillRect(190, -146, 9, 146);
  ctx.fillStyle = '#33251F';
  ctx.fillRect(9, -138, 181, 138);
  // Striped market awning
  const stripes = 6;
  const sw = 216 / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#B83B32' : '#EFE2C6';
    ctx.fillRect(-10 + i * sw, -158, sw, 26);
  }
  // Hanging warm bulb
  ctx.fillStyle = '#FFE4A3';
  ctx.beginPath();
  ctx.arc(98, -116, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function renderWeatherOverlay(
  ctx: CanvasRenderingContext2D,
  weather: WeatherType,
  globalTime: number,
  width: number,
  height: number,
  groundY: number
): void {
  if (weather === 'mist') {
    const mist = ctx.createLinearGradient(0, groundY - 90, 0, groundY + 60);
    mist.addColorStop(0, 'rgba(235, 224, 210, 0)');
    mist.addColorStop(0.5, 'rgba(235, 224, 210, 0.24)');
    mist.addColorStop(1, 'rgba(235, 224, 210, 0)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, groundY - 90, width, 150);
  } else if (weather === 'rain' || weather === 'heavy-storm') {
    const intensity = weather === 'heavy-storm' ? 1.3 : 0.72;
    ctx.save();
    ctx.scale(width / 1280, height / 720);
    drawMonsoonRain(ctx, globalTime, intensity, Math.round((groundY / height) * 720));
    ctx.restore();

    if (weather === 'heavy-storm' && Math.sin(globalTime * 8.7) > 0.968) {
      ctx.fillStyle = 'rgba(220, 238, 255, 0.30)';
      ctx.fillRect(0, 0, width, height);
    }
  } else if (weather === 'fireflies') {
    ctx.save();
    for (let i = 0; i < 24; i++) {
      const mx = (i * 119 + globalTime * 18) % width;
      const my = height * 0.22 + ((i * 73) % Math.round(height * 0.45)) + Math.sin(globalTime * 2.2 + i) * 12;
      const alpha = 0.25 + 0.45 * Math.sin(globalTime * 2.4 + i);
      ctx.fillStyle = `rgba(255, 224, 148, ${alpha})`;
      ctx.beginPath();
      ctx.arc(mx, my, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawSimpleTeaStall(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  scale: number,
  time: number
): void {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scale, scale);

  ctx.fillStyle = '#4F3626';
  ctx.fillRect(0, -150, 10, 150);
  ctx.fillRect(210, -150, 10, 150);
  ctx.fillStyle = '#5D6C78';
  ctx.beginPath();
  ctx.moveTo(-18, -156);
  ctx.lineTo(240, -172);
  ctx.lineTo(232, -146);
  ctx.lineTo(-14, -140);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#3B2C24';
  ctx.fillRect(10, -144, 200, 144);
  ctx.fillStyle = '#6E4931';
  ctx.fillRect(8, -68, 204, 68);

  ctx.fillStyle = '#C8CFD6';
  ctx.beginPath();
  ctx.roundRect(46, -92, 30, 24, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const sy = (time * 22 + i * 14) % 38;
    ctx.beginPath();
    ctx.moveTo(58 + i * 4, -96 - sy);
    ctx.quadraticCurveTo(54 + i * 4, -104 - sy, 62 + i * 4, -112 - sy);
    ctx.stroke();
  }
  ctx.restore();
}

function renderInteriorHome(
  ctx: CanvasRenderingContext2D,
  scene: SceneSpec,
  sceneTime: number,
  globalTime: number,
  width: number,
  height: number,
  isVertical: boolean,
  safe: PortraitSafeLayout,
  primaryRole: CharacterRole,
  secondaryRole: CharacterRole | null,
  emotion: EmotionTone,
  speechEnergy: number,
  rimLight: string,
  characterProfiles?: CharacterProfile[],
  viseme?: VisemePose
): void {
  drawSky(
    ctx,
    [
      [0, '#161211'],
      [0.55, '#251C16'],
      [1, '#1A130F'],
    ],
    width,
    height
  );

  // Night window with soft moon glow cleanly inside safe frame
  const winW = isVertical ? 120 : 170;
  const winH = isVertical ? 120 : 140;
  const winX = isVertical ? safe.safeRight - winW - 8 : width * 0.74;
  const winY = isVertical ? height * 0.2 : height * 0.16;
  ctx.fillStyle = '#152038';
  ctx.fillRect(winX, winY, winW, winH);
  ctx.fillStyle = '#FFF3CE';
  ctx.beginPath();
  ctx.arc(winX + winW * 0.7, winY + 38, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5B3E28';
  ctx.lineWidth = 7;
  ctx.strokeRect(winX, winY, winW, winH);

  // Hanging warm bulb
  const bulbY = isVertical ? height * 0.22 : height * 0.18;
  const flicker = 0.96 + Math.sin(globalTime * 7) * 0.03;
  const glow = ctx.createRadialGradient(width / 2, bulbY, 16, width / 2, bulbY + 140, width * 0.62);
  glow.addColorStop(0, `rgba(255, 214, 136, ${0.42 * flicker})`);
  glow.addColorStop(0.5, `rgba(224, 152, 74, ${0.15 * flicker})`);
  glow.addColorStop(1, 'rgba(20, 14, 10, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#332A24';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, bulbY);
  ctx.stroke();
  ctx.fillStyle = '#FFF0C2';
  ctx.beginPath();
  ctx.arc(width / 2, bulbY + 10, 11, 0, Math.PI * 2);
  ctx.fill();

  const floorY = isVertical ? height * 0.64 : height * 0.67;
  ctx.fillStyle = '#3B281B';
  ctx.fillRect(0, floorY, width, height - floorY);

  // Woven mat
  ctx.fillStyle = '#7E5A38';
  ctx.beginPath();
  ctx.moveTo(width * 0.14, floorY + 26);
  ctx.lineTo(width * 0.86, floorY + 26);
  ctx.lineTo(width * 0.94, height * 0.92);
  ctx.lineTo(width * 0.06, height * 0.92);
  ctx.closePath();
  ctx.fill();

  // Expressive seated family members using lifelike human rig
  const s = isVertical ? Math.min(1.24, 1.02 * safe.subjectScale) : 1.28;
  const baseY = floorY + 72;
  drawLifelikeHuman(ctx, {
    x: safe.clampX(width * 0.35, 52),
    y: baseY,
    scale: s,
    facing: 1,
    role: primaryRole,
    emotion,
    pose: 'sitting-floor',
    time: globalTime,
    speechEnergy,
    isSpeaking: speechEnergy > 0.12,
    viseme: speechEnergy > 0.12 ? viseme : undefined,
    rimLightColor: rimLight,
    profile: resolveSceneActorProfile(characterProfiles, primaryRole, scene, 'primary'),
  });

  const secRole = secondaryRole ?? (primaryRole === 'mother' ? 'youth-boy' : 'mother');
  drawLifelikeHuman(ctx, {
    x: safe.clampX(width * 0.65, 52),
    y: baseY + 4,
    scale: s * 0.96,
    facing: -1,
    role: secRole,
    emotion: emotion === 'worried' ? 'emotional' : 'calm',
    pose: 'sitting-floor',
    time: globalTime + 0.5,
    speechEnergy: 0,
    isSpeaking: false,
    rimLightColor: rimLight,
    profile: resolveSceneActorProfile(characterProfiles, secRole, scene, 'secondary'),
  });

  if (scene.action === 'home-meal') {
    const plateY = floorY + 86 + Math.sin(sceneTime * 1.2) * 0.4;
    for (const px of [width * 0.45, width * 0.55]) {
      ctx.fillStyle = '#BFC5CC';
      ctx.beginPath();
      ctx.ellipse(px, plateY, 34, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F6F2E8';
      ctx.beginPath();
      ctx.ellipse(px - 2, plateY - 2, 20, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function renderInteriorClassroom(
  ctx: CanvasRenderingContext2D,
  scene: SceneSpec,
  sceneTime: number,
  globalTime: number,
  width: number,
  height: number,
  isVertical: boolean,
  safe: PortraitSafeLayout,
  primaryRole: CharacterRole,
  secondaryRole: CharacterRole | null,
  emotion: EmotionTone,
  speechEnergy: number,
  rimLight: string,
  characterProfiles?: CharacterProfile[],
  viseme?: VisemePose
): void {
  drawSky(
    ctx,
    [
      [0, '#D4CEC0'],
      [1, '#B5AC9B'],
    ],
    width,
    height
  );

  const boardW = isVertical ? safe.safeWidth : width * 0.52;
  const boardH = isVertical ? 200 : 230;
  const boardX = isVertical ? safe.safeLeft : width * 0.24;
  const boardY = isVertical ? height * 0.17 : height * 0.12;

  ctx.fillStyle = '#1E4635';
  ctx.fillRect(boardX, boardY, boardW, boardH);
  ctx.strokeStyle = '#6A472B';
  ctx.lineWidth = 10;
  ctx.strokeRect(boardX, boardY, boardW, boardH);

  ctx.fillStyle = 'rgba(244, 242, 234, 0.9)';
  ctx.font = `600 ${isVertical ? 21 : 26}px "Noto Serif Bengali", serif`;
  ctx.textAlign = 'center';
  const boardTitle = scene.titleBn.length > 26 ? `${scene.titleBn.slice(0, 26)}…` : scene.titleBn;
  ctx.fillText(boardTitle, boardX + boardW / 2, boardY + boardH * 0.48);

  ctx.fillStyle = '#F2CA6B';
  ctx.font = '500 16px "Hind Siliguri", sans-serif';
  ctx.fillText(scene.titleEn, boardX + boardW / 2, boardY + boardH * 0.72);

  const floorY = height * 0.66;
  ctx.fillStyle = '#6D543D';
  ctx.fillRect(0, floorY, width, height - floorY);

  const s = isVertical ? Math.min(1.24, 1.0 * safe.subjectScale) : 1.24;
  const teacherRole = primaryRole === 'narrator' ? 'teacher' : primaryRole;
  drawLifelikeHuman(ctx, {
    x: safe.clampX(isVertical ? width * 0.30 : width * 0.26, 48),
    y: floorY + 120,
    scale: s,
    facing: 1,
    role: teacherRole,
    emotion,
    pose: 'standing-speak',
    time: globalTime,
    speechEnergy,
    isSpeaking: speechEnergy > 0.12,
    viseme: speechEnergy > 0.12 ? viseme : undefined,
    prop: 'book',
    rimLightColor: rimLight,
    profile: resolveSceneActorProfile(characterProfiles, teacherRole, scene, 'primary'),
  });

  // Student seated at desk safely inside frame
  const deskW = isVertical ? 124 : 150;
  const deskX = isVertical ? safe.safeRight - deskW - 10 : width * 0.58;
  const studentRole = secondaryRole ?? 'youth-boy';
  drawLifelikeHuman(ctx, {
    x: safe.clampX(deskX + deskW * 0.38, 44),
    y: floorY + 126,
    scale: s * 0.95,
    facing: -1,
    role: studentRole,
    emotion: emotion === 'worried' ? 'worried' : 'determined',
    pose: 'sitting-desk',
    time: globalTime + 0.4,
    speechEnergy: 0,
    isSpeaking: false,
    rimLightColor: rimLight,
    profile: resolveSceneActorProfile(characterProfiles, studentRole, scene, 'secondary'),
  });

  ctx.fillStyle = '#7D5433';
  ctx.fillRect(deskX, floorY + 46, deskW, 18);
  ctx.fillStyle = '#5C3C22';
  ctx.fillRect(deskX + 12, floorY + 64, 12, 82);
  ctx.fillRect(deskX + deskW - 24, floorY + 64, 12, 82);

  if (scene.weather === 'rain' || scene.weather === 'heavy-storm') {
    renderWeatherOverlay(ctx, scene.weather, globalTime, width, height, floorY);
  }
  void sceneTime;
}

function renderInteriorOffice(
  ctx: CanvasRenderingContext2D,
  scene: SceneSpec,
  _sceneTime: number,
  globalTime: number,
  width: number,
  height: number,
  isVertical: boolean,
  safe: PortraitSafeLayout,
  primaryRole: CharacterRole,
  secondaryRole: CharacterRole | null,
  emotion: EmotionTone,
  speechEnergy: number,
  rimLight: string,
  characterProfiles?: CharacterProfile[],
  viseme?: VisemePose
): void {
  const isNight = scene.timeOfDay === 'night';
  drawSky(
    ctx,
    isNight
      ? [
          [0, '#1B2234'],
          [0.55, '#273147'],
          [1, '#1C2230'],
        ]
      : [
          [0, '#2E3A4E'],
          [1, '#1F2636'],
        ],
    width,
    height
  );

  // Large glass studio window overlooking city skyline inside safe bounds
  const winW = isVertical ? safe.safeWidth : width * 0.50;
  const winH = isVertical ? 240 : 255;
  const winX = isVertical ? safe.safeLeft : width * 0.08;
  const winY = isVertical ? height * 0.16 : height * 0.11;

  const skyG = ctx.createLinearGradient(0, winY, 0, winY + winH);
  if (isNight) {
    skyG.addColorStop(0, '#131D36');
    skyG.addColorStop(0.65, '#253558');
    skyG.addColorStop(1, '#3B4563');
  } else {
    skyG.addColorStop(0, '#5A89B5');
    skyG.addColorStop(1, '#F0CCA0');
  }
  ctx.fillStyle = skyG;
  ctx.fillRect(winX, winY, winW, winH);

  // Crescent moon & stars in night window
  if (isNight) {
    ctx.fillStyle = '#FFF2C6';
    ctx.beginPath();
    ctx.arc(winX + winW * 0.8, winY + 46, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#192542';
    ctx.beginPath();
    ctx.arc(winX + winW * 0.8 + 7, winY + 42, 15, 0, Math.PI * 2);
    ctx.fill();
  }

  // City buildings with glowing warm apartment/office windows
  for (let i = 0; i < 6; i++) {
    const bx = winX + 14 + i * (winW / 6);
    const bw = winW / 7.2;
    const bh = 72 + ((i * 39) % 92);
    const by = winY + winH - bh;
    ctx.fillStyle = isNight ? '#151E33' : '#6A7F96';
    ctx.fillRect(bx, by, bw, bh);

    if (isNight) {
      ctx.fillStyle = 'rgba(255, 224, 146, 0.72)';
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 2; c++) {
          if ((i + r + c) % 3 !== 0) {
            ctx.fillRect(bx + 7 + c * (bw * 0.42), by + 12 + r * 18, bw * 0.24, 8);
          }
        }
      }
    }
  }
  ctx.strokeStyle = '#3E4B61';
  ctx.lineWidth = 8;
  ctx.strokeRect(winX, winY, winW, winH);

  // Studio wooden wall shelf on right (16:9)
  if (!isVertical) {
    ctx.fillStyle = '#5D412C';
    ctx.fillRect(width * 0.68, height * 0.24, width * 0.24, 10);
    const bookColors = ['#D9534F', '#E5A93C', '#4E9A74', '#5A92C8', '#C67B5C'];
    for (let b = 0; b < 5; b++) {
      ctx.fillStyle = bookColors[b];
      ctx.fillRect(width * 0.70 + b * 18, height * 0.24 - 38 - (b % 2) * 8, 14, 38 + (b % 2) * 8);
    }
    ctx.fillStyle = '#B86442';
    ctx.fillRect(width * 0.85, height * 0.24 - 26, 26, 26);
    ctx.fillStyle = '#4B8E5B';
    ctx.beginPath();
    ctx.arc(width * 0.863, height * 0.24 - 36, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  // Floor
  const floorY = isVertical ? height * 0.72 : height * 0.71;
  ctx.fillStyle = '#2B313F';
  ctx.fillRect(0, floorY, width, height - floorY);

  // Warm studio desk lamp + glowing screen ambience
  const deskY = isVertical ? floorY - 38 : floorY - 22;
  const deskW = isVertical ? safe.safeWidth : width * 0.56;
  const deskX = isVertical ? safe.safeLeft : width * 0.24;
  const lapX = deskX + deskW * 0.48;

  const warmPool = ctx.createRadialGradient(lapX + 20, deskY - 80, 18, lapX, deskY - 20, isVertical ? 300 : 380);
  warmPool.addColorStop(0, 'rgba(255, 214, 132, 0.44)');
  warmPool.addColorStop(0.45, 'rgba(130, 192, 245, 0.16)');
  warmPool.addColorStop(1, 'rgba(20, 24, 34, 0)');
  ctx.fillStyle = warmPool;
  ctx.fillRect(0, 0, width, height);

  // Expressive lifelike human seated closely at desk (never clipped on 9:16)
  const s = isVertical ? Math.min(1.68, 1.38 * safe.subjectScale) : 1.72;
  const humanX = safe.clampX(deskX + deskW * 0.28, 56);
  const officeRole = primaryRole === 'narrator' ? 'professional' : primaryRole;
  drawLifelikeHuman(ctx, {
    x: humanX,
    y: deskY + 135,
    scale: s,
    facing: 1,
    role: officeRole,
    emotion,
    pose: scene.action === 'working-desk' ? 'sitting-desk' : 'standing-speak',
    time: globalTime,
    speechEnergy,
    isSpeaking: speechEnergy > 0.12,
    viseme: speechEnergy > 0.12 ? viseme : undefined,
    rimLightColor: rimLight,
    profile: resolveSceneActorProfile(characterProfiles, officeRole, scene, 'primary'),
  });

  if (secondaryRole || scene.secondaryCharacterAssetId) {
    const secOfficeRole = secondaryRole ?? 'friend';
    drawLifelikeHuman(ctx, {
      x: safe.clampX(deskX + deskW * 0.76, 52),
      y: deskY + 135,
      scale: s * 0.94,
      facing: -1,
      role: secOfficeRole,
      emotion: 'calm',
      pose: 'listening',
      time: globalTime + 0.5,
      speechEnergy: 0,
      isSpeaking: false,
      rimLightColor: rimLight,
      profile: resolveSceneActorProfile(characterProfiles, secOfficeRole, scene, 'secondary'),
    });
  }

  // Modern walnut studio desk (foreground layer)
  ctx.fillStyle = '#6B4B34';
  ctx.beginPath();
  ctx.roundRect(deskX, deskY, deskW, 20, 5);
  ctx.fill();
  ctx.fillStyle = '#4B3424';
  ctx.fillRect(deskX + 2, deskY + 16, deskW - 4, 6);
  ctx.fillStyle = '#242934';
  ctx.fillRect(deskX + 22, deskY + 20, 14, 118);
  ctx.fillRect(deskX + deskW - 36, deskY + 20, 14, 118);

  // Glowing Laptop with live code lines
  ctx.fillStyle = '#1E242E';
  ctx.fillRect(lapX - 18, deskY - 5, 84, 6);
  ctx.beginPath();
  ctx.moveTo(lapX + 12, deskY - 4);
  ctx.lineTo(lapX + 94, deskY - 4);
  ctx.lineTo(lapX + 110, deskY - 62);
  ctx.lineTo(lapX + 28, deskY - 62);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#89CAF6';
  ctx.beginPath();
  ctx.moveTo(lapX + 18, deskY - 9);
  ctx.lineTo(lapX + 89, deskY - 9);
  ctx.lineTo(lapX + 103, deskY - 56);
  ctx.lineTo(lapX + 32, deskY - 56);
  ctx.closePath();
  ctx.fill();
  // Animated screen shimmer bar
  const codePulse = Math.sin(globalTime * 4) * 6;
  ctx.fillStyle = 'rgba(18, 42, 74, 0.45)';
  ctx.fillRect(lapX + 32, deskY - 46, 36 + codePulse, 4);
  ctx.fillRect(lapX + 29, deskY - 36, 46 - codePulse * 0.5, 4);

  // Warm Architect Desk Lamp on right side of desk
  const lampBaseX = deskX + deskW - 44;
  ctx.fillStyle = '#2B303C';
  ctx.fillRect(lampBaseX - 14, deskY - 6, 28, 6);
  ctx.strokeStyle = '#C9963A';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(lampBaseX, deskY - 6);
  ctx.lineTo(lampBaseX + 12, deskY - 64);
  ctx.lineTo(lampBaseX - 16, deskY - 92);
  ctx.stroke();
  ctx.fillStyle = '#E5A93C';
  ctx.beginPath();
  ctx.moveTo(lampBaseX - 28, deskY - 82);
  ctx.lineTo(lampBaseX - 4, deskY - 102);
  ctx.lineTo(lampBaseX + 4, deskY - 76);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#FFF5D1';
  ctx.beginPath();
  ctx.arc(lampBaseX - 16, deskY - 82, 7, 0, Math.PI * 2);
  ctx.fill();
}

function renderInteriorHospital(
  ctx: CanvasRenderingContext2D,
  scene: SceneSpec,
  _sceneTime: number,
  globalTime: number,
  width: number,
  height: number,
  isVertical: boolean,
  safe: PortraitSafeLayout,
  primaryRole: CharacterRole,
  secondaryRole: CharacterRole | null,
  emotion: EmotionTone,
  speechEnergy: number,
  rimLight: string,
  characterProfiles?: CharacterProfile[],
  viseme?: VisemePose
): void {
  drawSky(
    ctx,
    [
      [0, '#D8E5E8'],
      [1, '#B8CCD2'],
    ],
    width,
    height
  );

  // Calm clinic wall band & medical cross accent
  ctx.fillStyle = '#9BB8C0';
  ctx.fillRect(0, height * 0.56, width, 16);

  const floorY = height * 0.66;
  ctx.fillStyle = '#7E969E';
  ctx.fillRect(0, floorY, width, height - floorY);

  // Medical frame on wall
  const cx = width * 0.5;
  const cy = isVertical ? height * 0.24 : height * 0.22;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(cx, cy, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3C8D8E';
  ctx.fillRect(cx - 14, cy - 5, 28, 10);
  ctx.fillRect(cx - 5, cy - 14, 10, 28);

  const s = isVertical ? Math.min(1.24, 1.0 * safe.subjectScale) : 1.26;
  drawLifelikeHuman(ctx, {
    x: safe.clampX(isVertical ? width * 0.36 : width * 0.38, 48),
    y: floorY + 115,
    scale: s,
    facing: 1,
    role: 'doctor',
    emotion: 'calm',
    pose: 'standing-speak',
    time: globalTime,
    speechEnergy,
    isSpeaking: speechEnergy > 0.12,
    viseme: speechEnergy > 0.12 ? viseme : undefined,
    rimLightColor: rimLight,
    profile: resolveSceneActorProfile(characterProfiles, 'doctor', scene, 'primary'),
  });

  const patientRole = secondaryRole ?? (primaryRole === 'doctor' ? 'mother' : primaryRole);
  drawLifelikeHuman(ctx, {
    x: safe.clampX(isVertical ? width * 0.64 : width * 0.64, 48),
    y: floorY + 115,
    scale: s * 0.98,
    facing: -1,
    role: patientRole,
    emotion,
    pose: 'listening',
    time: globalTime + 0.3,
    speechEnergy: 0,
    isSpeaking: false,
    rimLightColor: rimLight,
    profile: resolveSceneActorProfile(characterProfiles, patientRole, scene, 'secondary'),
  });
}
