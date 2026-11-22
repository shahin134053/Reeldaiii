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

export interface StudioAssetCategoryMeta {
  id: StudioAssetCategory;
  labelEn: string;
  labelBn: string;
}

export const STUDIO_ASSET_CATEGORIES: readonly StudioAssetCategoryMeta[] = [
  { id: 'deshi', labelEn: 'Bangladeshi & Cultural', labelBn: 'বাংলাদেশি ও দেশজ' },
  { id: 'professions', labelEn: 'Professions & City', labelBn: 'পেশা ও শহর' },
  { id: 'school-daily', labelEn: 'School, Home & Study', labelBn: 'স্কুল, ঘর ও পড়াশোনা' },
  { id: 'fantasy-heroes', labelEn: 'Fantasy & Heroes', labelBn: 'ফ্যান্টাসি ও সুপারহিরো' },
  { id: 'scifi-animals', labelEn: 'Sci-Fi & Animals', labelBn: 'সাই-ফাই ও প্রাণী' },
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
  /** Scene-integrated portrait (soft feathered oval card instead of sheet paper flood-fill) */
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

function envAsset(
  id: string,
  fileName: string,
  nameEn: string,
  nameBn: string,
  category: StudioAssetCategory,
  defaultSetting: SceneSetting,
  timeOfDay: TimeOfDay,
  accentColor: string,
  keywords: string[]
): StudioEnvironmentAsset {
  return {
    id,
    fileName,
    url: resolveAssetUrl(`assets/aistudio/${fileName}`),
    nameEn,
    nameBn,
    category,
    defaultSetting,
    timeOfDay,
    accentColor,
    keywords,
  };
}

function charAsset(
  spec: Omit<StudioCharacterAsset, 'url'>
): StudioCharacterAsset {
  return {
    ...spec,
    url: resolveAssetUrl(`assets/aistudio/${spec.fileName}`),
  };
}

export const STUDIO_ENVIRONMENT_ASSETS: readonly StudioEnvironmentAsset[] = [
  envAsset(
    'env-bd-tea-stall',
    'Bangladeshi_roadside_tea_stall_b__fc9ba278_294c52f8.jpg',
    'Bangladeshi Roadside Tea Stall',
    'বাংলাদেশি রাস্তার চায়ের দোকান',
    'deshi',
    'tea-stall',
    'morning',
    '#E5A93C',
    ['tea', 'chai', 'stall', 'cha', 'bazar', 'চা', 'দোকান', 'আড্ডা', 'চায়ের', 'bangladesh', 'dhaka', 'village']
  ),
  envAsset(
    'env-rickshaw-street',
    'City_street_with_colorful_rickshaws_497082d1_8b8eda6c.jpg',
    'Colorful Rickshaw City Street',
    'রঙিন রিকশা ও শহরের রাস্তা',
    'deshi',
    'school-street',
    'afternoon',
    '#E87A3C',
    ['rickshaw', 'street', 'dhaka', 'city', 'road', 'রিকশা', 'শহর', 'রাস্তা', 'ঢাকা', 'যানজট', 'বাংলাদেশ']
  ),
  envAsset(
    'env-hospital-sunlight',
    'Sunlight_through_hospital_room_w__7fe02b0d_d4098d4b.jpg',
    'Sunlit Hospital Recovery Room',
    'রোদেলা হাসপাতালের কেবিন রুম',
    'professions',
    'hospital-care',
    'morning',
    '#E5B869',
    ['hospital', 'patient', 'bed', 'recovery', 'ward', 'clinic', 'হাসপাতাল', 'রোগী', 'কেবিন', 'সুস্থ']
  ),
  envAsset(
    'env-modern-hospital',
    'Modern_hospital_clinic_room_inte__03849a4f_211c9036.jpg',
    'Modern Hospital & Clinic Room',
    'আধুনিক হাসপাতাল ও ক্লিনিক রুম',
    'professions',
    'hospital-care',
    'afternoon',
    '#3C8D8E',
    ['clinic', 'doctor', 'medical', 'checkup', 'treatment', 'ডাক্তার', 'চিকিৎসা', 'ক্লিনিক', 'নার্স', 'স্বাস্থ্য']
  ),
  envAsset(
    'env-police-station',
    'Police_station_office_interior_b__b1ec76ce_651c4d62.jpg',
    'Police Station Office',
    'থানা ও পুলিশ স্টেশন অফিস',
    'professions',
    'court-justice',
    'afternoon',
    '#4A77B5',
    ['police', 'station', 'detective', 'law', 'crime', 'justice', 'পুলিশ', 'থানা', 'তদন্ত', 'আইন', 'মামলা']
  ),
  envAsset(
    'env-corporate-office',
    'Modern_corporate_office_workspac__45122eb2_33f41568.jpg',
    'Modern Corporate Office',
    'আধুনিক কর্পোরেট অফিস ওয়ার্কস্পেস',
    'professions',
    'office-studio',
    'morning',
    '#5B98CA',
    ['office', 'corporate', 'work', 'meeting', 'desk', 'laptop', 'অফিস', 'চাকরি', 'মিটিং', 'কর্মস্থল', 'ব্যবসা']
  ),
  envAsset(
    'env-construction-site',
    'Building_construction_site_daytime_8745e095_3c81276d.jpg',
    'Daytime Construction Site',
    'দিনের বেলা ভবন নির্মাণ সাইট',
    'professions',
    'city-evening',
    'afternoon',
    '#E5943C',
    ['construction', 'building', 'crane', 'engineer', 'worker', 'নির্মাণ', 'ভবন', 'শ্রমিক', 'ইঞ্জিনিয়ার', 'কাজ']
  ),
  envAsset(
    'env-restaurant-kitchen',
    'Restaurant_kitchen_interior_back__8ed51e47_e86ff925.jpg',
    'Restaurant Kitchen Interior',
    'রেস্টুরেন্টের রান্নাঘর',
    'professions',
    'market-bazaar',
    'afternoon',
    '#D97736',
    ['kitchen', 'chef', 'cook', 'restaurant', 'food', 'dinner', 'রান্নাঘর', 'শেফ', 'খাবার', 'রেস্টুরেন্ট', 'রান্না']
  ),
  envAsset(
    'env-cozy-coffee-shop',
    'Cozy_coffee_shop_interior_backgr__425cddbd_86673ae8.jpg',
    'Cozy Coffee Shop & Cafe',
    'সাজানো কফি শপ ও ক্যাফে',
    'school-daily',
    'tea-stall',
    'sunset',
    '#D99B52',
    ['coffee', 'cafe', 'shop', 'chat', 'talk', 'কফি', 'ক্যাফে', 'দোকান', 'গল্প']
  ),
  envAsset(
    'env-school-classroom',
    'Elementary_school_classroom_back__c9e70df2_b3dc41d0.jpg',
    'Elementary School Classroom',
    'স্কুলের শ্রেণিকক্ষ ও ব্ল্যাকবোর্ড',
    'school-daily',
    'classroom',
    'morning',
    '#4E9A74',
    ['school', 'classroom', 'student', 'teacher', 'lesson', 'board', 'স্কুল', 'শ্রেণিকক্ষ', 'ছাত্র', 'শিক্ষক', 'পড়া']
  ),
  envAsset(
    'env-university-hall',
    'University_lecture_hall_classroo__0108f789_ef2adf4e.jpg',
    'University Lecture Hall',
    'বিশ্ববিদ্যালয়ের লেকচার হল',
    'school-daily',
    'classroom',
    'afternoon',
    '#B87B46',
    ['university', 'college', 'lecture', 'professor', 'exam', 'বিশ্ববিদ্যালয়', 'কলেজ', 'অধ্যাপক', 'লেকচার', 'পরীক্ষা']
  ),
  envAsset(
    'env-public-library',
    'Public_library_study_hall_backgr__2c630b55_5eef783b.jpg',
    'Grand Public Library Hall',
    'বিশাল পাবলিক লাইব্রেরি ও পাঠাগার',
    'school-daily',
    'library-study',
    'afternoon',
    '#C9963A',
    ['library', 'books', 'study', 'read', 'knowledge', 'লাইব্রেরি', 'পাঠাগার', 'বই', 'জ্ঞান', 'পড়াশোনা']
  ),
  envAsset(
    'env-anime-bedroom',
    'Anime_style_bedroom_background_4812fc1f_218a975f.jpg',
    'Cozy Anime Bedroom',
    'সুন্দর অ্যানিমে বেডরুম ও পড়ার টেবিল',
    'school-daily',
    'home-night',
    'afternoon',
    '#7FA8D6',
    ['bedroom', 'room', 'home', 'house', 'study', 'sleep', 'ঘর', 'বাড়ি', 'রুম', 'বেডরুম', 'বাসা']
  ),
  envAsset(
    'env-modern-city',
    'Modern_city_street_vector_backgr__b0d182ce_260037f1.jpg',
    'Modern City Street',
    'আধুনিক শহরের ব্যস্ত সড়ক',
    'professions',
    'city-evening',
    'afternoon',
    '#4A8EC4',
    ['city', 'town', 'street', 'urban', 'buildings', 'শহর', 'নগর', 'দালান', 'রাস্তা']
  ),
  envAsset(
    'env-subway-station',
    'Subway_station_platform_vector_b__3b626f0f_d19b5982.jpg',
    'Subway & Metro Station Platform',
    'মেট্রোরেল ও সাবওয়ে স্টেশন',
    'professions',
    'train-journey',
    'evening' as TimeOfDay,
    '#52A8D8',
    ['subway', 'metro', 'train', 'station', 'platform', 'commute', 'মেট্রো', 'ট্রেন', 'স্টেশন', 'যাত্রা']
  ).category === 'professions'
    ? envAsset(
        'env-subway-station',
        'Subway_station_platform_vector_b__3b626f0f_d19b5982.jpg',
        'Subway & Metro Station Platform',
        'মেট্রোরেল ও সাবওয়ে স্টেশন',
        'professions',
        'train-journey',
        'afternoon',
        '#52A8D8',
        ['subway', 'metro', 'train', 'station', 'platform', 'commute', 'মেট্রো', 'ট্রেন', 'স্টেশন', 'যাত্রা']
      )
    : envAsset(
        'env-subway-station',
        'Subway_station_platform_vector_b__3b626f0f_d19b5982.jpg',
        'Subway & Metro Station Platform',
        'মেট্রোরেল ও সাবওয়ে স্টেশন',
        'professions',
        'train-journey',
        'afternoon',
        '#52A8D8',
        ['subway', 'metro', 'train', 'station', 'platform']
      ),
  envAsset(
    'env-tropical-beach',
    'Tropical_beach_with_palm_trees_4055edf7_8a1b608e.jpg',
    'Tropical Palm Beach & Ocean',
    'নারকেল গাছ ও নীল সমুদ্রসৈকত',
    'deshi',
    'ocean-voyage',
    'morning',
    '#38BDF8',
    ['beach', 'sea', 'ocean', 'island', 'palm', 'coxsbazar', 'সমুদ্র', 'সৈকত', 'নদী', 'কক্সবাজার', 'দ্বীপ']
  ),
  envAsset(
    'env-snow-village',
    'Snow-covered_mountain_village_ba__e7f238b4_6eb7bdd6.jpg',
    'Snowy Mountain Village',
    'তুষারাবৃত পাহাড়ি গ্রাম',
    'fantasy-heroes',
    'snow-valley',
    'dawn',
    '#93C5FD',
    ['snow', 'winter', 'mountain', 'cold', 'village', 'বরফ', 'শীত', 'পাহাড়', 'তুষার']
  ),
  envAsset(
    'env-desert-temple',
    'Ancient_desert_temple_ruins_back__aa1f02e7_4bacb621.jpg',
    'Ancient Desert Temple Ruins',
    'প্রাচীন মরুভূমির মন্দির ও ধ্বংসাবশেষ',
    'fantasy-heroes',
    'desert-dunes',
    'sunset',
    '#F59E0B',
    ['desert', 'temple', 'ancient', 'ruins', 'sand', 'history', 'মরুভূমি', 'প্রাচীন', 'বালি', 'ইতিহাস', 'মন্দির']
  ),
  envAsset(
    'env-medieval-castle',
    'Medieval_castle_courtyard_backgr__8f4cb218_d63d6cd6.jpg',
    'Medieval Castle Courtyard',
    'মধ্যযুগীয় রাজপ্রাসাদ ও দুর্গ প্রাঙ্গণ',
    'fantasy-heroes',
    'ancient-palace',
    'afternoon',
    '#D97706',
    ['castle', 'palace', 'king', 'queen', 'knight', 'medieval', 'প্রাসাদ', 'দুর্গ', 'রাজা', 'রানী', 'রাজ্য']
  ),
  envAsset(
    'env-fantasy-forest',
    'Fantasy_forest_with_glowing_mush__9e3563f3_e640fd0a.jpg',
    'Enchanted Glowing Forest',
    'জাদুর আলোময় রূপকথার জঙ্গল',
    'fantasy-heroes',
    'forest-wild',
    'night',
    '#34D399',
    ['forest', 'jungle', 'magic', 'fairy', 'glowing', 'woods', 'জঙ্গল', 'বন', 'জাদু', 'রূপকথা', 'গাছ']
  ),
  envAsset(
    'env-floating-islands',
    'Floating_islands_in_sky_background_651a0af2_9bedb89e.jpg',
    'Floating Sky Islands',
    'আকাশে ভাসমান জাদুর দ্বীপ',
    'fantasy-heroes',
    'mountain-summit',
    'morning',
    '#60A5FA',
    ['sky', 'floating', 'island', 'dream', 'magic', 'cloud', 'আকাশ', 'স্বপ্ন', 'মেঘ', 'দ্বীপ']
  ),
  envAsset(
    'env-candy-land',
    'Candy_land_landscape_vector_art_9842ee21_aae125ca.jpg',
    'Colorful Candy Land World',
    'রঙিন ক্যান্ডি ল্যান্ড ও শিশুতোষ জগৎ',
    'fantasy-heroes',
    'festival-celebration',
    'morning',
    '#F472B6',
    ['candy', 'kids', 'sweet', 'toy', 'cartoon', 'fun', 'শিশু', 'মিষ্টি', 'খেলা', 'রঙিন', 'কার্টুন']
  ),
  envAsset(
    'env-haunted-house',
    'Spooky_haunted_house_at_midnight_5b748bfb_f2fd909b.jpg',
    'Spooky Midnight Haunted House',
    'ভৌতিক ও রহস্যময় রাতের বাড়ি',
    'fantasy-heroes',
    'mystery-night',
    'night',
    '#A78BFA',
    ['ghost', 'horror', 'haunted', 'midnight', 'spooky', 'mystery', 'ভূত', 'রহস্য', 'ভৌতিক', 'অন্ধকার', 'ভয়']
  ),
  envAsset(
    'env-underwater-reef',
    'Underwater_coral_reef_kingdom_37901376_0d256fa2.jpg',
    'Underwater Coral Reef Kingdom',
    'সাগরের তলদেশের প্রবাল রাজ্য',
    'scifi-animals',
    'ocean-voyage',
    'morning',
    '#22D3EE',
    ['underwater', 'coral', 'fish', 'mermaid', 'ocean', 'deep', 'সাগর', 'মাছ', 'পানি', 'জলপরী']
  ),
  envAsset(
    'env-futuristic-city',
    'Futuristic_city_street_background_58c009bd_781b995d.jpg',
    'Futuristic Neon City Street',
    'ভবিষ্যতের নিয়োন সাই-ফাই শহর',
    'scifi-animals',
    'tech-ai-lab',
    'night',
    '#38BDF8',
    ['cyberpunk', 'futuristic', 'neon', 'scifi', 'robot', 'ai', 'future', 'ভবিষ্যৎ', 'রোবট', 'প্রযুক্তি', 'নিয়োন']
  ),
  envAsset(
    'env-science-lab',
    'Science_laboratory_environment_b__a096063d_916f30dc.jpg',
    'Science & AI Research Lab',
    'বিজ্ঞান ও গবেষণা ল্যাবরেটরি',
    'scifi-animals',
    'tech-ai-lab',
    'afternoon',
    '#34D399',
    ['science', 'lab', 'laboratory', 'research', 'experiment', 'scientist', 'বিজ্ঞান', 'ল্যাব', 'গবেষণা', 'বিজ্ঞানী']
  ),
  envAsset(
    'env-retro-arcade',
    'Retro_arcade_game_room_interior_75caea9c_49cd31fd.jpg',
    'Retro Arcade & Game Room',
    'রেট্রো আর্কেড ও গেম রুম',
    'scifi-animals',
    'stage-spotlight',
    'night',
    '#F43F5E',
    ['game', 'arcade', 'gaming', 'retro', 'play', 'neon', 'গেম', 'খেলা', 'আর্কেড', 'কম্পিউটার']
  ),
];

export const STUDIO_CHARACTER_ASSETS: readonly StudioCharacterAsset[] = [
  charAsset({
    id: 'char-rickshaw-puller',
    fileName: 'Rickshaw_puller_character_design__c49019a9_86b22525.jpg',
    nameEn: 'Bangladeshi Rickshaw Puller',
    nameBn: 'রিকশাচালক চাচা',
    category: 'deshi',
    role: 'father',
    cutoutCrop: { sx: 0.08, sy: 0.08, sw: 0.22, sh: 0.89 },
    hairStyleId: 'short-classic',
    headwear: 'none',
    skinTone: '#B57B56',
    hairColor: '#23201F',
    outfitColor: '#C9B896',
    pantsColor: '#1E4660',
    accentColor: '#C83232',
    isFemale: false,
    isElder: false,
    accessories: ['mustache', 'gamchha'],
    clothingDesc: 'Cream short shirt, checkered lungi & red gamchha around shoulder',
    personality: 'Hardworking, warm-hearted Bangladeshi rickshaw puller',
    keywords: ['rickshaw', 'father', 'worker', 'lungi', 'gamchha', 'রিকশাচালক', 'বাবা', 'চাচা', 'গামছা', 'রিকশা'],
  }),
  charAsset({
    id: 'char-tea-vendor',
    fileName: 'Tea_vendor_making_tea_2e04a02f_57ac1e66.jpg',
    nameEn: 'Deshi Tea Vendor (Cha-Wala)',
    nameBn: 'দেশি চা বিক্রেতা (চা মামা)',
    category: 'deshi',
    role: 'father',
    cutoutCrop: { sx: 0.02, sy: 0.07, sw: 0.29, sh: 0.89 },
    hairStyleId: 'bald-elder',
    headwear: 'none',
    skinTone: '#B47954',
    hairColor: '#3D3B39',
    outfitColor: '#9C9878',
    pantsColor: '#1D5B79',
    accentColor: '#C83434',
    isFemale: false,
    isElder: true,
    accessories: ['mustache', 'gamchha'],
    clothingDesc: 'Olive-beige shirt, colorful lungi & red gamchha',
    personality: 'Friendly neighborhood tea stall owner who knows everyone’s story',
    keywords: ['tea', 'vendor', 'chai', 'uncle', 'lungi', 'চা', 'মামা', 'দোকানদার', 'চা-ওয়ালা', 'বিক্রেতা'],
  }),
  charAsset({
    id: 'char-boy-classic',
    fileName: 'Boy_character_design_sheet_9aad33d1_7fa4785b.jpg',
    nameEn: 'Curious Young Boy',
    nameBn: 'চঞ্চল কিশোর বালক',
    category: 'school-daily',
    role: 'youth-boy',
    cutoutCrop: { sx: 0.14, sy: 0.03, sw: 0.22, sh: 0.94 },
    hairStyleId: 'parted-neat',
    headwear: 'none',
    skinTone: '#D4A17A',
    hairColor: '#2B1F1B',
    outfitColor: '#4E82B4',
    pantsColor: '#222F42',
    accentColor: '#E5A93C',
    isFemale: false,
    isElder: false,
    accessories: [],
    clothingDesc: 'Casual blue T-shirt, denim jeans & sneakers',
    personality: 'Bright, curious boy always ready for adventure or learning',
    keywords: ['boy', 'kid', 'child', 'son', 'youth', 'ছেলে', 'বালক', 'কিশোর', 'খোকা', 'সন্তান'],
  }),
  charAsset({
    id: 'char-student-school',
    fileName: 'Student_character_design_sheet_ec1db927_54179430.jpg',
    nameEn: 'School Student with Backpack',
    nameBn: 'স্কুল ছাত্র (ব্যাগসহ)',
    category: 'school-daily',
    role: 'youth-boy',
    cutoutCrop: { sx: 0.17, sy: 0.11, sw: 0.19, sh: 0.85 },
    hairStyleId: 'short-classic',
    headwear: 'none',
    skinTone: '#CE9872',
    hairColor: '#1E1918',
    outfitColor: '#5B88B8',
    pantsColor: '#1F2C40',
    accentColor: '#E5A93C',
    isFemale: false,
    isElder: false,
    accessories: ['watch'],
    clothingDesc: 'Neat school uniform shirt, trousers & school backpack',
    personality: 'Diligent, hopeful student dreaming big',
    keywords: ['student', 'school', 'exam', 'study', 'boy', 'ছাত্র', 'শিক্ষার্থী', 'স্কুল', 'পড়াশোনা', 'বই'],
  }),
  charAsset({
    id: 'char-school-teacher',
    fileName: 'School_teacher_character_design___9d313012_848e74d2.jpg',
    nameEn: 'Kind School Teacher (Madam)',
    nameBn: 'আদর্শ স্কুল শিক্ষিকা',
    category: 'school-daily',
    role: 'teacher',
    cutoutCrop: { sx: 0.08, sy: 0.18, sw: 0.18, sh: 0.78 },
    hairStyleId: 'bun-traditional',
    headwear: 'none',
    skinTone: '#E0B290',
    hairColor: '#3B281E',
    outfitColor: '#C87D55',
    pantsColor: '#2D3A4A',
    accentColor: '#E5A93C',
    isFemale: true,
    isElder: false,
    accessories: ['glasses'],
    clothingDesc: 'Warm blazer over pastel blouse, skirt & reading glasses',
    personality: 'Patient, encouraging teacher guiding students step by step',
    keywords: ['teacher', 'madam', 'school', 'education', 'lady', 'শিক্ষিকা', 'ম্যাডাম', 'টিচার', 'স্কুল', 'শিক্ষক'],
  }),
  charAsset({
    id: 'char-professor',
    fileName: 'Professor_character_design_sheet_f1de98c9_d82f10a4.jpg',
    nameEn: 'Senior University Professor',
    nameBn: 'প্রবীণ অধ্যাপক / গুরুজি',
    category: 'school-daily',
    role: 'elder',
    cutoutCrop: { sx: 0.16, sy: 0.09, sw: 0.21, sh: 0.87 },
    hairStyleId: 'bald-elder',
    headwear: 'none',
    skinTone: '#D6A684',
    hairColor: '#D6D4CE',
    outfitColor: '#7A5B44',
    pantsColor: '#2E3440',
    accentColor: '#C9963A',
    isFemale: false,
    isElder: true,
    accessories: ['glasses', 'mustache', 'beard'],
    clothingDesc: 'Tweed jacket, vest & round scholarly glasses',
    personality: 'Wise mentor rich with knowledge and timeless proverbs',
    keywords: ['professor', 'scholar', 'elder', 'wise', 'grandfather', 'অধ্যাপক', 'দাদু', 'গুরু', 'জ্ঞানী', 'বয়স্ক'],
  }),
  charAsset({
    id: 'char-doctor-sheet',
    fileName: 'Doctor_character_design_sheet_432603e3_d1ddd1ed.jpg',
    nameEn: 'Caring Physician (2D Sheet)',
    nameBn: 'ডাক্তার সাহেব (টুডি শিট)',
    category: 'professions',
    role: 'doctor',
    cutoutCrop: { sx: 0.16, sy: 0.12, sw: 0.20, sh: 0.85 },
    hairStyleId: 'parted-neat',
    headwear: 'none',
    skinTone: '#CE9872',
    hairColor: '#1E1B1A',
    outfitColor: '#EEF2F5',
    pantsColor: '#274252',
    accentColor: '#3C8D8E',
    isFemale: false,
    isElder: false,
    accessories: ['stethoscope', 'glasses'],
    clothingDesc: 'Crisp white doctor coat over shirt with stethoscope',
    personality: 'Calm, compassionate physician listening closely',
    keywords: ['doctor', 'physician', 'hospital', 'medical', 'ডাক্তার', 'চিকিৎসক', 'হাসপাতাল', 'রোগী'],
  }),
  charAsset({
    id: 'char-doctor-clinic',
    fileName: 'Doctor_in_white_coat_f52d5ad7_111eaaae.jpg',
    nameEn: 'Senior Clinic Doctor (Portrait)',
    nameBn: 'ক্লিনিক বিশেষজ্ঞ ডাক্তার',
    category: 'professions',
    role: 'doctor',
    cutoutCrop: { sx: 0.24, sy: 0.02, sw: 0.64, sh: 0.97 },
    isScenePortrait: true,
    hairStyleId: 'parted-neat',
    headwear: 'none',
    skinTone: '#C8926D',
    hairColor: '#2A2726',
    outfitColor: '#F1F5F9',
    pantsColor: '#1E3A5F',
    accentColor: '#3C8D8E',
    isFemale: false,
    isElder: false,
    accessories: ['stethoscope', 'glasses'],
    clothingDesc: 'White lab coat, glasses & stethoscope in hospital clinic',
    personality: 'Reassuring specialist doctor offering expert advice',
    keywords: ['doctor', 'clinic', 'specialist', 'white coat', 'ডাক্তার', 'ক্লিনিক', 'বিশেষজ্ঞ'],
  }),
  charAsset({
    id: 'char-female-nurse',
    fileName: 'Female_nurse_holding_clipboard_3b0535ed_e5256938.jpg',
    nameEn: 'Compassionate Nurse',
    nameBn: 'সেবিকা / নার্স আপু',
    category: 'professions',
    role: 'mother',
    cutoutCrop: { sx: 0.41, sy: 0.10, sw: 0.19, sh: 0.87 },
    hairStyleId: 'bun-traditional',
    headwear: 'none',
    skinTone: '#D6A27C',
    hairColor: '#251D1A',
    outfitColor: '#3B82A6',
    pantsColor: '#2E6987',
    accentColor: '#F8FAFC',
    isFemale: true,
    isElder: false,
    accessories: [],
    clothingDesc: 'Teal-blue nursing scrubs with clipboard & kind smile',
    personality: 'Gentle, attentive healthcare nurse',
    keywords: ['nurse', 'hospital', 'care', 'clipboard', 'medical', 'নার্স', 'সেবিকা', 'হাসপাতাল', 'সেবা'],
  }),
  charAsset({
    id: 'char-police-officer',
    fileName: 'Police_officer_character_design___83d546c2_563d651b.jpg',
    nameEn: 'Duty Police Officer',
    nameBn: 'সৎ পুলিশ অফিসার',
    category: 'professions',
    role: 'professional',
    cutoutCrop: { sx: 0.17, sy: 0.12, sw: 0.21, sh: 0.85 },
    hairStyleId: 'short-classic',
    headwear: 'cap',
    skinTone: '#C8906A',
    hairColor: '#1E1B1A',
    outfitColor: '#253D63',
    pantsColor: '#192944',
    accentColor: '#E5A93C',
    isFemale: false,
    isElder: false,
    accessories: ['cap', 'mustache'],
    clothingDesc: 'Navy police uniform, badge & officer peaked cap',
    personality: 'Courageous, principled law enforcement officer',
    keywords: ['police', 'officer', 'cop', 'inspector', 'law', 'পুলিশ', 'অফিসার', 'তদন্ত', 'আইন', 'থানা'],
  }),
  charAsset({
    id: 'char-chef',
    fileName: 'Chef_character_design_sheet_de41bde5_ddccf145.jpg',
    nameEn: 'Master Chef',
    nameBn: 'মাস্টার শেফ / বাবুর্চি',
    category: 'professions',
    role: 'professional',
    cutoutCrop: { sx: 0.06, sy: 0.05, sw: 0.36, sh: 0.92 },
    hairStyleId: 'short-classic',
    headwear: 'hat',
    skinTone: '#C78E68',
    hairColor: '#2A221E',
    outfitColor: '#F4F4F0',
    pantsColor: '#2B303A',
    accentColor: '#D9534F',
    isFemale: false,
    isElder: false,
    accessories: ['hat', 'mustache'],
    clothingDesc: 'Double-breasted white chef jacket, toque hat & red neckerchief',
    personality: 'Passionate culinary artist full of joyful energy',
    keywords: ['chef', 'cook', 'kitchen', 'food', 'baker', 'শেফ', 'বাবুর্চি', 'রান্না', 'খাবার'],
  }),
  charAsset({
    id: 'char-construction-worker',
    fileName: 'Construction_worker_character_de__ae83a3af_5e754e5f.jpg',
    nameEn: 'Construction Engineer & Worker',
    nameBn: 'নির্মাণ শ্রমিক ও ইঞ্জিনিয়ার',
    category: 'professions',
    role: 'father',
    cutoutCrop: { sx: 0.05, sy: 0.09, sw: 0.24, sh: 0.88 },
    hairStyleId: 'short-classic',
    headwear: 'hat',
    skinTone: '#B9815A',
    hairColor: '#221E1D',
    outfitColor: '#E87722',
    pantsColor: '#2C4259',
    accentColor: '#FBBF24',
    isFemale: false,
    isElder: false,
    accessories: ['hat'],
    clothingDesc: 'High-visibility orange vest, yellow hard hat & utility belt',
    personality: 'Strong, dependable builder crafting cities',
    keywords: ['worker', 'builder', 'engineer', 'construction', 'শ্রমিক', 'ইঞ্জিনিয়ার', 'নির্মাণ', 'মিস্ত্রি'],
  }),
  charAsset({
    id: 'char-office-worker',
    fileName: 'Office_worker_character_design_s__1bbe4bb5_ff3fdccd.jpg',
    nameEn: 'Corporate Office Executive',
    nameBn: 'অফিস এক্সিকিউটিভ ও চাকরিজীবী',
    category: 'professions',
    role: 'professional',
    cutoutCrop: { sx: 0.40, sy: 0.10, sw: 0.20, sh: 0.87 },
    hairStyleId: 'parted-neat',
    headwear: 'none',
    skinTone: '#D4A17A',
    hairColor: '#1E1A18',
    outfitColor: '#2F445C',
    pantsColor: '#1F2937',
    accentColor: '#C83C3C',
    isFemale: false,
    isElder: false,
    accessories: ['watch'],
    clothingDesc: 'Tailored suit blazer, necktie & neat corporate attire',
    personality: 'Focused office worker balancing deadlines & ambition',
    keywords: ['office', 'corporate', 'manager', 'business', 'job', 'অফিস', 'চাকরি', 'ব্যবসা', 'ম্যানেজার'],
  }),
  charAsset({
    id: 'char-female-executive',
    fileName: 'Female_executive_character_desig__251977fe_f37e55b1.jpg',
    nameEn: 'Female Business Leader',
    nameBn: 'কর্পোরেট নারী উদ্যোক্তা',
    category: 'professions',
    role: 'mother',
    cutoutCrop: { sx: 0.17, sy: 0.11, sw: 0.16, sh: 0.70 },
    hairStyleId: 'long-flowing',
    headwear: 'none',
    skinTone: '#E0B290',
    hairColor: '#2A1F1B',
    outfitColor: '#27384D',
    pantsColor: '#1B2433',
    accentColor: '#E5A93C',
    isFemale: true,
    isElder: false,
    accessories: ['glasses', 'watch'],
    clothingDesc: 'Sharp tailored navy blazer, crisp collar & confident poise',
    personality: 'Poised, visionary leader presenting bold ideas',
    keywords: ['executive', 'woman', 'leader', 'boss', 'entrepreneur', 'নারী', 'উদ্যোক্তা', 'লিডার', 'অফিস'],
  }),
  charAsset({
    id: 'char-software-engineer',
    fileName: 'Software_engineer_with_laptop_62157a28_9301cadf.jpg',
    nameEn: 'Software Engineer with Laptop',
    nameBn: 'সফটওয়্যার ইঞ্জিনিয়ার (ল্যাপটপসহ)',
    category: 'professions',
    role: 'youth-boy',
    cutoutCrop: { sx: 0.03, sy: 0.10, sw: 0.19, sh: 0.86 },
    hairStyleId: 'spiky-modern',
    headwear: 'none',
    skinTone: '#CE9872',
    hairColor: '#1B1817',
    outfitColor: '#3B6E8C',
    pantsColor: '#242C3A',
    accentColor: '#38BDF8',
    isFemale: false,
    isElder: false,
    accessories: ['glasses'],
    clothingDesc: 'Casual tech hoodie/shirt with laptop & modern glasses',
    personality: 'Creative problem-solver coding ideas into reality',
    keywords: ['software', 'developer', 'programmer', 'laptop', 'coding', 'tech', 'সফটওয়্যার', 'ডেভেলপার', 'ল্যাপটপ', 'কোডিং'],
  }),
  charAsset({
    id: 'char-male-scientist',
    fileName: 'Male_scientist_character_design___601b1f03_8a659bd7.jpg',
    nameEn: 'Research Scientist',
    nameBn: 'গবেষক বিজ্ঞানী',
    category: 'professions',
    role: 'teacher',
    cutoutCrop: { sx: 0.11, sy: 0.12, sw: 0.25, sh: 0.83 },
    hairStyleId: 'curly-voluminous',
    headwear: 'none',
    skinTone: '#D6A480',
    hairColor: '#5C3B28',
    outfitColor: '#ECEFF4',
    pantsColor: '#334155',
    accentColor: '#34D399',
    isFemale: false,
    isElder: false,
    accessories: ['glasses'],
    clothingDesc: 'Lab coat with glowing beaker, tie & safety glasses',
    personality: 'Excited researcher testing breakthroughs',
    keywords: ['scientist', 'science', 'lab', 'chemistry', 'experiment', 'বিজ্ঞানী', 'বিজ্ঞান', 'গবেষণা', 'ল্যাব'],
  }),
  charAsset({
    id: 'char-superhero-kid',
    fileName: 'Superhero_kid_character_design_aa9d2476_bfd07f61.jpg',
    nameEn: 'Hero Kid with Cape',
    nameBn: 'সুপারহিরো খুদে নায়ক',
    category: 'fantasy-heroes',
    role: 'youth-boy',
    cutoutCrop: { sx: 0.34, sy: 0.12, sw: 0.27, sh: 0.85 },
    hairStyleId: 'spiky-modern',
    headwear: 'none',
    skinTone: '#E0B290',
    hairColor: '#3D261B',
    outfitColor: '#D92B2B',
    pantsColor: '#1E64C8',
    accentColor: '#FACC15',
    isFemale: false,
    isElder: false,
    accessories: [],
    clothingDesc: 'Bright red superhero suit, blue cape, mask & star emblem',
    personality: 'Fearless, cheerful young superhero ready to help',
    keywords: ['superhero', 'hero', 'kid', 'cape', 'power', 'সুপারহিরো', 'হিরো', 'নায়ক', 'সাহসী'],
  }),
  charAsset({
    id: 'char-female-knight',
    fileName: 'Female_knight_character_design_s__453c3602_398b66c6.jpg',
    nameEn: 'Brave Knight Guardian',
    nameBn: 'বীরাঙ্গনা নাইট যোদ্ধা',
    category: 'fantasy-heroes',
    role: 'youth-girl',
    cutoutCrop: { sx: 0.08, sy: 0.07, sw: 0.37, sh: 0.90 },
    hairStyleId: 'long-flowing',
    headwear: 'crown',
    skinTone: '#E2B694',
    hairColor: '#8E4326',
    outfitColor: '#94A3B8',
    pantsColor: '#475569',
    accentColor: '#E5A93C',
    isFemale: true,
    isElder: false,
    accessories: ['crown'],
    clothingDesc: 'Shining silver steel armor, royal blue cape & sword',
    personality: 'Noble protector defending the kingdom with honor',
    keywords: ['knight', 'warrior', 'sword', 'armor', 'castle', 'যোদ্ধা', 'রানী', 'বীরাঙ্গনা', 'তলোয়ার'],
  }),
  charAsset({
    id: 'char-friendly-wizard',
    fileName: 'Friendly_wizard_character_design__bccc018a_188ddb7d.jpg',
    nameEn: 'Friendly Story Wizard',
    nameBn: 'দয়ালু জাদুকর দাদু',
    category: 'fantasy-heroes',
    role: 'elder',
    cutoutCrop: { sx: 0.10, sy: 0.08, sw: 0.38, sh: 0.89 },
    hairStyleId: 'long-flowing',
    headwear: 'hat',
    skinTone: '#DCB08E',
    hairColor: '#E2E8F0',
    outfitColor: '#4F469C',
    pantsColor: '#312E81',
    accentColor: '#F59E0B',
    isFemale: false,
    isElder: true,
    accessories: ['beard', 'mustache', 'hat'],
    clothingDesc: 'Starry indigo wizard robe, pointed hat & glowing staff',
    personality: 'Playful old wizard weaving wonder into every tale',
    keywords: ['wizard', 'magic', 'spell', 'witch', 'sorcerer', 'জাদুকর', 'জাদু', 'দরবেশ', 'রূপকথা'],
  }),
  charAsset({
    id: 'char-magical-fairy',
    fileName: 'Magical_fairy_character_design_s__fe1f9885_ad981286.jpg',
    nameEn: 'Glowing Woodland Fairy',
    nameBn: 'আলো ছড়ানো জাদুর পরী',
    category: 'fantasy-heroes',
    role: 'youth-girl',
    cutoutCrop: { sx: 0.17, sy: 0.12, sw: 0.39, sh: 0.84 },
    hairStyleId: 'long-flowing',
    headwear: 'crown',
    skinTone: '#F0C7A8',
    hairColor: '#D977A6',
    outfitColor: '#34D399',
    pantsColor: '#059669',
    accentColor: '#FDE047',
    isFemale: true,
    isElder: false,
    accessories: ['crown'],
    clothingDesc: 'Sparkling leaf-petal dress, translucent wings & magic wand',
    personality: 'Sparkling, kind-hearted woodland spirit',
    keywords: ['fairy', 'magic', 'wings', 'princess', 'wonder', 'পরী', 'জাদুর পরী', 'জলপরী', 'রূপকথা'],
  }),
  charAsset({
    id: 'char-funny-monster',
    fileName: 'Funny_monster_character_design_5bd55033_04387e3b.jpg',
    nameEn: 'Friendly Goofy Monster',
    nameBn: 'মজার বন্ধুসুলভ দানব',
    category: 'fantasy-heroes',
    role: 'friend',
    cutoutCrop: { sx: 0.03, sy: 0.16, sw: 0.29, sh: 0.50 },
    hairStyleId: 'curly-voluminous',
    headwear: 'none',
    skinTone: '#60A5FA',
    hairColor: '#7C3AED',
    outfitColor: '#3B82F6',
    pantsColor: '#1D4ED8',
    accentColor: '#FACC15',
    isFemale: false,
    isElder: false,
    accessories: [],
    clothingDesc: 'Fluffy blue-violet friendly monster with big cheerful smile',
    personality: 'Silly, loyal comic relief friend who loves snacks',
    keywords: ['monster', 'funny', 'creature', 'cartoon', 'comedy', 'দানব', 'মজার', 'কার্টুন', 'ভূত'],
  }),
  charAsset({
    id: 'char-astronaut',
    fileName: 'Astronaut_character_design_sheet_b14cbf82_c577cbd7.jpg',
    nameEn: 'Space Explorer Astronaut',
    nameBn: 'মহাকাশচারী নভোচারী',
    category: 'scifi-animals',
    role: 'youth-boy',
    cutoutCrop: { sx: 0.08, sy: 0.11, sw: 0.38, sh: 0.86 },
    hairStyleId: 'short-classic',
    headwear: 'cap',
    skinTone: '#E0B290',
    hairColor: '#3A281E',
    outfitColor: '#F1F5F9',
    pantsColor: '#CBD5E1',
    accentColor: '#F97316',
    isFemale: false,
    isElder: false,
    accessories: ['cap'],
    clothingDesc: 'White space suit with orange mission stripes & visor helmet',
    personality: 'Bold cosmic explorer charting distant stars',
    keywords: ['astronaut', 'space', 'rocket', 'planet', 'moon', 'cosmos', 'মহাকাশ', 'রকেট', 'নভোচারী', 'চাঁদ'],
  }),
  charAsset({
    id: 'char-cute-robot',
    fileName: 'Cute_robot_character_design_56be0e40_e7ea0c84.jpg',
    nameEn: 'AI Companion Robot',
    nameBn: 'কিউট এআই রোবট বন্ধু',
    category: 'scifi-animals',
    role: 'friend',
    cutoutCrop: { sx: 0.14, sy: 0.11, sw: 0.35, sh: 0.63 },
    hairStyleId: 'short-classic',
    headwear: 'none',
    skinTone: '#E2E8F0',
    hairColor: '#38BDF8',
    outfitColor: '#F8FAFC',
    pantsColor: '#64748B',
    accentColor: '#38BDF8',
    isFemale: false,
    isElder: false,
    accessories: [],
    clothingDesc: 'Rounded pearl-white bot shell with glowing cyan eyes & antenna',
    personality: 'Helpful, cheerful AI robot buddy',
    keywords: ['robot', 'ai', 'bot', 'tech', 'machine', 'drone', 'রোবট', 'যন্ত্র', 'প্রযুক্তি', 'এআই'],
  }),
  charAsset({
    id: 'char-cyberpunk-girl',
    fileName: 'Cyberpunk_girl_character_design_3009d55e_48094ba4.jpg',
    nameEn: 'Cyberpunk Neon Heroine',
    nameBn: 'সাইবারপাঙ্ক নিয়ন নায়িকা',
    category: 'scifi-animals',
    role: 'youth-girl',
    cutoutCrop: { sx: 0.12, sy: 0.06, sw: 0.29, sh: 0.91 },
    hairStyleId: 'spiky-modern',
    headwear: 'none',
    skinTone: '#E8BC9E',
    hairColor: '#EC4899',
    outfitColor: '#1E293B',
    pantsColor: '#0F172A',
    accentColor: '#22D3EE',
    isFemale: true,
    isElder: false,
    accessories: ['glasses'],
    clothingDesc: 'Neon-trimmed tech jacket, glowing visor & futuristic boots',
    personality: 'Quick-thinking future hacker & rebel',
    keywords: ['cyberpunk', 'girl', 'hacker', 'neon', 'futuristic', 'সাইবারপাঙ্ক', 'নিয়ন', 'ভবিষ্যৎ', 'মেয়ে'],
  }),
  charAsset({
    id: 'char-ninja-cat',
    fileName: 'Ninja_cat_character_design_sheet_8dbe40c3_362b971b.jpg',
    nameEn: 'Agile Ninja Cat',
    nameBn: 'নিনজা বিড়াল নায়ক',
    category: 'scifi-animals',
    role: 'friend',
    cutoutCrop: { sx: 0.33, sy: 0.11, sw: 0.33, sh: 0.83 },
    hairStyleId: 'spiky-modern',
    headwear: 'none',
    skinTone: '#F4A261',
    hairColor: '#2B2D42',
    outfitColor: '#22283A',
    pantsColor: '#171C28',
    accentColor: '#EF4444',
    isFemale: false,
    isElder: false,
    accessories: ['scarf'],
    clothingDesc: 'Sleek dark shinobi outfit with red headband & scarf',
    personality: 'Swift, clever ninja kitty with dramatic flair',
    keywords: ['cat', 'ninja', 'kitty', 'animal', 'pet', 'martial', 'বিড়াল', 'নিনজা', 'প্রাণী', 'কার্টুন'],
  }),
  charAsset({
    id: 'char-playful-monkey',
    fileName: 'Playful_monkey_character_design___57fbb6f6_b3bef6fb.jpg',
    nameEn: 'Playful Jungle Monkey',
    nameBn: 'দুষ্টু মিষ্টি বানর বন্ধু',
    category: 'scifi-animals',
    role: 'friend',
    cutoutCrop: { sx: 0.09, sy: 0.13, sw: 0.39, sh: 0.77 },
    hairStyleId: 'curly-voluminous',
    headwear: 'none',
    skinTone: '#E8B88A',
    hairColor: '#7C4A26',
    outfitColor: '#8B5A2B',
    pantsColor: '#6B421D',
    accentColor: '#FACC15',
    isFemale: false,
    isElder: false,
    accessories: [],
    clothingDesc: 'Cheerful brown jungle monkey full of mischievous energy',
    personality: 'Energetic, funny animal companion',
    keywords: ['monkey', 'jungle', 'forest', 'animal', 'banana', 'বানর', 'বাঁদর', 'জঙ্গল', 'গল্প'],
  }),
  charAsset({
    id: 'char-wise-owl',
    fileName: 'Wise_owl_character_design_sheet_a7433fe1_012b8d17.jpg',
    nameEn: 'The Wise Storyteller Owl',
    nameBn: 'জ্ঞানী প্যাঁচা দাদু',
    category: 'scifi-animals',
    role: 'elder',
    cutoutCrop: { sx: 0.305, sy: 0.12, sw: 0.345, sh: 0.705 },
    hairStyleId: 'bald-elder',
    headwear: 'hat',
    skinTone: '#B89B7A',
    hairColor: '#E5E7EB',
    outfitColor: '#7D6A56',
    pantsColor: '#5B4C3E',
    accentColor: '#9F3A44',
    isFemale: false,
    isElder: true,
    accessories: ['glasses', 'scarf', 'hat'],
    clothingDesc: 'Graduate cap, round spectacles & warm maroon scarf',
    personality: 'Thoughtful wise owl narrating fables & moral lessons',
    keywords: ['owl', 'wise', 'bird', 'fable', 'story', 'teacher', 'প্যাঁচা', 'পাখি', 'জ্ঞানী', 'গল্প', 'নীতিকথা'],
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
  text: string,
  settingHint?: SceneSetting
): StudioEnvironmentAsset | null {
  const lower = text.toLowerCase();
  let bestAsset: StudioEnvironmentAsset | null = null;
  let bestScore = 0;

  for (const env of STUDIO_ENVIRONMENT_ASSETS) {
    let score = 0;
    for (const kw of env.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += kw.length >= 5 ? 3 : 2;
      }
    }
    if (settingHint && env.defaultSetting === settingHint) {
      score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestAsset = env;
    }
  }

  if (bestScore >= 2) {
    return bestAsset;
  }

  // Soft setting match fallback when auto-illustrating
  if (settingHint) {
    const bySetting = STUDIO_ENVIRONMENT_ASSETS.find((e) => e.defaultSetting === settingHint);
    if (bySetting) return bySetting;
  }
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
  renderMode: CharacterRenderMode = 'rig-sync',
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
  renderMode: CharacterRenderMode = 'rig-sync',
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
  const { scope, sceneId, slot = 'primary', renderMode = 'rig-sync' } = options;
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
      return {
        ...sc,
        secondaryCharacter: asset.role,
        secondaryCharacterAssetId: asset.id,
        characterRenderMode: renderMode,
        characterIds: Array.from(new Set([...prevIds, profile.characterId])),
        presetSceneId: undefined,
        customSvg: undefined,
      };
    }

    return {
      ...sc,
      primaryCharacter: asset.role,
      primaryCharacterAssetId: asset.id,
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
  const nextScenes: SceneSpec[] = project.scenes.map((sc) => {
    if (sc.customBackgroundAssetId || sc.customSvg || sc.presetSceneId) {
      return sc;
    }
    const text = [sc.spokenExcerpt, sc.summary, sc.titleBn, sc.titleEn]
      .filter(Boolean)
      .join(' ');
    const matched = matchEnvironmentAssetForText(text, sc.setting);
    if (!matched) return sc;

    return {
      ...sc,
      customBackgroundAssetId: matched.id,
      customBackgroundUrl: matched.url,
      environmentDetails: `${matched.nameEn} (${matched.nameBn})`,
      accentColor: matched.accentColor,
    };
  });

  return {
    ...project,
    autoUseIllustratedWorlds: true,
    scenes: nextScenes,
  };
}
