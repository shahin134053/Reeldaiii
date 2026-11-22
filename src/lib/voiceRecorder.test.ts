import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRecordedFileName,
  computeWaveformBars,
  encodePcmToWavArrayBuffer,
  formatRecorderTimer,
  selectSupportedRecorderMimeType,
} from './voiceRecorder.ts';

test('formatRecorderTimer formats mm:ss cleanly', () => {
  assert.equal(formatRecorderTimer(0), '00:00');
  assert.equal(formatRecorderTimer(9.8), '00:09');
  assert.equal(formatRecorderTimer(65), '01:05');
  assert.equal(formatRecorderTimer(-5), '00:00');
});

test('selectSupportedRecorderMimeType prefers opus webm then falls back cleanly', () => {
  const opus = selectSupportedRecorderMimeType((m) => m === 'audio/webm;codecs=opus');
  assert.equal(opus, 'audio/webm;codecs=opus');

  const mp4 = selectSupportedRecorderMimeType((m) => m === 'audio/mp4');
  assert.equal(mp4, 'audio/mp4');

  const none = selectSupportedRecorderMimeType(() => false);
  assert.equal(none, undefined);
});

test('buildRecordedFileName uses proper audio extension based on MIME type', () => {
  const fixedDate = new Date(2026, 4, 10, 9, 5);
  assert.equal(buildRecordedFileName(fixedDate, 'audio/wav'), 'voiceover-20260510-0905.wav');
  assert.equal(buildRecordedFileName(fixedDate, 'audio/webm;codecs=opus'), 'voiceover-20260510-0905.webm');
  assert.equal(buildRecordedFileName(fixedDate, 'audio/mp4'), 'voiceover-20260510-0905.m4a');
});

test('computeWaveformBars extracts normalized bar heights from time-domain samples', () => {
  const silent = new Uint8Array(64).fill(128);
  const silentBars = computeWaveformBars(silent, 8);
  assert.equal(silentBars.length, 8);
  assert.ok(silentBars.every((v) => v === 0.08));

  const loud = new Uint8Array(64).fill(250);
  const loudBars = computeWaveformBars(loud, 8);
  assert.ok(loudBars.every((v) => v > 0.8 && v <= 1));
});

test('encodePcmToWavArrayBuffer writes valid RIFF/WAVE header and 16-bit PCM payload', () => {
  const samples = new Float32Array([0, 0.5, -0.5, 1, -1]);
  const wav = encodePcmToWavArrayBuffer(samples, 44100);
  assert.equal(wav.byteLength, 44 + samples.length * 2);

  const view = new DataView(wav);
  const riff = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3)
  );
  const wave = String.fromCharCode(
    view.getUint8(8),
    view.getUint8(9),
    view.getUint8(10),
    view.getUint8(11)
  );
  assert.equal(riff, 'RIFF');
  assert.equal(wave, 'WAVE');
  assert.equal(view.getUint16(20, true), 1); // PCM
  assert.equal(view.getUint32(24, true), 44100); // sample rate
  assert.equal(view.getUint32(40, true), 10); // 5 samples * 2 bytes
});
