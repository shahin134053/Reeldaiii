export type AppPage = 'home' | 'studio' | 'manual' | 'developer';

export type StudioSection = 'create' | 'preview' | 'storyboard' | 'script' | 'quality';

export type PreviewModeParam = '16:9' | '9:16' | 'dual';

export interface InitialNavigationState {
  page: AppPage;
  studioSection: StudioSection;
  openDemoReady: boolean;
  seekTime: number | null;
  autostart: boolean;
  previewMode: PreviewModeParam | null;
}

const VALID_PAGES: ReadonlySet<string> = new Set(['home', 'studio', 'manual', 'developer']);
const VALID_SECTIONS: ReadonlySet<string> = new Set([
  'create',
  'preview',
  'storyboard',
  'script',
  'quality',
]);

/**
 * Resolves initial page, dedicated studio section, and deep-link playback flags
 * from URL query parameters. Defaults to the Bengali Front Page ('home').
 */
export function resolveInitialNavigation(search: string): InitialNavigationState {
  const params = new URLSearchParams(search);

  const modeRaw = params.get('mode');
  const previewMode: PreviewModeParam | null =
    modeRaw === '16:9' || modeRaw === '9:16' || modeRaw === 'dual' ? modeRaw : null;

  const tRaw = params.get('t');
  const parsedT = tRaw !== null && tRaw.trim() !== '' ? Number(tRaw) : NaN;
  const seekTime = Number.isFinite(parsedT) && parsedT >= 0 ? parsedT : null;

  const demoParam = params.get('demo') === '1';
  const autostart = params.get('autostart') === '1';
  const openDemoReady = demoParam || seekTime !== null || autostart;

  const pageParam = params.get('page');
  const tabParam = params.get('tab');

  if (openDemoReady) {
    const studioSection: StudioSection =
      tabParam && VALID_SECTIONS.has(tabParam) ? (tabParam as StudioSection) : 'preview';
    return {
      page: 'studio',
      studioSection,
      openDemoReady: true,
      seekTime,
      autostart,
      previewMode,
    };
  }

  const page: AppPage =
    pageParam && VALID_PAGES.has(pageParam) ? (pageParam as AppPage) : 'home';

  const studioSection: StudioSection =
    tabParam && VALID_SECTIONS.has(tabParam) ? (tabParam as StudioSection) : 'create';

  return {
    page,
    studioSection,
    openDemoReady: false,
    seekTime: null,
    autostart: false,
    previewMode,
  };
}

/**
 * Checks whether a Studio section has content ready to inspect immediately
 * or should display the guided empty state prompting creation/demo load.
 */
export function isStudioSectionPopulated(
  section: StudioSection,
  hasActiveProject: boolean
): boolean {
  if (section === 'create') return true;
  return hasActiveProject;
}

/**
 * Safely validates external profile URLs (https, http, mailto) so placeholder
 * or malformed values never produce unsafe or broken anchors.
 */
export function normalizeExternalUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(trimmed)) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}
