import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEVELOPER_PROFILE } from './developerProfile';

describe('DEVELOPER_PROFILE (Md Shahin)', () => {
  it('contains Md Shahin personal info, location, icon-based social names, and SupportKori config', () => {
    assert.equal(DEVELOPER_PROFILE.isCustomized, true);
    assert.equal(DEVELOPER_PROFILE.nameEn, 'Md Shahin');
    assert.equal(
      DEVELOPER_PROFILE.photoUrl,
      '/assets/aistudio/Headshot_profile_Md_Shahin_4d1abc51.png'
    );
    assert.ok(DEVELOPER_PROFILE.locationEn?.includes('Dhaka'));

    const byId = Object.fromEntries(DEVELOPER_PROFILE.contactSlots.map((s) => [s.id, s]));
    assert.equal(byId.email.value, 'shahin.prpl@gmail.com');
    assert.equal(byId.email.href, 'mailto:shahin.prpl@gmail.com');

    // Social slots display clean names/handles instead of raw http URLs
    assert.equal(byId.linkedin.platformNameEn, 'LinkedIn');
    assert.equal(byId.linkedin.displayNameEn, 'Md Shahin');
    assert.equal(byId.linkedin.handle, '@shahin134053');
    assert.equal(byId.linkedin.href, 'https://www.linkedin.com/in/shahin134053/');
    assert.ok(!byId.linkedin.displayNameEn.includes('http'));

    assert.equal(byId.github.platformNameEn, 'GitHub');
    assert.equal(byId.github.displayNameEn, 'shahin134053');
    assert.equal(byId.github.handle, '@shahin134053');
    assert.equal(byId.github.href, 'https://github.com/shahin134053');
    assert.ok(!byId.github.displayNameEn.includes('http'));

    assert.equal(byId.facebook.platformNameEn, 'Facebook');
    assert.equal(byId.facebook.displayNameEn, 'Designpro202');
    assert.equal(byId.facebook.handle, '@Designpro202');
    assert.equal(byId.facebook.href, 'https://www.facebook.com/Designpro202');
    assert.ok(!byId.facebook.displayNameEn.includes('http'));

    // SupportKori configuration matches widget attributes
    assert.equal(DEVELOPER_PROFILE.supportKori.id, 'shahin134053');
    assert.equal(DEVELOPER_PROFILE.supportKori.message, 'Support Shahin');
    assert.equal(DEVELOPER_PROFILE.supportKori.color, '#FFDD00');
    assert.equal(DEVELOPER_PROFILE.supportKori.position, 'right');
    assert.equal(DEVELOPER_PROFILE.supportKori.scriptSrc, 'https://www.supportkori.com/widget.js');
  });
});
