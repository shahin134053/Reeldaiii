import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isStudioSectionPopulated,
  normalizeExternalUrl,
  resolveInitialNavigation,
} from './appNavigation';

test('resolveInitialNavigation defaults to home front page when no query params exist', () => {
  const state = resolveInitialNavigation('');
  assert.equal(state.page, 'home');
  assert.equal(state.studioSection, 'create');
  assert.equal(state.openDemoReady, false);
  assert.equal(state.seekTime, null);
  assert.equal(state.autostart, false);
});

test('resolveInitialNavigation routes explicit studio and developer page params accurately', () => {
  const studio = resolveInitialNavigation('?page=studio&tab=storyboard');
  assert.equal(studio.page, 'studio');
  assert.equal(studio.studioSection, 'storyboard');
  assert.equal(studio.openDemoReady, false);

  const manual = resolveInitialNavigation('?page=manual');
  assert.equal(manual.page, 'manual');
  assert.equal(manual.openDemoReady, false);

  const dev = resolveInitialNavigation('?page=developer');
  assert.equal(dev.page, 'developer');
  assert.equal(dev.openDemoReady, false);

  const fallback = resolveInitialNavigation('?page=unknown&tab=invalid');
  assert.equal(fallback.page, 'home');
  assert.equal(fallback.studioSection, 'create');
});

test('resolveInitialNavigation honors demo, timestamp, mode, and autostart deep links', () => {
  const state = resolveInitialNavigation('?demo=1&t=18.5&mode=9:16&autostart=1');
  assert.equal(state.page, 'studio');
  assert.equal(state.studioSection, 'preview');
  assert.equal(state.openDemoReady, true);
  assert.equal(state.seekTime, 18.5);
  assert.equal(state.previewMode, '9:16');
  assert.equal(state.autostart, true);
});

test('isStudioSectionPopulated allows create always and gates inspection tabs on active project', () => {
  assert.equal(isStudioSectionPopulated('create', false), true);
  assert.equal(isStudioSectionPopulated('preview', false), false);
  assert.equal(isStudioSectionPopulated('storyboard', false), false);
  assert.equal(isStudioSectionPopulated('preview', true), true);
  assert.equal(isStudioSectionPopulated('quality', true), true);
});

test('normalizeExternalUrl accepts valid http/https/mailto and blocks unsafe or empty strings', () => {
  assert.equal(normalizeExternalUrl('https://github.com/example'), 'https://github.com/example');
  assert.equal(normalizeExternalUrl('mailto:dev@example.com'), 'mailto:dev@example.com');
  assert.equal(normalizeExternalUrl('javascript:alert(1)'), null);
  assert.equal(normalizeExternalUrl('   '), null);
  assert.equal(normalizeExternalUrl(null), null);
});
