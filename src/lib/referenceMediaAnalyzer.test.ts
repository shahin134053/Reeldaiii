import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeReferencePixels,
  applyReferenceMediaToProject,
  createSampleReferenceProfile,
} from './referenceMediaAnalyzer';
import { createDemoProject } from './storyCompiler';

describe('Reference Animation Image & Video Analyzer', () => {
  it('classifies warm golden/crimson sunset reference pixels accurately', () => {
    const profile = createSampleReferenceProfile('anime-sunset', 'style-and-palette');
    assert.equal(profile.mediaType, 'image');
    assert.equal(profile.dominantSwatches.length, 3);
    assert.ok(profile.dominantSwatches[2].startsWith('#'));
    assert.ok(profile.warmthScore > 0);
    assert.ok(
      profile.matchedColorPalette === 'crimson-drama' ||
        profile.matchedColorPalette === 'heritage-gold'
    );
  });

  it('classifies emerald forest reference pixels into emerald-earth palette', () => {
    const profile = createSampleReferenceProfile('emerald-folklore', 'style-and-palette');
    assert.equal(profile.matchedColorPalette, 'emerald-earth');
    assert.ok(profile.dominantSwatches[1].startsWith('#'));
  });

  it('classifies cool cyan/blue reference pixels into midnight-neon & cinematic-anime', () => {
    const profile = createSampleReferenceProfile('midnight-cyber', 'backdrop-overlay');
    assert.equal(profile.matchedColorPalette, 'midnight-neon');
    assert.equal(profile.matchedVisualStyle, 'cinematic-anime');
    assert.equal(profile.applyMode, 'backdrop-overlay');
  });

  it('classifies low-saturation dark pixels into monochrome-noir and dramatic-noir', () => {
    const w = 16;
    const h = 16;
    const buf = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < buf.length; i += 4) {
      buf[i] = 28;
      buf[i + 1] = 28;
      buf[i + 2] = 30;
      buf[i + 3] = 255;
    }
    const profile = analyzeReferencePixels(buf, w, h, {
      fileName: 'noir-reference.mp4',
      mediaType: 'video',
      durationSec: 6.5,
    });
    assert.equal(profile.mediaType, 'video');
    assert.equal(profile.matchedColorPalette, 'monochrome-noir');
    assert.equal(profile.matchedVisualStyle, 'dramatic-noir');
    assert.equal(profile.recommendedCameraMotion, 'dolly-in');
  });

  it('applyReferenceMediaToProject updates project visualStyle, designConfig,referenceMedia, and scene accents', () => {
    const demo = createDemoProject([
      { index: 1, startTime: 0, endTime: 5, text: 'একটি সুন্দর গল্পের শুরু' },
    ]);
    const ref = createSampleReferenceProfile('midnight-cyber', 'backdrop-overlay');
    const updated = applyReferenceMediaToProject(demo, ref);

    assert.equal(updated.visualStyle, ref.matchedVisualStyle);
    assert.equal(updated.designConfig?.colorPalette, ref.matchedColorPalette);
    assert.equal(updated.referenceMedia?.id, ref.id);
    assert.equal(updated.scenes[0].accentColor, ref.dominantSwatches[2]);
    assert.equal(updated.scenes[0].presetSceneId, undefined);
  });
});
