import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyAcousticViseme,
  extractPhoneticTrackFromSamples,
  sampleVisemePose,
  synthesizePhoneticTrackFromCues,
  textToVisemeSequence,
} from './visemeEngine';
import { SubtitleCue } from './srtParser';

function generateSinePcm(freqHz: number, sampleRate: number, seconds: number, amp = 0.7): Float32Array {
  const len = Math.floor(sampleRate * seconds);
  const buf = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    buf[i] = Math.sin((2 * Math.PI * freqHz * i) / sampleRate) * amp;
  }
  return buf;
}

function generateSibilantNoisePcm(sampleRate: number, seconds: number, amp = 0.55): Float32Array {
  const len = Math.floor(sampleRate * seconds);
  const buf = new Float32Array(len);
  // Deterministic alternating high-frequency signal (~5.5kHz) simulating 'S'/'SH' fricative
  for (let i = 0; i < len; i++) {
    buf[i] = Math.sin((2 * Math.PI * 5200 * i) / sampleRate) * amp;
  }
  return buf;
}

describe('Phonetic Viseme Engine', () => {
  it('maps Bengali bilabials, open vowels, and sibilants to distinct visemes', () => {
    const bilabialSeq = textToVisemeSequence('মা বাবা আলো');
    assert.ok(bilabialSeq.some((t) => t.id === 'MBP'), 'Expected bilabial MBP for ম/ব');
    assert.ok(bilabialSeq.some((t) => t.id === 'AA'), 'Expected open vowel AA for আ/া');

    const sibilantSeq = textToVisemeSequence('শিশু সুন্দর');
    assert.ok(sibilantSeq.some((t) => t.id === 'SSZ'), 'Expected sibilant SSZ for শ/স');
    assert.ok(sibilantSeq.some((t) => t.id === 'EE'), 'Expected front vowel EE for ি');
    assert.ok(sibilantSeq.some((t) => t.id === 'OO'), 'Expected pursed vowel OO for ু');
  });

  it('maps English digraphs and distinct consonants accurately', () => {
    const seq = textToVisemeSequence('think ship phone pool');
    const ids = seq.map((t) => t.id);
    assert.ok(ids.includes('TH'), 'Expected TH for "think"');
    assert.ok(ids.includes('SSZ'), 'Expected SSZ for "ship"');
    assert.ok(ids.includes('FV'), 'Expected FV for "phone"');
    assert.ok(ids.includes('OO'), 'Expected OO for "pool"');
  });

  it('classifies unvoiced high-ZCR PCM as SSZ/FV and low-frequency voiced PCM as OH/OO/AA', () => {
    const sr = 16000;
    const sibilantPcm = generateSibilantNoisePcm(sr, 0.5, 0.6);
    const lowVowelPcm = generateSinePcm(220, sr, 0.5, 0.8);
    const silentPcm = new Float32Array(sr * 0.5);

    const sibTrack = extractPhoneticTrackFromSamples(sibilantPcm, sr, 20);
    const vowelTrack = extractPhoneticTrackFromSamples(lowVowelPcm, sr, 20);
    const silentTrack = extractPhoneticTrackFromSamples(silentPcm, sr, 20);

    const sibViseme = classifyAcousticViseme(sibTrack.frames[4]);
    const vowelViseme = classifyAcousticViseme(vowelTrack.frames[4]);
    const silentViseme = classifyAcousticViseme(silentTrack.frames[4]);

    assert.ok(sibViseme === 'SSZ' || sibViseme === 'FV', `Expected sibilant, got ${sibViseme}`);
    assert.ok(vowelViseme === 'OH' || vowelViseme === 'OO' || vowelViseme === 'AA', `Expected voiced vowel, got ${vowelViseme}`);
    assert.equal(silentViseme, 'rest');
  });

  it('forces rest during silence and preserves distinct articulatory geometry across vowels', () => {
    const cues: SubtitleCue[] = [
      { index: 1, startTime: 0.5, endTime: 1.5, text: 'মা আলো' },
      { index: 2, startTime: 2.5, endTime: 3.5, text: 'শীত সূর্য' },
    ];
    const synth = synthesizePhoneticTrackFromCues(cues, 4.5, 20);

    const silentPose = sampleVisemePose({
      cues,
      phoneticFrames: synth.frames,
      phoneticHz: synth.phoneticHz,
      time: 2.0,
      speechEnergy: 0.02,
    });
    assert.equal(silentPose.id, 'rest');
    assert.equal(silentPose.openness, 0);

    const openPose = sampleVisemePose({
      cues,
      phoneticFrames: synth.frames,
      phoneticHz: synth.phoneticHz,
      time: 0.9, // around 'আলো' ('AA' / 'L' / 'OH')
      speechEnergy: 0.78,
    });
    assert.notEqual(openPose.id, 'rest');
    assert.ok(openPose.openness > 0.25, `Expected noticeable mouth opening during speech, got ${openPose.openness}`);

    const sibPose = sampleVisemePose({
      cues,
      phoneticFrames: synth.frames,
      phoneticHz: synth.phoneticHz,
      time: 2.58, // start of 'শীত' ('SSZ' / 'EE')
      speechEnergy: 0.65,
    });
    assert.ok(sibPose.width > 0.5, `Expected wider spread mouth for sibilant/EE, got ${sibPose.width}`);
  });
});
