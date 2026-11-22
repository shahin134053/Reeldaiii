import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractAudioEnvelopeFromSamples,
  sampleSpeechEnergy,
  synthesizeEnvelopeFromCues,
} from './audioAnalyzer';

test('extractAudioEnvelopeFromSamples measures speech peaks vs silence accurately', () => {
  const sampleRate = 8000;
  // 2 seconds total: 0-1s loud sine speech, 1-2s silence
  const pcm = new Float32Array(sampleRate * 2);
  for (let i = 0; i < sampleRate; i++) {
    pcm[i] = Math.sin((i / sampleRate) * Math.PI * 2 * 220) * 0.6;
  }

  const res = extractAudioEnvelopeFromSamples(pcm, sampleRate, 10);
  assert.equal(res.sampleRateHz, 10);
  assert.equal(res.envelope.length, 20);
  assert.ok(res.envelope[2] > 0.7, 'Expected high energy during speech segment');
  assert.ok(res.envelope[15] < 0.05, 'Expected near-zero energy during silence');
  assert.equal(res.source, 'decoded-audio');
});

test('synthesizeEnvelopeFromCues generates active cadence inside cues and quiet gaps outside', () => {
  const cues = [
    { index: 1, startTime: 1.0, endTime: 3.5, text: 'প্রতিদিন ভোরে আমরা স্বপ্ন দেখি।' },
    { index: 2, startTime: 5.5, endTime: 8.0, text: 'পরিশ্রম একদিন সফলতা আনে।' },
  ];
  const res = synthesizeEnvelopeFromCues(cues, 10, 10);

  assert.equal(res.source, 'cue-cadence');
  assert.ok(sampleSpeechEnergy(res.envelope, 2.2) > 0.25, 'Active cue should have speaking energy');
  assert.ok(sampleSpeechEnergy(res.envelope, 4.5) < 0.1, 'Gap between cues should stay quiet');
});
