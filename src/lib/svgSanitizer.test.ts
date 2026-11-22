import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeSvgMarkup, splitSvgIntoParallaxLayers } from './svgSanitizer';

test('sanitizeSvgMarkup removes script tags, event handlers, foreignObject, and external links', () => {
  const dirty = `
    Here is your svg:
    <svg viewBox="0 0 1280 720" onload="alert(1)">
      <defs><linearGradient id="skyGrad"><stop offset="0%" stop-color="#112"/></linearGradient></defs>
      <script>window.evil = true;</script>
      <foreignObject width="100" height="100"><div>bad</div></foreignObject>
      <g id="layer-sky" onclick="hack()">
        <rect width="1280" height="720" fill="url(#skyGrad)" />
        <image href="https://evil.example/tracker.png" width="10" height="10" />
        <use href="#skyGrad" />
      </g>
    </svg>
  `;

  const clean = sanitizeSvgMarkup(dirty);
  assert.ok(clean);
  assert.equal(clean.includes('<script'), false);
  assert.equal(clean.includes('foreignObject'), false);
  assert.equal(clean.includes('onload='), false);
  assert.equal(clean.includes('onclick='), false);
  assert.equal(clean.includes('https://evil.example'), false);
  assert.equal(clean.includes('href="#skyGrad"'), true);
  assert.equal(clean.includes('xmlns="http://www.w3.org/2000/svg"'), true);
});

test('splitSvgIntoParallaxLayers splits nested layer groups and preserves shared defs', () => {
  const layered = `
    <svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g1"><stop offset="0%" stop-color="#102040"/></linearGradient>
      </defs>
      <g id="layer-sky"><rect width="1280" height="720" fill="url(#g1)"/></g>
      <g id="layer-mid"><g><circle cx="640" cy="300" r="80" fill="#fff"/></g></g>
      <g id="layer-hero"><path d="M500 500 L600 300 L700 500 Z" fill="#E5A93C"/></g>
      <g id="layer-fg"><rect x="0" y="650" width="1280" height="70" fill="#050508"/></g>
    </svg>
  `;

  const split = splitSvgIntoParallaxLayers(layered);
  assert.ok(split);
  assert.equal(split.hasLayeredGroups, true);
  assert.ok(split.skySvg?.includes('id="g1"') && split.skySvg?.includes('id="layer-sky"'));
  assert.ok(split.midSvg?.includes('id="g1"') && split.midSvg?.includes('circle'));
  assert.ok(split.heroSvg?.includes('id="g1"') && split.heroSvg?.includes('path'));
  assert.ok(split.fgSvg?.includes('id="g1"') && split.fgSvg?.includes('layer-fg'));
});

test('sanitizeSvgMarkup returns null for non-SVG text', () => {
  assert.equal(sanitizeSvgMarkup('plain text with no vector graphic'), null);
});
