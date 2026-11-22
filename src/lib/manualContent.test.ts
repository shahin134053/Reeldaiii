import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HOME_SHOWCASE_STORIES,
  KEYBOARD_SHORTCUTS,
  MANUAL_CHAPTERS_BN,
  MANUAL_CHAPTERS_EN,
  MANUAL_FAQS_BN,
  MANUAL_FAQS_EN,
  filterManualFaqs,
  filterManualSections,
  getManualChapters,
  getManualFaqs,
} from './manualContent';

test('manual provides complete English and Bengali chapters and FAQs', () => {
  assert.equal(getManualChapters('en').length, 7);
  assert.equal(getManualChapters('bn').length, 7);
  assert.equal(getManualFaqs('en').length, 6);
  assert.equal(getManualFaqs('bn').length, 6);
  assert.equal(MANUAL_CHAPTERS_EN.length, MANUAL_CHAPTERS_BN.length);
  assert.equal(MANUAL_FAQS_EN.length, MANUAL_FAQS_BN.length);

  for (const ch of [...MANUAL_CHAPTERS_EN, ...MANUAL_CHAPTERS_BN]) {
    assert.ok(ch.title.trim().length > 0);
    assert.ok(ch.summary.trim().length > 0);
    assert.ok(ch.bullets.length >= 3);
  }
});

test('filterManualSections filters by English and Bengali queries and category', () => {
  const enExport = filterManualSections(getManualChapters('en'), '4k', 'all');
  assert.ok(enExport.some((c) => c.id === 'export-guide'));

  const bnExport = filterManualSections(getManualChapters('bn'), 'এক্সপোর্ট', 'all');
  assert.ok(bnExport.some((c) => c.id === 'export-guide'));

  const worldsOnly = filterManualSections(getManualChapters('en'), '', 'worlds');
  assert.equal(worldsOnly.length, 1);
  assert.equal(worldsOnly[0].id, 'story-worlds-matching');

  const noMatch = filterManualSections(getManualChapters('en'), 'zzzz-nonexistent-term');
  assert.equal(noMatch.length, 0);
});

test('filterManualFaqs matches English and Bengali FAQ items', () => {
  const enMatches = filterManualFaqs(getManualFaqs('en'), 'redesign');
  assert.ok(enMatches.some((f) => f.id === 'faq-redesign'));

  const bnMatches = filterManualFaqs(getManualFaqs('bn'), 'রিডিজাইন');
  assert.ok(bnMatches.some((f) => f.id === 'faq-redesign'));
});

test('HOME_SHOWCASE_STORIES and KEYBOARD_SHORTCUTS provide both English and Bengali copy', () => {
  assert.equal(HOME_SHOWCASE_STORIES.length, 6);
  for (const story of HOME_SHOWCASE_STORIES) {
    assert.ok(story.labelEn.trim().length > 0);
    assert.ok(story.labelBn.trim().length > 0);
    assert.ok(story.titleEn.trim().length > 0);
    assert.ok(story.titleBn.trim().length > 0);
    assert.ok(story.spokenLineEn.trim().length > 0);
    assert.ok(story.spokenLineBn.trim().length > 0);
    assert.ok(story.fullScriptEn.trim().length > 30);
    assert.ok(story.fullScriptBn.trim().length > 30);
  }
  assert.ok(KEYBOARD_SHORTCUTS.length >= 5);
  for (const sc of KEYBOARD_SHORTCUTS) {
    assert.ok(sc.actionEn.trim().length > 0);
    assert.ok(sc.actionBn.trim().length > 0);
  }
});
