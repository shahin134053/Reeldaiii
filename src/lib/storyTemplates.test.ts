import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORY_TEMPLATES,
  applyStoryTemplateToProject,
  getStoryTemplateById,
} from './storyTemplates.ts';
import { compileStoryProject } from './storyCompiler.ts';

test('STORY_TEMPLATES includes all 5 required story genres with bilingual metadata', () => {
  const ids = STORY_TEMPLATES.map((t) => t.id);
  assert.deepEqual(ids, [
    'rupkotha',
    'horror-mystery',
    'history',
    'motivational',
    'kids-rhyme',
  ]);

  for (const tpl of STORY_TEMPLATES) {
    assert.ok(tpl.nameEn.length > 0);
    assert.ok(tpl.nameBn.length > 0);
    assert.ok(tpl.starterScriptEn.length > 40);
    assert.ok(tpl.starterScriptBn.length > 40);
    assert.equal(tpl.swatches.length, 3);
  }
});

test('applyStoryTemplateToProject applies palette, font, camera motion, visualStyle & BGM cleanly', () => {
  const base = compileStoryProject({
    title: 'Test Story',
    srtText: '',
    scriptText:
      'At midnight a dense fog covered the old station. Rain tapped on the tin roof. Someone walked down the platform slowly.',
    visualStyle: 'storybook-warm',
    audioUrl: null,
    audioDuration: 24,
  });

  const horrorTpl = getStoryTemplateById('horror-mystery');
  const styled = applyStoryTemplateToProject(base, 'horror-mystery');

  // Immutability check
  assert.notEqual(styled, base);
  assert.equal(base.visualStyle, 'storybook-warm');

  assert.equal(styled.visualStyle, horrorTpl.visualStyle);
  assert.equal(styled.designConfig?.colorPalette, 'monochrome-noir');
  assert.equal(styled.designConfig?.layoutMode, 'full-bleed');
  assert.equal(styled.subtitleConfig?.fontFamily, 'jetbrains-mono');
  assert.equal(styled.subtitleConfig?.highlightColor, horrorTpl.subtitleHighlightColor);
  assert.equal(styled.bgmConfig?.preset, 'lofi-ambient');
  assert.equal(styled.scenes[0].cameraMotion, 'dolly-in');
  assert.equal(styled.scenes[0].accentColor, horrorTpl.accentColor);
});
