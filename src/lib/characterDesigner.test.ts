import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CUSTOM_CHARACTER_DRAFT,
  applyCustomCharacterToProject,
  buildCustomCharacterProfile,
  draftFromCharacterProfile,
  shadeHexColor,
} from './characterDesigner.ts';
import { compileStoryProject } from './storyCompiler.ts';

test('shadeHexColor accurately darkens and lightens hex colors', () => {
  assert.equal(shadeHexColor('#808080', -0.5), '#404040');
  assert.equal(shadeHexColor('#808080', 0.5), '#c0c0c0');
  assert.equal(shadeHexColor('invalid', -0.2), '#1F242D');
});

test('buildCustomCharacterProfile encodes outfit color, hairstyle, glasses, headwear & custom name', () => {
  const profile = buildCustomCharacterProfile({
    ...DEFAULT_CUSTOM_CHARACTER_DRAFT,
    id: 'custom-rahim',
    name: 'রহিম মিয়া',
    role: 'father',
    outfitColor: '#2E7D5B',
    hairStyleId: 'curly-voluminous',
    hasGlasses: true,
    headwear: 'tupi',
    hasBeard: true,
    hasGamchha: true,
  });

  assert.equal(profile.characterId, 'custom-rahim');
  assert.equal(profile.name, 'রহিম মিয়া');
  assert.equal(profile.outfitColor, '#2E7D5B');
  assert.notEqual(profile.outfitShadow, '#2E7D5B');
  assert.equal(profile.hairStyleId, 'curly-voluminous');
  assert.ok(profile.accessories.includes('glasses'));
  assert.ok(profile.accessories.includes('tupi'));
  assert.ok(profile.accessories.includes('beard'));
  assert.ok(profile.accessories.includes('gamchha'));
  assert.equal(profile.isCustom, true);

  const roundtrip = draftFromCharacterProfile(profile, true);
  assert.equal(roundtrip.name, 'রহিম মিয়া');
  assert.equal(roundtrip.headwear, 'tupi');
  assert.equal(roundtrip.hasGlasses, true);
  assert.equal(roundtrip.hairStyleId, 'curly-voluminous');
});

test('applyCustomCharacterToProject locks customized protagonist across every scene', () => {
  const base = compileStoryProject({
    title: 'River Journey',
    srtText: '',
    scriptText:
      'Morning light rises over the quiet village. A traveler walks down the road toward the river. In the evening the stars appear above the silent boat.',
    visualStyle: 'storybook-warm',
    audioUrl: null,
    audioDuration: 24,
  });

  const customProfile = buildCustomCharacterProfile({
    ...DEFAULT_CUSTOM_CHARACTER_DRAFT,
    id: 'custom-hero-1',
    name: 'Aarav',
    role: 'youth-boy',
    outfitColor: '#A93848',
    hasGlasses: true,
    headwear: 'hat',
  });

  const updated = applyCustomCharacterToProject(base, customProfile, true);
  assert.equal(updated.characterProfiles?.[0].name, 'Aarav');
  assert.equal(updated.characterProfiles?.[0].characterId, 'custom-hero-1');
  assert.ok(updated.characterBible?.includes('Aarav'));

  for (const scene of updated.scenes) {
    assert.equal(scene.primaryCharacter, 'youth-boy');
    assert.equal(scene.characterIds?.[0], 'custom-hero-1');
  }
});
