/**
 * Centralized Reeldaiii Official Brand Assets & Paid User Secret Access Code Verification
 */

import { resolveAssetUrl } from './assetPath';

export const REELDAIII_BRAND = {
  name: 'Reeldaiii',
  studioName: 'Reeldaiii Studio',
  taglineEn: 'Context-Aware 2D Storytelling Animation Studio',
  taglineBn: 'বাংলা ও ইংরেজি কনটেক্সট-অ্যাওয়্যার ২ডি স্টোরি অ্যানিমেশন স্টুডিও',
  faviconUrl: resolveAssetUrl('assets/aistudio/Icon-Transparent-Favicon_a85ca1c4.png'),
  logoDarkBgUrl: resolveAssetUrl('assets/aistudio/Logo-Primary-DarkBG_1dee2b7e.png'),
  logoLightBgUrl: resolveAssetUrl('assets/aistudio/Logo-Primary-LightBG_e0355d5d.png'),
  primaryColor: '#FFAC1C',
  primaryHoverColor: '#F59E0B',
  adminEmail: 'shahin.prpl@gmail.com',
} as const;

export const PRIMARY_SECRET_ACCESS_CODE = '830973';

export const CUSTOM_BRAND_ACCESS_CODES = [
  PRIMARY_SECRET_ACCESS_CODE,
  'REELDAIII-PRO',
  'REELDAI-ADMIN',
  'REELDAIII-VIP',
  'ADMIN-2026',
] as const;

export const PAID_USER_STORAGE_KEY = 'reeldaiii_paid_user_v1';

const BENGALI_TO_ASCII_DIGITS: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

/**
 * Normalizes English or Bengali digit strings (e.g., "৮৩০৯৭৩" -> "830973")
 */
export function normalizeAccessCodeInput(code: string): string {
  return code
    .trim()
    .replace(/[০-৯]/g, (digit) => BENGALI_TO_ASCII_DIGITS[digit] ?? digit)
    .toUpperCase();
}

export function verifyCustomBrandAccessCode(code: string): boolean {
  const normalized = normalizeAccessCodeInput(code);
  if (!normalized) return false;
  return (CUSTOM_BRAND_ACCESS_CODES as readonly string[]).includes(normalized);
}

export function isStoredPaidUser(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(PAID_USER_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setStoredPaidUser(unlocked: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (unlocked) {
      window.localStorage.setItem(PAID_USER_STORAGE_KEY, 'true');
    } else {
      window.localStorage.removeItem(PAID_USER_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors in private mode
  }
}
