import { SubtitleCue } from './srtParser';
import type {
  CameraMotion,
  CameraShot,
  CharacterRole,
  EmotionTone,
  SceneAction,
  SceneSetting,
  TimeOfDay,
  WeatherType,
} from './storyCompiler';

export type StoryGenre =
  | 'rural-heritage'
  | 'mystery-thriller'
  | 'historical-epic'
  | 'nature-adventure'
  | 'justice-drama'
  | 'family-emotional'
  | 'celebration-life'
  | 'modern-career'
  | 'education-wisdom'
  | 'urban-journey';

export type DynamicStoryElement =
  | 'birds'
  | 'lantern'
  | 'campfire'
  | 'books'
  | 'flowers'
  | 'fireworks'
  | 'stars'
  | 'crescent-moon'
  | 'boat'
  | 'car-lights'
  | 'deer'
  | 'camel'
  | 'crown'
  | 'scales-justice'
  | 'snow-pines'
  | 'torch'
  | 'heart-glow'
  | 'clock';

export interface StoryGenreProfile {
  genre: StoryGenre;
  labelBn: string;
  companionSettings: SceneSetting[];
  preferredAccents: string[];
  defaultWeather: WeatherType;
}

const GENRE_PROFILES: Record<StoryGenre, StoryGenreProfile> = {
  'rural-heritage': {
    genre: 'rural-heritage',
    labelBn: 'গ্রামীণ ও ঐতিহ্যবাহী গল্প',
    companionSettings: ['village-cottage', 'river-village', 'market-bazaar', 'home-night', 'fajr-mosque', 'forest-wild'],
    preferredAccents: ['#4E9A74', '#D49456', '#C87D55', '#E5A93C'],
    defaultWeather: 'clear',
  },
  'mystery-thriller': {
    genre: 'mystery-thriller',
    labelBn: 'রহস্য ও রোমাঞ্চ',
    companionSettings: ['mystery-night', 'library-study', 'highway-bridge', 'monsoon-rain', 'forest-wild', 'home-night'],
    preferredAccents: ['#7E8CE0', '#5A92C8', '#C98A4B', '#6088AD'],
    defaultWeather: 'mist',
  },
  'historical-epic': {
    genre: 'historical-epic',
    labelBn: 'ইতিহাস ও মহাকাব্য',
    companionSettings: ['ancient-palace', 'battle-camp', 'desert-dunes', 'mountain-summit', 'river-village', 'ocean-voyage'],
    preferredAccents: ['#D69A4B', '#C96846', '#E5A93C', '#76A9C9'],
    defaultWeather: 'embers',
  },
  'nature-adventure': {
    genre: 'nature-adventure',
    labelBn: 'প্রকৃতি ও অভিযান',
    companionSettings: ['forest-wild', 'mountain-summit', 'river-village', 'ocean-voyage', 'snow-valley', 'desert-dunes'],
    preferredAccents: ['#4E9A74', '#4BA3C7', '#76A9C9', '#D98E4E'],
    defaultWeather: 'clear',
  },
  'justice-drama': {
    genre: 'justice-drama',
    labelBn: 'বিচার ও সামাজিক নাটক',
    companionSettings: ['court-justice', 'office-studio', 'city-evening', 'home-night', 'monsoon-rain', 'highway-bridge'],
    preferredAccents: ['#C9974C', '#6088AD', '#5A92C8', '#B88346'],
    defaultWeather: 'clear',
  },
  'family-emotional': {
    genre: 'family-emotional',
    labelBn: 'পারিবারিক ও আবেগময় গল্প',
    companionSettings: ['home-night', 'village-cottage', 'school-street', 'park-nature', 'hospital-care', 'tea-stall'],
    preferredAccents: ['#E5A93C', '#B88346', '#58A173', '#D49456'],
    defaultWeather: 'clear',
  },
  'celebration-life': {
    genre: 'celebration-life',
    labelBn: 'উৎসব ও আনন্দঘন মুহূর্ত',
    companionSettings: ['festival-celebration', 'park-nature', 'market-bazaar', 'home-night', 'river-village', 'stage-spotlight'],
    preferredAccents: ['#E5A93C', '#E06C75', '#52B788', '#D98E4E'],
    defaultWeather: 'fireflies',
  },
  'modern-career': {
    genre: 'modern-career',
    labelBn: 'আধুনিক কর্মজীবন ও প্রযুক্তি',
    companionSettings: ['office-studio', 'tech-ai-lab', 'finance-growth', 'highway-bridge', 'stage-spotlight', 'city-evening'],
    preferredAccents: ['#50C8B8', '#5A92C8', '#E5A93C', '#6EA8FE'],
    defaultWeather: 'clear',
  },
  'education-wisdom': {
    genre: 'education-wisdom',
    labelBn: 'শিক্ষা, জ্ঞান ও অনুপ্রেরণা',
    companionSettings: ['classroom', 'library-study', 'school-street', 'park-nature', 'stage-spotlight', 'home-night'],
    preferredAccents: ['#5B7C99', '#E5A93C', '#58A173', '#C87D55'],
    defaultWeather: 'clear',
  },
  'urban-journey': {
    genre: 'urban-journey',
    labelBn: 'শহুরে জীবন ও যাত্রা',
    companionSettings: ['highway-bridge', 'city-evening', 'train-journey', 'tea-stall', 'market-bazaar', 'park-nature'],
    preferredAccents: ['#D98E4E', '#E5A93C', '#C87D55', '#5A92C8'],
    defaultWeather: 'clear',
  },
};

const GENRE_KEYWORDS: Record<StoryGenre, string[]> = {
  'rural-heritage': [
    'গ্রাম', 'গ্রামের', 'নদী', 'নৌকা', 'মাঝি', 'কৃষক', 'ধান', 'কুঁড়েঘর', 'কুঁড়েঘর', 'উঠান', 'বটগাছ', 'পল্লী', 'ফসল', 'খামার',
    'village', 'rural', 'river', 'boat', 'farmer', 'cottage', 'paddy', 'harvest', 'countryside',
  ],
  'mystery-thriller': [
    'রহস্য', 'ভৌতিক', 'ভূত', 'অন্ধকার', 'নির্জন', 'পরিত্যক্ত', 'কবরস্থান', 'রহস্যময়', 'রহস্যময়', 'গুপ্তধন', 'গোয়েন্দা', 'গোয়েন্দা', 'সন্দেহ', 'ছায়া', 'ছায়া', 'ভয়', 'ভয়',
    'mystery', 'haunted', 'ghost', 'detective', 'clue', 'secret', 'shadow', 'midnight', 'abandoned', 'thriller',
  ],
  'historical-epic': [
    'রাজা', 'রানী', 'রাজপ্রাসাদ', 'সম্রাট', 'সাম্রাজ্য', 'সুলতান', 'দুর্গ', 'যুদ্ধ', 'যুদ্ধক্ষেত্র', 'সৈন্য', 'মুক্তিযুদ্ধ', 'তলোয়ার', 'তলোয়ার', 'ইতিহাস', 'প্রাচীন', 'সিংহাসন', 'মরুভূমি',
    'king', 'queen', 'palace', 'emperor', 'empire', 'sultan', 'kingdom', 'warrior', 'battle', 'war', 'history', 'ancient', 'throne', 'castle',
  ],
  'nature-adventure': [
    'জঙ্গল', 'অরণ্য', 'বন', 'পাহাড়', 'পাহাড়', 'পর্বত', 'সমুদ্র', 'সাগর', 'জাহাজ', 'হরিণ', 'বাঘ', 'অভিযান', 'তুষার', 'বরফ', 'মরুভূমি', 'উট', 'দ্বীপ', 'প্রকৃতি',
    'forest', 'jungle', 'mountain', 'ocean', 'adventure', 'expedition', 'wilderness', 'desert', 'snow', 'winter', 'island', 'summit',
  ],
  'justice-drama': [
    'আদালত', 'বিচার', 'বিচারক', 'আইন', 'থানা', 'পুলিশ', 'জেল', 'কারাগার', 'মামলা', 'সাক্ষী', 'উকিল', 'অপরাধ', 'সত্য', 'ন্যায়', 'ন্যায়',
    'court', 'judge', 'justice', 'law', 'lawyer', 'police', 'prison', 'trial', 'crime', 'verdict',
  ],
  'family-emotional': [
    'বাবা', 'মা', 'মায়ের', 'মায়ের', 'ছেলে', 'মেয়ে', 'মেয়ে', 'পরিবার', 'ভালোবাসা', 'কান্না', 'চোখের জল', 'হাসপাতাল', 'সংসার', 'সন্তান', 'আব্বু', 'আম্মু',
    'father', 'mother', 'family', 'son', 'daughter', 'parent', 'tears', 'sacrifice', 'love', 'home',
  ],
  'celebration-life': [
    'বিয়ে', 'বিয়ে', 'উৎসব', 'ঈদ', 'বৈশাখ', 'পূজা', 'মেলা', 'অনুষ্ঠান', 'জন্মদিন', 'আনন্দ', 'আতশবাজি', 'আলোকসজ্জা', 'উপহার',
    'wedding', 'festival', 'celebration', 'party', 'fireworks', 'eid', 'birthday', 'carnival', 'joy',
  ],
  'modern-career': [
    'অফিস', 'ল্যাপটপ', 'কোডিং', 'এআই', 'কৃত্রিম বুদ্ধিমত্তা', 'রোবট', 'প্রযুক্তি', 'স্টার্টআপ', 'বিনিয়োগ', 'বিনিয়োগ', 'ব্যবসা', 'চাকরি', 'উদ্যোক্তা', 'মহাকাশ', 'রকেট',
    'office', 'startup', 'business', 'finance', 'coding', 'ai', 'robot', 'technology', 'career', 'space', 'rocket', 'entrepreneur',
  ],
  'education-wisdom': [
    'স্কুল', 'কলেজ', 'বিশ্ববিদ্যালয়', 'বিশ্ববিদ্যালয়', 'শিক্ষক', 'ক্লাসরুম', 'পরীক্ষা', 'বই', 'লাইব্রেরি', 'গ্রন্থাগার', 'গবেষণা', 'জ্ঞান', 'পড়াশোনা', 'পড়াশোনা', 'শিক্ষা',
    'school', 'college', 'university', 'teacher', 'classroom', 'exam', 'library', 'study', 'book', 'knowledge', 'student',
  ],
  'urban-journey': [
    'শহর', 'রাস্তা', 'ট্রেন', 'রেলস্টেশন', 'বাস', 'গাড়ি', 'গাড়ি', 'ব্রিজ', 'সেতু', 'হাইওয়ে', 'হাইওয়ে', 'বাজার', 'চায়ের দোকান', 'চায়ের দোকান', 'যাত্রা', 'ভ্রমণ',
    'city', 'street', 'train', 'bus', 'car', 'bridge', 'highway', 'journey', 'travel', 'market', 'cafe',
  ],
};

/**
 * Deterministic 32-bit FNV-1a hash so every unique story gets its own reproducible visual seed.
 */
export function computeStorySeed(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Classifies the overall story genre from the complete narrative text before any scenes are cut.
 */
export function classifyStoryGenre(fullText: string): StoryGenreProfile {
  const lower = fullText.toLowerCase();
  let bestGenre: StoryGenre = 'family-emotional';
  let bestScore = -1;

  for (const genre of Object.keys(GENRE_KEYWORDS) as StoryGenre[]) {
    const terms = GENRE_KEYWORDS[genre];
    let score = 0;
    for (const term of terms) {
      if (lower.includes(term)) {
        score += term.length >= 4 ? 2 : 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestGenre = genre;
    }
  }

  if (bestScore <= 0) {
    // Deterministic genre fallback keyed to story text hash so even abstract stories don't all look identical
    const fallbackOrder: StoryGenre[] = [
      'rural-heritage',
      'education-wisdom',
      'urban-journey',
      'nature-adventure',
      'family-emotional',
    ];
    const seed = computeStorySeed(lower);
    return GENRE_PROFILES[fallbackOrder[seed % fallbackOrder.length]];
  }

  return GENRE_PROFILES[bestGenre];
}

/**
 * Extracts concrete visual story elements directly from a scene's spoken Bengali/English words
 * so the 2D canvas renderer animates the exact objects mentioned in the narration.
 */
export function extractDynamicStoryElements(text: string, setting: SceneSetting): DynamicStoryElement[] {
  const lower = text.toLowerCase();
  const elements: DynamicStoryElement[] = [];
  const add = (el: DynamicStoryElement) => {
    if (!elements.includes(el)) elements.push(el);
  };

  if (/(পাখি|ডানা|আকাশে উড়ে|আকাশে উড়ে|bird|birds|flock|eagle|crow|sparrow)/.test(lower)) add('birds');
  if (/(হারিকেন|লণ্ঠন|প্রদীপ|আলো|মোমবাতি|lantern|lamp|candle|torchlight)/.test(lower)) add('lantern');
  if (/(আগুন|অগ্নি|চুল্লি|ক্যাম্পফায়ার|ক্যাম্পফায়ার|campfire|bonfire|flame|fire)/.test(lower)) add('campfire');
  if (/(বই|খাতা|চিঠি|ডায়েরি|ডায়েরি|পাণ্ডুলিপি|book|diary|letter|scroll|journal|manuscript)/.test(lower)) add('books');
  if (/(ফুল|গোলাপ|বাগান|পাপড়ি|পাপড়ি|flower|rose|petal|blossom|garden)/.test(lower)) add('flowers');
  if (/(আতশবাজি|উৎসব|বিয়ে|বিয়ে|ঈদ|আলোকসজ্জা|fireworks|festival|wedding|celebration)/.test(lower)) add('fireworks');
  if (/(নক্ষত্র|আকাশভরা|জ্যোৎস্না|রাতের আকাশ|starry|stars|constellation)/.test(lower)) add('stars');
  if (/(চাঁদ|পূর্ণিমা|জ্যোৎস্না|moon|moonlight|full moon|crescent)/.test(lower)) add('crescent-moon');
  if (/(নৌকা|নৌকো|মাঝি|পাল|boat|ferry|canoe|sail)/.test(lower)) add('boat');
  if (/(গাড়ি|গাড়ি|বাস|হাইওয়ে|হাইওয়ে|হেডলাইট|car|bus|traffic|highway|headlight)/.test(lower)) add('car-lights');
  if (/(হরিণ|বন্যপ্রাণী|জঙ্গল|অরণ্য|deer|wildlife|stag)/.test(lower)) add('deer');
  if (/(উট|কাফেলা|মরুভূমি|camel|caravan|dune)/.test(lower)) add('camel');
  if (/(মুকুট|সিংহাসন|রাজা|সম্রাট|crown|throne|royal|king|sultan)/.test(lower)) add('crown');
  if (/(আদালত|বিচার|আইন|ন্যায়|ন্যায়|court|justice|verdict|judge|law)/.test(lower)) add('scales-justice');
  if (/(তুষার|বরফ|শীত|পাইন|snow|winter|pine|blizzard|frozen)/.test(lower)) add('snow-pines');
  if (/(মশাল|দুর্গ|রণাঙ্গন|যুদ্ধ|torch|battle|fortress|warrior)/.test(lower)) add('torch');
  if (/(ভালোবাসা|হৃদয়|হৃদয়|মায়া|মায়া|মমতা|heart|love|affection|warmth)/.test(lower)) add('heart-glow');
  if (/(সময়|সময়|ঘড়ি|ঘড়ি|বছর|অপেক্ষা|clock|time|years|waiting|hour)/.test(lower)) add('clock');

  // Ensure setting-native visual accents when no explicit noun appeared
  if (elements.length === 0) {
    if (setting === 'forest-wild') add('birds');
    else if (setting === 'desert-dunes') add('camel');
    else if (setting === 'court-justice') add('scales-justice');
    else if (setting === 'festival-celebration') add('fireworks');
    else if (setting === 'mystery-night') add('lantern');
    else if (setting === 'library-study') add('books');
    else if (setting === 'highway-bridge') add('car-lights');
    else if (setting === 'village-cottage') add('lantern');
    else if (setting === 'snow-valley') add('snow-pines');
    else if (setting === 'battle-camp') add('torch');
  }

  return elements.slice(0, 4);
}

export interface CueSignalSummary {
  cue: SubtitleCue;
  explicitSetting: SceneSetting | null;
  explicitTime: TimeOfDay | null;
  emotion: EmotionTone;
  primaryCharacter: CharacterRole;
}

/**
 * Dynamic Story-Driven Beat Segmentation:
 * Replaces the rigid `Math.min(24, ...)` cap with natural semantic scene cutting based on:
 *  - Location / world shifts
 *  - Time-of-day shifts
 *  - Emotional or character pivots
 *  - Natural duration scaling (up to 60 distinct scenes for long stories, 3-6 for short stories)
 */
export function segmentStoryIntoBeats(
  cueSignals: CueSignalSummary[],
  duration: number
): SubtitleCue[][] {
  if (cueSignals.length === 0) return [];
  if (cueSignals.length === 1) return [[cueSignals[0].cue]];

  // Scale naturally with story duration & cue density — NEVER hardcoded to 24!
  const maxScenes = Math.min(60, cueSignals.length);
  // Natural cinematic beat duration adapts gently by total story length:
  // short (<60s): ~6-9s/beat | medium (1-4m): ~9-13s/beat | long (4m+): ~11-16s/beat
  const minBeatDur = duration < 60 ? 3.0 : duration < 180 ? 4.5 : 5.5;
  const softBeatDur = duration < 60 ? 7.5 : duration < 180 ? 10.5 : duration < 420 ? 12.5 : 15.0;
  const hardBeatDur = duration < 60 ? 11.0 : duration < 180 ? 15.5 : 19.0;

  const groups: SubtitleCue[][] = [];
  let currentGroup: SubtitleCue[] = [cueSignals[0].cue];
  let groupSetting: SceneSetting | null = cueSignals[0].explicitSetting;
  let groupTime: TimeOfDay | null = cueSignals[0].explicitTime;
  let groupEmotion: EmotionTone = cueSignals[0].emotion;
  let groupCharacter: CharacterRole = cueSignals[0].primaryCharacter;

  for (let i = 1; i < cueSignals.length; i++) {
    const sig = cueSignals[i];
    const cue = sig.cue;
    const elapsedInGroup = cue.startTime - currentGroup[0].startTime;
    const groupDur = cue.endTime - currentGroup[0].startTime;

    const settingShifted =
      sig.explicitSetting !== null &&
      groupSetting !== null &&
      sig.explicitSetting !== groupSetting &&
      elapsedInGroup >= 2.6;

    const timeShifted =
      sig.explicitTime !== null &&
      groupTime !== null &&
      sig.explicitTime !== groupTime &&
      elapsedInGroup >= minBeatDur;

    const dramaticShift =
      elapsedInGroup >= minBeatDur + 1.2 &&
      ((sig.emotion !== groupEmotion && sig.emotion !== 'calm') ||
        (sig.primaryCharacter !== groupCharacter && sig.primaryCharacter !== 'narrator')) &&
      groupDur >= softBeatDur * 0.72;

    const naturalSentenceBreak =
      elapsedInGroup >= minBeatDur &&
      groupDur >= softBeatDur &&
      /[।.!?]["'”’]?$/.test(currentGroup[currentGroup.length - 1].text.trim());

    const hitHardCap = elapsedInGroup >= minBeatDur && groupDur >= hardBeatDur;

    const canCutMore = groups.length < maxScenes - 1;

    if (canCutMore && (settingShifted || timeShifted || dramaticShift || naturalSentenceBreak || hitHardCap)) {
      groups.push(currentGroup);
      currentGroup = [cue];
      groupSetting = sig.explicitSetting;
      groupTime = sig.explicitTime;
      groupEmotion = sig.emotion;
      groupCharacter = sig.primaryCharacter;
    } else {
      currentGroup.push(cue);
      if (sig.explicitSetting !== null && groupSetting === null) groupSetting = sig.explicitSetting;
      if (sig.explicitTime !== null && groupTime === null) groupTime = sig.explicitTime;
    }
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

export interface DirectedBeatVisuals {
  setting: SceneSetting;
  timeOfDay: TimeOfDay;
  action: SceneAction;
  cameraShot: CameraShot;
  cameraMotion: CameraMotion;
  focalPointX: number;
  visualSeed: number;
  sceneElements: DynamicStoryElement[];
  accentColor: string;
}

const CAMERA_SHOT_CYCLE: CameraShot[] = [
  'wide-establishing',
  'medium-two-shot',
  'close-up-portrait',
  'tracking-pan',
];

const CAMERA_MOTION_CYCLE: CameraMotion[] = [
  'dolly-in',
  'pan-right',
  'tracking',
  'tilt-up',
  'dolly-out',
  'pan-left',
];

const FOCAL_X_CYCLE = [0.5, 0.43, 0.57, 0.46, 0.54, 0.5];

/**
 * Prevents repetitive "same standing animation for 24 scenes" by evolving camera shot,
 * camera motion, framing focal point, character blocking, and companion locations
 * coherently along the story's own genre & narrative arc.
 */
export function directBeatProgression(params: {
  sceneIndex: number;
  totalScenes: number;
  storySeed: number;
  genreProfile: StoryGenreProfile;
  spokenText: string;
  hasExplicitSetting: boolean;
  baseSetting: SceneSetting;
  baseTimeOfDay: TimeOfDay;
  baseAction: SceneAction;
  baseCameraShot: CameraShot;
  baseCameraMotion: CameraMotion;
  baseAccentColor: string;
  emotion: EmotionTone;
  hasSecondaryCharacter: boolean;
  previousScenes: Array<{
    setting: SceneSetting;
    action: SceneAction;
    cameraShot: CameraShot;
    cameraMotion: CameraMotion;
    timeOfDay: TimeOfDay;
  }>;
}): DirectedBeatVisuals {
  const {
    sceneIndex,
    totalScenes,
    storySeed,
    genreProfile,
    spokenText,
    hasExplicitSetting,
    baseSetting,
    baseTimeOfDay,
    baseAction,
    baseCameraShot,
    baseCameraMotion,
    baseAccentColor,
    emotion,
    hasSecondaryCharacter,
    previousScenes,
  } = params;

  const prev = previousScenes[previousScenes.length - 1];
  const prev2 = previousScenes[previousScenes.length - 2];

  // 1. Evolve setting coherently when a beat has NO explicit location keyword
  // and the previous setting has already stayed on screen for 2 beats (breaks the 24-scene lock!)
  let setting: SceneSetting = baseSetting;
  if (!hasExplicitSetting && baseSetting !== 'quote-epilogue') {
    const sameSettingStreak =
      prev && prev.setting === baseSetting && prev2 && prev2.setting === baseSetting;
    const companionPool = genreProfile.companionSettings;

    if (sameSettingStreak && companionPool.length > 1) {
      // Pick the next story-coherent companion location from this story's own genre world!
      const startOffset = (storySeed + sceneIndex) % companionPool.length;
      for (let k = 0; k < companionPool.length; k++) {
        const candidate = companionPool[(startOffset + k) % companionPool.length];
        if (candidate !== prev.setting) {
          setting = candidate;
          break;
        }
      }
    } else if (!prev && baseSetting === 'city-evening' && companionPool.length > 0) {
      // Opening scene with no explicit keyword uses the story's true genre world instead of always gray city road!
      setting = companionPool[storySeed % companionPool.length];
    }
  }

  // 2. Natural time-of-day arc progression across the story if time is stuck
  let timeOfDay: TimeOfDay = baseTimeOfDay;
  if (!hasExplicitSetting && prev && prev2 && prev.timeOfDay === timeOfDay && prev2.timeOfDay === timeOfDay) {
    const arcPct = totalScenes > 1 ? sceneIndex / (totalScenes - 1) : 0.5;
    if (setting === 'mystery-night' || setting === 'space-cosmos' || setting === 'festival-celebration') {
      timeOfDay = 'night';
    } else if (arcPct < 0.25) {
      timeOfDay = 'morning';
    } else if (arcPct < 0.55) {
      timeOfDay = 'afternoon';
    } else if (arcPct < 0.85) {
      timeOfDay = 'sunset';
    } else {
      timeOfDay = emotion === 'inspiring' ? 'sunset' : 'night';
    }
  }

  // 3. Vary character action/blocking so characters don't freeze in the exact same pose for consecutive scenes
  let action: SceneAction = baseAction;
  if (
    prev &&
    prev.action === action &&
    action !== 'quote-card' &&
    action !== 'rickshaw-ride' &&
    action !== 'boat-glide'
  ) {
    const alternateActions: SceneAction[] = hasSecondaryCharacter
      ? ['conversation', 'family-together', 'walking-away', 'speaking-narrator']
      : emotion === 'inspiring' || emotion === 'happy'
        ? ['celebrating-proud', 'walking-away', 'speaking-narrator', 'praying-reflecting']
        : emotion === 'sad' || emotion === 'worried' || emotion === 'emotional'
          ? ['praying-reflecting', 'walking-away', 'speaking-narrator']
          : ['walking-away', 'speaking-narrator', 'praying-reflecting', 'celebrating-proud'];

    const pick = alternateActions[(sceneIndex + (storySeed % 5)) % alternateActions.length];
    if (pick !== prev.action) {
      action = pick;
    } else if (alternateActions.length > 1) {
      action = alternateActions[(sceneIndex + 1 + (storySeed % 5)) % alternateActions.length];
    }
  }

  // 4. Vary camera shot & motion on every beat for cinematic storytelling rhythm
  let cameraShot: CameraShot = baseCameraShot;
  if (sceneIndex === 0 && !hasExplicitSetting) {
    cameraShot = 'wide-establishing';
  } else if (prev && prev.cameraShot === cameraShot) {
    cameraShot = CAMERA_SHOT_CYCLE[(sceneIndex + (storySeed % 4)) % CAMERA_SHOT_CYCLE.length];
    if (cameraShot === prev.cameraShot) {
      cameraShot = CAMERA_SHOT_CYCLE[(CAMERA_SHOT_CYCLE.indexOf(cameraShot) + 1) % CAMERA_SHOT_CYCLE.length];
    }
  }

  let cameraMotion: CameraMotion = baseCameraMotion;
  if (prev && prev.cameraMotion === cameraMotion) {
    cameraMotion = CAMERA_MOTION_CYCLE[(sceneIndex + (storySeed % 6)) % CAMERA_MOTION_CYCLE.length];
    if (cameraMotion === prev.cameraMotion) {
      cameraMotion =
        CAMERA_MOTION_CYCLE[(CAMERA_MOTION_CYCLE.indexOf(cameraMotion) + 1) % CAMERA_MOTION_CYCLE.length];
    }
  }

  // 5. Subtle 9:16-safe focal point variation (0.43..0.57 stays comfortably inside portrait safe-zone!)
  const focalPointX = FOCAL_X_CYCLE[(sceneIndex + (storySeed % FOCAL_X_CYCLE.length)) % FOCAL_X_CYCLE.length];
  const visualSeed = computeStorySeed(`${storySeed}:${sceneIndex}:${setting}:${spokenText.slice(0, 48)}`);
  const sceneElements = extractDynamicStoryElements(spokenText, setting);
  const accentColor =
    baseAccentColor ||
    genreProfile.preferredAccents[(sceneIndex + storySeed) % genreProfile.preferredAccents.length];

  return {
    setting,
    timeOfDay,
    action,
    cameraShot,
    cameraMotion,
    focalPointX,
    visualSeed,
    sceneElements,
    accentColor,
  };
}
