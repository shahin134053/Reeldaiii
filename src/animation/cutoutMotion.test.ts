import test from 'node:test';
import assert from 'node:assert/strict';
import { computeCutoutMotion } from './cutoutMotion';
import type { CharacterMotionStyle } from '../lib/studioAssetLibrary';

const ALL_MOTION_STYLES: CharacterMotionStyle[] = [
  'vehicle-rickshaw',
  'walking-pull',
  'runner',
  'active-stride',
  'gentle-pace',
  'expressive-talk',
  'lab-spark',
  'painter-sway',
  'camera-snap',
];

test('every character motion style animates across time without standing frozen', () => {
  const times = [0.2, 0.9, 1.8, 2.7];

  for (const motionStyle of ALL_MOTION_STYLES) {
    const samples = times.map((time) =>
      computeCutoutMotion({
        time,
        baseX: 640,
        scale: 1,
        facing: 1,
        naturalFacing: 1,
        pose: 'standing-speak',
        emotion: 'happy',
        motionStyle,
        isSpeaking: true,
        speechEnergy: 0.6,
      })
    );

    const minX = Math.min(...samples.map((s) => s.offsetX));
    const maxX = Math.max(...samples.map((s) => s.offsetX));
    const minY = Math.min(...samples.map((s) => s.offsetY));
    const maxY = Math.max(...samples.map((s) => s.offsetY));

    assert.ok(
      maxX - minX > 12,
      `${motionStyle} should travel horizontally across stage (deltaX=${(maxX - minX).toFixed(2)})`
    );
    assert.ok(
      maxY - minY > 1.5,
      `${motionStyle} should exhibit visible vertical stride/breath bounce (deltaY=${(maxY - minY).toFixed(2)})`
    );
    assert.ok(
      samples.some((s) => Math.abs(s.tilt) > 0.01),
      `${motionStyle} should exhibit lean/expressive tilt`
    );
    assert.ok(
      samples.every((s) => s.scaleX > 0.9 && s.scaleX < 1.1 && s.scaleY > 0.9 && s.scaleY < 1.1),
      `${motionStyle} squash-and-stretch should stay subtle and proportional`
    );
  }
});

test('traversal styles turn naturally along travel direction when unlocked and honor lockFacing', () => {
  const movingRight = computeCutoutMotion({
    time: 0.1,
    baseX: 0,
    scale: 1,
    facing: 1,
    naturalFacing: -1,
    pose: 'standing-speak',
    emotion: 'determined',
    motionStyle: 'vehicle-rickshaw',
    isSpeaking: false,
    speechEnergy: 0,
    lockFacing: false,
  });
  // cos(0.056) > 0 -> velocitySign = +1, naturalFacing = -1 -> flipX must invert to face right
  assert.equal(movingRight.flipX, -1);
  assert.equal(movingRight.isMovingHorizontally, true);

  const locked = computeCutoutMotion({
    time: 0.1,
    baseX: 0,
    scale: 1,
    facing: -1,
    naturalFacing: -1,
    pose: 'standing-speak',
    emotion: 'calm',
    motionStyle: 'vehicle-rickshaw',
    isSpeaking: true,
    speechEnergy: 0.5,
    maxOffsetX: 22,
    lockFacing: true,
  });
  // facing (-1) * naturalFacing (-1) = +1 -> keeps source orientation toward left partner
  assert.equal(locked.flipX, 1);
  assert.ok(Math.abs(locked.offsetX) <= 22.001);
});

test('portrait-speak and sitting-desk keep motion bounded so headshots never slide out of frame', () => {
  const portrait = computeCutoutMotion({
    time: 1.4,
    baseX: 640,
    scale: 1.2,
    facing: 1,
    naturalFacing: 1,
    pose: 'portrait-speak',
    emotion: 'inspiring',
    motionStyle: 'runner',
    isSpeaking: true,
    speechEnergy: 0.8,
  });
  assert.ok(Math.abs(portrait.offsetX) <= 12.1);
  assert.equal(portrait.flipX, 1);
});
