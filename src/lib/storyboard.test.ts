import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseSrt, parseSrtTimestamp, getActiveCue } from './srtParser';
import {
  STORY_SCENES,
  ENGLISH_SUBTITLES,
  FILM_DURATION,
  getSceneAtTime,
  getSceneProgress,
  formatTimecode,
} from './storyboard';

test('parseSrtTimestamp converts comma and dot timestamps accurately', () => {
  assert.equal(parseSrtTimestamp('00:00:00,120'), 0.12);
  assert.equal(parseSrtTimestamp('00:01:05,379'), 65.379);
  assert.equal(parseSrtTimestamp('00:03:54.960'), 234.96);
  assert.equal(parseSrtTimestamp('invalid'), 0);
});

test('parseSrt parses the uploaded Bengali SRT file into 65 ordered cues', () => {
  const srtPath = path.resolve(
    process.cwd(),
    'public/assets/aistudio/ElevenLabs_2026-11-21T19_29_56_Charlie_-_Deep_Confident_Energetic_pre_s50_sim75_v4_ben_d89c7a2d.srt'
  );
  const raw = fs.readFileSync(srtPath, 'utf8');
  const cues = parseSrt(raw);

  assert.equal(cues.length, 65);
  assert.equal(cues[0].index, 1);
  assert.match(cues[0].text, /বাবা এখানেই থামাও/);
  assert.equal(cues[64].index, 65);
  assert.match(cues[64].text, /ফুলিয়ে বলার/);

  // Every SRT cue has a matching English translation
  for (const cue of cues) {
    assert.ok(
      typeof ENGLISH_SUBTITLES[cue.index] === 'string' && ENGLISH_SUBTITLES[cue.index].length > 0,
      `Missing English subtitle for cue ${cue.index}`
    );
  }
});

test('getActiveCue returns exact cue inside range and null in gaps', () => {
  const cues = [
    { index: 1, startTime: 0.12, endTime: 4.04, text: 'Line 1' },
    { index: 2, startTime: 5.0, endTime: 8.5, text: 'Line 2' },
  ];
  assert.equal(getActiveCue(cues, 0.05), null);
  assert.equal(getActiveCue(cues, 2.0)?.index, 1);
  assert.equal(getActiveCue(cues, 4.5), null);
  assert.equal(getActiveCue(cues, 6.2)?.index, 2);
  assert.equal(getActiveCue(cues, 9.0), null);
});

test('STORY_SCENES forms a continuous timeline from 0 to FILM_DURATION', () => {
  assert.equal(STORY_SCENES.length, 8);
  assert.equal(STORY_SCENES[0].startTime, 0);
  for (let i = 1; i < STORY_SCENES.length; i++) {
    assert.equal(STORY_SCENES[i].startTime, STORY_SCENES[i - 1].endTime);
    assert.ok(STORY_SCENES[i].endTime > STORY_SCENES[i].startTime);
  }
  assert.equal(STORY_SCENES[STORY_SCENES.length - 1].endTime, FILM_DURATION);
});

test('getSceneAtTime and getSceneProgress handle boundaries and clamping', () => {
  assert.equal(getSceneAtTime(-5).id, 'morning-dropoff');
  assert.equal(getSceneAtTime(10).id, 'morning-dropoff');
  assert.equal(getSceneAtTime(35).id, 'fajr-gamchha');
  assert.equal(getSceneAtTime(75).id, 'teastall-hurt');
  assert.equal(getSceneAtTime(115).id, 'exam-dinner');
  assert.equal(getSceneAtTime(135).id, 'storm-window');
  assert.equal(getSceneAtTime(160).id, 'rain-arrival');
  assert.equal(getSceneAtTime(200).id, 'mirror-ride');
  assert.equal(getSceneAtTime(225).id, 'sunset-epilogue');
  assert.equal(getSceneAtTime(999).id, 'sunset-epilogue');

  const scene1 = STORY_SCENES[0];
  assert.equal(getSceneProgress(scene1, -10), 0);
  assert.equal(getSceneProgress(scene1, 14), 0.5);
  assert.equal(getSceneProgress(scene1, 50), 1);
});

test('formatTimecode formats seconds into MM:SS with zero padding', () => {
  assert.equal(formatTimecode(0), '00:00');
  assert.equal(formatTimecode(9.8), '00:09');
  assert.equal(formatTimecode(65), '01:05');
  assert.equal(formatTimecode(235), '03:55');
  assert.equal(formatTimecode(-4), '00:00');
});
