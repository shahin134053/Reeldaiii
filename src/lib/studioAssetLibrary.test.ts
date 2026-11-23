import fs from 'node:fs';
import path from 'node:path';
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

test('resets uploaded environments while installing all 17 animated character PNGs with unique IDs and files on disk', () => {
  assert.equal(STUDIO_ENVIRONMENT_ASSETS.length, 0);
  assert.equal(STUDIO_CHARACTER_ASSETS.length, 17);
  assert.equal(STUDIO_ASSET_CATEGORIES.length, 4);

  const charIds = new Set(STUDIO_CHARACTER_ASSETS.map((c) => c.id));
  assert.equal(charIds.size, 17);

  for (const cat of STUDIO_ASSET_CATEGORIES) {
    assert.ok(
      STUDIO_CHARACTER_ASSETS.some((c) => c.category === cat.id),
      `Category ${cat.id} should contain at least one character`
    );
  }

  for (const ch of STUDIO_CHARACTER_ASSETS) {
    assert.ok(ch.url.includes('assets/aistudio/'));
    assert.ok(ch.fileName.endsWith('.png'), `${ch.id} should reference a PNG asset`);
    const diskPath = path.resolve(process.cwd(), 'public/assets/aistudio', ch.fileName);
    assert.ok(fs.existsSync(diskPath), `Missing asset file on disk: ${diskPath}`);
    assert.ok(ch.nameEn.length > 2 && ch.nameBn.length > 2);
    assert.ok(ch.motionStyle, `${ch.id} should define an explicit motionStyle`);

    const { sx, sy, sw, sh } = ch.cutoutCrop;
    assert.ok(sx >= 0 && sx < 1 && sy >= 0 && sy < 1);
    assert.ok(sw > 0.1 && sh > 0.3);
    assert.ok(sx + sw <= 1.01 && sy + sh <= 1.01);
  }
});

test('environment matchers return null while character matchers match English and Bengali text', () => {
  assert.equal(
    matchEnvironmentAssetForText('গ্রামের রাস্তার চায়ের দোকান থেকে ধোঁয়া উঠছে'),
    null
  );
  assert.equal(getEnvironmentAssetById('env-bd-tea-stall'), null);

  const rickshaw = matchCharacterAssetForText('সৎ রিকশাচালক চাচা যাত্রী নিয়ে যাচ্ছেন');
  assert.ok(
    rickshaw?.id === 'char-rickshaw-cyclist' || rickshaw?.id === 'char-rickshaw-puller'
  );

  const runner = matchCharacterAssetForText('The sprint athlete runner raced across the marathon track');
  assert.equal(runner?.id, 'char-athlete-runner');

  const farmer = matchCharacterAssetForText('বাংলার কৃষক কোদাল হাতে মাঠে ধান কাটছেন');
  assert.equal(farmer?.id, 'char-bd-farmer-spade');

  const nurse = matchCharacterAssetForText('Compassionate nurse in the hospital clinic');
  assert.equal(nurse?.id, 'char-nurse');
});

test('builds dual-mode CharacterProfile and draft cleanly from new 2D assets with illustrated-cutout default', () => {
  const scientist = getCharacterAssetById('char-scientist');
  assert.ok(scientist);

  const defaultCutout = buildCharacterProfileFromAsset(scientist);
  assert.equal(defaultCutout.renderMode, 'illustrated-cutout');
  assert.equal(defaultCutout.sourceAssetId, 'char-scientist');
  assert.ok(defaultCutout.referenceSheetUrl?.includes('Scientist_character_vector_illus'));

  const rigProfile = buildCharacterProfileFromAsset(scientist, 'rig-sync', 'বিজ্ঞানী মীরা');
  assert.equal(rigProfile.renderMode, 'rig-sync');
  assert.equal(rigProfile.sourceAssetId, 'char-scientist');
  assert.equal(rigProfile.name, 'বিজ্ঞানী মীরা');

  const draft = draftFromCharacterAsset(scientist);
  assert.equal(draft.sourceAssetId, 'char-scientist');
  assert.equal(draft.renderMode, 'illustrated-cutout');
});

test('applies characters project-wide and per-scene while keeping default procedural worlds clean', () => {
  const project = compileStoryProject({
    title: 'Dual Studio Test',
    scriptText:
      'একজন রিকশাচালক সকালের চায়ের দোকানে বসে আছেন। এরপর তিনি শহরের রাস্তায় বের হলেন।',
    audioDuration: 16,
  });

  const charA = getCharacterAssetById('char-rickshaw-cyclist');
  const charB = getCharacterAssetById('char-software-engineer');
  assert.ok(charA && charB);

  let updated = applyCharacterAssetToProject(project, charA, {
    scope: 'all',
    slot: 'primary',
  });
  assert.ok(updated.scenes.every((s) => s.primaryCharacterAssetId === 'char-rickshaw-cyclist'));
  assert.ok(updated.scenes.every((s) => s.characterRenderMode === 'illustrated-cutout'));

  const firstSceneId = updated.scenes[0].id;
  updated = applyCharacterAssetToProject(updated, charB, {
    scope: 'scene',
    sceneId: firstSceneId,
    slot: 'secondary',
    renderMode: 'rig-sync',
  });
  assert.equal(updated.scenes[0].secondaryCharacterAssetId, 'char-software-engineer');
  assert.equal(updated.scenes[0].characterRenderMode, 'rig-sync');
  if (updated.scenes.length > 1) {
    assert.equal(updated.scenes[1].characterRenderMode, 'illustrated-cutout');
  }

  // Clearing environment or calling auto-match preserves procedural default worlds
  const cleared = applyEnvironmentAssetToProject(updated, null, { scope: 'all' });
  assert.ok(cleared.scenes.every((s) => s.customBackgroundAssetId === undefined));

  const autoMatched = applyAutoIllustratedEnvironmentsToProject(cleared);
  assert.equal(autoMatched.autoUseIllustratedWorlds, false);
  assert.ok(autoMatched.scenes.every((s) => s.customBackgroundAssetId === undefined));
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

  paintRect(10, 12, 29, 31);
  paintRect(14, 2, 19, 3);
  paintRect(25, 36, 26, 37);

  stripDetachedSmallIslands(rgba, width, height);

  assert.equal(rgba[(20 * width + 20) * 4 + 3], 255);
  assert.equal(rgba[(2 * width + 15) * 4 + 3], 0);
  assert.equal(rgba[(36 * width + 25) * 4 + 3], 0);
});

test('applyCustomCharacterToProject clears Demo presetSceneId and customSvg and binds cutout profile', () => {
  const demo = createDemoProject([]);
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
  const runner = getCharacterAssetById('char-athlete-runner');
  assert.ok(runner);
  const runnerProfile = buildCharacterProfileFromAsset(runner, 'illustrated-cutout');

  const targetId = demo.scenes[2].id;
  const updated = applyCustomCharacterToProject(demo, runnerProfile, false, targetId);
  assert.equal(updated.scenes[2].primaryCharacterAssetId, 'char-athlete-runner');
  assert.equal(updated.scenes[2].presetSceneId, undefined);
  assert.notEqual(updated.scenes[0].primaryCharacterAssetId, 'char-athlete-runner');
});

test('applyCharacterAssetToProject clears both presetSceneId and customSvg', () => {
  const demo = createDemoProject([]);
  demo.scenes[0] = { ...demo.scenes[0], customSvg: '<svg></svg>' };
  const pilot = getCharacterAssetById('char-airline-pilot');
  assert.ok(pilot);

  const updated = applyCharacterAssetToProject(demo, pilot, {
    scope: 'all',
    slot: 'primary',
    renderMode: 'illustrated-cutout',
  });
  assert.ok(updated.scenes.every((s) => s.presetSceneId === undefined));
  assert.ok(updated.scenes.every((s) => s.customSvg === undefined));
  assert.ok(updated.scenes.every((s) => s.primaryCharacterAssetId === 'char-airline-pilot'));
});

test('applying primary asset matching previous secondaryCharacter trades roles without duplicating cutout in secondary slot', () => {
  const demo = createDemoProject([]);
  demo.scenes[0] = {
    ...demo.scenes[0],
    primaryCharacter: 'youth-boy',
    secondaryCharacter: 'father',
  };
  const rickshaw = getCharacterAssetById('char-rickshaw-cyclist');
  assert.ok(rickshaw);

  const updated = applyCharacterAssetToProject(demo, rickshaw, {
    scope: 'scene',
    sceneId: demo.scenes[0].id,
    slot: 'primary',
    renderMode: 'illustrated-cutout',
  });

  const scene0 = updated.scenes[0];
  assert.equal(scene0.primaryCharacter, 'father');
  assert.equal(scene0.secondaryCharacter, 'youth-boy');

  const resolvedPrimary = resolveSceneActorProfile(
    updated.characterProfiles,
    scene0.primaryCharacter,
    scene0,
    'primary'
  );
  const resolvedSecondary = resolveSceneActorProfile(
    updated.characterProfiles,
    scene0.secondaryCharacter ?? 'youth-boy',
    scene0,
    'secondary'
  );
  assert.equal(resolvedPrimary?.sourceAssetId, 'char-rickshaw-cyclist');
  assert.notEqual(resolvedSecondary?.sourceAssetId, 'char-rickshaw-cyclist');
});

