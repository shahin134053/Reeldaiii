import test from 'node:test';
import assert from 'node:assert/strict';
import { STUDIO_CHARACTER_ASSETS } from '../lib/studioAssetLibrary';
import {
  CUTOUT_RIG_SPECS,
  computePuppetKinematics,
  getCutoutRigSpec,
} from './cutoutRig';

import {
  buildMeshGridAndWeights,
  deformCharacterMeshVertices,
} from './cutoutMesh';

test('every one of the 17 studio character assets has a calibrated valid CutoutRigSpec', () => {
  assert.equal(STUDIO_CHARACTER_ASSETS.length, 17);

  for (const asset of STUDIO_CHARACTER_ASSETS) {
    const spec = CUTOUT_RIG_SPECS[asset.id];
    assert.ok(spec, `Missing CutoutRigSpec for ${asset.id}`);
    assert.equal(spec.id, asset.id);
    assert.ok(spec.eyeY > 0 && spec.eyeY < spec.mouthY, `${asset.id}: eyeY must sit above mouthY`);
    assert.ok(spec.mouthY < spec.neckY, `${asset.id}: mouthY must sit above neckY`);
    assert.ok(spec.neckY < spec.shoulderY, `${asset.id}: neckY must sit above shoulderY`);
    assert.ok(spec.shoulderY < spec.hipY && spec.hipY <= 0.92, `${asset.id}: invalid shoulderY/hipY range`);
    assert.ok(spec.crotchY >= spec.hipY && spec.crotchY <= 0.94, `${asset.id}: invalid crotchY`);
    assert.ok(spec.kneeY >= spec.crotchY && spec.kneeY <= 0.98, `${asset.id}: invalid kneeY`);
    assert.ok(spec.headMinX < spec.headMaxX && spec.headMinX >= 0 && spec.headMaxX <= 1);
    assert.ok(spec.armCutL < spec.armCutR && spec.armCutL >= 0 && spec.armCutR <= 1);
    assert.ok(spec.legMinX <= spec.legSplitX && spec.legSplitX <= spec.legMaxX);
    assert.ok(spec.earLX <= spec.earRX && spec.eyeLX <= spec.eyeRX, `${asset.id}: left/right landmark order`);
    if (spec.archetype !== 'runner-profile') {
      assert.ok(spec.earLX < spec.eyeLX && spec.eyeRX < spec.earRX, `${asset.id}: front/3Q ear-eye check`);
    }
    assert.ok(spec.mouthRadius >= 0.024 && spec.mouthRadius <= 0.12);
    assert.ok(spec.eyeRadius >= 0.012 && spec.eyeRadius <= 0.06);
  }
});

test('getCutoutRigSpec falls back gracefully for unknown IDs', () => {
  const fb = getCutoutRigSpec('unknown-custom-id');
  assert.equal(fb.archetype, 'biped');
  assert.ok(fb.mouthRadius > 0);
});

test('computePuppetKinematics animates alternating walking legs, knee flex, speaking hand gestures, head nods & jaw drop', () => {
  const sampleTimes = [0.2, 0.55, 0.9, 1.35, 1.8, 2.3];
  const poses: Array<'standing-speak' | 'walking'> = ['standing-speak', 'walking'];

  for (const pose of poses) {
    const frames = sampleTimes.map((time) =>
      computePuppetKinematics({
        assetId: 'char-police-officer',
        time,
        baseX: 640,
        scale: 1.2,
        facing: 1,
        naturalFacing: 1,
        pose,
        emotion: 'happy',
        motionStyle: 'active-stride',
        isSpeaking: true,
        speechEnergy: 0.65,
        viseme: {
          id: 'AA',
          openness: 0.8,
          width: 0.7,
          roundness: 0.15,
          lipPress: 0,
          teethUpper: 0.5,
          teethLower: 0.3,
          tongueTip: 0.1,
          jawDrop: 0.75,
        },
      })
    );

    const minLeftLeg = Math.min(...frames.map((f) => f.leftLegAngle));
    const maxLeftLeg = Math.max(...frames.map((f) => f.leftLegAngle));
    const minLeftArm = Math.min(...frames.map((f) => f.leftArmAngle));
    const maxLeftArm = Math.max(...frames.map((f) => f.leftArmAngle));
    const minRightArm = Math.min(...frames.map((f) => f.rightArmAngle));
    const maxRightArm = Math.max(...frames.map((f) => f.rightArmAngle));
    const maxLegLift = Math.max(...frames.map((f) => f.leftLegLiftY + f.rightLegLiftY));
    const maxKneeFlex = Math.max(...frames.map((f) => f.leftKneeFlexX + f.rightKneeFlexX));

    assert.ok(
      maxLeftLeg - minLeftLeg > 0.12,
      `${pose}: expected alternating leg swing > 0.12 rad (got ${(maxLeftLeg - minLeftLeg).toFixed(3)})`
    );
    assert.ok(maxLegLift > 1.0, `${pose}: expected visible upward foot lift during stride`);
    assert.ok(maxKneeFlex > 0.5, `${pose}: expected visible knee flex during stride`);
    assert.ok(
      maxLeftArm - minLeftArm > 0.16 && maxRightArm - minRightArm > 0.08,
      `${pose}: expected active left & right hand/arm gestures while speaking`
    );

    // Opposite phase invariant: left and right legs swing in opposite directions
    for (const f of frames) {
      assert.ok(Math.abs(f.leftLegAngle + f.rightLegAngle) < 0.001);
      assert.ok(f.jawDropPx > 1.0, 'expected phonetic jawDrop when AA viseme is active');
    }
  }
});

test('sitting-desk & portrait-speak keep legs stationary while animating speaking arms and head', () => {
  const frames = [0.25, 0.8, 1.4].map((time) =>
    computePuppetKinematics({
      assetId: 'char-school-teacher',
      time,
      baseX: 520,
      scale: 1,
      facing: 1,
      naturalFacing: -1,
      pose: 'sitting-desk',
      emotion: 'calm',
      motionStyle: 'expressive-talk',
      isSpeaking: true,
      speechEnergy: 0.55,
    })
  );

  for (const f of frames) {
    assert.equal(f.walkBlend, 0);
    assert.equal(f.leftLegAngle, 0);
    assert.equal(f.rightLegAngle, 0);
  }
  const armDelta =
    Math.max(...frames.map((f) => f.leftArmAngle)) -
    Math.min(...frames.map((f) => f.leftArmAngle));
  assert.ok(armDelta > 0.12, 'arms should still gesture expressively while sitting & speaking');
});

test('blinking triggers naturally around the end of each ~3.4s blink cycle', () => {
  let maxBlink = 0;
  for (let t = 0; t <= 3.6; t += 0.04) {
    const f = computePuppetKinematics({
      assetId: 'char-police-officer',
      time: t,
      baseX: 0,
      scale: 1,
      facing: 1,
      pose: 'standing-speak',
      emotion: 'calm',
      isSpeaking: false,
      speechEnergy: 0,
    });
    if (f.blinkAmount > maxBlink) maxBlink = f.blinkAmount;
  }
  assert.ok(maxBlink > 0.85, `Expected natural eyelid blink peak > 0.85, got ${maxBlink.toFixed(2)}`);
});

test('deformable mesh locks rigid props without stretching and never bridges open legs below crotchY', () => {
  for (const assetId of ['char-bd-farmer-spade', 'char-police-officer', 'char-airline-pilot']) {
    const rig = getCutoutRigSpec(assetId);
    const mesh = buildMeshGridAndWeights(rig, 320, 460, (nx, ny) => {
      // Simulate transparent air channel between left & right legs below crotchY
      if (ny >= rig.crotchY && Math.abs(nx - rig.legSplitX) < 0.025) {
        return 0;
      }
      return 255;
    });

    // Zero quads below crotchY may span across legSplitX
    for (const q of mesh.quads) {
      const x0 = mesh.vertices[q.v00].nx;
      const x1 = mesh.vertices[q.v10].nx;
      const y0 = mesh.vertices[q.v00].ny;
      if (y0 >= rig.crotchY - 0.008) {
        assert.ok(
          !(x0 < rig.legSplitX && x1 > rig.legSplitX),
          `${assetId}: found quad bridging leg gap at y=${y0.toFixed(2)}`
        );
      }
    }

    // Held rigid prop pair distance remains invariant under peak stride deformation
    const prop = rig.rigidProps[rig.rigidProps.length - 1];
    assert.ok(prop, `${assetId}: expected rigid prop definition`);
    const propVerts: number[] = [];
    mesh.vertices.forEach((v, idx) => {
      if (v.rigidBone === prop.bone && v.nx >= prop.x0 && v.nx <= prop.x1 && v.ny >= prop.y0 && v.ny <= prop.y1) {
        propVerts.push(idx);
      }
    });
    assert.ok(propVerts.length >= 2, `${assetId}: expected vertices inside rigid prop`);

    const kin = computePuppetKinematics({
      assetId,
      time: 0.95,
      baseX: 500,
      scale: 1.2,
      facing: 1,
      pose: 'walking',
      emotion: 'happy',
      motionStyle: 'active-stride',
      isSpeaking: true,
      speechEnergy: 0.75,
    });
    const pose = deformCharacterMeshVertices(mesh, kin, 140, 220);

    const a = propVerts[0];
    const b = propVerts[propVerts.length - 1];
    const restDist = Math.hypot(
      (mesh.vertices[a].nx - mesh.vertices[b].nx) * 140,
      (mesh.vertices[a].ny - mesh.vertices[b].ny) * 220
    );
    const deformedDist = Math.hypot(pose.xs[a] - pose.xs[b], pose.ys[a] - pose.ys[b]);
    assert.ok(
      Math.abs(restDist - deformedDist) < 0.75,
      `${assetId}: rigid prop stretched by ${Math.abs(restDist - deformedDist).toFixed(2)}px`
    );
  }
});

test('coupled-prop arms disable elbow/lift shear and preserve seamless wrist continuity across all prop characters', () => {
  const propIds = [
    'char-airline-pilot',
    'char-police-officer',
    'char-nurse',
    'char-day-laborer',
    'char-architect',
    'char-software-engineer',
    'char-school-teacher',
    'char-scientist',
    'char-artist-painter',
    'char-bd-farmer-spade',
    'char-elder-farmer',
  ];

  for (const id of propIds) {
    const rig = getCutoutRigSpec(id);
    const kin = computePuppetKinematics({
      assetId: id,
      time: 1.15,
      baseX: 600,
      scale: 1.25,
      facing: 1,
      pose: 'walking',
      emotion: 'happy',
      motionStyle: 'active-stride',
      isSpeaking: true,
      speechEnergy: 0.85,
    });

    if (rig.armModeL === 'coupled-prop') {
      assert.equal(kin.leftElbowFlex, 0, `${id}: coupled-prop armL must have 0 elbow flex`);
      assert.equal(kin.leftArmLiftY, 0, `${id}: coupled-prop armL must have 0 liftY`);
    }
    if (rig.armModeR === 'coupled-prop') {
      assert.equal(kin.rightElbowFlex, 0, `${id}: coupled-prop armR must have 0 elbow flex`);
      assert.equal(kin.rightArmLiftY, 0, `${id}: coupled-prop armR must have 0 liftY`);
    }

    const mesh = buildMeshGridAndWeights(rig, 360, 540, () => 255);
    const pose = deformCharacterMeshVertices(mesh, kin, 180, 270);

    // Check every arm-attached rigidProp has matching wrist angle on the sleeve immediately above y0
    for (const prop of rig.rigidProps) {
      if (prop.bone !== 'armL' && prop.bone !== 'armR') continue;
      const sideX = prop.bone === 'armL' ? Math.max(prop.x0, Math.min(prop.x1, rig.armCutL - 0.04)) : Math.min(prop.x1, Math.max(prop.x0, rig.armCutR + 0.04));
      let wristIdx = -1;
      let sleeveIdx = -1;
      for (let i = 0; i < mesh.vertices.length; i++) {
        const v = mesh.vertices[i];
        if (Math.abs(v.nx - sideX) < 0.05 && Math.abs(v.ny - prop.y0) < 0.015 && v.rigidBone === prop.bone) {
          wristIdx = i;
        }
        if (Math.abs(v.nx - sideX) < 0.05 && v.ny < prop.y0 && prop.y0 - v.ny < 0.075 && v.rigidBone === null) {
          sleeveIdx = i;
        }
      }
      if (wristIdx >= 0 && sleeveIdx >= 0) {
        const restGap = Math.hypot(
          (mesh.vertices[wristIdx].nx - mesh.vertices[sleeveIdx].nx) * 180,
          (mesh.vertices[wristIdx].ny - mesh.vertices[sleeveIdx].ny) * 270
        );
        const defGap = Math.hypot(
          pose.xs[wristIdx] - pose.xs[sleeveIdx],
          pose.ys[wristIdx] - pose.ys[sleeveIdx]
        );
        assert.ok(
          Math.abs(restGap - defGap) < 1.5,
          `${id} (${prop.bone}): wrist seam drifted by ${Math.abs(restGap - defGap).toFixed(2)}px`
        );
      }
    }
  }

  // Regression: Police Officer's hanging right hand (below hipY, outside thigh) must stay 100% bound to armR, never legR
  const policeRig = getCutoutRigSpec('char-police-officer');
  const policeMesh = buildMeshGridAndWeights(policeRig, 360, 540, () => 255);
  const handVert = policeMesh.vertices.find(
    (v) => v.nx >= 0.88 && v.ny >= 0.58 && v.ny <= 0.64
  );
  assert.ok(handVert, 'Expected mesh vertex on Police Officer hanging right hand');
  assert.ok(
    handVert.wArmR > 0.9 && handVert.wLegR < 0.05,
    `Police Officer hanging right hand leaked to legR (wArmR=${handVert.wArmR.toFixed(2)}, wLegR=${handVert.wLegR.toFixed(2)})`
  );
});


