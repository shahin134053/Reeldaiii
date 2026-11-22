import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeTheme,
  resolveInitialTheme,
  toggleAppTheme,
} from './themePreference';

test('normalizeTheme validates only dark and light values', () => {
  assert.equal(normalizeTheme('dark'), 'dark');
  assert.equal(normalizeTheme('light'), 'light');
  assert.equal(normalizeTheme('sepia'), null);
  assert.equal(normalizeTheme(undefined), null);
});

test('resolveInitialTheme prioritizes URL param, then stored preference, then default dark', () => {
  assert.equal(resolveInitialTheme({ search: '?theme=light', stored: 'dark' }), 'light');
  assert.equal(resolveInitialTheme({ search: '?page=studio', stored: 'light' }), 'light');
  assert.equal(resolveInitialTheme({ search: '', stored: null }), 'dark');
  assert.equal(resolveInitialTheme({ search: '', stored: null, prefersLight: true }), 'light');
});

test('toggleAppTheme cleanly flips between dark and light', () => {
  assert.equal(toggleAppTheme('dark'), 'light');
  assert.equal(toggleAppTheme('light'), 'dark');
});
