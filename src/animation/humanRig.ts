import { CharacterRole, EmotionTone, StoryProp } from '../lib/storyCompiler';
import { CharacterProfile } from '../lib/storyIntelligence';
import { getCharacterAssetById } from '../lib/studioAssetLibrary';
import { VisemePose } from '../lib/visemeEngine';
import { drawGamchhaRect } from './drawHelpers';
import { drawIllustratedCharacterCutout } from './assetCanvasRenderer';

export type HumanPose =
  | 'standing-speak'
  | 'walking'
  | 'running'
  | 'sitting-desk'
  | 'sitting-floor'
  | 'praying'
  | 'celebrating'
  | 'listening'
  | 'portrait-speak';

export interface LifelikeHumanOptions {
  x: number;
  y: number; // feet baseline for full-body, or chest/waist anchor for portrait-speak
  scale?: number;
  facing?: 1 | -1; // 1 = looking right/three-quarter right, -1 = looking left
  role: CharacterRole;
  emotion: EmotionTone;
  pose: HumanPose;
  time: number;
  /** Live voiceover speech amplitude [0..1] driving lip-sync, head nods, and hand gestures */
  speechEnergy?: number;
  isSpeaking?: boolean;
  /** Phonetic mouth-shape articulatory pose for lip-sync */
  viseme?: VisemePose;
  isWet?: boolean;
  prop?: StoryProp;
  rimLightColor?: string;
  /** Consistent visual DNA profile locked across all scenes */
  profile?: Partial<CharacterProfile>;
  /** Optional horizontal pacing limit around anchor x */
  maxOffsetX?: number;
  /** Keep facing locked toward partner/camera during two-person dialogues */
  lockFacing?: boolean;
}

interface RoleStyle {
  skinBase: string;
  skinShadow: string;
  skinHighlight: string;
  hairColor: string;
  hairHighlight: string;
  topColor: string;
  topShadow: string;
  bottomColor: string;
  accentColor: string;
  isFemale: boolean;
  isElder: boolean;
  hasMustache: boolean;
  hasBeard: boolean;
  hasGlasses: boolean;
  hasStethoscope: boolean;
  hasGamchha: boolean;
  hasScarf: boolean;
  heightRatio: number;
  shoulderWidth: number;
}

const ROLE_STYLES: Record<CharacterRole, RoleStyle> = {
  father: {
    skinBase: '#B67D58',
    skinShadow: '#8B583B',
    skinHighlight: '#CE9873',
    hairColor: '#252120',
    hairHighlight: '#7D7B78',
    topColor: '#DDD5C5',
    topShadow: '#B5AC9B',
    bottomColor: '#27465B',
    accentColor: '#B82626',
    isFemale: false,
    isElder: false,
    hasMustache: true,
    hasBeard: false,
    hasGlasses: false,
    hasStethoscope: false,
    hasGamchha: true,
    hasScarf: false,
    heightRatio: 1.06,
    shoulderWidth: 22,
  },
  mother: {
    skinBase: '#C8926D',
    skinShadow: '#9B6949',
    skinHighlight: '#DFAC89',
    hairColor: '#191514',
    hairHighlight: '#3A312E',
    topColor: '#A93848',
    topShadow: '#7A2230',
    bottomColor: '#8F2938',
    accentColor: '#E8B852',
    isFemale: true,
    isElder: false,
    hasMustache: false,
    hasBeard: false,
    hasGlasses: false,
    hasStethoscope: false,
    hasGamchha: false,
    hasScarf: true,
    heightRatio: 0.98,
    shoulderWidth: 18.5,
  },
  'youth-boy': {
    skinBase: '#CA936C',
    skinShadow: '#9E6A47',
    skinHighlight: '#E2AF8A',
    hairColor: '#171413',
    hairHighlight: '#3B3532',
    topColor: '#5B98CA',
    topShadow: '#3D729F',
    bottomColor: '#1F2C40',
    accentColor: '#E5A93C',
    isFemale: false,
    isElder: false,
    hasMustache: false,
    hasBeard: false,
    hasGlasses: false,
    hasStethoscope: false,
    hasGamchha: false,
    hasScarf: false,
    heightRatio: 0.94,
    shoulderWidth: 19,
  },
  'youth-girl': {
    skinBase: '#D09B76',
    skinShadow: '#A2704E',
    skinHighlight: '#E7B796',
    hairColor: '#181413',
    hairHighlight: '#3B322E',
    topColor: '#3D847B',
    topShadow: '#285D56',
    bottomColor: '#254446',
    accentColor: '#E6A856',
    isFemale: true,
    isElder: false,
    hasMustache: false,
    hasBeard: false,
    hasGlasses: false,
    hasStethoscope: false,
    hasGamchha: false,
    hasScarf: true,
    heightRatio: 0.92,
    shoulderWidth: 17.5,
  },
  elder: {
    skinBase: '#B98360',
    skinShadow: '#8E5E41',
    skinHighlight: '#CFA07E',
    hairColor: '#C5C3BE',
    hairHighlight: '#E8E6E0',
    topColor: '#ECE7DC',
    topShadow: '#C7C0B2',
    bottomColor: '#3B4A58',
    accentColor: '#C9963A',
    isFemale: false,
    isElder: true,
    hasMustache: true,
    hasBeard: true,
    hasGlasses: true,
    hasStethoscope: false,
    hasGamchha: false,
    hasScarf: false,
    heightRatio: 1.02,
    shoulderWidth: 20.5,
  },
  teacher: {
    skinBase: '#BD8762',
    skinShadow: '#8F5E3F',
    skinHighlight: '#D5A27F',
    hairColor: '#24201E',
    hairHighlight: '#5A5550',
    topColor: '#E2DACB',
    topShadow: '#B9B09E',
    bottomColor: '#2E3440',
    accentColor: '#5B4636',
    isFemale: false,
    isElder: false,
    hasMustache: true,
    hasBeard: false,
    hasGlasses: true,
    hasStethoscope: false,
    hasGamchha: false,
    hasScarf: false,
    heightRatio: 1.05,
    shoulderWidth: 21,
  },
  professional: {
    skinBase: '#C7906A',
    skinShadow: '#9A6746',
    skinHighlight: '#DFAC89',
    hairColor: '#1B1817',
    hairHighlight: '#3E3835',
    topColor: '#2B3A4E',
    topShadow: '#1C2736',
    bottomColor: '#1B222E',
    accentColor: '#E5A93C',
    isFemale: false,
    isElder: false,
    hasMustache: false,
    hasBeard: false,
    hasGlasses: false,
    hasStethoscope: false,
    hasGamchha: false,
    hasScarf: false,
    heightRatio: 1.04,
    shoulderWidth: 22,
  },
  doctor: {
    skinBase: '#C8926D',
    skinShadow: '#9A6847',
    skinHighlight: '#E0AE8D',
    hairColor: '#1E1B1A',
    hairHighlight: '#4A4542',
    topColor: '#EEF2F5',
    topShadow: '#CBD4DC',
    bottomColor: '#274252',
    accentColor: '#3C8D8E',
    isFemale: false,
    isElder: false,
    hasMustache: false,
    hasBeard: false,
    hasGlasses: true,
    hasStethoscope: true,
    hasGamchha: false,
    hasScarf: false,
    heightRatio: 1.04,
    shoulderWidth: 21,
  },
  narrator: {
    skinBase: '#C68F69',
    skinShadow: '#986544',
    skinHighlight: '#DFAD8A',
    hairColor: '#1A1716',
    hairHighlight: '#423B38',
    topColor: '#394356',
    topShadow: '#242B3A',
    bottomColor: '#1B202B',
    accentColor: '#E5A93C',
    isFemale: false,
    isElder: false,
    hasMustache: false,
    hasBeard: false,
    hasGlasses: false,
    hasStethoscope: false,
    hasGamchha: false,
    hasScarf: false,
    heightRatio: 1.04,
    shoulderWidth: 21.5,
  },
  friend: {
    skinBase: '#C28A65',
    skinShadow: '#966343',
    skinHighlight: '#DAA581',
    hairColor: '#1A1614',
    hairHighlight: '#3E3631',
    topColor: '#C57B44',
    topShadow: '#96582B',
    bottomColor: '#273140',
    accentColor: '#E6CFA0',
    isFemale: false,
    isElder: false,
    hasMustache: false,
    hasBeard: false,
    hasGlasses: false,
    hasStethoscope: false,
    hasGamchha: false,
    hasScarf: false,
    heightRatio: 0.98,
    shoulderWidth: 20,
  },
};

function drawSegmentLimb(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  upperColor: string,
  lowerColor: string,
  wUpper: number,
  wLower: number
): void {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Upper segment
  ctx.strokeStyle = upperColor;
  ctx.lineWidth = wUpper;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();

  // Lower segment
  ctx.strokeStyle = lowerColor;
  ctx.lineWidth = wLower;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawExpressiveHand(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  skinColor: string,
  skinShadow: string,
  angle: number,
  openness = 0.4
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = skinColor;
  ctx.strokeStyle = skinShadow;
  ctx.lineWidth = 0.8;

  // Palm
  ctx.beginPath();
  ctx.ellipse(3, 0, 5.2, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Thumb
  ctx.beginPath();
  ctx.ellipse(2, -3.5 - openness * 1.5, 3.2, 1.5, -0.55, 0, Math.PI * 2);
  ctx.fill();

  // Articulated fingers silhouette
  for (let f = 0; f < 3; f++) {
    const fy = -2 + f * 2;
    const fx = 6.5 + (f === 1 ? 1.5 : 0);
    ctx.beginPath();
    ctx.ellipse(fx, fy, 3.3 + openness, 1.25, (f - 1) * 0.16 * openness, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPropInHand(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  prop: StoryProp,
  time: number
): void {
  ctx.save();
  ctx.translate(x, y);
  if (prop === 'book') {
    ctx.fillStyle = '#F3EFE4';
    ctx.strokeStyle = '#334E68';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-2, -14, 22, 18, 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#C9BFA9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(9, -13);
    ctx.lineTo(9, 3);
    ctx.stroke();
  } else if (prop === 'phone') {
    ctx.fillStyle = '#181B22';
    ctx.beginPath();
    ctx.roundRect(-2, -16, 11, 19, 2.5);
    ctx.fill();
    ctx.fillStyle = '#7DC4F0';
    ctx.fillRect(0, -13, 7, 13);
  } else if (prop === 'money') {
    ctx.fillStyle = 'rgba(232, 246, 255, 0.78)';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(-2, -10, 24, 15, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#4B9B5E';
    ctx.fillRect(2, -7, 16, 9);
  } else if (prop === 'tea') {
    ctx.fillStyle = '#ECE6DA';
    ctx.beginPath();
    ctx.roundRect(-3, -12, 12, 14, 2);
    ctx.fill();
    ctx.fillStyle = '#8C5228';
    ctx.fillRect(-1, -10, 8, 5);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.4;
    const s = (time * 16) % 14;
    ctx.beginPath();
    ctx.moveTo(3, -14 - s * 0.5);
    ctx.quadraticCurveTo(0, -20 - s * 0.5, 4, -25 - s * 0.5);
    ctx.stroke();
  } else if (prop === 'umbrella') {
    // Handle
    ctx.strokeStyle = '#2B241E';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(2, 6);
    ctx.lineTo(2, -76);
    ctx.stroke();
    // Canopy
    ctx.fillStyle = '#203852';
    ctx.beginPath();
    ctx.moveTo(-48, -68);
    ctx.quadraticCurveTo(2, -108, 52, -68);
    ctx.quadraticCurveTo(28, -76, 2, -68);
    ctx.quadraticCurveTo(-24, -76, -48, -68);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#5D7B9B';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  } else if (prop === 'lantern') {
    const glow = ctx.createRadialGradient(4, 12, 2, 4, 12, 42);
    glow.addColorStop(0, 'rgba(255, 214, 124, 0.72)');
    glow.addColorStop(1, 'rgba(255, 180, 74, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(4, 12, 42, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#3C2D22';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(4, 2, 6, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = '#FFE39C';
    ctx.beginPath();
    ctx.roundRect(-2, 4, 12, 16, 4);
    ctx.fill();
    ctx.strokeStyle = '#4B3726';
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draws an anatomically proportioned, expressive, voice-synced 2D human character
 * with layered shading, natural blinking, eyebrow emotion, real speech visemes,
 * articulated 2-bone limbs, and culturally authentic clothing.
 */
export function drawLifelikeHuman(ctx: CanvasRenderingContext2D, opts: LifelikeHumanOptions): void {
  const {
    x,
    y,
    scale = 1,
    facing = 1,
    role,
    emotion,
    pose,
    time,
    speechEnergy = 0,
    isSpeaking = false,
    viseme,
    isWet = false,
    prop = 'none',
    rimLightColor = 'rgba(255, 224, 166, 0.28)',
    profile,
  } = opts;

  if (profile?.renderMode === 'illustrated-cutout' && profile.sourceAssetId) {
    const asset = getCharacterAssetById(profile.sourceAssetId);
    if (asset) {
      drawIllustratedCharacterCutout(ctx, opts, asset);
      return;
    }
  }

  const baseStyle = ROLE_STYLES[role];
  const st: RoleStyle = profile
    ? {
        ...baseStyle,
        skinBase: profile.skinTone || baseStyle.skinBase,
        skinShadow: profile.skinShadow || baseStyle.skinShadow,
        skinHighlight: profile.skinHighlight || baseStyle.skinHighlight,
        hairColor: profile.hairColor || baseStyle.hairColor,
        hairHighlight: profile.hairHighlight || baseStyle.hairHighlight,
        topColor: profile.outfitColor || baseStyle.topColor,
        topShadow: profile.outfitShadow || baseStyle.topShadow,
        bottomColor: profile.pantsColor || baseStyle.bottomColor,
        accentColor: profile.accentColor || baseStyle.accentColor,
        isFemale: profile.isFemale !== undefined ? profile.isFemale : baseStyle.isFemale,
        isElder: profile.isElder !== undefined ? profile.isElder : baseStyle.isElder,
        hasMustache: profile.accessories ? profile.accessories.includes('mustache') : baseStyle.hasMustache,
        hasBeard: profile.accessories ? profile.accessories.includes('beard') : baseStyle.hasBeard,
        hasGlasses: profile.accessories ? profile.accessories.includes('glasses') : baseStyle.hasGlasses,
        hasStethoscope: profile.accessories ? profile.accessories.includes('stethoscope') : baseStyle.hasStethoscope,
        hasGamchha: profile.accessories ? profile.accessories.includes('gamchha') : baseStyle.hasGamchha,
        hasScarf: profile.accessories ? profile.accessories.includes('scarf') : baseStyle.hasScarf,
        shoulderWidth:
          profile.bodyStructure === 'broad'
            ? baseStyle.shoulderWidth * 1.12
            : profile.bodyStructure === 'slim'
              ? baseStyle.shoulderWidth * 0.9
              : baseStyle.shoulderWidth,
      }
    : baseStyle;
  const hasCap = Boolean(profile?.accessories?.includes('cap'));
  const hasTupi = Boolean(profile?.accessories?.includes('tupi'));
  const hasHat = Boolean(profile?.accessories?.includes('hat'));
  const hasCrown = Boolean(profile?.accessories?.includes('crown'));
  const hasWatch = Boolean(profile?.accessories?.includes('watch'));
  const hairStyleId =
    profile?.hairStyleId ||
    (st.isFemale ? 'long-flowing' : st.isElder ? 'bald-elder' : 'short-classic');
  const h = st.heightRatio;
  const energy = isSpeaking ? Math.max(0.06, speechEnergy) : speechEnergy * 0.25;

  // Natural biological rhythms + expressive stage pacing & weight shift
  const breath = Math.sin(time * 2.15 + x * 0.01) * 2.2;
  const paceSpan = Math.min(opts.maxOffsetX ?? 22, 22 * scale);
  const weightShiftX =
    pose === 'standing-speak' || pose === 'celebrating'
      ? Math.sin(time * 0.85 + x * 0.015) * (paceSpan * 0.65) +
        Math.sin(time * 1.9) * (2.4 + energy * 2.2)
      : pose === 'listening'
        ? Math.sin(time * 0.72 + x * 0.015) * (paceSpan * 0.35)
        : 0;
  const headNod = isSpeaking
    ? Math.sin(time * 5.8) * (0.055 * energy) + Math.sin(time * 1.9) * 0.03
    : Math.sin(time * 1.4) * 0.025;
  const activeViseme: VisemePose | null = isSpeaking && viseme ? viseme : null;
  const jawDropPx = activeViseme
    ? activeViseme.jawDrop * 2.8
    : isSpeaking
      ? Math.min(2.2, energy * 2.4 * (0.5 + 0.5 * Math.sin(time * 16.5)))
      : 0;

  // Natural asymmetric eye blink every ~3.6 seconds
  const blinkCycle = (time + (role.length * 0.73)) % 3.6;
  const blinkAmount =
    blinkCycle > 3.42
      ? Math.sin(((blinkCycle - 3.42) / 0.18) * Math.PI)
      : 0;

  const walkSpeed = pose === 'running' ? 9.5 : pose === 'walking' ? 5.2 : 0;
  const stridePhase = walkSpeed > 0 ? time * walkSpeed : 0;
  const walkBounce =
    walkSpeed > 0
      ? Math.abs(Math.sin(stridePhase)) * (pose === 'running' ? 6 : 3.2)
      : pose === 'standing-speak' || pose === 'celebrating'
        ? Math.abs(Math.sin(time * 2.6)) * (1.8 + energy * 2.0)
        : 0;
  const torsoLean =
    pose === 'running'
      ? 0.16
      : pose === 'walking'
        ? 0.05
        : pose === 'praying'
          ? 0.09
          : emotion === 'sad'
            ? 0.08
            : pose === 'sitting-desk'
              ? 0.06
              : 0;

  ctx.save();
  ctx.translate(x + weightShiftX, y);
  ctx.scale(scale * facing, scale);

  const isPortrait = pose === 'portrait-speak';
  const hipY = isPortrait ? 18 : pose === 'sitting-floor' ? -24 : pose === 'sitting-desk' ? -52 : -78 * h;
  const shoulderY = hipY - 58 * h;
  const headY = shoulderY - 29;

  // 1. Grounded contact shadow (full-body poses)
  if (!isPortrait) {
    ctx.fillStyle = isWet ? 'rgba(8, 14, 22, 0.42)' : 'rgba(10, 9, 12, 0.30)';
    ctx.beginPath();
    ctx.ellipse(0, 3, pose === 'sitting-floor' ? 42 : 26, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.translate(0, -walkBounce);

  // 2. Legs (for non-portrait poses)
  if (!isPortrait) {
    const legTopColor = st.bottomColor;
    const shoeColor = st.isElder || role === 'father' ? '#3B281E' : '#171A21';

    if (pose === 'sitting-floor') {
      // Cross-legged seated posture
      ctx.fillStyle = legTopColor;
      ctx.beginPath();
      ctx.ellipse(-6, -10, 38, 16, 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = st.skinShadow;
      ctx.beginPath();
      ctx.ellipse(24, -4, 9, 4.5, 0.1, 0, Math.PI * 2);
      ctx.fill();
    } else if (pose === 'sitting-desk') {
      // Seated at chair/desk
      drawSegmentLimb(ctx, -4, hipY, 22, hipY + 4, 24, -4, legTopColor, legTopColor, 13, 10.5);
      drawSegmentLimb(ctx, 4, hipY, 30, hipY + 4, 34, -4, legTopColor, legTopColor, 13, 10.5);
      ctx.fillStyle = shoeColor;
      ctx.beginPath();
      ctx.ellipse(29, -2, 10, 4.5, 0, 0, Math.PI * 2);
      ctx.ellipse(39, -2, 10, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Articulated 2-bone walking / running / standing legs
      const amp = pose === 'running' ? 24 : pose === 'walking' ? 16 : 0;
      const backHipAngle = Math.sin(stridePhase + Math.PI);
      const frontHipAngle = Math.sin(stridePhase);

      const backKneeX = -3 + backHipAngle * amp * 0.65 + (amp > 0 ? 4 : 0);
      const backKneeY = hipY + 38 * h - Math.max(0, -backHipAngle) * 5;
      const backFootX = -4 + backHipAngle * amp;
      const backFootY = -4 - Math.max(0, -backHipAngle) * (pose === 'running' ? 10 : 4);

      const frontKneeX = 3 + frontHipAngle * amp * 0.65 + (amp > 0 ? 4 : 0);
      const frontKneeY = hipY + 38 * h - Math.max(0, -frontHipAngle) * 5;
      const frontFootX = 4 + frontHipAngle * amp;
      const frontFootY = -4 - Math.max(0, -frontHipAngle) * (pose === 'running' ? 10 : 4);

      // Slightly darker back leg for depth
      drawSegmentLimb(ctx, -3, hipY, backKneeX, backKneeY, backFootX, backFootY, '#141B26', '#141B26', 12.5, 9.5);
      ctx.fillStyle = shoeColor;
      ctx.beginPath();
      ctx.ellipse(backFootX + 4, backFootY + 2, 9.5, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Front leg
      drawSegmentLimb(ctx, 3, hipY, frontKneeX, frontKneeY, frontFootX, frontFootY, legTopColor, legTopColor, 13, 10);
      ctx.fillStyle = shoeColor;
      ctx.beginPath();
      ctx.ellipse(frontFootX + 4, frontFootY + 2, 10, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Female saree / kurta lower drape for authentic silhouette
      if (st.isFemale) {
        ctx.fillStyle = st.bottomColor;
        ctx.beginPath();
        ctx.moveTo(-16, hipY - 4);
        ctx.lineTo(17, hipY - 4);
        ctx.lineTo(20 + frontHipAngle * 4, -8);
        ctx.lineTo(-18 + backHipAngle * 4, -8);
        ctx.closePath();
        ctx.fill();
        // Gold border trim at hem
        ctx.fillStyle = st.accentColor;
        ctx.fillRect(-17, -14, 35, 3.5);
      }
    }
  }

  // 3. Upper Body Transform (breathing + emotional/action lean)
  ctx.save();
  ctx.translate(0, hipY + breath * 0.45);
  ctx.rotate(torsoLean);
  const localShoulderY = shoulderY - hipY;
  const localHeadY = headY - hipY;

  // Back Arm (behind torso)
  const gestureWave = Math.sin(time * 3.4 + 0.8) * (6 + energy * 14);
  const backShoulderX = -st.shoulderWidth * 0.45;
  let bElbowX = backShoulderX - 6;
  let bElbowY = localShoulderY + 24;
  let bWristX = backShoulderX + 2;
  let bWristY = localShoulderY + 46;

  if (pose === 'celebrating') {
    bElbowX = backShoulderX - 16;
    bElbowY = localShoulderY - 12;
    bWristX = backShoulderX - 10;
    bWristY = localShoulderY - 38 + Math.sin(time * 6) * 4;
  } else if (pose === 'praying') {
    bElbowX = backShoulderX + 10;
    bElbowY = localShoulderY + 20;
    bWristX = 18;
    bWristY = localShoulderY + 8;
  } else if (pose === 'standing-speak' || pose === 'portrait-speak') {
    bElbowX = backShoulderX - 8;
    bElbowY = localShoulderY + 22;
    bWristX = backShoulderX + 12 + energy * 8;
    bWristY = localShoulderY + 24 - gestureWave * 0.5;
  } else if (pose === 'walking' || pose === 'running') {
    const swing = Math.sin(stridePhase) * (pose === 'running' ? 18 : 11);
    bElbowX = backShoulderX + swing * 0.6;
    bElbowY = localShoulderY + 22;
    bWristX = backShoulderX + swing * 1.25;
    bWristY = localShoulderY + 40;
  }

  drawSegmentLimb(
    ctx,
    backShoulderX,
    localShoulderY + 8,
    bElbowX,
    bElbowY,
    bWristX,
    bWristY,
    st.topShadow,
    st.topShadow,
    9.5,
    7.8
  );
  drawExpressiveHand(ctx, bWristX, bWristY, st.skinShadow, st.skinShadow, 0.2, energy * 0.7);

  // Backpack if applicable
  if (prop === 'backpack') {
    ctx.fillStyle = '#223854';
    ctx.beginPath();
    ctx.roundRect(-st.shoulderWidth - 10, localShoulderY + 4, 15, 36, 5);
    ctx.fill();
    ctx.fillStyle = '#E5A93C';
    ctx.fillRect(-st.shoulderWidth - 8, localShoulderY + 18, 11, 3);
  }

  // Sculpted Torso with clothing shading & natural shoulder curve
  const sw = st.shoulderWidth;
  const torsoGrad = ctx.createLinearGradient(-sw, localShoulderY, sw, 0);
  torsoGrad.addColorStop(0, st.topShadow);
  torsoGrad.addColorStop(0.55, st.topColor);
  torsoGrad.addColorStop(1, isWet ? st.topShadow : st.topColor);

  ctx.fillStyle = torsoGrad;
  ctx.beginPath();
  ctx.moveTo(-sw * 0.78, 4);
  ctx.quadraticCurveTo(-sw * 0.95, localShoulderY * 0.55, -sw * 0.92, localShoulderY + 10);
  ctx.quadraticCurveTo(-sw * 0.75, localShoulderY - 2, -6, localShoulderY - 2);
  ctx.lineTo(8, localShoulderY - 2);
  ctx.quadraticCurveTo(sw * 0.88, localShoulderY - 1, sw * 0.95, localShoulderY + 12);
  ctx.quadraticCurveTo(sw * 0.85, localShoulderY * 0.52, sw * 0.78, 4);
  ctx.closePath();
  ctx.fill();

  // Subtle rim light along front shoulder
  ctx.strokeStyle = rimLightColor;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(8, localShoulderY - 1);
  ctx.quadraticCurveTo(sw * 0.86, localShoulderY, sw * 0.92, localShoulderY + 16);
  ctx.stroke();

  // Clothing details (collar / blazer lapel / saree pallu / doctor stethoscope / gamchha)
  if (role === 'professional' || role === 'narrator') {
    // Inner crisp shirt V-neck & lapel
    ctx.fillStyle = '#EDE8DE';
    ctx.beginPath();
    ctx.moveTo(-4, localShoulderY);
    ctx.lineTo(4, localShoulderY + 20);
    ctx.lineTo(10, localShoulderY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-7, localShoulderY + 2);
    ctx.lineTo(4, localShoulderY + 22);
    ctx.lineTo(13, localShoulderY + 2);
    ctx.stroke();
  } else if (st.hasScarf) {
    // Graceful diagonal saree pallu / orna drape with subtle breeze
    const breeze = Math.sin(time * 2.2) * 2.5;
    ctx.fillStyle = st.accentColor;
    ctx.globalAlpha = 0.86;
    ctx.beginPath();
    ctx.moveTo(-sw * 0.75, localShoulderY + 2);
    ctx.quadraticCurveTo(0, localShoulderY + 24, sw * 0.78, -2);
    ctx.lineTo(sw * 0.48, 6);
    ctx.quadraticCurveTo(-4, localShoulderY + 34, -sw * 0.92 - breeze, localShoulderY + 22);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  } else {
    // Panjabi / shirt collar + placket
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath();
    ctx.moveTo(-5, localShoulderY - 1);
    ctx.lineTo(3, localShoulderY + 9);
    ctx.lineTo(10, localShoulderY - 1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.14)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(3, localShoulderY + 9);
    ctx.lineTo(3, localShoulderY + 26);
    ctx.stroke();
  }

  if (st.hasGamchha) {
    drawGamchhaRect(ctx, -sw * 0.86, localShoulderY + 1, 13, 32, 3);
  }

  if (st.hasStethoscope) {
    ctx.strokeStyle = '#2A333E';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-7, localShoulderY + 1);
    ctx.quadraticCurveTo(2, localShoulderY + 28, 12, localShoulderY + 2);
    ctx.stroke();
    ctx.fillStyle = '#9BA8B4';
    ctx.beginPath();
    ctx.arc(3, localShoulderY + 23, 3.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Neck + Sculpted Expressive Head (with subtle voice-synced head nod)
  ctx.save();
  ctx.translate(1, localShoulderY - 2);
  ctx.rotate(headNod);

  const headCenterY = localHeadY - localShoulderY + 2;

  // Neck with chin cast-shadow
  ctx.fillStyle = st.skinBase;
  ctx.beginPath();
  ctx.roundRect(-6.5, -14, 13, 18, 4);
  ctx.fill();
  ctx.fillStyle = st.skinShadow;
  ctx.beginPath();
  ctx.ellipse(0, -10, 6.8, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Back hair layer for long flowing or traditional bun hairstyles
  if (hairStyleId === 'long-flowing' || (st.isFemale && hairStyleId !== 'bun-traditional' && hairStyleId !== 'short-classic' && hairStyleId !== 'parted-neat' && hairStyleId !== 'spiky-modern' && hairStyleId !== 'bald-elder')) {
    const hairSway = Math.sin(time * 2) * 2;
    ctx.fillStyle = st.hairColor;
    ctx.beginPath();
    ctx.moveTo(-16, headCenterY - 6);
    ctx.quadraticCurveTo(-22 - hairSway, headCenterY + 18, -14 - hairSway, headCenterY + 34);
    ctx.lineTo(-4, headCenterY + 30);
    ctx.lineTo(-4, headCenterY - 2);
    ctx.closePath();
    ctx.fill();
  } else if (hairStyleId === 'bun-traditional') {
    ctx.fillStyle = st.hairColor;
    ctx.beginPath();
    ctx.arc(-16.5, headCenterY + 2, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = st.accentColor;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(-15, headCenterY + 2, 6.2, -1.1, 1.1);
    ctx.stroke();
  }

  // Sculpted Anatomical Head (oval cranium + gentle jawline)
  const headGrad = ctx.createRadialGradient(5, headCenterY - 5, 3, 0, headCenterY, 22);
  headGrad.addColorStop(0, st.skinHighlight);
  headGrad.addColorStop(0.65, st.skinBase);
  headGrad.addColorStop(1, st.skinShadow);
  ctx.fillStyle = headGrad;

  ctx.beginPath();
  ctx.moveTo(-14, headCenterY - 4);
  ctx.bezierCurveTo(-15, headCenterY - 22, 15, headCenterY - 22, 15.5, headCenterY - 3);
  ctx.bezierCurveTo(16, headCenterY + 11 + jawDropPx * 0.55, 9, headCenterY + 18.5 + jawDropPx, 2, headCenterY + 19 + jawDropPx);
  ctx.bezierCurveTo(-7, headCenterY + 19 + jawDropPx * 0.85, -13.5, headCenterY + 10 + jawDropPx * 0.35, -14, headCenterY - 4);
  ctx.closePath();
  ctx.fill();

  // Subtle rim light on forehead/nose side
  ctx.strokeStyle = rimLightColor;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(1, headCenterY - 1, 15, -0.7, 0.55);
  ctx.stroke();

  // Ear
  ctx.fillStyle = st.skinBase;
  ctx.beginPath();
  ctx.ellipse(-12.5, headCenterY + 1, 3.3, 5.2, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = st.skinShadow;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(-12.2, headCenterY + 1, 2.2, 0.4, 2.6);
  ctx.stroke();

  // Warm cheek blush for happy / inspiring / emotional
  if (emotion === 'happy' || emotion === 'inspiring' || emotion === 'emotional') {
    ctx.fillStyle = 'rgba(225, 118, 98, 0.19)';
    ctx.beginPath();
    ctx.ellipse(5, headCenterY + 5, 4.8, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Hair Crown & Styled Bangs (7 distinct styles)
  ctx.fillStyle = st.hairColor;
  if (hairStyleId === 'bald-elder') {
    // Side fringe hair only, receding smooth crown
    ctx.beginPath();
    ctx.moveTo(-14.5, headCenterY - 2);
    ctx.quadraticCurveTo(-15.5, headCenterY - 12, -8, headCenterY - 12);
    ctx.quadraticCurveTo(-10, headCenterY - 5, -11, headCenterY + 2);
    ctx.closePath();
    ctx.fill();
  } else if (hairStyleId === 'curly-voluminous') {
    // Voluminous curly puffs around crown
    const puffs = [
      [-12, headCenterY - 8, 6.8],
      [-7, headCenterY - 16, 7.6],
      [1, headCenterY - 19, 8.0],
      [9, headCenterY - 16, 7.2],
      [13.5, headCenterY - 11, 5.5],
      [-13, headCenterY - 1, 5.4],
    ];
    for (const [px, py, pr] of puffs) {
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = st.hairHighlight;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(1, headCenterY - 17, 5, Math.PI * 1.1, Math.PI * 1.85);
    ctx.stroke();
  } else if (hairStyleId === 'spiky-modern') {
    ctx.beginPath();
    ctx.moveTo(-14.5, headCenterY - 1);
    ctx.lineTo(-17, headCenterY - 14);
    ctx.lineTo(-10, headCenterY - 16);
    ctx.lineTo(-10, headCenterY - 25);
    ctx.lineTo(-2, headCenterY - 19);
    ctx.lineTo(3, headCenterY - 27);
    ctx.lineTo(8, headCenterY - 19);
    ctx.lineTo(16, headCenterY - 21);
    ctx.lineTo(15.5, headCenterY - 9);
    ctx.quadraticCurveTo(6, headCenterY - 13, -6, headCenterY - 9);
    ctx.lineTo(-11, headCenterY + 1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = st.hairHighlight;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-2, headCenterY - 18);
    ctx.lineTo(3, headCenterY - 24);
    ctx.stroke();
  } else if (hairStyleId === 'parted-neat') {
    ctx.beginPath();
    ctx.moveTo(-14.5, headCenterY - 2);
    ctx.bezierCurveTo(-16.5, headCenterY - 22, 13, headCenterY - 25, 16, headCenterY - 10);
    ctx.quadraticCurveTo(9, headCenterY - 15, 2, headCenterY - 12);
    ctx.quadraticCurveTo(-7, headCenterY - 11, -11, headCenterY + 1);
    ctx.closePath();
    ctx.fill();
    // Crisp side-part line
    ctx.strokeStyle = st.skinHighlight;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-4, headCenterY - 17);
    ctx.lineTo(4, headCenterY - 13);
    ctx.stroke();
  } else {
    // Classic short / long-flowing / traditional bun crown
    ctx.beginPath();
    ctx.moveTo(-14.5, headCenterY - 2);
    ctx.bezierCurveTo(-17, headCenterY - 23, 12, headCenterY - 26, 15.5, headCenterY - 10);
    ctx.quadraticCurveTo(8, headCenterY - 14, -1, headCenterY - 11);
    ctx.quadraticCurveTo(-9, headCenterY - 10, -11, headCenterY + 1);
    ctx.closePath();
    ctx.fill();

    // Subtle hair highlight streak
    ctx.strokeStyle = st.hairHighlight;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(-1, headCenterY - 12, 9, Math.PI * 1.15, Math.PI * 1.75);
    ctx.stroke();
  }

  // Traditional red bindi for Mother
  if (role === 'mother' && st.isFemale) {
    ctx.fillStyle = '#B82626';
    ctx.beginPath();
    ctx.arc(10.5, headCenterY - 5.5, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Optional Headwear accessories (Cap / Traditional Tupi / Classic Hat / Royal Crown)
  if (hasTupi) {
    // Traditional embroidered Bengali white/cream Tupi skullcap
    ctx.fillStyle = '#F7F3EA';
    ctx.beginPath();
    ctx.moveTo(-14.5, headCenterY - 10);
    ctx.quadraticCurveTo(-14, headCenterY - 24, 0, headCenterY - 24.5);
    ctx.quadraticCurveTo(14.5, headCenterY - 24, 15, headCenterY - 10);
    ctx.closePath();
    ctx.fill();
    // Embroidered geometric rim band
    ctx.strokeStyle = st.accentColor;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-14, headCenterY - 12.5);
    ctx.quadraticCurveTo(0, headCenterY - 14.5, 14.5, headCenterY - 12.5);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(130, 118, 96, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-14.5, headCenterY - 10);
    ctx.lineTo(15, headCenterY - 10);
    ctx.stroke();
  } else if (hasHat) {
    // Classic brimmed fedora / storyteller hat
    ctx.fillStyle = st.topShadow;
    ctx.beginPath();
    ctx.ellipse(1, headCenterY - 11.5, 22, 4.2, -0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = st.bottomColor;
    ctx.beginPath();
    ctx.moveTo(-13.5, headCenterY - 12);
    ctx.lineTo(-10.5, headCenterY - 26);
    ctx.quadraticCurveTo(0, headCenterY - 29, 10.5, headCenterY - 26);
    ctx.lineTo(14, headCenterY - 12);
    ctx.closePath();
    ctx.fill();
    // Hat ribbon band
    ctx.fillStyle = st.accentColor;
    ctx.fillRect(-13.2, headCenterY - 15.5, 26.8, 3.2);
  } else if (hasCrown) {
    // Golden fairy-tale royal crown
    ctx.fillStyle = '#F2BD3E';
    ctx.beginPath();
    ctx.moveTo(-13, headCenterY - 12);
    ctx.lineTo(-14, headCenterY - 25);
    ctx.lineTo(-6, headCenterY - 18);
    ctx.lineTo(0, headCenterY - 28);
    ctx.lineTo(6.5, headCenterY - 18);
    ctx.lineTo(14, headCenterY - 25);
    ctx.lineTo(13, headCenterY - 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#9E6E14';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // Crown center jewel
    ctx.fillStyle = '#C93838';
    ctx.beginPath();
    ctx.arc(0, headCenterY - 16, 2.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (hasCap) {
    ctx.fillStyle = st.accentColor;
    ctx.beginPath();
    ctx.arc(0, headCenterY - 9, 15.5, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = st.topShadow;
    ctx.beginPath();
    ctx.ellipse(8, headCenterY - 9, 14, 3.2, 0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  // === EXPRESSIVE EYES (Sclera + Iris + Pupil + Specular Catchlight + Blink) ===
  const eyeX = 8.2;
  const eyeY = headCenterY - 1.5;
  const farEyeX = 13.8;
  const eyeOpenH = Math.max(0.5, 3.4 * (1 - blinkAmount));

  const drawEye = (ex: number, ey: number, rx: number) => {
    if (blinkAmount > 0.78) {
      // Closed expressive eyelid arc
      ctx.strokeStyle = '#2A1D18';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(ex - rx, ey);
      ctx.quadraticCurveTo(ex, ey + 1.8, ex + rx, ey);
      ctx.stroke();
      return;
    }
    // Sclera
    ctx.fillStyle = '#F7F4EE';
    ctx.beginPath();
    ctx.ellipse(ex, ey, rx, eyeOpenH, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iris & Pupil with gentle gaze shift
    const gazeX = Math.sin(time * 0.7) * 0.45;
    ctx.fillStyle = '#2B1F19';
    ctx.beginPath();
    ctx.arc(ex + 0.6 + gazeX, ey, Math.min(2.1, eyeOpenH * 0.82), 0, Math.PI * 2);
    ctx.fill();

    // Tiny white specular catchlight (gives real human life!)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ex + 1.2 + gazeX, ey - 0.8, 0.75, 0, Math.PI * 2);
    ctx.fill();

    // Upper eyelid lash crease
    ctx.strokeStyle = '#231814';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(ex - rx - 0.4, ey - 0.6);
    ctx.quadraticCurveTo(ex, ey - eyeOpenH - 1.1, ex + rx + 0.4, ey - 0.3);
    ctx.stroke();
  };

  drawEye(eyeX, eyeY, 3.3);
  drawEye(farEyeX, eyeY, 2.0);

  // Subtle tear glint when deeply emotional or sad
  if (emotion === 'emotional' || emotion === 'sad') {
    ctx.fillStyle = 'rgba(186, 224, 250, 0.75)';
    ctx.beginPath();
    ctx.arc(eyeX - 1.2, eyeY + 3.4, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // === ARTICULATED EYEBROWS (Driven by Emotion + Voice Emphasis) ===
  const browLift = energy * 1.4;
  ctx.strokeStyle = st.hairColor;
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (emotion === 'sad' || emotion === 'worried' || emotion === 'emotional') {
    // Inner brow raised tenderly, outer sloped down
    ctx.moveTo(eyeX - 3.6, eyeY - 4.4);
    ctx.quadraticCurveTo(eyeX, eyeY - 6.4 - browLift, eyeX + 3.4, eyeY - 6.8 - browLift);
  } else if (emotion === 'determined' || emotion === 'angry') {
    // Focused angled brow
    ctx.moveTo(eyeX - 3.6, eyeY - 6.8 - browLift * 0.4);
    ctx.lineTo(eyeX + 3.6, eyeY - 4.6);
  } else if (emotion === 'happy' || emotion === 'inspiring') {
    // Warm uplifted arch
    ctx.moveTo(eyeX - 3.6, eyeY - 5.8 - browLift);
    ctx.quadraticCurveTo(eyeX, eyeY - 8.2 - browLift, eyeX + 3.6, eyeY - 6.0 - browLift);
  } else {
    // Calm natural brow
    ctx.moveTo(eyeX - 3.4, eyeY - 5.6 - browLift * 0.5);
    ctx.quadraticCurveTo(eyeX, eyeY - 6.8 - browLift * 0.5, eyeX + 3.4, eyeY - 5.6 - browLift * 0.5);
  }
  ctx.stroke();

  // Optional Glasses (Teacher / Elder / Doctor)
  if (st.hasGlasses) {
    ctx.strokeStyle = '#383B44';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.roundRect(eyeX - 4.2, eyeY - 3.8, 8.4, 7.2, 2.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(eyeX - 4.2, eyeY - 1);
    ctx.lineTo(-11, eyeY - 2);
    ctx.stroke();
  }

  // Nose bridge & soft nostril contour
  ctx.strokeStyle = st.skinShadow;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(12.2, headCenterY - 2);
  ctx.lineTo(14.8, headCenterY + 3.2);
  ctx.quadraticCurveTo(13.2, headCenterY + 4.4, 11.4, headCenterY + 3.8);
  ctx.stroke();

  // Mustache / Beard (tracks subtle chin articulation)
  if (st.hasBeard) {
    ctx.fillStyle = st.hairColor;
    ctx.beginPath();
    ctx.moveTo(1, headCenterY + 10 + jawDropPx * 0.25);
    ctx.quadraticCurveTo(10, headCenterY + 12 + jawDropPx * 0.5, 13.5, headCenterY + 9 + jawDropPx * 0.4);
    ctx.quadraticCurveTo(12, headCenterY + 22 + jawDropPx, 2, headCenterY + 21 + jawDropPx);
    ctx.quadraticCurveTo(-4, headCenterY + 18 + jawDropPx * 0.8, 1, headCenterY + 10 + jawDropPx * 0.25);
    ctx.closePath();
    ctx.fill();
  }
  if (st.hasMustache) {
    ctx.fillStyle = st.hairColor;
    ctx.beginPath();
    ctx.ellipse(10.5, headCenterY + 6.4, 4.6, 1.6, 0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  // === PHONEME-LINKED MULTI-VISEME LIP-SYNC MOUTH ===
  const mouthX = 10.2;
  const mouthY = headCenterY + 9.8;

  if (activeViseme) {
    drawVisemeMouth(ctx, mouthX, mouthY, activeViseme, emotion);
  } else {
    // Fallback modulation if no viseme pose passed
    const syllablePrimary = 0.5 + 0.5 * Math.sin(time * 16.5);
    const syllableSecondary = 0.5 + 0.5 * Math.cos(time * 25.2 + 0.8);
    const visemePhase = syllablePrimary * 0.65 + syllableSecondary * 0.35;
    const mouthOpen = isSpeaking ? Math.min(6.0, energy * 6.8 * visemePhase) : 0;
    const fallbackPose: VisemePose =
      mouthOpen <= 0.75
        ? {
            id: 'rest',
            openness: 0,
            width: 0.48,
            roundness: 0,
            lipPress: 0,
            teethUpper: 0,
            teethLower: 0,
            tongueTip: 0,
            jawDrop: 0,
          }
        : {
            id: mouthOpen > 3.6 ? 'AA' : 'EE',
            openness: Math.min(1, mouthOpen / 5.8),
            width: 0.5 + energy * 0.25 + Math.sin(time * 12.2) * 0.14,
            roundness: mouthOpen > 3.8 ? 0.3 : 0.1,
            lipPress: 0,
            teethUpper: mouthOpen > 1.7 ? 0.75 : 0.2,
            teethLower: mouthOpen > 2.8 ? 0.35 : 0,
            tongueTip: mouthOpen > 2.4 ? 0.45 : 0,
            jawDrop: Math.min(1, mouthOpen / 5.8),
          };
    drawVisemeMouth(ctx, mouthX, mouthY, fallbackPose, emotion);
  }

  ctx.restore(); // End head transform

  // 5. Front Expressive Arm (2-bone shoulder -> elbow -> wrist + hand + optional prop)
  const fShoulderX = st.shoulderWidth * 0.36;
  let fElbowX = fShoulderX + 4;
  let fElbowY = localShoulderY + 26;
  let fWristX = fShoulderX + 12;
  let fWristY = localShoulderY + 46;
  let handAngle = 0.2;

  if (pose === 'celebrating') {
    fElbowX = fShoulderX + 18;
    fElbowY = localShoulderY - 10;
    fWristX = fShoulderX + 16;
    fWristY = localShoulderY - 38 + Math.sin(time * 6 + 1) * 4;
    handAngle = -1.2;
  } else if (pose === 'praying') {
    fElbowX = fShoulderX + 8;
    fElbowY = localShoulderY + 24;
    fWristX = fShoulderX + 20;
    fWristY = localShoulderY + 10;
    handAngle = -0.7;
  } else if (pose === 'sitting-desk') {
    fElbowX = fShoulderX + 12;
    fElbowY = localShoulderY + 24;
    fWristX = fShoulderX + 30;
    fWristY = localShoulderY + 24 + Math.sin(time * 7) * 1.5;
    handAngle = 0.05;
  } else if (pose === 'standing-speak' || pose === 'portrait-speak') {
    // Dynamic voice-driven hand gesturing (feels like a real speaker!)
    const gLift = Math.sin(time * 3.1) * (5 + energy * 14);
    const gReach = Math.cos(time * 2.4) * (3 + energy * 7);
    fElbowX = fShoulderX + 10 + gReach * 0.4;
    fElbowY = localShoulderY + 24 - gLift * 0.25;
    fWristX = fShoulderX + 24 + gReach;
    fWristY = localShoulderY + 16 - gLift;
    handAngle = -0.35 - energy * 0.3;
  } else if (pose === 'walking' || pose === 'running') {
    const swing = Math.sin(stridePhase + Math.PI) * (pose === 'running' ? 18 : 11);
    fElbowX = fShoulderX + swing * 0.6;
    fElbowY = localShoulderY + 23;
    fWristX = fShoulderX + swing * 1.2;
    fWristY = localShoulderY + 42 - Math.abs(swing) * 0.25;
    handAngle = swing * 0.03;
  } else if (prop !== 'none' && prop !== 'backpack') {
    fElbowX = fShoulderX + 10;
    fElbowY = localShoulderY + 24;
    fWristX = fShoulderX + 24;
    fWristY = localShoulderY + 18;
    handAngle = -0.25;
  }

  drawSegmentLimb(
    ctx,
    fShoulderX,
    localShoulderY + 9,
    fElbowX,
    fElbowY,
    fWristX,
    fWristY,
    st.topColor,
    st.topColor,
    10,
    8.2
  );
  drawExpressiveHand(ctx, fWristX, fWristY, st.skinBase, st.skinShadow, handAngle, 0.35 + energy * 0.65);

  if (hasWatch) {
    ctx.fillStyle = '#C9A24D';
    ctx.beginPath();
    ctx.roundRect(fWristX - 4, fWristY - 3, 7, 4.5, 1.5);
    ctx.fill();
  }

  if (prop !== 'none' && prop !== 'backpack') {
    drawPropInHand(ctx, fWristX + 4, fWristY, prop, time);
  }

  ctx.restore(); // End torso transform
  ctx.restore(); // End root transform
}

/**
 * Draws an anatomically distinct 2D mouth contour driven by continuous co-articulated VisemePose
 * parameters (lip press, labiodental teeth-lip tuck, sibilant slit, lifted tongue tip, rounded O/U, wide AA).
 */
export function drawVisemeMouth(
  ctx: CanvasRenderingContext2D,
  mouthX: number,
  mouthY: number,
  pose: VisemePose,
  emotion: EmotionTone
): void {
  const { id, openness, width, roundness, lipPress, teethUpper, teethLower, tongueTip } = pose;

  // 1. Bilabial Lip Press (M / B / P / ব / প / ম): pressed lips rolled slightly inward, zero teeth
  if (id === 'MBP' || (lipPress > 0.45 && openness < 0.14)) {
    const pressW = 3.4 + (width - 0.5) * 1.4;
    ctx.strokeStyle = '#6D352E';
    ctx.lineWidth = 1.9 + lipPress * 0.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(mouthX - pressW, mouthY + 0.2);
    ctx.quadraticCurveTo(mouthX, mouthY + 0.6, mouthX + pressW, mouthY);
    ctx.stroke();

    // Soft lip pillow highlight beneath pressed seam
    ctx.strokeStyle = 'rgba(155, 86, 74, 0.55)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(mouthX - pressW * 0.72, mouthY + 1.8);
    ctx.quadraticCurveTo(mouthX, mouthY + 2.3, mouthX + pressW * 0.72, mouthY + 1.7);
    ctx.stroke();
    return;
  }

  // 2. Rest / Silence: Emotion-matched closed lip contour
  if (id === 'rest' || openness < 0.05) {
    ctx.strokeStyle = '#6D352E';
    ctx.lineWidth = 1.7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (emotion === 'happy' || emotion === 'inspiring') {
      ctx.moveTo(mouthX - 4.2, mouthY - 0.5);
      ctx.quadraticCurveTo(mouthX, mouthY + 3.2, mouthX + 4.0, mouthY - 1.2);
    } else if (emotion === 'sad' || emotion === 'worried' || emotion === 'emotional') {
      ctx.moveTo(mouthX - 3.6, mouthY + 1.4);
      ctx.quadraticCurveTo(mouthX, mouthY - 1.4, mouthX + 3.6, mouthY + 1.2);
    } else if (emotion === 'determined' || emotion === 'angry') {
      ctx.moveTo(mouthX - 4.0, mouthY + 0.4);
      ctx.lineTo(mouthX + 3.6, mouthY - 0.2);
    } else {
      ctx.moveTo(mouthX - 3.8, mouthY);
      ctx.quadraticCurveTo(mouthX, mouthY + 1.4, mouthX + 3.8, mouthY - 0.2);
    }
    ctx.stroke();
    return;
  }

  // 3. Labiodental (F / V / ফ): upper teeth biting cleanly onto tucked lower lip
  if (id === 'FV' || (teethUpper > 0.6 && openness < 0.24 && roundness < 0.15 && width < 0.65)) {
    const fw = 3.8;
    ctx.fillStyle = '#521E22';
    ctx.beginPath();
    ctx.ellipse(mouthX, mouthY + 0.5, fw, 1.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Visible upper teeth resting against lower lip
    ctx.fillStyle = '#F8F5EE';
    ctx.beginPath();
    ctx.roundRect(mouthX - fw * 0.72, mouthY - 0.6, fw * 1.44, 1.6, 0.5);
    ctx.fill();

    // Tucked lower lip
    ctx.strokeStyle = '#8F4C44';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(mouthX - fw, mouthY + 1.1);
    ctx.quadraticCurveTo(mouthX, mouthY + 2.4, mouthX + fw, mouthY + 1.0);
    ctx.stroke();
    return;
  }

  // 4. Open / Rounded / Sibilant / Dental Phoneme Articulation
  // rx narrows cleanly for OO/OH and widens for EE/SSZ/AA
  const rx = Math.max(1.65, 1.85 + width * 3.5 - roundness * 1.45);
  const ry = Math.max(0.95, openness * 4.9);
  const centerY = mouthY + ry * 0.24;

  // Inner oral cavity
  ctx.fillStyle = '#4B191E';
  ctx.beginPath();
  ctx.ellipse(mouthX, centerY, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  // Clip teeth & tongue cleanly inside the inner oral cavity
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(mouthX, centerY, Math.max(1.1, rx - 0.2), Math.max(0.7, ry - 0.15), 0, 0, Math.PI * 2);
  ctx.clip();

  // Tongue position: raised tip for TH/L, warm low floor for AA/EE
  if (tongueTip > 0.52) {
    ctx.fillStyle = '#C9686B';
    ctx.beginPath();
    ctx.ellipse(
      mouthX + 0.3,
      centerY - ry * 0.08,
      rx * 0.68,
      Math.max(1.0, ry * 0.58),
      -0.1,
      0,
      Math.PI * 2
    );
    ctx.fill();
  } else if (ry > 1.7) {
    ctx.fillStyle = '#A84A4D';
    ctx.beginPath();
    ctx.ellipse(mouthX, centerY + ry * 0.52, rx * 0.66, ry * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Upper teeth row (refined natural enamel proportion so teeth sit cleanly along upper gumline)
  if (teethUpper > 0.25 && roundness < 0.72) {
    ctx.fillStyle = '#F3EFE6';
    const toothH = Math.min(ry * 0.44, 0.55 + teethUpper * 0.65);
    ctx.fillRect(mouthX - rx * 0.84, centerY - ry, rx * 1.68, toothH);
  }

  // Lower teeth hint (sibilant clenched slit SSZ or wide AA)
  if (teethLower > 0.32 && roundness < 0.45 && ry > 1.25) {
    ctx.fillStyle = '#E5DFD2';
    const lToothH = Math.min(ry * 0.34, 0.45 + teethLower * 0.52);
    ctx.fillRect(mouthX - rx * 0.74, centerY + ry - lToothH, rx * 1.48, lToothH);
  }

  ctx.restore();

  // Subtle upper lip contour & lower lip highlight
  if (roundness <= 0.6) {
    ctx.strokeStyle = 'rgba(118, 56, 48, 0.72)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(mouthX, centerY - ry * 0.08, Math.max(2.1, rx * 0.92), Math.PI + 0.22, -0.22);
    ctx.stroke();
  }

  // Outer lip contour (full rounded ring for OO/OH, expressive lower lip highlight for vowels)
  ctx.strokeStyle = roundness > 0.6 ? '#7D3C36' : '#8F4C44';
  ctx.lineWidth = roundness > 0.6 ? 1.55 : 1.2;
  ctx.beginPath();
  if (roundness > 0.6) {
    ctx.ellipse(mouthX, centerY, rx + 0.45, ry + 0.45, 0, 0, Math.PI * 2);
  } else {
    ctx.arc(mouthX, centerY + ry * 0.14, Math.max(2.3, rx * 0.9), 0.18, Math.PI - 0.18);
  }
  ctx.stroke();
}

