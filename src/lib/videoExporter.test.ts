import test from 'node:test';
import assert from 'node:assert/strict';
import { computeExportFrameSchedule } from './videoExporter';

test('computeExportFrameSchedule keeps short videos at crisp 24fps', () => {
  const s = computeExportFrameSchedule(45, '4k');
  assert.equal(s.fps, 24);
  assert.equal(s.totalFrames, 1080);
  assert.ok(s.estimatedRenderSeconds < 60);
});

test('computeExportFrameSchedule keeps even long 6-10 minute 4K & 1080p renders within 1 minute max', () => {
  for (const dur of [120, 240, 360, 600]) {
    const s4k = computeExportFrameSchedule(dur, '4k');
    const s1080 = computeExportFrameSchedule(dur, '1080p');
    const s720 = computeExportFrameSchedule(dur, '720p');

    assert.ok(s4k.totalFrames <= 1440, `4K ${dur}s exceeded 1440 frames (${s4k.totalFrames})`);
    assert.ok(s4k.estimatedRenderSeconds <= 50, `4K ${dur}s ETA exceeded 50s (${s4k.estimatedRenderSeconds}s)`);
    assert.ok(s1080.totalFrames <= 2400, `1080p ${dur}s exceeded 2400 frames (${s1080.totalFrames})`);
    assert.ok(s720.totalFrames <= 3200, `720p ${dur}s exceeded 3200 frames (${s720.totalFrames})`);
  }
});
