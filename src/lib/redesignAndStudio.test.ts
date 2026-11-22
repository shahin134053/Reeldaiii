import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_DESIGN_CONFIG,
  adjustSceneBoundary,
  captureDesignSnapshot,
  createScriptPreviewEnvelope,
  mergeSceneWithNext,
  remixProjectDesign,
  restoreDesignSnapshot,
  shiftSrtCuesOffset,
  splitSceneAtMidpoint,
} from './redesignAndStudio';
import { computeBgmGainAtTime, synthesizeEmotionBgmChannels } from './bgmEngine';
import { validateGenerationInputs } from './storyIntelligence';
import { createDemoProject } from './storyCompiler';
import { parseSrt } from './srtParser';

const SAMPLE_SRT = `1
00:00:00,000 --> 00:00:04,500
সকালবেলার রোদ রাস্তায় পড়েছে।

2
00:00:04,500 --> 00:00:10,000
ছেলেটি বই হাতে স্কুলে যাচ্ছে।
`;

test('remixProjectDesign transforms layout, color palette, visualStyle, and scene choreography while keeping story intact', () => {
  const cues = parseSrt(SAMPLE_SRT);
  const base = createDemoProject(cues);
  const originalTitle = base.title;
  const originalDuration = base.duration;

  const remixed = remixProjectDesign(base);
  assert.equal(remixed.title, originalTitle);
  assert.equal(remixed.duration, originalDuration);
  assert.notEqual(
    remixed.designConfig?.colorPalette,
    DEFAULT_DESIGN_CONFIG.colorPalette
  );
  assert.notEqual(
    remixed.designConfig?.layoutMode,
    DEFAULT_DESIGN_CONFIG.layoutMode
  );
  assert.equal(remixed.designConfig?.remixSeed, 2);
  assert.notEqual(remixed.scenes[0].cameraShot, base.scenes[0].cameraShot);
});

test('captureDesignSnapshot and restoreDesignSnapshot enable lossless Undo of full redesign', () => {
  const cues = parseSrt(SAMPLE_SRT);
  const base = createDemoProject(cues);
  const snap = captureDesignSnapshot(base, 'Original Design');

  const remixed = remixProjectDesign(base, {
    layoutMode: 'split-focus',
    colorPalette: 'midnight-neon',
    visualStyle: 'dramatic-noir',
  });
  assert.equal(remixed.designConfig?.layoutMode, 'split-focus');
  assert.equal(remixed.designConfig?.colorPalette, 'midnight-neon');

  const restored = restoreDesignSnapshot(remixed, snap);
  assert.equal(
    restored.designConfig?.layoutMode,
    base.designConfig?.layoutMode ?? DEFAULT_DESIGN_CONFIG.layoutMode
  );
  assert.equal(restored.visualStyle, base.visualStyle ?? 'storybook-warm');
  assert.equal(restored.scenes[0].cameraShot, base.scenes[0].cameraShot);
});

test('timeline helpers adjust boundaries, split at midpoint, merge adjacent scenes, and renumber cleanly', () => {
  const cues = parseSrt(SAMPLE_SRT);
  const base = createDemoProject(cues);
  const firstId = base.scenes[0].id;
  const origEnd = base.scenes[0].endTime;

  const trimmed = adjustSceneBoundary(base.scenes, firstId, 'end', -2.0, base.duration);
  assert.equal(trimmed[0].endTime, Number((origEnd - 2.0).toFixed(2)));
  assert.equal(trimmed[1].startTime, trimmed[0].endTime);

  const split = splitSceneAtMidpoint(trimmed, firstId);
  assert.equal(split.length, base.scenes.length + 1);
  assert.equal(split[0].endTime, split[1].startTime);
  assert.equal(split[1].chapterNumber, '02');
  assert.equal(split[split.length - 1].chapterNumber, String(split.length).padStart(2, '0'));

  const merged = mergeSceneWithNext(split, split[0].id);
  assert.equal(merged.length, base.scenes.length);
  assert.equal(merged[0].endTime, trimmed[0].endTime);
});

test('shiftSrtCuesOffset shifts timestamps accurately and clamps at 0', () => {
  const cues = parseSrt(SAMPLE_SRT);
  const forward = shiftSrtCuesOffset(cues, 1.5);
  assert.equal(forward[0].startTime, 1.5);
  assert.equal(forward[0].endTime, 6.0);

  const clamped = shiftSrtCuesOffset(cues, -2.0);
  assert.equal(clamped[0].startTime, 0);
  assert.equal(clamped[1].startTime, 2.5);
});

test('Script-Only Quick Preview validates cleanly without audio while strict mode still rejects missing audio', () => {
  const strictRes = validateGenerationInputs({
    hasAudio: false,
    srtText: '',
    scriptText: 'একটি ছোট গল্পের স্ক্রিপ্ট।',
    allowScriptOnly: false,
  });
  assert.equal(strictRes.valid, false);

  const quickRes = validateGenerationInputs({
    hasAudio: false,
    srtText: '',
    scriptText: 'একটি ছোট গল্পের স্ক্রিপ্ট।',
    allowScriptOnly: true,
  });
  assert.equal(quickRes.valid, true);
  assert.equal(quickRes.syncReport.status, 'script-timed');

  const cues = parseSrt(SAMPLE_SRT);
  const env = createScriptPreviewEnvelope(cues, 10);
  assert.ok(env.length >= 100);
  assert.ok(env[10] > 0.15);
});

test('emotion BGM synthesizer applies Auto-Ducking when voiceover speech energy rises', () => {
  const silentGain = computeBgmGainAtTime(
    { enabled: true, preset: 'auto-emotion', volume: 0.3, autoDucking: true },
    0.05
  );
  const speechGain = computeBgmGainAtTime(
    { enabled: true, preset: 'auto-emotion', volume: 0.3, autoDucking: true },
    0.85
  );
  assert.ok(speechGain < silentGain * 0.5);

  const cues = parseSrt(SAMPLE_SRT);
  const base = createDemoProject(cues);
  const channels = synthesizeEmotionBgmChannels({
    duration: 2,
    sampleRate: 8000,
    preset: 'auto-emotion',
    volume: 0.25,
    autoDucking: true,
    scenes: base.scenes,
    audioEnvelope: [0.1, 0.8, 0.8, 0.1],
    audioEnvelopeHz: 2,
  });
  assert.equal(channels.left.length, 16000);
  assert.equal(channels.right.length, 16000);
  const peak = Math.max(...Array.from(channels.left.slice(0, 4000)).map(Math.abs));
  assert.ok(peak > 0.005);
});
