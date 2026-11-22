import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EXPORT_QUALITY_PRESETS,
  computeCameraTransform,
  computeTransitionState,
  getPortraitSafeLayout,
  interpolateRange,
  springValue,
} from './motionEngine';

test('springValue starts at 0, overshoots smoothly underdamped, and settles near 1', () => {
  assert.equal(springValue(0), 0);
  const mid = springValue(0.18, { stiffness: 140, damping: 14, mass: 1 });
  assert.ok(mid > 0.3, `Expected spring to advance quickly, got ${mid}`);
  const settled = springValue(2.5, { stiffness: 140, damping: 16, mass: 1 });
  assert.ok(Math.abs(settled - 1) < 0.01, `Expected spring to settle near 1, got ${settled}`);
});

test('EXPORT_QUALITY_PRESETS defines true 4K UHD, 1080p Full HD, and 720p dimensions', () => {
  assert.deepEqual(EXPORT_QUALITY_PRESETS['4k'].dimensions['16:9'], { width: 3840, height: 2160 });
  assert.deepEqual(EXPORT_QUALITY_PRESETS['4k'].dimensions['9:16'], { width: 2160, height: 3840 });
  assert.deepEqual(EXPORT_QUALITY_PRESETS['1080p'].dimensions['16:9'], { width: 1920, height: 1080 });
  assert.deepEqual(EXPORT_QUALITY_PRESETS['1080p'].dimensions['9:16'], { width: 1080, height: 1920 });
  assert.ok(
    EXPORT_QUALITY_PRESETS['4k'].videoBitsPerSecond > EXPORT_QUALITY_PRESETS['1080p'].videoBitsPerSecond
  );
});

test('computeCameraTransform keeps 9:16 canvas zoom safe (<= 1.15) while boosting subjectScale cleanly', () => {
  const landscape = computeCameraTransform({
    width: 1280,
    height: 720,
    sceneTime: 2.0,
    sceneDuration: 8,
    globalTime: 2.0,
    cameraShot: 'close-up-portrait',
    portraitZoom: 1.4,
  });

  const portrait = computeCameraTransform({
    width: 720,
    height: 1280,
    sceneTime: 2.0,
    sceneDuration: 8,
    globalTime: 2.0,
    cameraShot: 'close-up-portrait',
    portraitZoom: 1.4,
  });

  assert.ok(
    portrait.zoom <= 1.15,
    `Expected 9:16 canvas zoom <= 1.15 to prevent edge clipping, got ${portrait.zoom}`
  );
  assert.ok(
    portrait.subjectScale >= 1.25,
    `Expected 9:16 close-up subjectScale >= 1.25, got ${portrait.subjectScale}`
  );
  assert.equal(landscape.subjectScale, 1.0);
});

test('getPortraitSafeLayout clamps props and characters inside 9:16 safe bounds', () => {
  const layout = getPortraitSafeLayout(1080, 1920, 1.38);
  assert.equal(layout.isVertical, true);
  assert.ok(layout.safeLeft >= 1080 * 0.13);
  assert.ok(layout.safeRight <= 1080 * 0.87);
  assert.ok(layout.clampX(10, 60) >= layout.safeLeft + 60);
  assert.ok(layout.clampX(1070, 60) <= layout.safeRight - 60);
});

test('computeTransitionState keeps opening frame bright and adds light-leak flare on chapter cuts', () => {
  const opening = computeTransitionState(0, 0, 10, 0);
  assert.equal(opening.darknessAlpha, 0);
  assert.equal(opening.flareAlpha, 0);

  const chapterCut = computeTransitionState(12, 0.25, 10, 1);
  assert.ok(chapterCut.flareAlpha > 0.2, `Expected golden transition flare, got ${chapterCut.flareAlpha}`);
});

test('interpolateRange clamps cleanly when clamp=true', () => {
  assert.equal(interpolateRange(-5, 0, 10, 100, 200), 100);
  assert.equal(interpolateRange(5, 0, 10, 100, 200), 150);
  assert.equal(interpolateRange(20, 0, 10, 100, 200), 200);
});

test('computeChapterStingerState springs in smoothly and exits cleanly after 2.35s', async () => {
  const { computeChapterStingerState } = await import('./storyChoreographer');
  const start = computeChapterStingerState(0.0, 8);
  const mid = computeChapterStingerState(0.5, 8);
  const end = computeChapterStingerState(2.6, 8);

  assert.ok(start.opacity < 0.25);
  assert.ok(mid.opacity > 0.85, `Expected visible stinger at 0.5s, got ${mid.opacity}`);
  assert.equal(end.opacity, 0, 'Stinger must completely exit after 2.35s');
});

