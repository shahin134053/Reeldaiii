export type AppTheme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'chitrakatha_ui_theme_v1';

export function normalizeTheme(value: unknown): AppTheme | null {
  if (value === 'dark' || value === 'light') return value;
  return null;
}

export function resolveInitialTheme(options?: {
  search?: string;
  stored?: string | null;
  prefersLight?: boolean;
}): AppTheme {
  const search = options?.search ?? '';
  if (search) {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    const paramTheme = normalizeTheme(params.get('theme'));
    if (paramTheme) return paramTheme;
  }

  const saved = normalizeTheme(options?.stored);
  if (saved) return saved;

  if (options?.prefersLight) return 'light';
  return 'dark';
}

export function toggleAppTheme(current: AppTheme): AppTheme {
  return current === 'dark' ? 'light' : 'dark';
}

export function readStoredTheme(): AppTheme {
  if (typeof window === 'undefined') return 'dark';
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    stored = null;
  }
  return resolveInitialTheme({
    search: window.location.search,
    stored,
    prefersLight: false,
  });
}

export function applyAppTheme(theme: AppTheme): void {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  }
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage quota / private browsing errors
    }
  }
}
