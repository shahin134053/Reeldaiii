import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PRIMARY_SECRET_ACCESS_CODE,
  REELDAIII_BRAND,
  normalizeAccessCodeInput,
  verifyCustomBrandAccessCode,
} from './brandAssets';
import { DEFAULT_BRANDING_CONFIG } from './redesignAndStudio';

describe('REELDAIII_BRAND & Paid User Secret Access Code Verification', () => {
  it('exposes official Reeldaiii brand metadata and uploaded PNG asset paths', () => {
    assert.equal(REELDAIII_BRAND.name, 'Reeldaiii');
    assert.equal(REELDAIII_BRAND.studioName, 'Reeldaiii Studio');
    assert.equal(REELDAIII_BRAND.primaryColor, '#FFAC1C');
    assert.ok(REELDAIII_BRAND.faviconUrl.endsWith('.png'));
    assert.ok(REELDAIII_BRAND.logoDarkBgUrl.endsWith('.png'));
    assert.ok(REELDAIII_BRAND.logoLightBgUrl.endsWith('.png'));
  });

  it('defaults to Standard mode with customAccessUnlocked and hideOfficialWatermark false', () => {
    assert.equal(DEFAULT_BRANDING_CONFIG.enabled, false);
    assert.equal(DEFAULT_BRANDING_CONFIG.customAccessUnlocked, false);
    assert.equal(DEFAULT_BRANDING_CONFIG.hideOfficialWatermark, false);
  });

  it('normalizes Bengali digits (৮৩০৯৭৩) to English digits (830973) and verifies secret code', () => {
    assert.equal(PRIMARY_SECRET_ACCESS_CODE, '830973');
    assert.equal(normalizeAccessCodeInput(' ৮৩০৯৭৩ '), '830973');
    assert.equal(verifyCustomBrandAccessCode('830973'), true);
    assert.equal(verifyCustomBrandAccessCode('৮৩০৯৭৩'), true);
    assert.equal(verifyCustomBrandAccessCode('  830973  '), true);
    assert.equal(verifyCustomBrandAccessCode('REELDAIII-PRO'), true);

    assert.equal(verifyCustomBrandAccessCode(''), false);
    assert.equal(verifyCustomBrandAccessCode('000000'), false);
    assert.equal(verifyCustomBrandAccessCode('wrong-code'), false);
  });
});
