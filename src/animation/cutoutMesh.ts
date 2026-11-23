import {
  CutoutRigSpec,
  PuppetKinematicsOutput,
  RigidPropBone,
} from './cutoutRig';

export interface MeshVertexSpec {
  nx: number;
  ny: number;
  wHead: number;
  wTorso: number;
  wArmL: number;
  wArmR: number;
  wLegL: number;
  wLegR: number;
  /** Normalized radial distance along arm from shoulder pivot (0..1) */
  armDistL: number;
  armDistR: number;
  /** Normalized vertical distance down leg from hip/crotch (0..1) */
  legDistL: number;
  legDistR: number;
  /** Normalized shin progression below knee (0..1) */
  kneeDistL: number;
  kneeDistR: number;
  /** If inside a rigid prop box, locks vertex uniformly to that prop bone & amplitude */
  rigidBone: RigidPropBone | null;
  rigidScale: number;
}

export interface MeshQuadCell {
  v00: number;
  v10: number;
  v01: number;
  v11: number;
  uMin: number;
  vMin: number;
  uSpan: number;
  vSpan: number;
}

export interface DeformableCharacterMesh {
  rig: CutoutRigSpec;
  spriteWidth: number;
  spriteHeight: number;
  cols: number;
  rows: number;
  vertices: MeshVertexSpec[];
  quads: MeshQuadCell[];
}

export interface DeformedHeadLandmarks {
  headTilt: number;
  headPx: number;
  headPy: number;
  headNodY: number;
  mouthX: number;
  mouthY: number;
  eyeLX: number;
  eyeLY: number;
  eyeRX: number;
  eyeRY: number;
}

export interface DeformedMeshPose {
  xs: Float32Array;
  ys: Float32Array;
  drawW: number;
  drawH: number;
  head: DeformedHeadLandmarks;
}

const SCRATCH_X_CACHE = new WeakMap<DeformableCharacterMesh, Float32Array>();
const SCRATCH_Y_CACHE = new WeakMap<DeformableCharacterMesh, Float32Array>();

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (Math.abs(edge1 - edge0) < 1e-5) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function mergeSortedAxisStops(
  baseStops: number[],
  priorityStops: number[],
  minSpacing = 0.014,
  protectCenter?: number,
  protectHalfGap = 0.013
): number[] {
  const result: number[] = [];

  const tryInsert = (val: number, force: boolean) => {
    const clamped = clamp01(val);
    if (
      protectCenter !== undefined &&
      Math.abs(clamped - protectCenter) < protectHalfGap - 0.0015
    ) {
      return;
    }
    for (let i = 0; i < result.length; i++) {
      if (Math.abs(result[i] - clamped) < (force ? 0.006 : minSpacing)) {
        return;
      }
    }
    result.push(clamped);
  };

  // Insert exact protected boundaries around legSplitX first so legs never fuse
  if (protectCenter !== undefined) {
    tryInsert(protectCenter - protectHalfGap, true);
    tryInsert(protectCenter + protectHalfGap, true);
  }
  for (const p of priorityStops) tryInsert(p, true);
  for (const b of baseStops) tryInsert(b, false);

  result.sort((a, b) => a - b);
  if (result[0] > 0.001) result.unshift(0);
  else result[0] = 0;
  if (result[result.length - 1] < 0.999) result.push(1);
  else result[result.length - 1] = 1;
  return result;
}

export function computeVertexRigWeights(
  nx: number,
  ny: number,
  rig: CutoutRigSpec
): MeshVertexSpec {
  const armTopL = rig.armTopYL ?? Math.max(rig.neckY, rig.shoulderY - 0.035);
  const armTopR = rig.armTopYR ?? Math.max(rig.neckY, rig.shoulderY - 0.035);

  // 1. Seated cyclist archetype: keep chassis locked cleanly and articulate head cleanly
  if (rig.archetype === 'rickshaw-cyclist') {
    const isHeadZone = ny <= rig.neckY + 0.015 && nx >= rig.headMinX && nx <= rig.headMaxX;
    const wHead = isHeadZone ? 1 - smoothstep(rig.neckY - 0.02, rig.neckY + 0.015, ny) : 0;
    const wTorso = 1 - wHead;
    return {
      nx,
      ny,
      wHead,
      wTorso,
      wArmL: 0,
      wArmR: 0,
      wLegL: 0,
      wLegR: 0,
      armDistL: 0,
      armDistR: 0,
      legDistL: 0,
      legDistR: 0,
      kneeDistL: 0,
      kneeDistR: 0,
      rigidBone: wTorso > 0.8 ? 'torso' : null,
      rigidScale: wTorso > 0.8 ? 0.06 : 1,
    };
  }

  // Protect core facial anatomy so shoulder/torso props never steal the head bone
  const inFaceCore =
    ny <= rig.neckY + 0.005 &&
    nx >= rig.headMinX + 0.02 &&
    nx <= rig.headMaxX - 0.02;

  // 2. Check rigid props (spades, golden paddy, holsters, bags, laptops, clipboards, rickshaw poles)
  for (const prop of rig.rigidProps) {
    if (
      nx >= prop.x0 - 0.002 &&
      nx <= prop.x1 + 0.002 &&
      ny >= prop.y0 - 0.002 &&
      ny <= prop.y1 + 0.002
    ) {
      if (prop.bone === 'torso' && inFaceCore) {
        continue;
      }
      // Never let a torso rigidProp steal a free-swinging arm past the shoulder cut seam
      if (prop.bone === 'torso') {
        if (rig.armModeR === 'free-limb' && nx >= rig.armCutR + 0.008) continue;
        if (rig.armModeL === 'free-limb' && nx <= rig.armCutL - 0.008) continue;
      }
      return {
        nx,
        ny,
        wHead: prop.bone === 'head' ? 1 : 0,
        wTorso: prop.bone === 'torso' ? 1 : 0,
        wArmL: prop.bone === 'armL' ? 1 : 0,
        wArmR: prop.bone === 'armR' ? 1 : 0,
        wLegL: 0,
        wLegR: 0,
        armDistL: prop.bone === 'armL' ? clamp01(Math.hypot(nx - rig.armCutL, ny - rig.shoulderY) / 0.36) : 0,
        armDistR: prop.bone === 'armR' ? clamp01(Math.hypot(nx - rig.armCutR, ny - rig.shoulderY) / 0.36) : 0,
        legDistL: 0,
        legDistR: 0,
        kneeDistL: 0,
        kneeDistR: 0,
        rigidBone: prop.bone,
        rigidScale: prop.weightScale,
      };
    }
  }

  let wHead = 0;
  let wArmL = 0;
  let wArmR = 0;
  let wLegL = 0;
  let wLegR = 0;
  let wTorso = 0;

  // 3. Head weight with smooth neck transition
  if (ny <= rig.neckY + 0.02 && nx >= rig.headMinX && nx <= rig.headMaxX) {
    // Yield upper-side regions to raised waving arms if applicable (e.g. Farmer/Pilot raised hand)
    const inRaisedArmR = ny >= armTopR - 0.01 && nx > rig.armCutR + 0.01;
    const inRaisedArmL = ny >= armTopL - 0.01 && nx < rig.armCutL - 0.01;
    if (!inRaisedArmR && !inRaisedArmL) {
      wHead = 1 - smoothstep(rig.neckY - 0.022, rig.neckY + 0.018, ny);
    }
  }

  // 4. Arm weights (smooth shoulder blending so sleeves never step-slice)
  const armBottomCap = Math.max(rig.hipY + 0.08, 0.64);
  if (ny >= armTopL - 0.01 && ny <= armBottomCap && nx <= rig.armCutL + 0.024) {
    const hBlend = 1 - smoothstep(rig.armCutL - 0.026, rig.armCutL + 0.022, nx);
    const topFade = smoothstep(armTopL - 0.015, armTopL + 0.025, ny);
    const botFade =
      ny > rig.hipY + 0.01 && nx >= rig.legMinX - 0.02
        ? 1 - smoothstep(rig.hipY, rig.hipY + 0.06, ny)
        : 1;
    wArmL = hBlend * topFade * botFade * (1 - wHead);
  }

  if (ny >= armTopR - 0.01 && ny <= armBottomCap && nx >= rig.armCutR - 0.024) {
    const hBlend = smoothstep(rig.armCutR - 0.022, rig.armCutR + 0.026, nx);
    const topFade = smoothstep(armTopR - 0.015, armTopR + 0.025, ny);
    const botFade =
      ny > rig.hipY + 0.01 && nx <= rig.legMaxX + 0.02
        ? 1 - smoothstep(rig.hipY, rig.hipY + 0.06, ny)
        : 1;
    wArmR = hBlend * topFade * botFade * (1 - wHead);
  }

  // 5. Leg weights (gradual waist->crotch handoff, strict left/right leg split below crotchY)
  const legStart = rig.hipY - 0.035;
  if (ny >= legStart && ny > rig.shoulderY + 0.06) {
    const legVert =
      rig.archetype === 'biped-skirt'
        ? smoothstep(rig.hipY - 0.025, Math.min(0.98, rig.crotchY + 0.02), ny)
        : smoothstep(rig.hipY - 0.03, rig.crotchY - 0.005, ny);

    const sideLock = ny >= rig.crotchY - 0.01;
    const isLeftSide = nx <= rig.legSplitX;

    if (sideLock) {
      const legFactor = legVert * (1 - Math.max(wArmL, wArmR));
      if (isLeftSide) wLegL = legFactor;
      else wLegR = legFactor;
    } else {
      // Smooth hip cross-blend above crotch so trousers & belt move organically without tearing
      const splitBlend = smoothstep(rig.legSplitX - 0.04, rig.legSplitX + 0.04, nx);
      const legFactor = legVert * (1 - Math.max(wArmL, wArmR));
      wLegL = legFactor * (1 - splitBlend);
      wLegR = legFactor * splitBlend;
    }
  }

  const used = wHead + wArmL + wArmR + wLegL + wLegR;
  if (used >= 1) {
    const inv = 1 / used;
    wHead *= inv;
    wArmL *= inv;
    wArmR *= inv;
    wLegL *= inv;
    wLegR *= inv;
    wTorso = 0;
  } else {
    wTorso = 1 - used;
  }

  const armDistL = clamp01(Math.hypot(nx - rig.armCutL, ny - rig.shoulderY) / 0.34);
  const armDistR = clamp01(Math.hypot(nx - rig.armCutR, ny - rig.shoulderY) / 0.34);
  const legDenom = Math.max(0.08, 1 - rig.hipY);
  const legDistL = clamp01((ny - rig.hipY) / legDenom);
  const legDistR = legDistL;
  const kneeDenom = Math.max(0.04, 1 - rig.kneeY);
  const kneeDistL = clamp01((ny - rig.kneeY) / kneeDenom);
  const kneeDistR = kneeDistL;

  return {
    nx,
    ny,
    wHead,
    wTorso,
    wArmL,
    wArmR,
    wLegL,
    wLegR,
    armDistL,
    armDistR,
    legDistL,
    legDistR,
    kneeDistL,
    kneeDistR,
    rigidBone: null,
    rigidScale: 1,
  };
}

/**
 * Pure mesh topology & anatomical skinning builder.
 * Separates empty transparent regions and keeps a clean un-bridged channel along `legSplitX`
 * below `crotchY`, while pinning rigid held props seamlessly without slicing.
 */
export function buildMeshGridAndWeights(
  rig: CutoutRigSpec,
  spriteWidth: number,
  spriteHeight: number,
  alphaSampler: (nx: number, ny: number) => number
): DeformableCharacterMesh {
  const baseXs = [0, 0.25, 0.5, 0.75, 1.0];
  const baseYs = [0, 0.16, 0.34, 0.52, 0.72, 0.88, 1.0];

  const priorityXs = [
    rig.headMinX,
    rig.headMaxX,
    rig.armCutL,
    rig.armCutR,
    rig.legMinX,
    rig.legMaxX,
  ];
  const priorityYs = [
    rig.neckY,
    rig.shoulderY,
    rig.hipY,
    rig.crotchY,
    rig.kneeY,
    rig.armTopYL ?? Math.max(rig.neckY, rig.shoulderY - 0.035),
    rig.armTopYR ?? Math.max(rig.neckY, rig.shoulderY - 0.035),
  ];

  for (const prop of rig.rigidProps) {
    priorityXs.push(prop.x0, prop.x1);
    priorityYs.push(prop.y0, prop.y1);
  }

  const colStops = mergeSortedAxisStops(baseXs, priorityXs, 0.052, rig.legSplitX, 0.013);
  const rowStops = mergeSortedAxisStops(baseYs, priorityYs, 0.044);

  const cols = colStops.length;
  const rows = rowStops.length;
  const vertices: MeshVertexSpec[] = new Array(cols * rows);

  for (let r = 0; r < rows; r++) {
    const ny = rowStops[r];
    for (let c = 0; c < cols; c++) {
      const nx = colStops[c];
      vertices[r * cols + c] = computeVertexRigWeights(nx, ny, rig);
    }
  }

  const quads: MeshQuadCell[] = [];
  for (let r = 0; r < rows - 1; r++) {
    const y0 = rowStops[r];
    const y1 = rowStops[r + 1];
    for (let c = 0; c < cols - 1; c++) {
      const x0 = colStops[c];
      const x1 = colStops[c + 1];

      // Never bridge left and right legs below crotchY unless solid garment artwork bridges across
      const spansSplit = x0 < rig.legSplitX && x1 > rig.legSplitX;
      if (spansSplit && y0 >= rig.crotchY - 0.008) {
        const midAlpha = alphaSampler((x0 + x1) * 0.5, (y0 + y1) * 0.5);
        if (midAlpha < 95) {
          continue;
        }
      }

      // Skip quads whose sprite region is 100% transparent to cut triangle count in half
      let maxA = 0;
      for (let sy = 0; sy < 3 && maxA <= 16; sy++) {
        const py = y0 + ((y1 - y0) * sy) / 2;
        for (let sx = 0; sx < 3; sx++) {
          const px = x0 + ((x1 - x0) * sx) / 2;
          const a = alphaSampler(px, py);
          if (a > maxA) maxA = a;
        }
      }
      if (maxA <= 16) continue;

      const uMin = Math.max(0, Math.floor(x0 * spriteWidth) - 1);
      const vMin = Math.max(0, Math.floor(y0 * spriteHeight) - 1);
      const uMax = Math.min(spriteWidth, Math.ceil(x1 * spriteWidth) + 1);
      const vMax = Math.min(spriteHeight, Math.ceil(y1 * spriteHeight) + 1);

      quads.push({
        v00: r * cols + c,
        v10: r * cols + (c + 1),
        v01: (r + 1) * cols + c,
        v11: (r + 1) * cols + (c + 1),
        uMin,
        vMin,
        uSpan: Math.max(1, uMax - uMin),
        vSpan: Math.max(1, vMax - vMin),
      });
    }
  }

  return {
    rig,
    spriteWidth,
    spriteHeight,
    cols,
    rows,
    vertices,
    quads,
  };
}

function rotatePointAround(
  x: number,
  y: number,
  px: number,
  py: number,
  angle: number
): [number, number] {
  if (angle === 0) return [x - px + px, y - py + py];
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = x - px;
  const dy = y - py;
  return [px + dx * cos - dy * sin, py + dx * sin + dy * cos];
}

/**
 * Solves exact deformed vertex coordinates and exact deformed facial landmark coordinates
 * in bottom-center-anchored character local space ([-drawW/2..+drawW/2], [-drawH..0]).
 */
export function deformCharacterMeshVertices(
  mesh: DeformableCharacterMesh,
  kin: PuppetKinematicsOutput,
  drawW: number,
  drawH: number
): DeformedMeshPose {
  const { rig, vertices } = mesh;
  const n = vertices.length;
  let outXs = SCRATCH_X_CACHE.get(mesh);
  let outYs = SCRATCH_Y_CACHE.get(mesh);
  if (!outXs || !outYs || outXs.length !== n || outYs.length !== n) {
    outXs = new Float32Array(n);
    outYs = new Float32Array(n);
    SCRATCH_X_CACHE.set(mesh, outXs);
    SCRATCH_Y_CACHE.set(mesh, outYs);
  }

  const headPx = ((rig.headMinX + rig.headMaxX) * 0.5 - 0.5) * drawW;
  const headPy = (rig.neckY - 1) * drawH;

  const armLPx = (rig.armCutL - 0.5) * drawW;
  const armLPy = (rig.shoulderY - 1) * drawH;
  const armRPx = (rig.armCutR - 0.5) * drawW;
  const armRPy = (rig.shoulderY - 1) * drawH;

  const legLPx = ((rig.legMinX + rig.legSplitX) * 0.5 - 0.5) * drawW;
  const legLPy = (rig.hipY - 1) * drawH;
  const legRPx = ((rig.legSplitX + rig.legMaxX) * 0.5 - 0.5) * drawW;
  const legRPy = (rig.hipY - 1) * drawH;

  for (let i = 0; i < n; i++) {
    const v = vertices[i];
    const bx = (v.nx - 0.5) * drawW;
    const by = (v.ny - 1) * drawH;

    let accX = v.wTorso * bx;
    let accY = v.wTorso * by;

    if (v.wHead > 0) {
      const hTilt = v.rigidBone === 'head' ? kin.headTilt * v.rigidScale : kin.headTilt;
      const hNod = v.rigidBone === 'head' ? kin.headNodY * v.rigidScale : kin.headNodY;
      const [hx, hy] = rotatePointAround(bx, by, headPx, headPy, hTilt);
      accX += v.wHead * hx;
      accY += v.wHead * (hy + hNod);
    }

    if (v.wArmL > 0) {
      if (v.rigidBone === 'armL') {
        const ang =
          rig.armModeL === 'coupled-prop'
            ? kin.leftArmAngle * v.rigidScale
            : (kin.leftArmAngle + kin.leftElbowFlex * 0.28) * v.rigidScale;
        const lift = rig.armModeL === 'coupled-prop' ? 0 : kin.leftArmLiftY * 0.72 * v.rigidScale;
        const [ax, ay] = rotatePointAround(bx, by, armLPx, armLPy, ang);
        accX += v.wArmL * ax;
        accY += v.wArmL * (ay - lift);
      } else {
        const elbowBlend = smoothstep(0.35, 1.0, v.armDistL);
        const effAng = kin.leftArmAngle + kin.leftElbowFlex * elbowBlend * 0.42;
        const [ax, ay] = rotatePointAround(bx, by, armLPx, armLPy, effAng);
        accX += v.wArmL * ax;
        accY += v.wArmL * (ay - kin.leftArmLiftY * v.armDistL);
      }
    }

    if (v.wArmR > 0) {
      if (v.rigidBone === 'armR') {
        const ang =
          rig.armModeR === 'coupled-prop'
            ? kin.rightArmAngle * v.rigidScale
            : (kin.rightArmAngle + kin.rightElbowFlex * 0.28) * v.rigidScale;
        const lift = rig.armModeR === 'coupled-prop' ? 0 : kin.rightArmLiftY * 0.72 * v.rigidScale;
        const [ax, ay] = rotatePointAround(bx, by, armRPx, armRPy, ang);
        accX += v.wArmR * ax;
        accY += v.wArmR * (ay - lift);
      } else {
        const elbowBlend = smoothstep(0.35, 1.0, v.armDistR);
        const effAng = kin.rightArmAngle + kin.rightElbowFlex * elbowBlend * 0.42;
        const [ax, ay] = rotatePointAround(bx, by, armRPx, armRPy, effAng);
        accX += v.wArmR * ax;
        accY += v.wArmR * (ay - kin.rightArmLiftY * v.armDistR);
      }
    }

    if (v.wLegL > 0) {
      const [lx, ly] = rotatePointAround(bx, by, legLPx, legLPy, kin.leftLegAngle);
      const kneeArc = Math.sin(v.kneeDistL * Math.PI * 0.72) * kin.leftKneeFlexX;
      const lift = kin.leftLegLiftY * smoothstep(0.15, 0.9, v.legDistL);
      accX += v.wLegL * (lx + kneeArc);
      accY += v.wLegL * (ly - lift);
    }

    if (v.wLegR > 0) {
      const [rx, ry] = rotatePointAround(bx, by, legRPx, legRPy, kin.rightLegAngle);
      const kneeArc = Math.sin(v.kneeDistR * Math.PI * 0.72) * kin.rightKneeFlexX;
      const lift = kin.rightLegLiftY * smoothstep(0.15, 0.9, v.legDistR);
      accX += v.wLegR * (rx + kneeArc);
      accY += v.wLegR * (ry - lift);
    }

    outXs[i] = accX;
    outYs[i] = accY;
  }

  // Transform mouth and eyes identically with head bone so lip-sync stays pixel-locked
  const transformHeadPoint = (nx: number, ny: number): [number, number] => {
    const px = (nx - 0.5) * drawW;
    const py = (ny - 1) * drawH;
    const [hx, hy] = rotatePointAround(px, py, headPx, headPy, kin.headTilt);
    return [hx, hy + kin.headNodY];
  };

  const [mouthX, mouthY] = transformHeadPoint(rig.mouthX, rig.mouthY);
  const [eyeLX, eyeLY] = transformHeadPoint(rig.eyeLX, rig.eyeY);
  const [eyeRX, eyeRY] = transformHeadPoint(rig.eyeRX, rig.eyeY);

  return {
    xs: outXs,
    ys: outYs,
    drawW,
    drawH,
    head: {
      headTilt: kin.headTilt,
      headPx,
      headPy,
      headNodY: kin.headNodY,
      mouthX,
      mouthY,
      eyeLX,
      eyeLY,
      eyeRX,
      eyeRY,
    },
  };
}

function drawTexturedTriangle(
  ctx: CanvasRenderingContext2D,
  sprite: HTMLCanvasElement,
  uMin: number,
  vMin: number,
  uSpan: number,
  vSpan: number,
  u0: number,
  v0: number,
  x0: number,
  y0: number,
  u1: number,
  v1: number,
  x1: number,
  y1: number,
  u2: number,
  v2: number,
  x2: number,
  y2: number
): void {
  const du1 = u1 - u0;
  const dv1 = v1 - v0;
  const du2 = u2 - u0;
  const dv2 = v2 - v0;
  const det = du1 * dv2 - du2 * dv1;
  if (Math.abs(det) < 1e-4) return;

  const dx1 = x1 - x0;
  const dy1 = y1 - y0;
  const dx2 = x2 - x0;
  const dy2 = y2 - y0;

  const a = (dx1 * dv2 - dx2 * dv1) / det;
  const b = (dy1 * dv2 - dy2 * dv1) / det;
  const c = (du1 * dx2 - du2 * dx1) / det;
  const d = (du1 * dy2 - du2 * dy1) / det;
  const e = x0 - a * u0 - c * v0;
  const f = y0 - b * u0 - d * v0;

  // Slightly inflate clip polygon outward (~0.68px from centroid) to prevent anti-aliased seam hairlines
  const cx = (x0 + x1 + x2) / 3;
  const cy = (y0 + y1 + y2) / 3;
  const expand = (px: number, py: number): [number, number] => {
    const vx = px - cx;
    const vy = py - cy;
    const len = Math.hypot(vx, vy);
    if (len < 1e-3) return [px, py];
    return [px + (vx / len) * 0.68, py + (vy / len) * 0.68];
  };

  const [ex0, ey0] = expand(x0, y0);
  const [ex1, ey1] = expand(x1, y1);
  const [ex2, ey2] = expand(x2, y2);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(ex0, ey0);
  ctx.lineTo(ex1, ey1);
  ctx.lineTo(ex2, ey2);
  ctx.closePath();
  ctx.clip();

  ctx.transform(a, b, c, d, e, f);
  ctx.drawImage(sprite, uMin, vMin, uSpan, vSpan, uMin, vMin, uSpan, vSpan);
  ctx.restore();
}

/**
 * Renders the full continuous deformed character triangle mesh cleanly onto Canvas2D
 * with subpixel overlap sealing and tight sprite sub-rect blitting.
 */
export function drawDeformedCharacterMesh(
  ctx: CanvasRenderingContext2D,
  mesh: DeformableCharacterMesh,
  sprite: HTMLCanvasElement,
  pose: DeformedMeshPose
): void {
  const { vertices, quads, spriteWidth: sw, spriteHeight: sh } = mesh;
  const { xs, ys, head } = pose;
  const pureHeadQuads: MeshQuadCell[] = [];

  for (let i = 0; i < quads.length; i++) {
    const q = quads[i];
    const v00 = vertices[q.v00];
    const v10 = vertices[q.v10];
    const v01 = vertices[q.v01];
    const v11 = vertices[q.v11];

    // Batch pure rigid-head quads into a single transformed drawImage pass (skips ~50 triangle clips)
    if (
      v00.wHead > 0.998 &&
      v10.wHead > 0.998 &&
      v01.wHead > 0.998 &&
      v11.wHead > 0.998 &&
      v00.rigidBone === null &&
      v10.rigidBone === null &&
      v01.rigidBone === null &&
      v11.rigidBone === null
    ) {
      pureHeadQuads.push(q);
      continue;
    }

    const u00 = v00.nx * sw;
    const vv00 = v00.ny * sh;
    const u10 = v10.nx * sw;
    const vv10 = v10.ny * sh;
    const u01 = v01.nx * sw;
    const vv01 = v01.ny * sh;
    const u11 = v11.nx * sw;
    const vv11 = v11.ny * sh;

    const x00 = xs[q.v00];
    const y00 = ys[q.v00];
    const x10 = xs[q.v10];
    const y10 = ys[q.v10];
    const x01 = xs[q.v01];
    const y01 = ys[q.v01];
    const x11 = xs[q.v11];
    const y11 = ys[q.v11];

    // Fast path for un-rotated rectangular torso & rigid-torso-prop quads (zero save/clip/transform)
    if (
      Math.abs(y00 - y10) < 0.08 &&
      Math.abs(y01 - y11) < 0.08 &&
      Math.abs(x00 - x01) < 0.08 &&
      Math.abs(x10 - x11) < 0.08 &&
      u10 > u00 + 0.5 &&
      vv01 > vv00 + 0.5
    ) {
      const dw = x10 - x00;
      const dh = y01 - y00;
      if (dw > 0.2 && dh > 0.2) {
        ctx.drawImage(
          sprite,
          u00,
          vv00,
          u10 - u00,
          vv01 - vv00,
          x00 - 0.35,
          y00 - 0.35,
          dw + 0.7,
          dh + 0.7
        );
      }
      continue;
    }

    drawTexturedTriangle(
      ctx,
      sprite,
      q.uMin,
      q.vMin,
      q.uSpan,
      q.vSpan,
      u00,
      vv00,
      x00,
      y00,
      u10,
      vv10,
      x10,
      y10,
      u11,
      vv11,
      x11,
      y11
    );

    drawTexturedTriangle(
      ctx,
      sprite,
      q.uMin,
      q.vMin,
      q.uSpan,
      q.vSpan,
      u00,
      vv00,
      x00,
      y00,
      u11,
      vv11,
      x11,
      y11,
      u01,
      vv01,
      x01,
      y01
    );
  }

  if (pureHeadQuads.length > 0) {
    const { drawW, drawH } = pose;
    ctx.save();
    ctx.translate(head.headPx, head.headPy + head.headNodY);
    ctx.rotate(head.headTilt);
    ctx.translate(-head.headPx, -head.headPy);
    for (let i = 0; i < pureHeadQuads.length; i++) {
      const q = pureHeadQuads[i];
      const v00 = vertices[q.v00];
      const v11 = vertices[q.v11];
      const sx0 = v00.nx * sw;
      const sy0 = v00.ny * sh;
      const swq = (v11.nx - v00.nx) * sw;
      const shq = (v11.ny - v00.ny) * sh;
      const dx0 = (v00.nx - 0.5) * drawW;
      const dy0 = (v00.ny - 1) * drawH;
      const dwq = (v11.nx - v00.nx) * drawW;
      const dhq = (v11.ny - v00.ny) * drawH;
      if (swq > 0.4 && shq > 0.4 && dwq > 0.2 && dhq > 0.2) {
        ctx.drawImage(sprite, sx0, sy0, swq, shq, dx0 - 0.35, dy0 - 0.35, dwq + 0.7, dhq + 0.7);
      }
    }
    ctx.restore();
  }
}
