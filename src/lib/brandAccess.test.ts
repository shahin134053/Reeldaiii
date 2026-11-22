import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REELDAIII_ICON_FAVICON,
  REELDAIII_LOGO_DARK_BG,
  REELDAIII_LOGO_LIGHT_BG,
  STUDIO_BRAND_NAME,
  resolvePromotionalWatermarkRule,
  verifySubBrandAccessCode,
} from './brandAccess.ts';

test('Reeldaiii brand constants and uploaded logo paths are defined', () => {
  assert.equal(STUDIO_BRAND_NAME, 'Reeldaiii');
  assert.ok(REELDAIII_LOGO_DARK_BG.endsWith('.png'));
  assert.ok(REELDAIII_LOGO_LIGHT_BG.endsWith('.png'));
  assert.ok(REELDAIII_ICON_FAVICON.endsWith('.png'));
});

test('verifySubBrandAccessCode validates admin unlock codes case-insensitively', () => {
  assert.equal(verifySubBrandAccessCode('reeldaiii-pro'), true);
  assert.equal(verifySubBrandAccessCode('  REELDAIII-ADMIN '), true);
  assert.equal(verifySubBrandAccessCode('wrong-code'), false);
  assert.equal(verifySubBrandAccessCode(''), false);
});

test('resolvePromotionalWatermarkRule keeps Reeldaiii bottom-right by default and drops to 30% opacity when admin-unlocked user brand is at top', () => {
  // Default user without admin access
  const lockedRule = resolvePromotionalWatermarkRule({
    hasAdminAccess: false,
    userBrandEnabled: true,
    userBrandName: 'My Channel',
    userLogoDataUrl: null,
  });
  assert.equal(lockedRule.position, 'bottom-right');
  assert.equal(lockedRule.renderCustomTopBrand, false);
  assert.equal(lockedRule.opacity, 0.88);

  // Admin-unlocked user with active custom brand
  const unlockedActiveRule = resolvePromotionalWatermarkRule({
    hasAdminAccess: true,
    userBrandEnabled: true,
    userBrandName: 'Custom Studio',
    userLogoDataUrl: 'data:image/png;base64,abc',
    userPreferredPosition: 'top-left',
  });
  assert.equal(unlockedActiveRule.position, 'bottom-right');
  assert.equal(unlockedActiveRule.renderCustomTopBrand, true);
  assert.equal(unlockedActiveRule.customTopPosition, 'top-left');
  assert.equal(unlockedActiveRule.opacity, 0.3);
});
