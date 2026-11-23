import { AnimationProject, CharacterRole } from './storyCompiler';
import {
  CharacterAccessory,
  CharacterBodyStructure,
  CharacterProfile,
  CharacterRenderMode,
  formatCharacterBibleFromProfiles,
} from './storyIntelligence';

export type CharacterHairStyle =
  | 'short-classic'
  | 'parted-neat'
  | 'curly-voluminous'
  | 'spiky-modern'
  | 'long-flowing'
  | 'bun-traditional'
  | 'bald-elder';

export type HeadwearType = 'none' | 'cap' | 'tupi' | 'hat' | 'crown';

export interface CustomCharacterDraft {
  id?: string;
  name: string;
  role: CharacterRole;
  isFemale: boolean;
  isElder: boolean;
  bodyStructure: CharacterBodyStructure;
  skinTone: string;
  outfitColor: string;
  pantsColor: string;
  accentColor: string;
  hairStyleId: CharacterHairStyle;
  hairColor: string;
  hasGlasses: boolean;
  headwear: HeadwearType;
  hasMustache: boolean;
  hasBeard: boolean;
  hasScarf: boolean;
  hasGamchha: boolean;
  hasWatch: boolean;
  lockAcrossAllScenes: boolean;
  sourceAssetId?: string;
  referenceSheetUrl?: string;
  renderMode?: CharacterRenderMode;
}

export interface HairStyleOption {
  id: CharacterHairStyle;
  labelEn: string;
  labelBn: string;
  description: string;
}

export interface HeadwearOption {
  id: HeadwearType;
  labelEn: string;
  labelBn: string;
}

export interface ColorSwatchOption {
  hex: string;
  labelEn: string;
  labelBn: string;
}

export const HAIR_STYLE_OPTIONS: readonly HairStyleOption[] = [
  { id: 'short-classic', labelEn: 'Classic Short', labelBn: 'ক্লাসিক ছোট', description: 'Short classic brushed hair' },
  { id: 'parted-neat', labelEn: 'Neat Side-Part', labelBn: 'পাশ সিঁথি', description: 'Neat side-parted hair' },
  { id: 'curly-voluminous', labelEn: 'Curly Full', labelBn: 'কোঁকড়ানো', description: 'Voluminous curly hair' },
  { id: 'spiky-modern', labelEn: 'Modern Spiky', labelBn: 'আধুনিক স্পাইকি', description: 'Textured modern spiky hair' },
  { id: 'long-flowing', labelEn: 'Long Flowing', labelBn: 'লম্বা খোলা চুল', description: 'Long flowing dark hair' },
  { id: 'bun-traditional', labelEn: 'Traditional Bun', labelBn: 'ঐতিহ্যবাহী খোঁপা', description: 'Traditional braided bun' },
  { id: 'bald-elder', labelEn: 'Receding / Bald', labelBn: 'পাতলা / টাক', description: 'Minimal receding crown hair' },
] as const;

export const HEADWEAR_OPTIONS: readonly HeadwearOption[] = [
  { id: 'none', labelEn: 'None', labelBn: 'কিছুই না' },
  { id: 'tupi', labelEn: 'Tupi (Skullcap)', labelBn: 'টুপি' },
  { id: 'cap', labelEn: 'Cap', labelBn: 'ক্যাপ' },
  { id: 'hat', labelEn: 'Classic Hat', labelBn: 'হ্যাট' },
  { id: 'crown', labelEn: 'Royal Crown', labelBn: 'মুকুট' },
] as const;

export const SKIN_TONE_SWATCHES: readonly ColorSwatchOption[] = [
  { hex: '#E3B492', labelEn: 'Fair Warm', labelBn: 'উজ্জ্বল উষ্ণ' },
  { hex: '#CE9872', labelEn: 'Golden Wheat', labelBn: 'সোনালি গমেরঙ' },
  { hex: '#B9815A', labelEn: 'Warm Olive', labelBn: 'শ্যামলা' },
  { hex: '#9A6542', labelEn: 'Deep Tan', labelBn: 'গাঢ় শ্যামলা' },
  { hex: '#764B31', labelEn: 'Rich Espresso', labelBn: 'গাঢ় বাদামি' },
] as const;

export const OUTFIT_COLOR_SWATCHES: readonly ColorSwatchOption[] = [
  { hex: '#D97724', labelEn: 'Saffron Panjabi', labelBn: 'গেরুয়া পাঞ্জাবি' },
  { hex: '#2E7D5B', labelEn: 'Bengal Emerald', labelBn: 'সবুজ' },
  { hex: '#3B6EA5', labelEn: 'River Blue', labelBn: 'নদী নীল' },
  { hex: '#A93848', labelEn: 'Crimson Red', labelBn: 'লালচে মেরুন' },
  { hex: '#DDD5C5', labelEn: 'Ivory Cotton', labelBn: 'অফ-হোয়াইট' },
  { hex: '#6D4C93', labelEn: 'Royal Violet', labelBn: 'রাজকীয় বেগুনি' },
  { hex: '#2C3444', labelEn: 'Charcoal Navy', labelBn: 'চারকোল নেভি' },
  { hex: '#C7932F', labelEn: 'Mustard Gold', labelBn: 'সরিষা হলুদ' },
] as const;

export const PANTS_COLOR_SWATCHES: readonly ColorSwatchOption[] = [
  { hex: '#1F2C40', labelEn: 'Deep Indigo', labelBn: 'গাঢ় নীল' },
  { hex: '#2A2D34', labelEn: 'Slate Charcoal', labelBn: 'স্ল্যাট ধূসর' },
  { hex: '#4A3828', labelEn: 'Earth Brown', labelBn: 'মাটি বাদামি' },
  { hex: '#E5DDD0', labelEn: 'White Pajama', labelBn: 'সাদা পায়জামা' },
  { hex: '#7A2230', labelEn: 'Maroon Drape', labelBn: 'মেরুন' },
] as const;

export const HAIR_COLOR_SWATCHES: readonly ColorSwatchOption[] = [
  { hex: '#191615', labelEn: 'Jet Black', labelBn: 'গাঢ় কালো' },
  { hex: '#3B281E', labelEn: 'Dark Chestnut', labelBn: 'বাদামি কালো' },
  { hex: '#6A442C', labelEn: 'Warm Brown', labelBn: 'বাদামি' },
  { hex: '#9D9B97', labelEn: 'Salt & Pepper', labelBn: 'পাকা-কাঁচা' },
  { hex: '#D6D4CE', labelEn: 'Silver Elder', labelBn: 'রুপালি সাদা' },
] as const;

export const DEFAULT_CUSTOM_CHARACTER_DRAFT: CustomCharacterDraft = {
  name: 'রহিম মিয়া',
  role: 'narrator',
  isFemale: false,
  isElder: false,
  bodyStructure: 'average',
  skinTone: '#CE9872',
  outfitColor: '#2E7D5B',
  pantsColor: '#1F2C40',
  accentColor: '#E5A93C',
  hairStyleId: 'parted-neat',
  hairColor: '#191615',
  hasGlasses: false,
  headwear: 'none',
  hasMustache: false,
  hasBeard: false,
  hasScarf: false,
  hasGamchha: false,
  hasWatch: true,
  lockAcrossAllScenes: true,
};

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

/**
 * Lightens (factor > 0) or darkens (factor < 0) a 6-digit hex color cleanly.
 * Example: shadeHexColor('#2E7D5B', -0.28) produces realistic garment shadow.
 */
export function shadeHexColor(hex: string, factor: number): string {
  const clean = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    return factor < 0 ? '#1F242D' : '#E2D8C8';
  }
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  const adjust = (c: number) =>
    factor >= 0 ? clampByte(c + (255 - c) * factor) : clampByte(c * (1 + factor));

  const toHex = (c: number) => adjust(c).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Converts a user's CustomCharacterDraft into a production CharacterProfile
 * ready for drawLifelikeHuman and AnimationProject.characterProfiles.
 */
export function buildCustomCharacterProfile(draft: CustomCharacterDraft): CharacterProfile {
  const accessories: CharacterAccessory[] = [];
  if (draft.hasGlasses) accessories.push('glasses');
  if (draft.hasMustache) accessories.push('mustache');
  if (draft.hasBeard) accessories.push('beard');
  if (draft.hasScarf) accessories.push('scarf');
  if (draft.hasGamchha) accessories.push('gamchha');
  if (draft.hasWatch) accessories.push('watch');
  if (draft.headwear !== 'none') {
    accessories.push(draft.headwear);
  }

  const hairMeta =
    HAIR_STYLE_OPTIONS.find((h) => h.id === draft.hairStyleId) ?? HAIR_STYLE_OPTIONS[0];
  const headwearLabel =
    draft.headwear === 'none'
      ? ''
      : `, wearing ${HEADWEAR_OPTIONS.find((h) => h.id === draft.headwear)?.labelEn.toLowerCase() ?? draft.headwear}`;
  const glassesLabel = draft.hasGlasses ? ', glasses' : '';

  const trimmedName = draft.name.trim() || 'Custom Protagonist';
  const charId = draft.id?.trim() || `custom-char-${draft.role}`;

  return {
    characterId: charId,
    role: draft.role,
    name: trimmedName,
    ageAppearance: draft.isElder ? 'Elder (60+)' : 'Adult / Story Lead',
    hairStyle: hairMeta.description,
    hairStyleId: draft.hairStyleId,
    clothing: `Custom ${draft.outfitColor} attire${headwearLabel}${glassesLabel}`,
    skinTone: draft.skinTone,
    skinShadow: shadeHexColor(draft.skinTone, -0.24),
    skinHighlight: shadeHexColor(draft.skinTone, 0.16),
    hairColor: draft.hairColor,
    hairHighlight: shadeHexColor(draft.hairColor, 0.24),
    outfitColor: draft.outfitColor,
    outfitShadow: shadeHexColor(draft.outfitColor, -0.28),
    pantsColor: draft.pantsColor,
    accentColor: draft.accentColor,
    bodyStructure: draft.bodyStructure,
    personality: 'User-customized lead character locked for story continuity',
    isFemale: draft.isFemale,
    isElder: draft.isElder,
    accessories,
    isCustom: true,
    sourceAssetId: draft.sourceAssetId,
    referenceSheetUrl: draft.referenceSheetUrl,
    renderMode: draft.renderMode ?? (draft.sourceAssetId ? 'illustrated-cutout' : 'rig-sync'),
  };
}

/**
 * Extracts a CustomCharacterDraft back out of an existing CharacterProfile
 * so users can edit any existing story character seamlessly.
 */
export function draftFromCharacterProfile(
  profile: CharacterProfile,
  lockAcrossAllScenes = true
): CustomCharacterDraft {
  let headwear: HeadwearType = 'none';
  if (profile.accessories.includes('tupi')) headwear = 'tupi';
  else if (profile.accessories.includes('cap')) headwear = 'cap';
  else if (profile.accessories.includes('hat')) headwear = 'hat';
  else if (profile.accessories.includes('crown')) headwear = 'crown';

  const knownHair = HAIR_STYLE_OPTIONS.some((h) => h.id === profile.hairStyleId)
    ? (profile.hairStyleId as CharacterHairStyle)
    : profile.isFemale
      ? 'long-flowing'
      : profile.isElder
        ? 'bald-elder'
        : 'short-classic';

  return {
    id: profile.characterId,
    name: profile.name,
    role: profile.role,
    isFemale: profile.isFemale,
    isElder: profile.isElder,
    bodyStructure: profile.bodyStructure,
    skinTone: profile.skinTone,
    outfitColor: profile.outfitColor,
    pantsColor: profile.pantsColor,
    accentColor: profile.accentColor,
    hairStyleId: knownHair,
    hairColor: profile.hairColor,
    hasGlasses: profile.accessories.includes('glasses'),
    headwear,
    hasMustache: profile.accessories.includes('mustache'),
    hasBeard: profile.accessories.includes('beard'),
    hasScarf: profile.accessories.includes('scarf'),
    hasGamchha: profile.accessories.includes('gamchha'),
    hasWatch: profile.accessories.includes('watch'),
    lockAcrossAllScenes,
    sourceAssetId: profile.sourceAssetId,
    referenceSheetUrl: profile.referenceSheetUrl,
    renderMode:
      profile.renderMode ?? (profile.sourceAssetId ? 'illustrated-cutout' : 'rig-sync'),
  };
}

/**
 * Applies a customized CharacterProfile to an AnimationProject.
 * When lockAcrossAllScenes is true, every scene's primaryCharacter and characterIds
 * bind directly to this custom character so visual identity stays 100% consistent
 * from the opening beat to the finale.
 */
export function applyCustomCharacterToProject(
  project: AnimationProject,
  customProfile: CharacterProfile,
  lockAcrossAllScenes = true,
  targetSceneId?: string
): AnimationProject {
  const existing = project.characterProfiles ?? [];
  const filtered = existing.filter(
    (p) => p.characterId !== customProfile.characterId && p.role !== customProfile.role
  );
  const nextProfiles: CharacterProfile[] = [customProfile, ...filtered];

  const renderMode = customProfile.sourceAssetId
    ? (customProfile.renderMode ?? 'illustrated-cutout')
    : 'rig-sync';

  const applyToScene = (scene: AnimationProject['scenes'][number]) => {
    const restIds = (scene.characterIds ?? []).filter(
      (id) => id !== customProfile.characterId
    );
    const nextSecondary =
      !scene.secondaryCharacterAssetId && scene.secondaryCharacter === customProfile.role
        ? scene.primaryCharacter && scene.primaryCharacter !== customProfile.role
          ? scene.primaryCharacter
          : null
        : scene.secondaryCharacter;
    return {
      ...scene,
      primaryCharacter: customProfile.role,
      primaryCharacterAssetId: customProfile.sourceAssetId,
      secondaryCharacter: nextSecondary,
      characterRenderMode: renderMode,
      characterIds: [customProfile.characterId, ...restIds],
      presetSceneId: undefined,
      customSvg: undefined,
    };
  };

  const roleMatchesAny = project.scenes.some(
    (scene) => scene.primaryCharacter === customProfile.role
  );

  const nextScenes = lockAcrossAllScenes
    ? project.scenes.map(applyToScene)
    : project.scenes.map((scene) => {
        const shouldUpdate =
          scene.primaryCharacter === customProfile.role ||
          (!roleMatchesAny && targetSceneId ? scene.id === targetSceneId : false);
        return shouldUpdate ? applyToScene(scene) : scene;
      });

  return {
    ...project,
    characterProfiles: nextProfiles,
    characterBible: formatCharacterBibleFromProfiles(nextProfiles),
    scenes: nextScenes,
  };
}

const STORAGE_KEY = 'chitrakatha_custom_characters_v1';

export interface SavedCustomCharacter {
  id: string;
  savedAt: string;
  draft: CustomCharacterDraft;
  profile: CharacterProfile;
}

export function listSavedCustomCharacters(): SavedCustomCharacter[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SavedCustomCharacter =>
        Boolean(item && typeof item.id === 'string' && item.draft && item.profile)
    );
  } catch {
    return [];
  }
}

export function saveCustomCharacterPreset(
  draft: CustomCharacterDraft
): SavedCustomCharacter[] {
  const id = draft.id?.trim() || `char-${Date.now()}`;
  const normalizedDraft: CustomCharacterDraft = { ...draft, id };
  const profile = buildCustomCharacterProfile(normalizedDraft);
  const entry: SavedCustomCharacter = {
    id,
    savedAt: new Date().toISOString(),
    draft: normalizedDraft,
    profile,
  };
  const existing = listSavedCustomCharacters().filter((c) => c.id !== id);
  const next = [entry, ...existing].slice(0, 12);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }
  return next;
}

export function deleteCustomCharacterPreset(id: string): SavedCustomCharacter[] {
  const next = listSavedCustomCharacters().filter((c) => c.id !== id);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage errors
    }
  }
  return next;
}
