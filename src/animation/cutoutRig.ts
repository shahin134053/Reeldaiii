import type { EmotionTone } from '../lib/storyCompiler';
import type { CharacterMotionStyle } from '../lib/studioAssetLibrary';
import type { VisemePose } from '../lib/visemeEngine';
import { computeCutoutMotion } from './cutoutMotion';
import type { HumanPose } from './humanRig';

export type CutoutRigArchetype =
  | 'biped'
  | 'biped-skirt'
  | 'runner-profile'
  | 'rickshaw-puller'
  | 'rickshaw-cyclist';

export type ArmMobilityMode = 'free-limb' | 'coupled-prop';

export type RigidPropBone = 'torso' | 'head' | 'armL' | 'armR';

export interface RigidPropRegion {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  bone: RigidPropBone;
  /** Motion amplitude scalar (0..1) keeping attached prop natural without distortion */
  weightScale: number;
}

export interface CutoutRigSpec {
  id: string;
  archetype: CutoutRigArchetype;
  /** Identified full facial & head anatomy in normalized trimmed-sprite coords (0..1) */
  neckY: number;
  headMinX: number;
  headMaxX: number;
  torsoCenterX: number;
  shoulderY: number;
  armpitY: number;
  hipY: number;
  /** Exact top row where left leg & right leg separate cleanly by transparent space */
  crotchY: number;
  kneeY: number;
  legSplitX: number;
  legMinX: number;
  legMaxX: number;
  armCutL: number;
  armCutR: number;
  armTopYL?: number;
  armTopYR?: number;
  armModeL: ArmMobilityMode;
  armModeR: ArmMobilityMode;
  armWeightL: number;
  armWeightR: number;
  /** Solid object regions (paddy, bag, laptop, holster/pistol, spade, camera, clipboard) pinned without bending */
  rigidProps: RigidPropRegion[];
  /** Eyes, nose, ears & mouth landmarks */
  mouthX: number;
  mouthY: number;
  mouthRadius: number;
  noseX: number;
  noseY: number;
  earLX: number;
  earRX: number;
  earY: number;
  eyeLX: number;
  eyeRX: number;
  eyeY: number;
  eyeRadius: number;
  hasMustache?: boolean;
  hasBeard?: boolean;
}

export const CUTOUT_RIG_SPECS: Record<string, CutoutRigSpec> = {
  'char-police-officer': {
    id: 'char-police-officer',
    archetype: 'biped',
    neckY: 0.215,
    headMinX: 0.30,
    headMaxX: 0.78,
    torsoCenterX: 0.55,
    shoulderY: 0.255,
    armpitY: 0.36,
    hipY: 0.575,
    crotchY: 0.62,
    kneeY: 0.78,
    legSplitX: 0.525,
    legMinX: 0.18,
    legMaxX: 0.81,
    armCutL: 0.24,
    armCutR: 0.845,
    armModeL: 'coupled-prop',
    armModeR: 'free-limb',
    armWeightL: 0.28,
    armWeightR: 0.65,
    rigidProps: [
      { x0: 0.18, y0: 0.43, x1: 0.835, y1: 0.57, bone: 'torso', weightScale: 0.14 },
    ],
    mouthX: 0.555,
    mouthY: 0.168,
    mouthRadius: 0.052,
    noseX: 0.57,
    noseY: 0.145,
    earLX: 0.38,
    earRX: 0.69,
    earY: 0.135,
    eyeLX: 0.505,
    eyeRX: 0.605,
    eyeY: 0.125,
    eyeRadius: 0.032,
  },
  'char-nurse': {
    id: 'char-nurse',
    archetype: 'biped',
    neckY: 0.21,
    headMinX: 0.22,
    headMaxX: 0.66,
    torsoCenterX: 0.42,
    shoulderY: 0.245,
    armpitY: 0.34,
    hipY: 0.53,
    crotchY: 0.66,
    kneeY: 0.81,
    legSplitX: 0.39,
    legMinX: 0.12,
    legMaxX: 0.69,
    armCutL: 0.21,
    armCutR: 0.61,
    armModeL: 'coupled-prop',
    armModeR: 'free-limb',
    armWeightL: 0.24,
    armWeightR: 1.0,
    rigidProps: [
      { x0: 0.0, y0: 0.35, x1: 0.47, y1: 0.57, bone: 'armL', weightScale: 1.0 },
    ],
    mouthX: 0.415,
    mouthY: 0.148,
    mouthRadius: 0.062,
    noseX: 0.43,
    noseY: 0.125,
    earLX: 0.28,
    earRX: 0.54,
    earY: 0.112,
    eyeLX: 0.375,
    eyeRX: 0.455,
    eyeY: 0.102,
    eyeRadius: 0.028,
  },
  'char-airline-pilot': {
    id: 'char-airline-pilot',
    archetype: 'biped',
    neckY: 0.22,
    headMinX: 0.28,
    headMaxX: 0.68,
    torsoCenterX: 0.47,
    shoulderY: 0.26,
    armpitY: 0.35,
    hipY: 0.585,
    crotchY: 0.64,
    kneeY: 0.80,
    legSplitX: 0.468,
    legMinX: 0.27,
    legMaxX: 0.66,
    armCutL: 0.26,
    armCutR: 0.66,
    armTopYR: 0.17,
    armModeL: 'coupled-prop',
    armModeR: 'free-limb',
    armWeightL: 0.18,
    armWeightR: 1.05,
    rigidProps: [
      { x0: 0.0, y0: 0.50, x1: 0.27, y1: 1.0, bone: 'armL', weightScale: 1.0 },
    ],
    mouthX: 0.465,
    mouthY: 0.184,
    mouthRadius: 0.044,
    noseX: 0.465,
    noseY: 0.148,
    earLX: 0.33,
    earRX: 0.60,
    earY: 0.14,
    eyeLX: 0.42,
    eyeRX: 0.515,
    eyeY: 0.132,
    eyeRadius: 0.025,
  },
  'char-business-executive': {
    id: 'char-business-executive',
    archetype: 'biped',
    neckY: 0.195,
    headMinX: 0.32,
    headMaxX: 0.78,
    torsoCenterX: 0.56,
    shoulderY: 0.235,
    armpitY: 0.33,
    hipY: 0.535,
    crotchY: 0.65,
    kneeY: 0.80,
    legSplitX: 0.585,
    legMinX: 0.32,
    legMaxX: 0.86,
    armCutL: 0.32,
    armCutR: 0.78,
    armModeL: 'coupled-prop',
    armModeR: 'coupled-prop',
    armWeightL: 0.26,
    armWeightR: 0.14,
    rigidProps: [
      { x0: 0.0, y0: 0.28, x1: 0.42, y1: 0.44, bone: 'armL', weightScale: 1.0 },
    ],
    mouthX: 0.52,
    mouthY: 0.142,
    mouthRadius: 0.072,
    noseX: 0.505,
    noseY: 0.122,
    earLX: 0.40,
    earRX: 0.67,
    earY: 0.11,
    eyeLX: 0.48,
    eyeRX: 0.57,
    eyeY: 0.102,
    eyeRadius: 0.032,
  },
  'char-architect': {
    id: 'char-architect',
    archetype: 'biped',
    neckY: 0.195,
    headMinX: 0.34,
    headMaxX: 0.74,
    torsoCenterX: 0.54,
    shoulderY: 0.24,
    armpitY: 0.34,
    hipY: 0.54,
    crotchY: 0.635,
    kneeY: 0.79,
    legSplitX: 0.53,
    legMinX: 0.36,
    legMaxX: 0.72,
    armCutL: 0.35,
    armCutR: 0.68,
    armModeL: 'coupled-prop',
    armModeR: 'coupled-prop',
    armWeightL: 0.20,
    armWeightR: 0.24,
    rigidProps: [
      { x0: 0.0, y0: 0.20, x1: 0.48, y1: 0.71, bone: 'torso', weightScale: 0.20 },
      { x0: 0.67, y0: 0.20, x1: 1.0, y1: 0.58, bone: 'armR', weightScale: 1.0 },
    ],
    mouthX: 0.545,
    mouthY: 0.142,
    mouthRadius: 0.068,
    noseX: 0.56,
    noseY: 0.122,
    earLX: 0.43,
    earRX: 0.66,
    earY: 0.112,
    eyeLX: 0.50,
    eyeRX: 0.59,
    eyeY: 0.105,
    eyeRadius: 0.03,
  },
  'char-school-teacher': {
    id: 'char-school-teacher',
    archetype: 'biped',
    neckY: 0.215,
    headMinX: 0.38,
    headMaxX: 0.78,
    torsoCenterX: 0.60,
    shoulderY: 0.255,
    armpitY: 0.35,
    hipY: 0.545,
    crotchY: 0.665,
    kneeY: 0.81,
    legSplitX: 0.625,
    legMinX: 0.38,
    legMaxX: 0.86,
    armCutL: 0.41,
    armCutR: 0.79,
    armModeL: 'free-limb',
    armModeR: 'coupled-prop',
    armWeightL: 1.0,
    armWeightR: 0.24,
    rigidProps: [
      { x0: 0.58, y0: 0.26, x1: 1.0, y1: 0.48, bone: 'armR', weightScale: 1.0 },
    ],
    mouthX: 0.575,
    mouthY: 0.165,
    mouthRadius: 0.06,
    noseX: 0.56,
    noseY: 0.144,
    earLX: 0.46,
    earRX: 0.72,
    earY: 0.132,
    eyeLX: 0.54,
    eyeRX: 0.62,
    eyeY: 0.125,
    eyeRadius: 0.028,
  },
  'char-scientist': {
    id: 'char-scientist',
    archetype: 'biped-skirt',
    neckY: 0.235,
    headMinX: 0.30,
    headMaxX: 0.72,
    torsoCenterX: 0.52,
    shoulderY: 0.275,
    armpitY: 0.37,
    hipY: 0.715,
    crotchY: 0.72,
    kneeY: 0.84,
    legSplitX: 0.52,
    legMinX: 0.30,
    legMaxX: 0.78,
    armCutL: 0.31,
    armCutR: 0.71,
    armModeL: 'free-limb',
    armModeR: 'coupled-prop',
    armWeightL: 0.65,
    armWeightR: 0.26,
    rigidProps: [
      { x0: 0.0, y0: 0.10, x1: 0.26, y1: 0.44, bone: 'armL', weightScale: 1.0 },
      { x0: 0.70, y0: 0.27, x1: 1.0, y1: 0.48, bone: 'armR', weightScale: 1.0 },
    ],
    mouthX: 0.51,
    mouthY: 0.184,
    mouthRadius: 0.055,
    noseX: 0.505,
    noseY: 0.164,
    earLX: 0.38,
    earRX: 0.63,
    earY: 0.155,
    eyeLX: 0.47,
    eyeRX: 0.56,
    eyeY: 0.145,
    eyeRadius: 0.026,
  },
  'char-software-engineer': {
    id: 'char-software-engineer',
    archetype: 'biped',
    neckY: 0.195,
    headMinX: 0.40,
    headMaxX: 0.82,
    torsoCenterX: 0.62,
    shoulderY: 0.24,
    armpitY: 0.34,
    hipY: 0.515,
    crotchY: 0.635,
    kneeY: 0.79,
    legSplitX: 0.635,
    legMinX: 0.40,
    legMaxX: 0.88,
    armCutL: 0.41,
    armCutR: 0.80,
    armModeL: 'coupled-prop',
    armModeR: 'coupled-prop',
    armWeightL: 0.22,
    armWeightR: 0.22,
    rigidProps: [
      { x0: 0.0, y0: 0.25, x1: 0.56, y1: 0.46, bone: 'armL', weightScale: 1.0 },
      { x0: 0.76, y0: 0.18, x1: 1.0, y1: 0.52, bone: 'torso', weightScale: 0.10 },
    ],
    mouthX: 0.595,
    mouthY: 0.142,
    mouthRadius: 0.056,
    noseX: 0.585,
    noseY: 0.122,
    earLX: 0.49,
    earRX: 0.73,
    earY: 0.115,
    eyeLX: 0.56,
    eyeRX: 0.64,
    eyeY: 0.105,
    eyeRadius: 0.026,
  },
  'char-day-laborer': {
    id: 'char-day-laborer',
    archetype: 'biped',
    neckY: 0.205,
    headMinX: 0.24,
    headMaxX: 0.64,
    torsoCenterX: 0.45,
    shoulderY: 0.245,
    armpitY: 0.35,
    hipY: 0.54,
    crotchY: 0.655,
    kneeY: 0.80,
    legSplitX: 0.455,
    legMinX: 0.18,
    legMaxX: 0.70,
    armCutL: 0.24,
    armCutR: 0.72,
    armModeL: 'coupled-prop',
    armModeR: 'coupled-prop',
    armWeightL: 0.16,
    armWeightR: 0.14,
    rigidProps: [
      { x0: 0.15, y0: 0.43, x1: 0.71, y1: 0.71, bone: 'torso', weightScale: 0.14 },
      { x0: 0.72, y0: 0.31, x1: 1.0, y1: 1.0, bone: 'armR', weightScale: 1.0 },
    ],
    mouthX: 0.44,
    mouthY: 0.15,
    mouthRadius: 0.056,
    noseX: 0.455,
    noseY: 0.132,
    earLX: 0.33,
    earRX: 0.55,
    earY: 0.12,
    eyeLX: 0.40,
    eyeRX: 0.475,
    eyeY: 0.115,
    eyeRadius: 0.024,
  },
  'char-western-farmer': {
    id: 'char-western-farmer',
    archetype: 'biped',
    neckY: 0.22,
    headMinX: 0.16,
    headMaxX: 0.74,
    torsoCenterX: 0.46,
    shoulderY: 0.26,
    armpitY: 0.35,
    hipY: 0.55,
    crotchY: 0.615,
    kneeY: 0.78,
    legSplitX: 0.45,
    legMinX: 0.18,
    legMaxX: 0.70,
    armCutL: 0.25,
    armCutR: 0.67,
    armTopYR: 0.12,
    armModeL: 'coupled-prop',
    armModeR: 'free-limb',
    armWeightL: 0.32,
    armWeightR: 1.15,
    rigidProps: [],
    mouthX: 0.46,
    mouthY: 0.165,
    mouthRadius: 0.058,
    noseX: 0.465,
    noseY: 0.145,
    earLX: 0.31,
    earRX: 0.59,
    earY: 0.135,
    eyeLX: 0.415,
    eyeRX: 0.50,
    eyeY: 0.128,
    eyeRadius: 0.026,
    hasBeard: true,
  },
  'char-bd-farmer-spade': {
    id: 'char-bd-farmer-spade',
    archetype: 'biped-skirt',
    neckY: 0.205,
    headMinX: 0.36,
    headMaxX: 0.72,
    torsoCenterX: 0.55,
    shoulderY: 0.24,
    armpitY: 0.34,
    hipY: 0.86,
    crotchY: 0.90,
    kneeY: 0.94,
    legSplitX: 0.58,
    legMinX: 0.34,
    legMaxX: 0.78,
    armCutL: 0.34,
    armCutR: 0.77,
    armModeL: 'coupled-prop',
    armModeR: 'coupled-prop',
    armWeightL: 0.24,
    armWeightR: 0.28,
    rigidProps: [
      { x0: 0.0, y0: 0.06, x1: 1.0, y1: 0.30, bone: 'torso', weightScale: 0.12 },
      { x0: 0.56, y0: 0.52, x1: 1.0, y1: 0.74, bone: 'armR', weightScale: 1.0 },
    ],
    mouthX: 0.55,
    mouthY: 0.148,
    mouthRadius: 0.052,
    noseX: 0.55,
    noseY: 0.125,
    earLX: 0.44,
    earRX: 0.66,
    earY: 0.112,
    eyeLX: 0.495,
    eyeRX: 0.605,
    eyeY: 0.105,
    eyeRadius: 0.026,
    hasMustache: true,
  },
  'char-elder-farmer': {
    id: 'char-elder-farmer',
    archetype: 'biped-skirt',
    neckY: 0.22,
    headMinX: 0.14,
    headMaxX: 0.56,
    torsoCenterX: 0.36,
    shoulderY: 0.26,
    armpitY: 0.35,
    hipY: 0.81,
    crotchY: 0.83,
    kneeY: 0.90,
    legSplitX: 0.37,
    legMinX: 0.12,
    legMaxX: 0.64,
    armCutL: 0.19,
    armCutR: 0.57,
    armTopYR: 0.08,
    armModeL: 'free-limb',
    armModeR: 'coupled-prop',
    armWeightL: 0.62,
    armWeightR: 0.24,
    rigidProps: [
      { x0: 0.08, y0: 0.12, x1: 1.0, y1: 0.40, bone: 'torso', weightScale: 0.16 },
      { x0: 0.0, y0: 0.53, x1: 0.27, y1: 0.73, bone: 'armL', weightScale: 1.0 },
    ],
    mouthX: 0.36,
    mouthY: 0.188,
    mouthRadius: 0.052,
    noseX: 0.36,
    noseY: 0.162,
    earLX: 0.24,
    earRX: 0.48,
    earY: 0.148,
    eyeLX: 0.305,
    eyeRX: 0.415,
    eyeY: 0.145,
    eyeRadius: 0.024,
    hasMustache: true,
  },
  'char-artist-painter': {
    id: 'char-artist-painter',
    archetype: 'biped-skirt',
    neckY: 0.225,
    headMinX: 0.32,
    headMaxX: 0.68,
    torsoCenterX: 0.50,
    shoulderY: 0.265,
    armpitY: 0.35,
    hipY: 0.70,
    crotchY: 0.715,
    kneeY: 0.84,
    legSplitX: 0.485,
    legMinX: 0.30,
    legMaxX: 0.68,
    armCutL: 0.34,
    armCutR: 0.64,
    armTopYL: 0.24,
    armTopYR: 0.24,
    armModeL: 'coupled-prop',
    armModeR: 'free-limb',
    armWeightL: 0.34,
    armWeightR: 0.85,
    rigidProps: [
      { x0: 0.0, y0: 0.33, x1: 0.34, y1: 0.49, bone: 'armL', weightScale: 1.0 },
      { x0: 0.72, y0: 0.23, x1: 1.0, y1: 0.40, bone: 'armR', weightScale: 1.0 },
    ],
    mouthX: 0.50,
    mouthY: 0.17,
    mouthRadius: 0.05,
    noseX: 0.505,
    noseY: 0.148,
    earLX: 0.37,
    earRX: 0.62,
    earY: 0.138,
    eyeLX: 0.455,
    eyeRX: 0.54,
    eyeY: 0.132,
    eyeRadius: 0.024,
  },
  'char-photographer': {
    id: 'char-photographer',
    archetype: 'biped',
    neckY: 0.205,
    headMinX: 0.44,
    headMaxX: 0.74,
    torsoCenterX: 0.52,
    shoulderY: 0.24,
    armpitY: 0.34,
    hipY: 0.52,
    crotchY: 0.59,
    kneeY: 0.78,
    legSplitX: 0.53,
    legMinX: 0.20,
    legMaxX: 0.84,
    armCutL: 0.36,
    armCutR: 0.74,
    armTopYL: 0.14,
    armModeL: 'coupled-prop',
    armModeR: 'coupled-prop',
    armWeightL: 0.22,
    armWeightR: 0.22,
    rigidProps: [
      { x0: 0.0, y0: 0.07, x1: 0.44, y1: 0.42, bone: 'torso', weightScale: 0.22 },
      { x0: 0.56, y0: 0.35, x1: 1.0, y1: 0.58, bone: 'torso', weightScale: 0.20 },
    ],
    mouthX: 0.505,
    mouthY: 0.148,
    mouthRadius: 0.052,
    noseX: 0.47,
    noseY: 0.128,
    earLX: 0.42,
    earRX: 0.62,
    earY: 0.122,
    eyeLX: 0.525,
    eyeRX: 0.565,
    eyeY: 0.116,
    eyeRadius: 0.026,
  },
  'char-athlete-runner': {
    id: 'char-athlete-runner',
    archetype: 'runner-profile',
    neckY: 0.24,
    headMinX: 0.58,
    headMaxX: 0.96,
    torsoCenterX: 0.58,
    shoulderY: 0.26,
    armpitY: 0.34,
    hipY: 0.47,
    crotchY: 0.52,
    kneeY: 0.70,
    legSplitX: 0.50,
    legMinX: 0.0,
    legMaxX: 1.0,
    armCutL: 0.46,
    armCutR: 0.68,
    armTopYL: 0.22,
    armTopYR: 0.20,
    armModeL: 'free-limb',
    armModeR: 'free-limb',
    armWeightL: 1.0,
    armWeightR: 1.0,
    rigidProps: [],
    mouthX: 0.785,
    mouthY: 0.184,
    mouthRadius: 0.036,
    noseX: 0.80,
    noseY: 0.16,
    earLX: 0.69,
    earRX: 0.73,
    earY: 0.145,
    eyeLX: 0.765,
    eyeRX: 0.79,
    eyeY: 0.142,
    eyeRadius: 0.018,
  },
  'char-rickshaw-puller': {
    id: 'char-rickshaw-puller',
    archetype: 'rickshaw-puller',
    neckY: 0.195,
    headMinX: 0.14,
    headMaxX: 0.36,
    torsoCenterX: 0.34,
    shoulderY: 0.225,
    armpitY: 0.33,
    hipY: 0.76,
    crotchY: 0.80,
    kneeY: 0.88,
    legSplitX: 0.44,
    legMinX: 0.14,
    legMaxX: 0.68,
    armCutL: 0.18,
    armCutR: 0.40,
    armModeL: 'coupled-prop',
    armModeR: 'coupled-prop',
    armWeightL: 0.20,
    armWeightR: 0.25,
    rigidProps: [
      { x0: 0.0, y0: 0.34, x1: 1.0, y1: 0.60, bone: 'torso', weightScale: 0.14 },
    ],
    mouthX: 0.23,
    mouthY: 0.145,
    mouthRadius: 0.032,
    noseX: 0.215,
    noseY: 0.122,
    earLX: 0.19,
    earRX: 0.31,
    earY: 0.112,
    eyeLX: 0.205,
    eyeRX: 0.255,
    eyeY: 0.098,
    eyeRadius: 0.016,
    hasMustache: true,
  },
  'char-rickshaw-cyclist': {
    id: 'char-rickshaw-cyclist',
    archetype: 'rickshaw-cyclist',
    neckY: 0.165,
    headMinX: 0.36,
    headMaxX: 0.56,
    torsoCenterX: 0.48,
    shoulderY: 0.20,
    armpitY: 0.30,
    hipY: 0.55,
    crotchY: 0.58,
    kneeY: 0.74,
    legSplitX: 0.48,
    legMinX: 0.36,
    legMaxX: 0.58,
    armCutL: 0.35,
    armCutR: 0.58,
    armModeL: 'coupled-prop',
    armModeR: 'coupled-prop',
    armWeightL: 0.16,
    armWeightR: 0.16,
    rigidProps: [
      { x0: 0.0, y0: 0.04, x1: 1.0, y1: 1.0, bone: 'torso', weightScale: 0.06 },
    ],
    mouthX: 0.442,
    mouthY: 0.125,
    mouthRadius: 0.026,
    noseX: 0.435,
    noseY: 0.105,
    earLX: 0.405,
    earRX: 0.50,
    earY: 0.092,
    eyeLX: 0.422,
    eyeRX: 0.462,
    eyeY: 0.08,
    eyeRadius: 0.014,
    hasMustache: true,
  },
};

export function getCutoutRigSpec(assetId: string): CutoutRigSpec {
  const found = CUTOUT_RIG_SPECS[assetId];
  if (found) return found;
  return {
    id: assetId,
    archetype: 'biped',
    neckY: 0.21,
    headMinX: 0.28,
    headMaxX: 0.72,
    torsoCenterX: 0.50,
    shoulderY: 0.25,
    armpitY: 0.35,
    hipY: 0.54,
    crotchY: 0.62,
    kneeY: 0.78,
    legSplitX: 0.50,
    legMinX: 0.20,
    legMaxX: 0.80,
    armCutL: 0.30,
    armCutR: 0.70,
    armModeL: 'free-limb',
    armModeR: 'free-limb',
    armWeightL: 0.8,
    armWeightR: 0.8,
    rigidProps: [],
    mouthX: 0.50,
    mouthY: 0.155,
    mouthRadius: 0.055,
    noseX: 0.50,
    noseY: 0.132,
    earLX: 0.38,
    earRX: 0.62,
    earY: 0.12,
    eyeLX: 0.45,
    eyeRX: 0.55,
    eyeY: 0.115,
    eyeRadius: 0.025,
  };
}

export interface PuppetKinematicsInput {
  assetId: string;
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
  viseme?: VisemePose;
  maxOffsetX?: number;
  lockFacing?: boolean;
}

export interface PuppetKinematicsOutput {
  offsetX: number;
  offsetY: number;
  flipX: 1 | -1;
  torsoTilt: number;
  scaleX: number;
  scaleY: number;
  stridePhase: number;
  isMovingHorizontally: boolean;
  walkBlend: number;
  headTilt: number;
  headNodY: number;
  jawDropPx: number;
  blinkAmount: number;
  leftArmAngle: number;
  rightArmAngle: number;
  leftArmLiftY: number;
  rightArmLiftY: number;
  leftElbowFlex: number;
  rightElbowFlex: number;
  leftLegAngle: number;
  rightLegAngle: number;
  leftLegLiftY: number;
  rightLegLiftY: number;
  leftKneeFlexX: number;
  rightKneeFlexX: number;
  wheelSpinAngle: number;
  pedalPhase: number;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Pure articulated 2-bone puppet kinematics solver for all 17 2D character sheets.
 * Produces organic walking stride (thigh + knee bend + foot clearance), expressive hand
 * & forearm gestures that keep chest-crossing props completely intact, head nods, eye blinks,
 * and phonetic jaw movement.
 */
export function computePuppetKinematics(input: PuppetKinematicsInput): PuppetKinematicsOutput {
  const {
    assetId,
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
    viseme,
    maxOffsetX,
    lockFacing,
  } = input;

  const rig = getCutoutRigSpec(assetId);
  const motion = computeCutoutMotion({
    time,
    baseX,
    scale,
    facing,
    naturalFacing,
    pose,
    emotion,
    motionStyle,
    isSpeaking,
    speechEnergy,
    maxOffsetX,
    lockFacing,
  });

  const seed = (Math.abs(baseX) * 0.019 + assetId.length * 0.43) % (Math.PI * 2);
  const isPortrait = pose === 'portrait-speak';
  const isDesk = pose === 'sitting-desk';
  const isSeatedFloor = pose === 'sitting-floor';
  const isCyclist = rig.archetype === 'rickshaw-cyclist';
  const energy = isSpeaking ? Math.max(0.22, speechEnergy) : speechEnergy * 0.2;

  const paceDerivative = Math.abs(Math.cos(time * 0.82 + seed));
  let walkBlend = 0;
  if (!isPortrait && !isDesk && !isSeatedFloor && !isCyclist) {
    if (pose === 'walking' || pose === 'running' || rig.archetype === 'runner-profile') {
      walkBlend = pose === 'running' || rig.archetype === 'runner-profile' ? 1.15 : 1.0;
    } else if (pose === 'standing-speak' || pose === 'celebrating' || pose === 'listening') {
      walkBlend = clamp((paceDerivative - 0.14) / 0.45, 0.28, 0.92);
    }
  }

  const stridePhase = motion.stridePhase;
  const strideSin = Math.sin(stridePhase);
  const legMaxAngle =
    pose === 'running' || rig.archetype === 'runner-profile'
      ? 0.34
      : rig.archetype === 'biped-skirt'
        ? 0.15
        : 0.22;

  const leftLegAngle = (strideSin * legMaxAngle * walkBlend) || 0;
  const rightLegAngle = (-strideSin * legMaxAngle * walkBlend) || 0;
  const leftLegLiftY = Math.max(0, strideSin) * 7.2 * scale * walkBlend;
  const rightLegLiftY = Math.max(0, -strideSin) * 7.2 * scale * walkBlend;
  // Natural knee lead when lifting foot forward
  const leftKneeFlexX = Math.max(0, strideSin) * 4.5 * scale * walkBlend;
  const rightKneeFlexX = Math.max(0, -strideSin) * 4.5 * scale * walkBlend;

  // Counter-swing while walking + natural forearm speech gestures
  const armCounterWalk = -strideSin * 0.18 * walkBlend;
  const talkPulseL = isSpeaking
    ? Math.sin(time * 4.2 + seed) * (0.14 + energy * 0.18)
    : Math.sin(time * 1.65 + seed) * 0.04;
  const talkPulseR = isSpeaking
    ? Math.sin(time * 3.6 + seed + 1.15) * (0.16 + energy * 0.20)
    : Math.cos(time * 1.55 + seed) * 0.04;
  const celebrateLift = pose === 'celebrating' ? -0.24 + Math.sin(time * 7 + seed) * 0.09 : 0;

  // Free limbs get full natural swing & elbow flex; coupled-prop arms rotate cleanly from shoulder without elbow shear
  const leftArmAngle = (armCounterWalk + talkPulseL + celebrateLift * 0.6) * rig.armWeightL;
  const rightArmAngle = (-armCounterWalk - talkPulseR - celebrateLift * 0.6) * rig.armWeightR;

  const isFreeL = rig.armModeL === 'free-limb';
  const isFreeR = rig.armModeR === 'free-limb';

  const leftElbowFlex = isFreeL
    ? (isSpeaking ? Math.sin(time * 5.0 + seed) * (0.16 + energy * 0.2) : 0.04) * rig.armWeightL
    : 0;
  const rightElbowFlex = isFreeR
    ? (isSpeaking ? Math.cos(time * 4.5 + seed) * (0.16 + energy * 0.2) : 0.04) * rig.armWeightR
    : 0;

  const leftArmLiftY =
    isFreeL && isSpeaking
      ? Math.max(0, Math.sin(time * 4.2 + seed)) * 3.8 * scale * rig.armWeightL
      : 0;
  const rightArmLiftY =
    isFreeR && isSpeaking
      ? Math.max(0, Math.sin(time * 3.6 + seed + 1.15)) * 4.2 * scale * rig.armWeightR
      : 0;

  // Keep overall torso tilt gentle & grounded (~45% softer than whole-bitmap rocking)
  const torsoTilt = motion.tilt * 0.55;

  const headTilt = isSpeaking
    ? Math.sin(time * 4.9 + seed) * (0.042 + energy * 0.036) + Math.sin(time * 1.8 + seed) * 0.022
    : Math.sin(time * 1.35 + seed) * 0.02;
  const headNodY = isSpeaking ? Math.sin(time * 5.6 + seed) * 1.4 * scale * energy : 0;

  const activeViseme: VisemePose | null = isSpeaking && viseme ? viseme : null;
  const jawDropPx = activeViseme
    ? activeViseme.jawDrop * 2.8 * scale
    : isSpeaking
      ? Math.min(2.4, energy * 2.5 * (0.5 + 0.5 * Math.sin(time * 15.5))) * scale
      : 0;

  const blinkPeriod = 3.4;
  const blinkCycle = (time + seed * 0.7) % blinkPeriod;
  const blinkAmount =
    blinkCycle > blinkPeriod - 0.18
      ? Math.sin(((blinkCycle - (blinkPeriod - 0.18)) / 0.18) * Math.PI)
      : 0;

  return {
    offsetX: motion.offsetX,
    offsetY: motion.offsetY,
    flipX: motion.flipX,
    torsoTilt,
    scaleX: motion.scaleX,
    scaleY: motion.scaleY,
    stridePhase,
    isMovingHorizontally: motion.isMovingHorizontally,
    walkBlend,
    headTilt,
    headNodY,
    jawDropPx,
    blinkAmount,
    leftArmAngle,
    rightArmAngle,
    leftArmLiftY,
    rightArmLiftY,
    leftElbowFlex,
    rightElbowFlex,
    leftLegAngle,
    rightLegAngle,
    leftLegLiftY,
    rightLegLiftY,
    leftKneeFlexX,
    rightKneeFlexX,
    wheelSpinAngle: time * 8.5,
    pedalPhase: time * 6.8 + seed,
  };
}
