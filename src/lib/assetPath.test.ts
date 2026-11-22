import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveAssetUrl } from './assetPath';

describe('resolveAssetUrl', () => {
  it('resolves root-relative assets by default in Node/root deployments', () => {
    assert.equal(
      resolveAssetUrl('assets/aistudio/Logo-Primary-DarkBG_1dee2b7e.png'),
      '/assets/aistudio/Logo-Primary-DarkBG_1dee2b7e.png'
    );
    assert.equal(
      resolveAssetUrl('/assets/aistudio/Headshot_profile_Md_Shahin_4d1abc51.png'),
      '/assets/aistudio/Headshot_profile_Md_Shahin_4d1abc51.png'
    );
  });

  it('prefixes subpath base cleanly for GitHub Pages deployments', () => {
    assert.equal(
      resolveAssetUrl('assets/aistudio/Logo-Primary-DarkBG_1dee2b7e.png', '/Reeldaiii/'),
      '/Reeldaiii/assets/aistudio/Logo-Primary-DarkBG_1dee2b7e.png'
    );
    assert.equal(
      resolveAssetUrl('/assets/aistudio/Icon-Transparent-Favicon_a85ca1c4.png', '/Reeldaiii'),
      '/Reeldaiii/assets/aistudio/Icon-Transparent-Favicon_a85ca1c4.png'
    );
  });
});
