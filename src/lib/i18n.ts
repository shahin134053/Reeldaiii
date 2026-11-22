export type AppLang = 'en' | 'bn';

export const LANG_STORAGE_KEY = 'chitrakatha_ui_lang_v1';

export function normalizeLang(value: unknown): AppLang | null {
  if (typeof value !== 'string') return null;
  const lower = value.trim().toLowerCase();
  if (lower === 'en' || lower.startsWith('en-')) return 'en';
  if (lower === 'bn' || lower.startsWith('bn-')) return 'bn';
  return null;
}

/**
 * Resolves initial interface language:
 * 1. Explicit URL query param (?lang=en | ?lang=bn)
 * 2. Saved localStorage preference
 * 3. Default to International English ('en') so global users get an instant English experience.
 */
export function resolveInitialLang(options?: {
  search?: string;
  stored?: string | null;
}): AppLang {
  const search = options?.search ?? '';
  if (search) {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    const paramLang = normalizeLang(params.get('lang'));
    if (paramLang) return paramLang;
  }

  const saved = normalizeLang(options?.stored);
  if (saved) return saved;

  return 'en';
}

export function toggleAppLang(current: AppLang): AppLang {
  return current === 'en' ? 'bn' : 'en';
}

export function readStoredLang(): AppLang {
  if (typeof window === 'undefined') return 'en';
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(LANG_STORAGE_KEY);
  } catch {
    stored = null;
  }
  return resolveInitialLang({
    search: window.location.search,
    stored,
  });
}

export function applyAppLang(lang: AppLang): void {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;
    document.title =
      lang === 'bn'
        ? 'Reeldaiii — বাংলা ও ইংরেজি ২ডি স্টোরি অ্যানিমেশন স্টুডিও'
        : 'Reeldaiii — Context-Aware 2D Storytelling Animation Studio';
  }
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // Ignore private browsing / storage quota errors
    }
  }
}

/** Concise bilingual text selector (English primary, Bengali secondary). */
export function L(lang: AppLang, en: string, bn: string): string {
  return lang === 'bn' ? bn : en;
}
