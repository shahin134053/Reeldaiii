/**
 * Safe SVG sanitizer & 2.5D parallax layer splitter for bespoke AI-directed vector cinema scenes.
 * Strips any executable/external vectors before turning SVG markup into cached HTMLImageElement layers.
 */

export interface ParallaxSvgLayers {
  fullSvg: string;
  skySvg: string | null;
  midSvg: string | null;
  heroSvg: string | null;
  fgSvg: string | null;
  hasLayeredGroups: boolean;
}

export interface CachedSvgScene {
  fullImg: HTMLImageElement | null;
  skyImg: HTMLImageElement | null;
  midImg: HTMLImageElement | null;
  heroImg: HTMLImageElement | null;
  fgImg: HTMLImageElement | null;
  hasLayers: boolean;
  ready: boolean;
  failed: boolean;
}

/**
 * Strictly sanitizes raw SVG markup so it can never run scripts or fetch external origins.
 * Returns null if the input does not contain a valid <svg>...</svg> block.
 */
export function sanitizeSvgMarkup(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;

  const match = raw.match(/<svg[\s\S]*?<\/svg>/i);
  if (!match) return null;

  let svg = match[0];

  // Remove dangerous elements completely
  svg = svg.replace(/<script[\s\S]*?<\/script>/gi, '');
  svg = svg.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '');
  svg = svg.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
  svg = svg.replace(/<object[\s\S]*?<\/object>/gi, '');
  svg = svg.replace(/<embed[^>]*\/?>/gi, '');
  svg = svg.replace(/<style[\s\S]*?<\/style>/gi, '');

  // Strip all inline event handlers (onload, onclick, onerror, etc.)
  svg = svg.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // Strip external URLs in href / xlink:href / src (keep internal #id references only)
  svg = svg.replace(
    /\s+(?:xlink:)?href\s*=\s*(?:"(?!#)[^"]*"|'(?!#)[^']*')/gi,
    ''
  );
  svg = svg.replace(/\s+src\s*=\s*(?:"[^"]*"|'[^']*')/gi, '');
  svg = svg.replace(/javascript:/gi, '');

  // Ensure xmlns and viewBox="0 0 1280 720" exist on root <svg>
  svg = svg.replace(/<svg\b([^>]*)>/i, (_full, attrs: string) => {
    let nextAttrs = attrs;
    if (!/\bxmlns\s*=/i.test(nextAttrs)) {
      nextAttrs += ' xmlns="http://www.w3.org/2000/svg"';
    }
    if (!/\bviewBox\s*=/i.test(nextAttrs)) {
      nextAttrs += ' viewBox="0 0 1280 720"';
    }
    if (!/\bwidth\s*=/i.test(nextAttrs)) {
      nextAttrs += ' width="1280"';
    }
    if (!/\bheight\s*=/i.test(nextAttrs)) {
      nextAttrs += ' height="720"';
    }
    return `<svg${nextAttrs}>`;
  });

  return svg.trim();
}

/**
 * Extracts a balanced <g id="targetId">...</g> block from sanitized SVG markup.
 */
function extractGroupById(svg: string, groupId: string): string | null {
  const openRe = new RegExp(`<g\\b[^>]*\\bid\\s*=\\s*["']${groupId}["'][^>]*>`, 'i');
  const openMatch = openRe.exec(svg);
  if (!openMatch) return null;

  const startIdx = openMatch.index;
  let cursor = startIdx + openMatch[0].length;
  let depth = 1;

  const tagRe = /<(\/?)g\b[^>]*>/gi;
  tagRe.lastIndex = cursor;

  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(svg)) !== null) {
    const isClosing = m[1] === '/';
    const isSelfClosing = /\/\s*>$/.test(m[0]);
    if (isClosing) {
      depth -= 1;
      if (depth === 0) {
        return svg.slice(startIdx, m.index + m[0].length);
      }
    } else if (!isSelfClosing) {
      depth += 1;
    }
  }

  return null;
}

function wrapLayerSvg(defsBlock: string, groupMarkup: string | null): string | null {
  if (!groupMarkup) return null;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">${defsBlock}${groupMarkup}</svg>`;
}

/**
 * Splits a sanitized 1280x720 SVG into independent depth layers (sky, mid, hero, fg)
 * while duplicating shared <defs> so gradients/filters work in every layer.
 */
export function splitSvgIntoParallaxLayers(rawSvg: string): ParallaxSvgLayers | null {
  const clean = sanitizeSvgMarkup(rawSvg);
  if (!clean) return null;

  const defsMatches = clean.match(/<defs[\s\S]*?<\/defs>/gi);
  const defsBlock = defsMatches ? defsMatches.join('') : '';

  const skyGroup = extractGroupById(clean, 'layer-sky');
  const midGroup = extractGroupById(clean, 'layer-mid');
  const heroGroup = extractGroupById(clean, 'layer-hero');
  const fgGroup = extractGroupById(clean, 'layer-fg');

  const hasLayeredGroups = Boolean(skyGroup && (midGroup || heroGroup));

  return {
    fullSvg: clean,
    skySvg: hasLayeredGroups ? wrapLayerSvg(defsBlock, skyGroup) : null,
    midSvg: hasLayeredGroups ? wrapLayerSvg(defsBlock, midGroup) : null,
    heroSvg: hasLayeredGroups ? wrapLayerSvg(defsBlock, heroGroup) : null,
    fgSvg: hasLayeredGroups ? wrapLayerSvg(defsBlock, fgGroup) : null,
    hasLayeredGroups,
  };
}

// Runtime browser image cache for zero-jank 60fps canvas compositing
const sceneImageCache = new Map<string, CachedSvgScene>();
const imageReadyListeners = new Set<() => void>();

export function onSvgSceneLoaded(listener: () => void): () => void {
  imageReadyListeners.add(listener);
  return () => {
    imageReadyListeners.delete(listener);
  };
}

function notifySceneLoaded(): void {
  for (const fn of imageReadyListeners) {
    try {
      fn();
    } catch {
      // Ignore listener errors
    }
  }
}

function svgToDataUrl(svgMarkup: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
}

function loadSvgImage(svgMarkup: string | null, onDone: () => void): HTMLImageElement | null {
  if (!svgMarkup || typeof Image === 'undefined') return null;
  const img = new Image();
  img.decoding = 'async';
  img.onload = onDone;
  img.onerror = onDone;
  img.src = svgToDataUrl(svgMarkup);
  return img;
}

/**
 * Returns a cached HTMLImageElement bundle for a bespoke scene SVG.
 * Starts async decode immediately on first access and notifies listeners when ready.
 */
export function getCachedSvgScene(rawSvg: string | undefined): CachedSvgScene | null {
  if (!rawSvg || typeof Image === 'undefined') return null;

  const existing = sceneImageCache.get(rawSvg);
  if (existing) return existing;

  const split = splitSvgIntoParallaxLayers(rawSvg);
  if (!split) return null;

  const entry: CachedSvgScene = {
    fullImg: null,
    skyImg: null,
    midImg: null,
    heroImg: null,
    fgImg: null,
    hasLayers: split.hasLayeredGroups,
    ready: false,
    failed: false,
  };

  sceneImageCache.set(rawSvg, entry);

  let pending = 1;
  const checkDone = () => {
    pending -= 1;
    if (pending <= 0) {
      entry.ready = Boolean(entry.fullImg && entry.fullImg.naturalWidth > 0);
      entry.failed = !entry.ready;
      notifySceneLoaded();
    }
  };

  if (split.hasLayeredGroups) {
    if (split.skySvg) pending += 1;
    if (split.midSvg) pending += 1;
    if (split.heroSvg) pending += 1;
    if (split.fgSvg) pending += 1;
  }

  entry.fullImg = loadSvgImage(split.fullSvg, checkDone);
  if (split.hasLayeredGroups) {
    entry.skyImg = loadSvgImage(split.skySvg, checkDone);
    entry.midImg = loadSvgImage(split.midSvg, checkDone);
    entry.heroImg = loadSvgImage(split.heroSvg, checkDone);
    entry.fgImg = loadSvgImage(split.fgSvg, checkDone);
  }

  return entry;
}

/**
 * Preloads an array of scene SVG markups so playback starts immediately with crisp visuals.
 */
export async function preloadSceneSvgs(svgList: Array<string | undefined>): Promise<void> {
  if (typeof Image === 'undefined') return;
  const unique = Array.from(new Set(svgList.filter((s): s is string => Boolean(s))));
  if (unique.length === 0) return;

  await Promise.all(
    unique.map(
      (svg) =>
        new Promise<void>((resolve) => {
          const entry = getCachedSvgScene(svg);
          if (!entry || entry.ready || entry.failed) {
            resolve();
            return;
          }
          const unsub = onSvgSceneLoaded(() => {
            if (entry.ready || entry.failed) {
              unsub();
              resolve();
            }
          });
          // Safety timeout so loading never stalls
          setTimeout(() => {
            unsub();
            resolve();
          }, 2500);
        })
    )
  );
}
