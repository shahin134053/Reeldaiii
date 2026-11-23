import type { EmotionTone } from '../lib/storyCompiler';
import type { CharacterMotionStyle } from '../lib/studioAssetLibrary';
import type { HumanPose } from './humanRig';

export interface CutoutMotionInput {
  time: number;
  baseX: number;
  scale: number;
  facing: 1 | -1;
  naturalFacing?: 1 | -1;
  pose: HumanPose;
  emotion: EmotionTone;
  motionStyle?: CharacterMotionStyle;
  isSpeaking: boolean;
  speechEnergy: number;
  /** Optional stage half-width budget around baseX so characters never clip out of frame */
  maxOffsetX?: number;
  /** Keep facing locked toward partner/camera (e.g. two-person conversation or portrait) */
  lockFacing?: boolean;
}

export interface CutoutMotionOutput {
  offsetX: number;
  offsetY: number;
  tilt: number;
  scaleX: number;
  scaleY: number;
  /** Final canvas horizontal scale sign (incorporates direction of travel + naturalFacing) */
  flipX: 1 | -1;
  /** Normalized gait/cycle phase in radians */
  stridePhase: number;
  /** True when the character is visibly traveling/stepping horizontally */
  isMovingHorizontally: boolean;
}

/**
 * Pure kinematic motion solver for 2D illustrated character cutouts.
 * Ensures every selected character moves organically across stage space (pacing,
 * striding, pedaling, sprinting, breathing, leaning, and gesturing) and never stands frozen.
 */
export function computeCutoutMotion(input: CutoutMotionInput): CutoutMotionOutput {
  const {
    time,
    baseX,
    scale,
    facing,
    naturalFacing = 1,
    pose,
    emotion,
    motionStyle = 'gentle-pace',
    isSpeaking,
    speechEnergy,
    maxOffsetX = 68,
    lockFacing = false,
  } = input;

  const energy = isSpeaking ? Math.max(0.14, speechEnergy) : speechEnergy * 0.35;
  const seed = (Math.abs(baseX) * 0.017) % (Math.PI * 2);
  const isPortrait = pose === 'portrait-speak';
  const isDesk = pose === 'sitting-desk';

  const safeLimit = Math.max(12, maxOffsetX);

  let paceFreq = 0.78;
  let paceSpan = 26 * scale;
  let stepFreq = 4.4;
  let bounceAmp = 5.2 * scale;
  let baseTiltAmp = 0.036;
  let forwardLean = 0;

  switch (motionStyle) {
    case 'vehicle-rickshaw':
      paceFreq = 0.56;
      paceSpan = 60 * scale;
      stepFreq = 7.4;
      bounceAmp = 4.2 * scale;
      baseTiltAmp = 0.028;
      forwardLean = 0.018;
      break;
    case 'runner':
      paceFreq = 0.84;
      paceSpan = 56 * scale;
      stepFreq = 8.6;
      bounceAmp = 11.5 * scale;
      baseTiltAmp = 0.042;
      forwardLean = 0.075;
      break;
    case 'walking-pull':
      paceFreq = 0.62;
      paceSpan = 46 * scale;
      stepFreq = 5.6;
      bounceAmp = 6.8 * scale;
      baseTiltAmp = 0.038;
      forwardLean = 0.045;
      break;
    case 'active-stride':
      paceFreq = 0.72;
      paceSpan = 34 * scale;
      stepFreq = 4.8;
      bounceAmp = 5.8 * scale;
      baseTiltAmp = 0.038;
      forwardLean = 0.02;
      break;
    case 'painter-sway':
      paceFreq = 0.92;
      paceSpan = 24 * scale;
      stepFreq = 3.9;
      bounceAmp = 4.6 * scale;
      baseTiltAmp = 0.045;
      break;
    case 'lab-spark':
      paceFreq = 0.88;
      paceSpan = 22 * scale;
      stepFreq = 4.1;
      bounceAmp = 4.4 * scale;
      baseTiltAmp = 0.034;
      break;
    case 'camera-snap':
      paceFreq = 0.82;
      paceSpan = 25 * scale;
      stepFreq = 4.0;
      bounceAmp = 4.2 * scale;
      baseTiltAmp = 0.04;
      break;
    case 'expressive-talk':
      paceFreq = 0.9;
      paceSpan = 22 * scale;
      stepFreq = 4.2;
      bounceAmp = 4.8 * scale;
      baseTiltAmp = 0.042;
      break;
    default:
      break;
  }

  // Amplify locomotion when scene explicitly requests walking/running/celebrating
  if (pose === 'running') {
    stepFreq = Math.max(stepFreq, 8.8);
    bounceAmp = Math.max(bounceAmp, 11 * scale);
    paceSpan = Math.max(paceSpan, 48 * scale);
    forwardLean = Math.max(forwardLean, 0.07);
  } else if (pose === 'walking') {
    stepFreq = Math.max(stepFreq, 5.4);
    bounceAmp = Math.max(bounceAmp, 6.4 * scale);
    paceSpan = Math.max(paceSpan, 38 * scale);
  } else if (pose === 'celebrating') {
    stepFreq = Math.max(stepFreq, 6.4);
    bounceAmp = Math.max(bounceAmp, 9.5 * scale);
  } else if (isPortrait) {
    paceSpan = Math.min(paceSpan, 10 * scale);
    bounceAmp = Math.min(bounceAmp, 4.2 * scale);
  } else if (isDesk) {
    paceSpan = Math.min(paceSpan, 9 * scale);
    bounceAmp = Math.min(bounceAmp, 3.2 * scale);
  }

  const clampedSpan = Math.min(safeLimit, paceSpan);
  const phase = time * paceFreq + seed;
  const offsetX = Math.sin(phase) * clampedSpan;
  const velocitySign: 1 | -1 = Math.cos(phase) >= 0 ? 1 : -1;

  // Turn naturally toward direction of travel on dynamic traversal styles when not locked
  const allowTravelTurn =
    !lockFacing &&
    !isPortrait &&
    !isDesk &&
    (motionStyle === 'vehicle-rickshaw' ||
      motionStyle === 'runner' ||
      motionStyle === 'walking-pull' ||
      motionStyle === 'active-stride');

  const activeFacing: 1 | -1 = allowTravelTurn ? velocitySign : facing;
  const flipX: 1 | -1 = (activeFacing * naturalFacing) >= 0 ? 1 : -1;

  const stridePhase = time * stepFreq + seed;
  const stepWave = Math.abs(Math.sin(stridePhase));
  const speechBounce = isSpeaking ? Math.abs(Math.sin(time * 6.2 + seed)) * energy * 3.4 * scale : 0;
  const happyBoost = emotion === 'happy' || emotion === 'inspiring' ? 1.15 : 1.0;
  const offsetY = (stepWave * bounceAmp + speechBounce) * happyBoost;

  const emotionTilt =
    emotion === 'sad' || emotion === 'emotional'
      ? 0.025
      : emotion === 'determined' || emotion === 'angry'
        ? 0.032
        : 0;
  const speechTilt = isSpeaking ? Math.sin(time * 4.8 + seed) * (0.028 * energy + 0.012) : 0;
  const swayTilt = Math.sin(stridePhase * 0.5) * baseTiltAmp;
  const tilt = forwardLean + emotionTilt + swayTilt + speechTilt;

  // Squash & stretch linked directly to footstep/bounce peaks and speech accents
  const squashPulse = Math.sin(stridePhase * 2) * 0.022 + (isSpeaking ? energy * 0.028 : 0);
  const breathPulse = Math.sin(time * 2.5 + seed) * 0.016;
  const scaleY = 1 + breathPulse + squashPulse;
  const scaleX = 1 - breathPulse * 0.65 - squashPulse * 0.6;

  return {
    offsetX,
    offsetY,
    tilt,
    scaleX,
    scaleY,
    flipX,
    stridePhase,
    isMovingHorizontally: clampedSpan > 11,
  };
}
