import { resolveAssetUrl } from './assetPath';
import {
  CharacterHairStyle,
  CustomCharacterDraft,
  HeadwearType,
  shadeHexColor,
} from './characterDesigner';
import type {
  AnimationProject,
  CharacterRole,
  SceneSetting,
  SceneSpec,
  TimeOfDay,
} from './storyCompiler';
import {
  CharacterAccessory,
  CharacterProfile,
  CharacterRenderMode,
  formatCharacterBibleFromProfiles,
} from './storyIntelligence';

export type StudioAssetCategory =
  | 'deshi'
  | 'professions'
  | 'school-daily'
  | 'fantasy-heroes'
  | 'scifi-animals';

export type CharacterMotionStyle =
  | 'vehicle-rickshaw'
  | 'walking-pull'
  | 'runner'
  | 'active-stride'
  | 'gentle-pace'
  | 'expressive-talk'
  | 'lab-spark'
  | 'painter-sway'
  | 'camera-snap';

export interface StudioAssetCategoryMeta {
  id: StudioAssetCategory;
  labelEn: string;
  labelBn: string;
}

export const STUDIO_ASSET_CATEGORIES: readonly StudioAssetCategoryMeta[] = [
  { id: 'deshi', labelEn: 'Bangladeshi & Rural', labelBn: 'বাংলাদেশি ও গ্রামীণ' },
  { id: 'professions', labelEn: 'Professions & City', labelBn: 'পেশাজীবী ও শহর' },
  { id: 'school-daily', labelEn: 'Education, Tech & Farm', labelBn: 'শিক্ষা, প্রযুক্তি ও কৃষি' },
  { id: 'fantasy-heroes', labelEn: 'Sports & Creative', labelBn: 'খেলা ও সৃজনশীল' },
] as const;

export interface StudioEnvironmentAsset {
  id: string;
  fileName: string;
  url: string;
  nameEn: string;
  nameBn: string;
  category: StudioAssetCategory;
  defaultSetting: SceneSetting;
  timeOfDay: TimeOfDay;
  accentColor: string;
  keywords: string[];
}

export interface CutoutCropBox {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export interface StudioCharacterAsset {
  id: string;
  fileName: string;
  url: string;
  nameEn: string;
  nameBn: string;
  category: StudioAssetCategory;
  role: CharacterRole;
  cutoutCrop: CutoutCropBox;
  /** Direction the character naturally faces in source artwork (1 = right/front, -1 = left) */
  naturalFacing?: 1 | -1;
  /** Tailored continuous animation choreography so characters never stand still */
  motionStyle?: CharacterMotionStyle;
  /** Scene-integrated portrait (soft feathered oval card instead of cutout) */
  isScenePortrait?: boolean;
  hairStyleId: CharacterHairStyle;
  headwear: HeadwearType;
  skinTone: string;
  hairColor: string;
  outfitColor: string;
  pantsColor: string;
  accentColor: string;
  isFemale: boolean;
  isElder: boolean;
  accessories: CharacterAccessory[];
  clothingDesc: string;
  personality: string;
  keywords: string[];
}

function charAsset(
  spec: Omit<StudioCharacterAsset, 'url'>
): StudioCharacterAsset {
  return {
    ...spec,
    url: resolveAssetUrl(`assets/aistudio/${spec.fileName}`),
  };
}

/**
 * Previously uploaded environments have been removed per workspace reset;
 * all 32+ built-in default procedural worlds remain active.
 */
export const STUDIO_ENVIRONMENT_ASSETS: readonly StudioEnvironmentAsset[] = [];

export const STUDIO_CHARACTER_ASSETS: readonly StudioCharacterAsset[] = [
  charAsset({
    id: 'char-rickshaw-cyclist',
    fileName: 'Rickshaw_driver_character_vector__9481aa1c-removebg-preview_copy_691fae8d.png',
    nameEn: 'Rickshaw Driver (Cycle Rickshaw)',
    nameBn: 'রিকশাচালক (সাইকেল রিকশা)',
    category: 'deshi',
    role: 'father',
    cutoutCrop: { sx: 0, sy: 0, sw: 1, sh: 1 },
    naturalFacing: -1,
    motionStyle: 'vehicle-rickshaw',
    hairStyleId: 'short-classic',
    headwear: 'none',
    skinTone: '#AA724B',
    hairColor: '#1E1A18',
    outfitColor: '#6E809E',
    pantsColor: '#2B6E8C',
    accentColor: '#E0523C',
    isFemale: false,
    isElder: false,
    accessories: ['mustache', 'gamchha'],
    clothingDesc: 'Slate shirt, red-check gamchha, teal lungi on decorated Dhaka cycle rickshaw',
    personality: 'Resilient hardworking Bangladeshi rickshaw driver pedaling through city streets',
    keywords: ['rickshaw', 'cycle', 'driver', 'puller', 'dhaka', 'father', 'baba', 'রিকশা', 'রিকশাচালক', 'বাবা', 'ঢাকা', 'চাচা'],
  }),
  charAsset({
    id: 'char-rickshaw-puller',
    fileName: 'Rickshaw_driver_character_illust__5ab69d87_copy_557f802a.png',
    nameEn: 'Rickshaw Puller (On Foot)',
    nameBn: 'রিকশাচালক চাচা (পায়ে হেঁটে)',
    category: 'deshi',
    role: 'father',
    cutoutCrop: { sx: 0, sy: 0, sw: 1, sh: 1 },
    naturalFacing: -1,
    motionStyle: 'walking-pull',
    hairStyleId: 'short-classic',
    headwear: 'none',
    skinTone: '#B8774E',
    hairColor: '#1D1917',
    outfitColor: '#ECECE6',
    pantsColor: '#2678B8',
    accentColor: '#D84E32',
    isFemale: false,
    isElder: false,
    accessories: ['mustache', 'gamchha'],
    clothingDesc: 'White sleeveless vest, red-check gamchha headband & blue checkered lungi',
    personality: 'Determined barefoot puller hauling with quiet dignity and steady stride',
    keywords: ['puller', 'cart', 'handcart', 'rickshaw', 'lungi', 'gamchha', 'ভ্যান', 'ঠেলাগাড়ি', 'লুঙ্গি', 'গামছা', 'রিকশা'],
  }),
  charAsset({
    id: 'char-bd-farmer-spade',
    fileName: 'Farmer_character_illustration_ad5d632f_copy_dcabb868.png',
    nameEn: 'Bangladeshi Farmer (With Spade)',
    nameBn: 'বাংলার কৃষক (কোদাল হাতে)',
    category: 'deshi',
    role: 'father',
    cutoutCrop: { sx: 0, sy: 0, sw: 1, sh: 1 },
    naturalFacing: 1,
    motionStyle: 'active-stride',
    hairStyleId: 'short-classic',
    headwear: 'none',
    skinTone: '#B17651',
    hairColor: '#231D1A',
    outfitColor: '#E5E0CE',
    pantsColor: '#214A70',
    accentColor: '#DE4A32',
    isFemale: false,
    isElder: false,
    accessories: ['mustache', 'gamchha'],
    clothingDesc: 'Cream cotton shirt, red shoulder gamchha, blue lungi, spade & golden paddy stalks',
    personality: 'Warm-hearted Bangladeshi farmer proud of golden harvests and village soil',
    keywords: ['farmer', 'spade', 'kodal', 'paddy', 'rice', 'village', 'bangladesh', 'কৃষক', 'চাষী', 'ধান', 'কোদাল', 'গ্রাম'],
  }),
  charAsset({
    id: 'char-elder-farmer',
    fileName: 'South_Asian_farmer_standing_4e8f1fe9_copy_e1ecd0b2.png',
    nameEn: 'Elder Farmer (Harvest Paddy)',
    nameBn: 'বর্ষীয়ান কৃষক (ধানের আঁটি)',
    category: 'deshi',
    role: 'elder',
    cutoutCrop: { sx: 0, sy: 0, sw: 1, sh: 1 },
    naturalFacing: 1,
    motionStyle: 'gentle-pace',
    hairStyleId: 'bald-elder',
    headwear: 'hat',
    skinTone: '#AD724D',
    hairColor: '#8B8D92',
    outfitColor: '#EAE6D5',
    pantsColor: '#2E76AA',
    accentColor: '#D64844',
    isFemale: false,
    isElder: true,
    accessories: ['mustache', 'gamchha', 'hat'],
    clothingDesc: 'Woven conical straw mathal hat, red gamchha, blue check lungi, sickle & golden paddy',
    personality: 'Wise elder village farmer carrying golden paddy sheaves with calm pride',
    keywords: ['elder', 'farmer', 'sickle', 'mathal', 'harvest', 'grandpa', 'dada', 'বৃদ্ধ', 'কৃষক', 'দাদু', 'মাথাল', 'কাস্তে', 'ফসল'],
  }),
  charAsset({
    id: 'char-day-laborer',
    fileName: 'Day_laborer_worker_illustration_3bef663f_copy_19fc0ee2.png',
    nameEn: 'Day Laborer / Field Worker',
    nameBn: 'দিনমজুর / নির্মাণ শ্রমিক',
    category: 'deshi',
    role: 'father',
    cutoutCrop: { sx: 0, sy: 0, sw: 1, sh: 1 },
    naturalFacing: 1,
    motionStyle: 'active-stride',
    hairStyleId: 'short-classic',
    headwear: 'cap',
    skinTone: '#ECA87C',
    hairColor: '#3A281E',
    outfitColor: '#EE6D26',
    pantsColor: '#2E4C6C',
    accentColor: '#D9DF4E',
    isFemale: false,
    isElder: false,
    accessories: ['cap'],
    clothingDesc: 'High-vis orange safety vest over grey shirt, blue work cap, tool belt & shovel',
    personality: 'Resilient hardworking builder and laborer full of quiet strength',
    keywords: ['laborer', 'worker', 'builder', 'shovel', 'construction', 'শ্রমিক', 'দিনমজুর', 'নির্মাণ', 'বেলচা', 'কাজ'],
  }),
  charAsset({
    id: 'char-nurse',
    fileName: 'Nurse_character_vector_illustration_8b817701_copy_b5f5e41c.png',
    nameEn: 'Healthcare Nurse',
    nameBn: 'সেবিকা / নার্স',
    category: 'professions',
    role: 'doctor',
    cutoutCrop: { sx: 0, sy: 0, sw: 1, sh: 1 },
    naturalFacing: 1,
    motionStyle: 'gentle-pace',
    hairStyleId: 'bun-traditional',
    headwear: 'none',
    skinTone: '#F1A678',
    hairColor: '#212A3E',
    outfitColor: '#66AEE6',
    pantsColor: '#569FD9',
    accentColor: '#22314A',
    isFemale: true,
    isElder: false,
    accessories: ['stethoscope'],
    clothingDesc: 'Sky-blue hospital scrubs with stethoscope, ID badge & patient clipboard',
    personality: 'Compassionate medical caregiver offering gentle reassurance and clarity',
    keywords: ['nurse', 'hospital', 'clinic', 'medical', 'health', 'care', 'নার্স', 'সেবিকা', 'হাসপাতাল', 'চিকিৎসা', 'স্বাস্থ্য'],
  }),
  charAsset({
    id: 'char-police-officer',
    fileName: 'Police_officer_character_illustr__24e9912d_copy_04fe4b9a.png',
    nameEn: 'Police Officer',
    nameBn: 'পুলিশ অফিসার',
    category: 'professions',
    role: 'professional',
    cutoutCrop: { sx: 0, sy: 0, sw: 1, sh: 1 },
    naturalFacing: 1,
    motionStyle: 'active-stride',
    hairStyleId: 'short-classic',
    headwear: 'cap',
    skinTone: '#F2AE84',
    hairColor: '#3C271C',
    outfitColor: '#223250',
    pantsColor: '#1B2740',
    accentColor: '#DFB145',
    isFemale: false,
    isElder: false,
    accessories: ['cap'],
    clothingDesc: 'Navy police uniform with gold badge, peaked cap, radio & duty belt',
    personality: 'Alert and courteous law-enforcement officer keeping communities safe',
    keywords: ['police', 'officer', 'cop', 'security', 'badge', 'পুলিশ', 'অফিসার', 'নিরাপত্তা', 'থানা'],
  }),
  charAsset({
    id: 'char-airline-pilot',
    fileName: 'Pilot_character_vector_illustration_dad3f9c8_copy_7c762195.png',
    nameEn: 'Airline Captain Pilot',
    nameBn: 'বিমান পাইলট',
    category: 'professions',
    role: 'professional',
    cutoutCrop: { sx: 0, sy: 0, sw: 1, sh: 1 },
    naturalFacing: 1,
    motionStyle: 'active-stride',
    hairStyleId: 'short-classic',
    headwear: 'cap',
    skinTone: '#F2AE84',
    hairColor: '#4A3122',
    outfitColor: '#1C2C49',
    pantsColor: '#17233B',
    accentColor: '#E8BC4A',
    isFemale: false,
    isElder: false,
    accessories: ['cap'],
    clothingDesc: 'Navy double-breasted airline captain uniform, gold wing stripes & rolling bag',
    personality: 'Confident friendly aviator ready for sky-high adventures',
    keywords: ['pilot', 'captain', 'airline', 'flight', 'plane', 'airport', 'পাইলট', 'বিমান', 'ফ্লাইট', 'আকাশ'],
  }),
  charAsset({
    id: 'char-business-executive',
    fileName: 'Business_executive_vector_illust__851d9a14_copy_b8c45c2e.png',
    nameEn: 'Business Executive',
    nameBn: 'বিজনেস এক্সিকিউটিভ',
    category: 'professions',
    role: 'professional',
    cutoutCrop: { sx: 0, sy: 0, sw: 1, sh: 1 },
    naturalFacing: -1,
    motionStyle: 'gentle-pace',
    hairStyleId: 'parted-neat',
    headwear: 'none',
    skinTone: '#EDA479',
    hairColor: '#20222A',
    outfitColor: '#2B3E5E',
    pantsColor: '#22314A',
    accentColor: '#762D3B',
    isFemale: false,
    isElder: false,
    accessories: ['glasses'],
    clothingDesc: 'Tailored navy business suit, burgundy tie, glasses & presentation tablet',
    personality: 'Sharp and poised corporate leader presenting smart ideas',
    keywords: ['business', 'executive', 'manager', 'suit', 'office', 'corporate', 'ব্যবসা', 'অফিস', 'ম্যানেজার', 'সুট'],
  }),
  charAsset({
    id: 'char-architect',
    fileName: 'Architect_character_vector_illus__65df9289-removebg-preview_copy_f9785229.png',
    nameEn: 'Architect Engineer',
    nameBn: 'স্থপতি / আর্কিটেক্ট',
    category: 'professions',
    role: 'professional',
    cutoutCrop: { sx: 0, sy: 0, sw: 1, sh: 1 },
    naturalFacing: 1,
    motionStyle: 'gentle-pace',
    hairStyleId: 'bun-traditional',
    headwear: 'none',
    skinTone: '#EEAB82',
    hairColor: '#6D3F29',
    outfitColor: '#24314A',
    pantsColor: '#3A3E48',
    accentColor: '#DFAC38',
    isFemale: true,
    isElder: false,
    accessories: ['glasses'],
    clothingDesc: 'Navy blazer over mustard sweater, blueprints, yellow hard hat & CAD tablet',
    personality: 'Visionary urban designer turning blueprints into reality',
    keywords: ['architect', 'engineer', 'blueprint', 'design', 'building', 'আর্কিটেক্ট', 'স্থপতি', 'ইঞ্জিনিয়ার', 'নকশা'],
  }),
  charAsset({
    id: 'char-school-teacher',
    fileName: 'Teacher_illustration_vector_design_405ad94b_ea842d98.png',
    nameEn: 'Inspiring School Teacher',
    nameBn: 'আদর্শ শিক্ষিকা',
    category: 'school-daily',
    role: 'teacher',
    cutoutCrop: { sx: 0, sy: 0, sw: 1, sh: 1 },
    naturalFacing: -1,
    motionStyle: 'expressive-talk',
    hairStyleId: 'bun-traditional',
    headwear: 'none',
    skinTone: '#F0A47A',
    hairColor: '#663B25',
    outfitColor: '#245F57',
    pantsColor: '#212A3E',
    accentColor: '#DFB07D',
    isFemale: true,
    isElder: false,
    accessories: ['glasses', 'watch'],
    clothingDesc: 'Teal cardigan over cream blouse, round glasses, lanyard, notebooks & marker',
    personality: 'Warm engaging teacher explaining lessons with expressive gestures',
    keywords: ['teacher', 'school', 'classroom', 'mentor', 'books', 'শিক্ষিকা', 'শিক্ষক', 'স্কুল', 'পড়াশোনা', 'বই'],
  }),
  charAsset({
    id: 'char-scientist',
    fileName: 'Scientist_character_vector_illus__6e284a75_copy_8156e620.png',
    nameEn: 'Research Scientist',
    nameBn: 'বিজ্ঞানী / গবেষক',
    category: 'school-daily',
    role: 'doctor',
    cutoutCrop: { sx: 0, sy: 0, sw: 1, sh: 1 },
    naturalFacing: 1,
    motionStyle: 'lab-spark',
    hairStyleId: 'bun-traditional',
    headwear: 'none',
    skinTone: '#995738',
    hairColor: '#281C18',
    outfitColor: '#DCE6F2',
    pantsColor: '#1E2740',
    accentColor: '#18888E',
    isFemale: true,
    isElder: false,
    accessories: ['glasses'],
    clothingDesc: 'White lab coat over teal top, safety goggles, glowing Erlenmeyer flask & chart tablet',
    personality: 'Curious innovator testing exciting experiments with scientific wonder',
    keywords: ['scientist', 'science', 'lab', 'research', 'chemistry', 'experiment', 'বিজ্ঞানী', 'বিজ্ঞান', 'ল্যাব', 'গবেষণা'],
  }),
  charAsset({
    id: 'char-software-engineer',
    fileName: 'Software_engineer_vector_illustr__7c11da16_8de4c539.png',
    nameEn: 'Software Engineer',
    nameBn: 'সফটওয়্যার ইঞ্জিনিয়ার',
    category: 'school-daily',
    role: 'youth-boy',
    cutoutCrop: { sx: 0, sy: 0, sw: 1, sh: 1 },
    naturalFacing: -1,
    motionStyle: 'expressive-talk',
    hairStyleId: 'spiky-modern',
    headwear: 'none',
    skinTone: '#EEA97D',
    hairColor: '#1C222D',
    outfitColor: '#1F3A60',
    pantsColor: '#363C45',
    accentColor: '#66AEE6',
    isFemale: false,
    isElder: false,
    accessories: ['glasses'],
    clothingDesc: 'Navy </> developer hoodie, headphones, glasses, backpack & code-filled laptop',
    personality: 'Clever young software creator coding apps and AI projects on the move',
    keywords: ['software', 'engineer', 'developer', 'programmer', 'coding', 'laptop', 'tech', 'সফটওয়্যার', 'ইঞ্জিনিয়ার', 'কোডিং', 'ল্যাপটপ'],
  }),
  charAsset({
    id: 'char-western-farmer',
    fileName: 'Farmer_character_vector_illustra__ee829ee2_copy_0df2b910.png',
    nameEn: 'Countryside Grower / Farmer',
    nameBn: 'খামারি / প্রবাসী কৃষক',
    category: 'school-daily',
    role: 'father',
    cutoutCrop: { sx: 0, sy: 0, sw: 1, sh: 1 },
    naturalFacing: 1,
    motionStyle: 'gentle-pace',
    hairStyleId: 'short-classic',
    headwear: 'hat',
    skinTone: '#F1AE84',
    hairColor: '#5B3926',
    outfitColor: '#C44538',
    pantsColor: '#3C6588',
    accentColor: '#DFB676',
    isFemale: false,
    isElder: false,
    accessories: ['beard', 'hat'],
    clothingDesc: 'Wide straw hat, red plaid shirt, denim overalls & work boots',
    personality: 'Cheerful farm grower waving warmly across sunlit fields',
    keywords: ['grower', 'farm', 'farmer', 'overalls', 'garden', 'খামারি', 'বাগান', 'কৃষক', 'ফসল'],
  }),
  charAsset({
    id: 'char-athlete-runner',
    fileName: 'Athlete_runner_vector_illustration_cd97a250_copy_306aed78.png',
    nameEn: 'Sprint Athlete Runner',
    nameBn: 'দৌড়বিদ অ্যাথলেট',
    category: 'fantasy-heroes',
    role: 'youth-girl',
    cutoutCrop: { sx: 0, sy: 0, sw: 1, sh: 1 },
    naturalFacing: 1,
    motionStyle: 'runner',
    hairStyleId: 'bun-traditional',
    headwear: 'none',
    skinTone: '#DE926A',
    hairColor: '#1B243E',
    outfitColor: '#FA5E43',
    pantsColor: '#213158',
    accentColor: '#1EB098',
    isFemale: true,
    isElder: false,
    accessories: ['watch'],
    clothingDesc: 'Coral-orange running tank top, navy sprint shorts, smartwatch & teal sneakers',
    personality: 'Energetic track sprinter bursting forward with determination and speed',
    keywords: ['athlete', 'runner', 'sprint', 'sport', 'jogging', 'race', 'marathon', 'দৌড়', 'খেলা', 'অ্যাথলেট', 'প্রতিযোগিতা'],
  }),
  charAsset({
    id: 'char-artist-painter',
    fileName: 'Artist_painter_character_vector___d5b51ed2_copy_304f0315.png',
    nameEn: 'Artist & Painter',
    nameBn: 'শিল্পী / চিত্রকর',
    category: 'fantasy-heroes',
    role: 'youth-girl',
    cutoutCrop: { sx: 0, sy: 0, sw: 1, sh: 1 },
    naturalFacing: 1,
    motionStyle: 'painter-sway',
    hairStyleId: 'short-classic',
    headwear: 'hat',
    skinTone: '#F1A67B',
    hairColor: '#4E2C1E',
    outfitColor: '#304966',
    pantsColor: '#354962',
    accentColor: '#B83333',
    isFemale: true,
    isElder: false,
    accessories: ['glasses', 'hat'],
    clothingDesc: 'Maroon beret, round glasses, striped shirt, paint-splattered apron, palette & brush',
    personality: 'Imaginative visual artist bringing colorful stories to life on canvas',
    keywords: ['artist', 'painter', 'art', 'paint', 'brush', 'creative', 'শিল্পী', 'আঁকা', 'চিত্রকর', 'রঙ', 'তুলি'],
  }),
  charAsset({
    id: 'char-photographer',
    fileName: 'Photographer_holding_camera_vect__ef2b0b03_copy_ab4fdd8d.png',
    nameEn: 'Travel Photographer',
    nameBn: 'ফটোগ্রাফার',
    category: 'fantasy-heroes',
    role: 'youth-girl',
    cutoutCrop: { sx: 0, sy: 0, sw: 1, sh: 1 },
    naturalFacing: -1,
    motionStyle: 'camera-snap',
    hairStyleId: 'bun-traditional',
    headwear: 'cap',
    skinTone: '#F1A275',
    hairColor: '#6B472E',
    outfitColor: '#566444',
    pantsColor: '#253C56',
    accentColor: '#DF6D32',
    isFemale: true,
    isElder: false,
    accessories: ['cap'],
    clothingDesc: 'Orange knit beanie, olive field jacket, DSLR camera & leather messenger bag',
    personality: 'Observant storyteller capturing golden moments through her camera lens',
    keywords: ['photographer', 'camera', 'photo', 'travel', 'journalist', 'ফটোগ্রাফার', 'ক্যামেরা', 'ছবি', 'ভ্রমণ'],
  }),
];

export function getEnvironmentAssetById(id?: string | null): StudioEnvironmentAsset | null {
  if (!id) return null;
  return STUDIO_ENVIRONMENT_ASSETS.find((e) => e.id === id) ?? null;
}

export function getCharacterAssetById(id?: string | null): StudioCharacterAsset | null {
  if (!id) return null;
  return STUDIO_CHARACTER_ASSETS.find((c) => c.id === id) ?? null;
}

export function matchEnvironmentAssetForText(
  _text: string,
  _settingHint?: SceneSetting
): StudioEnvironmentAsset | null {
  return null;
}

export function matchCharacterAssetForText(text: string): StudioCharacterAsset | null {
  const lower = text.toLowerCase();
  let best: StudioCharacterAsset | null = null;
  let bestScore = 0;

  for (const char of STUDIO_CHARACTER_ASSETS) {
    let score = 0;
    for (const kw of char.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += kw.length >= 5 ? 3 : 2;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = char;
    }
  }

  return bestScore >= 2 ? best : null;
}

export function buildCharacterProfileFromAsset(
  asset: StudioCharacterAsset,
  renderMode: CharacterRenderMode = 'illustrated-cutout',
  customName?: string
): CharacterProfile {
  return {
    characterId: `asset-char-${asset.id}`,
    role: asset.role,
    name: customName?.trim() || asset.nameEn,
    ageAppearance: asset.isElder ? 'Elder' : 'Story Lead',
    hairStyle: asset.hairStyleId,
    hairStyleId: asset.hairStyleId,
    clothing: asset.clothingDesc,
    skinTone: asset.skinTone,
    skinShadow: shadeHexColor(asset.skinTone, -0.24),
    skinHighlight: shadeHexColor(asset.skinTone, 0.16),
    hairColor: asset.hairColor,
    hairHighlight: shadeHexColor(asset.hairColor, 0.24),
    outfitColor: asset.outfitColor,
    outfitShadow: shadeHexColor(asset.outfitColor, -0.28),
    pantsColor: asset.pantsColor,
    accentColor: asset.accentColor,
    bodyStructure: 'average',
    personality: asset.personality,
    isFemale: asset.isFemale,
    isElder: asset.isElder,
    accessories: [...asset.accessories],
    isCustom: true,
    sourceAssetId: asset.id,
    referenceSheetUrl: asset.url,
    renderMode,
  };
}

export function draftFromCharacterAsset(
  asset: StudioCharacterAsset,
  renderMode: CharacterRenderMode = 'illustrated-cutout',
  lockAcrossAllScenes = true
): CustomCharacterDraft {
  return {
    id: `asset-char-${asset.id}`,
    name: asset.nameBn,
    role: asset.role,
    isFemale: asset.isFemale,
    isElder: asset.isElder,
    bodyStructure: 'average',
    skinTone: asset.skinTone,
    outfitColor: asset.outfitColor,
    pantsColor: asset.pantsColor,
    accentColor: asset.accentColor,
    hairStyleId: asset.hairStyleId,
    hairColor: asset.hairColor,
    hasGlasses: asset.accessories.includes('glasses'),
    headwear: asset.headwear,
    hasMustache: asset.accessories.includes('mustache'),
    hasBeard: asset.accessories.includes('beard'),
    hasScarf: asset.accessories.includes('scarf'),
    hasGamchha: asset.accessories.includes('gamchha'),
    hasWatch: asset.accessories.includes('watch'),
    lockAcrossAllScenes,
    sourceAssetId: asset.id,
    referenceSheetUrl: asset.url,
    renderMode,
  };
}

export function applyCharacterAssetToProject(
  project: AnimationProject,
  asset: StudioCharacterAsset,
  options: {
    scope: 'all' | 'scene';
    sceneId?: string;
    slot?: 'primary' | 'secondary';
    renderMode?: CharacterRenderMode;
  }
): AnimationProject {
  const { scope, sceneId, slot = 'primary', renderMode = 'illustrated-cutout' } = options;
  const profile = buildCharacterProfileFromAsset(asset, renderMode);

  const existingProfiles = project.characterProfiles ?? [];
  const nextProfiles: CharacterProfile[] = [
    profile,
    ...existingProfiles.filter((p) => p.characterId !== profile.characterId),
  ];

  const nextScenes = project.scenes.map((sc) => {
    if (scope === 'scene' && sc.id !== sceneId) return sc;

    const prevIds = (sc.characterIds ?? []).filter((id) => id !== profile.characterId);
    if (slot === 'secondary') {
      const nextPrimary =
        !sc.primaryCharacterAssetId && sc.primaryCharacter === asset.role
          ? sc.secondaryCharacter && sc.secondaryCharacter !== asset.role
            ? sc.secondaryCharacter
            : sc.primaryCharacter
          : sc.primaryCharacter;
      return {
        ...sc,
        primaryCharacter: nextPrimary,
        secondaryCharacter: asset.role,
        secondaryCharacterAssetId: asset.id,
        characterRenderMode: renderMode,
        characterIds: Array.from(new Set([...prevIds, profile.characterId])),
        presetSceneId: undefined,
        customSvg: undefined,
      };
    }

    const nextSecondary =
      !sc.secondaryCharacterAssetId && sc.secondaryCharacter === asset.role
        ? sc.primaryCharacter && sc.primaryCharacter !== asset.role
          ? sc.primaryCharacter
          : null
        : sc.secondaryCharacter;

    return {
      ...sc,
      primaryCharacter: asset.role,
      primaryCharacterAssetId: asset.id,
      secondaryCharacter: nextSecondary,
      characterRenderMode: renderMode,
      characterIds: [profile.characterId, ...prevIds],
      presetSceneId: undefined,
      customSvg: undefined,
    };
  });

  return {
    ...project,
    characterProfiles: nextProfiles,
    characterBible: formatCharacterBibleFromProfiles(nextProfiles),
    scenes: nextScenes,
  };
}

export function applyEnvironmentAssetToProject(
  project: AnimationProject,
  envAssetItem: StudioEnvironmentAsset | null,
  options: {
    scope: 'all' | 'scene';
    sceneId?: string;
  }
): AnimationProject {
  const { scope, sceneId } = options;

  const nextScenes: SceneSpec[] = project.scenes.map((sc) => {
    if (scope === 'scene' && sc.id !== sceneId) return sc;

    if (!envAssetItem) {
      return {
        ...sc,
        customBackgroundAssetId: undefined,
        customBackgroundUrl: undefined,
      };
    }

    return {
      ...sc,
      customBackgroundAssetId: envAssetItem.id,
      customBackgroundUrl: envAssetItem.url,
      setting: envAssetItem.defaultSetting,
      timeOfDay: envAssetItem.timeOfDay,
      accentColor: envAssetItem.accentColor,
      environmentDetails: `${envAssetItem.nameEn} (${envAssetItem.nameBn})`,
      presetSceneId: undefined,
      customSvg: undefined,
    };
  });

  return {
    ...project,
    defaultEnvironmentAssetId:
      scope === 'all' ? envAssetItem?.id : project.defaultEnvironmentAssetId,
    scenes: nextScenes,
  };
}

export function applyAutoIllustratedEnvironmentsToProject(
  project: AnimationProject
): AnimationProject {
  return {
    ...project,
    autoUseIllustratedWorlds: false,
  };
}
