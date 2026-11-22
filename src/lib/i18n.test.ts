import test from 'node:test';
import assert from 'node:assert/strict';
import {
  L,
  normalizeLang,
  resolveInitialLang,
  toggleAppLang,
} from './i18n';

test('resolveInitialLang defaults to international English (en)', () => {
  assert.equal(resolveInitialLang(), 'en');
  assert.equal(resolveInitialLang({ search: '', stored: null }), 'en');
  assert.equal(resolveInitialLang({ search: '?lang=fr', stored: 'invalid' }), 'en');
});

test('resolveInitialLang prioritizes URL param over stored preference', () => {
  assert.equal(resolveInitialLang({ search: '?lang=bn', stored: 'en' }), 'bn');
  assert.equal(resolveInitialLang({ search: '?lang=en', stored: 'bn' }), 'en');
  assert.equal(resolveInitialLang({ search: '?page=manual&lang=BN', stored: 'en' }), 'bn');
});

test('resolveInitialLang falls back to stored preference when no URL param exists', () => {
  assert.equal(resolveInitialLang({ search: '?page=studio', stored: 'bn' }), 'bn');
  assert.equal(resolveInitialLang({ search: '', stored: 'en' }), 'en');
});

test('normalizeLang handles locale variants safely', () => {
  assert.equal(normalizeLang('en-US'), 'en');
  assert.equal(normalizeLang('bn-BD'), 'bn');
  assert.equal(normalizeLang('de'), null);
  assert.equal(normalizeLang(null), null);
});

test('toggleAppLang and L helper switch cleanly between en and bn', () => {
  assert.equal(toggleAppLang('en'), 'bn');
  assert.equal(toggleAppLang('bn'), 'en');
  assert.equal(L('en', 'Studio', 'স্টুডিও'), 'Studio');
  assert.equal(L('bn', 'Studio', 'স্টুডিও'), 'স্টুডিও');
});
