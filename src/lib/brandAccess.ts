/**
 * Centralized Reeldaiii brand identity, logo assets, promotional bottom-right watermark
 * policy, and Admin Access governance for the "Sub & Brand" (সাব ও ব্র্যান্ড) studio module.
 */

import { resolveAssetUrl } from './assetPath';

export const STUDIO_BRAND_NAME = 'Reeldaiii';
export const STUDIO_BRAND_NAME_UPPER = 'REELDAIII';

export const REELDAIII_LOGO_DARK_BG = resolveAssetUrl('assets/aistudio/Logo-Primary-DarkBG_1dee2b7e.png');
export const REELDAIII_LOGO_LIGHT_BG = resolveAssetUrl('assets/aistudio/Logo-Primary-LightBG_e0355d5d.png');
export const REELDAIII_ICON_FAVICON = resolveAssetUrl('assets/aistudio/Icon-Transparent-Favicon_a85ca1c4.png');

export const ADMIN_BRAND_ACCESS_STORAGE_KEY = 'reeldaiii_sub_brand_access_v1';

/**
 * Default admin unlock codes so the studio owner/admin can grant a client access
 * after they contact admin (case-insensitive).
 */
const VALID_ADMIN_ACCESS_CODES = new Set([
  'REELDAIII-PRO',
  'REELDAIII-ADMIN',
  'REELDAI-PRO',
  'REELDAI-2026',
  'ADMIN-UNLOCK',
]);

export function verifySubBrandAccessCode(inputCode: string): boolean {
  const cleaned = inputCode.trim().toUpperCase();
  if (!cleaned) return false;
  return VALID_ADMIN_ACCESS_CODES.has(cleaned);
}

export function readStoredSubBrandAccess(search = ''): boolean {
  if (search) {
    try {
      const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
      if (params.get('brandAccess') === '1' || params.get('admin') === '1') {
        return true;
      }
    } catch {
      // Ignore invalid query string
    }
  }
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    return window.localStorage.getItem(ADMIN_BRAND_ACCESS_STORAGE_KEY) === 'granted';
  } catch {
    return false;
  }
}

export function persistSubBrandAccess(granted: boolean): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    if (granted) {
      window.localStorage.setItem(ADMIN_BRAND_ACCESS_STORAGE_KEY, 'granted');
    } else {
      window.localStorage.removeItem(ADMIN_BRAND_ACCESS_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export interface PromotionalWatermarkRule {
  /** Official Reeldaiii promotional watermark is ALWAYS rendered in bottom-right */
  position: 'bottom-right';
  /** 0.30 (30% subtle promotional opacity) when user's custom top brand is active; 0.88 by default */
  opacity: number;
  /** Whether the user's custom top watermark should also render at the top corner */
  renderCustomTopBrand: boolean;
  /** Enforced top corner for user's custom brand ('top-right' or 'top-left') */
  customTopPosition: 'top-right' | 'top-left';
}

/**
 * Computes the dual-watermark promotional rule required for every Reeldaiii video:
 * 1. The official Reeldaiii watermark is ALWAYS present at the bottom-right corner of every video.
 * 2. When a user has Admin Access AND activates their own custom brand (logo or channel name),
 *    their custom brand renders at the TOP corner ('top-right' or 'top-left'), while the
 *    official Reeldaiii promotional watermark remains at the bottom-right at 30% opacity (0.30).
 * 3. Without custom top brand active, the official Reeldaiii watermark renders at bottom-right
 *    at crisp promotional visibility (0.88).
 */
export function resolvePromotionalWatermarkRule(options: {
  hasAdminAccess: boolean;
  userBrandEnabled: boolean;
  userBrandName: string;
  userLogoDataUrl: string | null;
  userPreferredPosition?: string;
}): PromotionalWatermarkRule {
  const hasCustomContent =
    Boolean(options.userLogoDataUrl) || options.userBrandName.trim().length > 0;
  const renderCustomTopBrand =
    Boolean(options.hasAdminAccess) && Boolean(options.userBrandEnabled) && hasCustomContent;

  const customTopPosition: 'top-right' | 'top-left' =
    options.userPreferredPosition === 'top-left' ? 'top-left' : 'top-right';

  return {
    position: 'bottom-right',
    opacity: renderCustomTopBrand ? 0.3 : 0.88,
    renderCustomTopBrand,
    customTopPosition,
  };
}
