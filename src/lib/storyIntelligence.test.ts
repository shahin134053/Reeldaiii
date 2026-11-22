import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PIPELINE_STEP_DEFINITIONS,
  analyzeAudioSrtSync,
  auditProjectQuality,
  buildCharacterRegistry,
  computePipelineProgressPct,
  createInitialPipelineSteps,
  formatCharacterBibleFromProfiles,
  formatCuesToSrt,
  validateGenerationInputs,
} from './storyIntelligence';
import { compileStoryProject, redirectSingleSceneLocally } from './storyCompiler';

const SAMPLE_SRT = `1
00:00:00,000 --> 00:00:04,200
মানুষের সবচেয়ে বড় স্বপ্ন ছিল মহাকাশ জয় করা।

2
00:00:04,300 --> 00:00:09,000
রাতের আকাশে গর্জন তুলে রকেট ছুটে চলে নক্ষত্রের পথে।

3
00:00:09,100 --> 00:00:14,500
অবশেষে সমুদ্র ও পাহাড় জয় করে মানুষ নতুন ইতিহাস লেখে।`;

test('validateGenerationInputs enforces mandatory voiceover audio and SRT or script', () => {
  const noAudio = validateGenerationInputs({
    hasAudio: false,
    srtText: SAMPLE_SRT,
    scriptText: '',
  });
  assert.equal(noAudio.valid, false);
  assert.ok(noAudio.errors.some((e) => e.includes('Voiceover Audio')));

  const badExt = validateGenerationInputs({
    hasAudio: true,
    audioFileName: 'notes.pdf',
    srtText: SAMPLE_SRT,
    scriptText: '',
  });
  assert.equal(badExt.valid, false);

  const noText = validateGenerationInputs({
    hasAudio: true,
    audioFileName: 'voice.mp3',
    srtText: '',
    scriptText: '',
  });
  assert.equal(noText.valid, false);

  const badSrt = validateGenerationInputs({
    hasAudio: true,
    audioFileName: 'voice.mp3',
    srtText: 'not a valid subtitle file',
    scriptText: '',
  });
  assert.equal(badSrt.valid, false);

  const valid = validateGenerationInputs({
    hasAudio: true,
    audioFileName: 'voice.mp3',
    audioDuration: 15.0,
    srtText: SAMPLE_SRT,
    scriptText: '',
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.parsedCueCount, 3);
  assert.equal(valid.syncReport.status, 'synced');
});

test('analyzeAudioSrtSync classifies synced, minor-drift, mismatch, and script-timed accurately', () => {
  const cues = [
    { index: 1, startTime: 0, endTime: 10, text: 'Line 1' },
  ];

  assert.equal(
    analyzeAudioSrtSync({
      hasAudio: true,
      audioDuration: 11.2,
      cues,
      hasSrt: true,
      hasScript: false,
    }).status,
    'synced'
  );

  assert.equal(
    analyzeAudioSrtSync({
      hasAudio: true,
      audioDuration: 14.5,
      cues,
      hasSrt: true,
      hasScript: false,
    }).status,
    'minor-drift'
  );

  assert.equal(
    analyzeAudioSrtSync({
      hasAudio: true,
      audioDuration: 24.0,
      cues,
      hasSrt: true,
      hasScript: false,
    }).status,
    'mismatch'
  );

  assert.equal(
    analyzeAudioSrtSync({
      hasAudio: true,
      audioDuration: 18.0,
      cues: [],
      hasSrt: false,
      hasScript: true,
    }).status,
    'script-timed'
  );
});

test('buildCharacterRegistry locks consistent profiles and respects valid hex overrides', () => {
  const profiles = buildCharacterRegistry(['father', 'youth-boy'], [
    {
      role: 'father',
      name: 'Abdul Karim',
      outfitColor: '#224466',
      accessories: ['glasses', 'mustache'],
    },
  ]);

  assert.equal(profiles.length, 2);
  assert.equal(profiles[0].name, 'Abdul Karim');
  assert.equal(profiles[0].outfitColor, '#224466');
  assert.deepEqual(profiles[0].accessories, ['glasses', 'mustache']);
  const bible = formatCharacterBibleFromProfiles(profiles);
  assert.ok(bible.includes('Abdul Karim'));
  assert.ok(bible.includes('#224466'));
});

test('PIPELINE_STEP_DEFINITIONS exposes all 15 named stages and computes 1..100 progress', () => {
  assert.equal(PIPELINE_STEP_DEFINITIONS.length, 15);
  const steps = createInitialPipelineSteps();
  assert.equal(computePipelineProgressPct(steps), 1);

  const half = steps.map((s, idx) =>
    idx < 7 ? { ...s, status: 'completed' as const } : s
  );
  const halfPct = computePipelineProgressPct(half);
  assert.ok(halfPct >= 45 && halfPct <= 50, `Expected ~47%, got ${halfPct}`);

  const done = steps.map((s) => ({ ...s, status: 'completed' as const }));
  assert.equal(computePipelineProgressPct(done), 100);
});

test('auditProjectQuality catches missing audio, extreme focal bounds, and 3+ repeated scenes', () => {
  const project = compileStoryProject({
    title: 'Space & Ocean',
    srtText: SAMPLE_SRT,
    scriptText: '',
    audioUrl: 'blob:test-audio',
    audioFileName: 'voice.mp3',
    audioDuration: 15.0,
  });

  assert.ok(project.qualityAudit);
  assert.ok(project.qualityAudit.score >= 85, `Expected healthy score, got ${project.qualityAudit.score}`);
  assert.equal(project.qualityAudit.passed, true);

  const broken = {
    ...project,
    audioUrl: null,
    scenes: project.scenes.map((s) => ({
      ...s,
      setting: 'park-nature' as const,
      action: 'speaking-narrator' as const,
      emotion: 'calm' as const,
      focalPointX: 0.92,
    })),
  };

  const badReport = auditProjectQuality(broken);
  assert.equal(badReport.passed, false);
  assert.ok(badReport.issues.some((i) => i.category === 'audio'));
  assert.ok(badReport.issues.some((i) => i.category === 'aspect-ratio'));
  assert.ok(badReport.flaggedSceneIds.length > 0);
});

test('redirectSingleSceneLocally updates a single scene and formatCuesToSrt emits valid SRT', () => {
  const project = compileStoryProject({
    title: 'Adventure Story',
    srtText: SAMPLE_SRT,
    scriptText: '',
    audioUrl: 'blob:test-audio',
    audioFileName: 'voice.mp3',
    audioDuration: 15.0,
  });

  const targetId = project.scenes[0].id;
  const redirected = redirectSingleSceneLocally(project, targetId, 'rainy village market');
  assert.equal(redirected.scenes.length, project.scenes.length);
  assert.ok(redirected.scenes[0].visualMatchReason?.includes('rainy village market'));
  assert.ok(redirected.qualityAudit);

  const srtOut = formatCuesToSrt(project.cues);
  assert.ok(srtOut.includes('00:00:00,000 --> 00:00:04,200'));
  assert.ok(srtOut.includes('মহাকাশ'));
});
