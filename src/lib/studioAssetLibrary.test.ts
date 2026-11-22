import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STUDIO_ASSET_CATEGORIES,
  STUDIO_CHARACTER_ASSETS,
  STUDIO_ENVIRONMENT_ASSETS,
  applyAutoIllustratedEnvironmentsToProject,
  applyCharacterAssetToProject,
  applyEnvironmentAssetToProject,
  buildCharacterProfileFromAsset,
  draftFromCharacterAsset,
  getCharacterAssetById,
  getEnvironmentAssetById,
  matchCharacterAssetForText,
  matchEnvironmentAssetForText,
} from './studioAssetLibrary';
import { compileStoryProject, createDemoProject } from './storyCompiler';
import {
  resolveSceneActorProfile,
  stripDetachedSmallIslands,
} from '../animation/assetCanvasRenderer';
import { applyCustomCharacterToProject } from './characterDesigner';

test('contains all 27 environments and 27 characters with unique IDs and resolved URLs', () => {
  assert.equal(STUDIO_ENVIRONMENT_ASSETS.length, 27);
  assert.equal(STUDIO_CHARACTER_ASSETS.length, 27);
  assert.equal(STUDIO_ASSET_CATEGORIES.length, 5);

  const envIds = new Set(STUDIO_ENVIRONMENT_ASSETS.map((e) => e.id));
  const charIds = new Set(STUDIO_CHARACTER_ASSETS.map((c) => c.id));
  assert.equal(envIds.size, 27);
  assert.equal(charIds.size, 27);

  for (const env of STUDIO_ENVIRONMENT_ASSETS) {
    assert.ok(env.url.includes('assets/aistudio/'));
    assert.ok(env.nameEn.length > 2 && env.nameBn.length > 2);
  }

  for (const ch of STUDIO_CHARACTER_ASSETS) {
    assert.ok(ch.url.includes('assets/aistudio/'));
    const { sx, sy, sw, sh } = ch.cutoutCrop;
    assert.ok(sx >= 0 && sx < 1 && sy >= 0 && sy < 1);
    assert.ok(sw > 0.1 && sh > 0.3);
    assert.ok(sx + sw <= 1.01 && sy + sh <= 1.01);
  }
});

test('matches environments and characters from English and Bengali story text', () => {
  const tea = matchEnvironmentAssetForText('গ্রামের রাস্তার চায়ের দোকান থেকে ধোঁয়া উঠছে');
  assert.equal(tea?.id, 'env-bd-tea-stall');

  const hospital = matchEnvironmentAssetForText('The doctor checked the patient in the sunny hospital ward');
  assert.ok(hospital?.id === 'env-hospital-sunlight' || hospital?.id === 'env-modern-hospital');

  const rickshaw = matchCharacterAssetForText('সৎ রিকশাচালক চাচা যাত্রী নিয়ে যাচ্ছেন');
  assert.equal(rickshaw?.id, 'char-rickshaw-puller');

  const hero = matchCharacterAssetForText('The fearless superhero kid flew across the skyline');
  assert.equal(hero?.id, 'char-superhero-kid');
});

test('builds dual-mode CharacterProfile and draft cleanly from any 2D sheet', () => {
  const owl = getCharacterAssetById('char-wise-owl');
  assert.ok(owl);

  const rigProfile = buildCharacterProfileFromAsset(owl, 'rig-sync', 'জ্ঞানী প্যাঁচা');
  assert.equal(rigProfile.renderMode, 'rig-sync');
  assert.equal(rigProfile.sourceAssetId, 'char-wise-owl');
  assert.equal(rigProfile.name, 'জ্ঞানী প্যাঁচা');

  const cutoutProfile = buildCharacterProfileFromAsset(owl, 'illustrated-cutout');
  assert.equal(cutoutProfile.renderMode, 'illustrated-cutout');
  assert.ok(cutoutProfile.referenceSheetUrl?.includes('Wise_owl_character_design_sheet'));

  const draft = draftFromCharacterAsset(owl, 'illustrated-cutout');
  assert.equal(draft.sourceAssetId, 'char-wise-owl');
  assert.equal(draft.renderMode, 'illustrated-cutout');
});

test('applies environments and characters both project-wide and per-scene', () => {
  const project = compileStoryProject({
    title: 'Dual Studio Test',
    scriptText:
      'একজন রিকশাচালক সকালের চায়ের দোকানে বসে আছেন। এরপর তিনি শহরের রাস্তায় বের হলেন।',
    audioDuration: 16,
  });

  const envA = getEnvironmentAssetById('env-bd-tea-stall');
  const envB = getEnvironmentAssetById('env-futuristic-city');
  const charA = getCharacterAssetById('char-tea-vendor');
  const charB = getCharacterAssetById('char-cyberpunk-girl');
  assert.ok(envA && envB && charA && charB);

  let updated = applyEnvironmentAssetToProject(project, envA, { scope: 'all' });
  assert.ok(updated.scenes.every((s) => s.customBackgroundAssetId === 'env-bd-tea-stall'));

  const firstSceneId = updated.scenes[0].id;
  updated = applyEnvironmentAssetToProject(updated, envB, {
    scope: 'scene',
    sceneId: firstSceneId,
  });
  assert.equal(updated.scenes[0].customBackgroundAssetId, 'env-futuristic-city');
  if (updated.scenes.length > 1) {
    assert.equal(updated.scenes[1].customBackgroundAssetId, 'env-bd-tea-stall');
  }

  updated = applyCharacterAssetToProject(updated, charA, {
    scope: 'all',
    slot: 'primary',
    renderMode: 'illustrated-cutout',
  });
  assert.ok(updated.scenes.every((s) => s.primaryCharacterAssetId === 'char-tea-vendor'));
  assert.ok(updated.scenes.every((s) => s.characterRenderMode === 'illustrated-cutout'));

  updated = applyCharacterAssetToProject(updated, charB, {
    scope: 'scene',
    sceneId: firstSceneId,
    slot: 'secondary',
    renderMode: 'rig-sync',
  });
  assert.equal(updated.scenes[0].secondaryCharacterAssetId, 'char-cyberpunk-girl');
  assert.equal(updated.scenes[0].characterRenderMode, 'rig-sync');

  // Auto-match environments works cleanly when scenes lack customBackgroundAssetId
  const cleared = applyEnvironmentAssetToProject(project, null, { scope: 'all' });
  const autoMatched = applyAutoIllustratedEnvironmentsToProject(cleared);
  assert.equal(autoMatched.autoUseIllustratedWorlds, true);
  assert.ok(autoMatched.scenes.some((s) => Boolean(s.customBackgroundAssetId)));
});

test('stripDetachedSmallIslands removes floating label/dot fragments while keeping main silhouette', () => {
  const width = 40;
  const height = 40;
  const rgba = new Uint8ClampedArray(width * height * 4);
  const paintRect = (x0: number, y0: number, x1: number, y1: number) => {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        rgba[(y * width + x) * 4 + 3] = 255;
      }
    }
  };

  // Main character block (20x20 = 400 px)
  paintRect(10, 12, 29, 31);
  // Stray "FRONT VIEW" fragment above (6x2 = 12 px)
  paintRect(14, 2, 19, 3);
  // Stray palette dot inside X range near bottom (2x2 = 4 px)
  paintRect(25, 36, 26, 37);

  stripDetachedSmallIslands(rgba, width, height);

  // Main character center pixel still opaque
  assert.equal(rgba[(20 * width + 20) * 4 + 3], 255);
  // Floating text & dot cleared
  assert.equal(rgba[(2 * width + 15) * 4 + 3], 0);
  assert.equal(rgba[(36 * width + 25) * 4 + 3], 0);
});

test('applyCustomCharacterToProject clears Demo presetSceneId and customSvg and binds cutout profile', () => {
  const demo = createDemoProject([]);
  // Simulate AI-generated customSvg on one scene as well
  demo.scenes[0] = { ...demo.scenes[0], customSvg: '<svg></svg>' };
  assert.ok(demo.scenes.every((s) => Boolean(s.presetSceneId)));

  const teacher = getCharacterAssetById('char-school-teacher');
  assert.ok(teacher);
  const teacherProfile = buildCharacterProfileFromAsset(teacher, 'illustrated-cutout');

  const applied = applyCustomCharacterToProject(demo, teacherProfile, true);
  assert.ok(applied.scenes.every((s) => s.presetSceneId === undefined));
  assert.ok(applied.scenes.every((s) => s.customSvg === undefined));
  assert.ok(applied.scenes.every((s) => s.primaryCharacterAssetId === 'char-school-teacher'));
  assert.ok(applied.scenes.every((s) => s.characterRenderMode === 'illustrated-cutout'));

  const resolved = resolveSceneActorProfile(
    applied.characterProfiles,
    applied.scenes[0].primaryCharacter ?? 'teacher',
    applied.scenes[0],
    'primary'
  );
  assert.equal(resolved?.sourceAssetId, 'char-school-teacher');
  assert.equal(resolved?.renderMode, 'illustrated-cutout');
});

test('applyCustomCharacterToProject unlocked updates targetSceneId when role does not match existing scenes', () => {
  const demo = createDemoProject([]);
  const owl = getCharacterAssetById('char-wise-owl');
  assert.ok(owl);
  const owlProfile = buildCharacterProfileFromAsset(owl, 'illustrated-cutout');

  const targetId = demo.scenes[2].id;
  const updated = applyCustomCharacterToProject(demo, owlProfile, false, targetId);
  assert.equal(updated.scenes[2].primaryCharacterAssetId, 'char-wise-owl');
  assert.equal(updated.scenes[2].presetSceneId, undefined);
  assert.notEqual(updated.scenes[0].primaryCharacterAssetId, 'char-wise-owl');
});

test('applyCharacterAssetToProject clears both presetSceneId and customSvg', () => {
  const demo = createDemoProject([]);
  demo.scenes[0] = { ...demo.scenes[0], customSvg: '<svg></svg>' };
  const hero = getCharacterAssetById('char-superhero-kid');
  assert.ok(hero);

  const updated = applyCharacterAssetToProject(demo, hero, {
    scope: 'all',
    slot: 'primary',
    renderMode: 'illustrated-cutout',
  });
  assert.ok(updated.scenes.every((s) => s.presetSceneId === undefined));
  assert.ok(updated.scenes.every((s) => s.customSvg === undefined));
  assert.ok(updated.scenes.every((s) => s.primaryCharacterAssetId === 'char-superhero-kid'));
});
