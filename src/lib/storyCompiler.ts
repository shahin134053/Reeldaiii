import { SubtitleCue, parseSrt } from './srtParser';
import { SpeechPace, synthesizeEnvelopeFromCues } from './audioAnalyzer';
import { PhoneticAudioFrame } from './visemeEngine';
import {
  AUDIO_SRC,
  ENGLISH_SUBTITLES,
  FILM_DURATION,
  STORY_SCENES,
  SceneId,
} from './storyboard';
import {
  CharacterProfile,
  QualityAuditReport,
  StoryIntelligenceProfile,
  analyzeAudioSrtSync,
  auditProjectQuality,
  buildCharacterRegistry,
  formatCharacterBibleFromProfiles,
} from './storyIntelligence';
import type {
  BgmConfig,
  BrandingConfig,
  DesignConfig,
  SubtitleConfig,
} from './redesignAndStudio';
import {
  DynamicStoryElement,
  StoryGenre,
  classifyStoryGenre,
  computeStorySeed,
  directBeatProgression,
  segmentStoryIntoBeats,
} from './storySceneDirector';

export type { DynamicStoryElement, StoryGenre } from './storySceneDirector';

export type {
  CharacterProfile,
  QualityAuditReport,
  StoryIntelligenceProfile,
} from './storyIntelligence';

export type AspectRatio = '16:9' | '9:16';

export type SceneSetting =
  | 'school-street'
  | 'fajr-mosque'
  | 'tea-stall'
  | 'classroom'
  | 'home-night'
  | 'monsoon-rain'
  | 'river-village'
  | 'city-evening'
  | 'office-studio'
  | 'park-nature'
  | 'market-bazaar'
  | 'hospital-care'
  | 'space-cosmos'
  | 'ocean-voyage'
  | 'mountain-summit'
  | 'train-journey'
  | 'tech-ai-lab'
  | 'finance-growth'
  | 'sports-arena'
  | 'ancient-palace'
  | 'stage-spotlight'
  | 'forest-wild'
  | 'desert-dunes'
  | 'court-justice'
  | 'festival-celebration'
  | 'mystery-night'
  | 'library-study'
  | 'highway-bridge'
  | 'village-cottage'
  | 'snow-valley'
  | 'battle-camp'
  | 'quote-epilogue';

export type VisualStyle =
  | 'storybook-warm'
  | 'cinematic-anime'
  | 'editorial-doc'
  | 'dramatic-noir';

export type CameraMotion =
  | 'dolly-in'
  | 'dolly-out'
  | 'pan-left'
  | 'pan-right'
  | 'tilt-up'
  | 'tracking';

export type StoryMotif =
  | 'none'
  | 'rocket-launch'
  | 'sailing-ship'
  | 'growth-chart'
  | 'clock-time'
  | 'glowing-heart'
  | 'floating-books'
  | 'digital-network'
  | 'spotlight-mic'
  | 'stadium-ball'
  | 'mountain-peak'
  | 'train-express'
  | 'royal-arch'
  | 'dream-orbs';

export type TimeOfDay = 'dawn' | 'morning' | 'afternoon' | 'storm' | 'sunset' | 'night';

export type WeatherType = 'clear' | 'mist' | 'rain' | 'heavy-storm' | 'fireflies' | 'snow' | 'embers' | 'stars';

export type SceneAction =
  | 'rickshaw-ride'
  | 'walking-away'
  | 'conversation'
  | 'studying'
  | 'home-meal'
  | 'running-rain'
  | 'boat-glide'
  | 'speaking-narrator'
  | 'working-desk'
  | 'family-together'
  | 'praying-reflecting'
  | 'celebrating-proud'
  | 'quote-card';

export type EmotionTone =
  | 'calm'
  | 'happy'
  | 'sad'
  | 'determined'
  | 'worried'
  | 'emotional'
  | 'inspiring'
  | 'angry';

export type CameraShot =
  | 'wide-establishing'
  | 'medium-two-shot'
  | 'close-up-portrait'
  | 'tracking-pan';

export type CharacterRole =
  | 'father'
  | 'mother'
  | 'youth-boy'
  | 'youth-girl'
  | 'elder'
  | 'teacher'
  | 'professional'
  | 'doctor'
  | 'narrator'
  | 'friend';

export type StoryProp =
  | 'none'
  | 'book'
  | 'laptop'
  | 'phone'
  | 'money'
  | 'tea'
  | 'umbrella'
  | 'backpack'
  | 'lantern';

export type SceneTransitionName =
  | 'cross-dissolve'
  | 'light-leak'
  | 'iris-glow'
  | 'directional-wipe';

export interface SceneSpec {
  id: string;
  chapterNumber: string;
  titleBn: string;
  titleEn: string;
  summary: string;
  /** Exact spoken SRT/script lines aligned to this visual beat */
  spokenExcerpt?: string;
  /** Concise explanation of how this visual directly depicts the spoken lines */
  visualMatchReason?: string;
  /** Detailed visual storytelling plan aligned to the voiceover */
  visualStorytelling?: string;
  characterIds?: string[];
  characterActions?: string;
  facialExpression?: string;
  bodyLanguage?: string;
  environmentDetails?: string;
  importantProps?: string[];
  lightingColor?: string;
  transitionToNext?: SceneTransitionName;
  startTime: number;
  endTime: number;
  setting: SceneSetting;
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  action: SceneAction;
  accentColor: string;
  emotion?: EmotionTone;
  cameraShot?: CameraShot;
  cameraMotion?: CameraMotion;
  motif?: StoryMotif;
  focalPointX?: number;
  primaryCharacter?: CharacterRole;
  secondaryCharacter?: CharacterRole | null;
  prop?: StoryProp;
  matchedSignals?: string[];
  headlineText?: string;
  /** Deterministic per-scene seed derived from story + spoken lines for unique visual variation */
  visualSeed?: number;
  /** Story-specific animated props & elements extracted directly from the scene's spoken words */
  sceneElements?: DynamicStoryElement[];
  /** Overall story genre context guiding lighting & companion worlds */
  storyGenre?: StoryGenre;
  /** Visual direction prompt (editable in Scene Director to regenerate custom AI artwork) */
  visualPrompt?: string;
  /** Optional bespoke multi-layered 1280x720 SVG illustration from Gemini AI Director */
  customSvg?: string;
  /** Optional link to a bespoke hand-directed scene (used by built-in showcase project) */
  presetSceneId?: SceneId;
}

export interface StoryAnalysisSummary {
  totalWords: number;
  cueCount: number;
  sceneCount: number;
  storyGenre?: StoryGenre;
  detectedCharacters: CharacterRole[];
  dominantEmotions: EmotionTone[];
  primarySettings: SceneSetting[];
  speechPace: SpeechPace;
  audioSyncMode: 'decoded-audio' | 'cue-cadence';
  narrativeHighlights: string[];
}

export interface AnimationProject {
  id: string;
  title: string;
  subtitle: string;
  audioUrl: string | null;
  audioFileName: string | null;
  audioEnvelope?: number[];
  audioEnvelopeHz?: number;
  phoneticFrames?: PhoneticAudioFrame[];
  phoneticHz?: number;
  analysis?: StoryAnalysisSummary;
  visualStyle?: VisualStyle;
  characterBible?: string;
  characterProfiles?: CharacterProfile[];
  storyIntelligence?: StoryIntelligenceProfile;
  qualityAudit?: QualityAuditReport;
  directorEngine?: 'gemini-ai' | 'local-engine';
  designConfig?: DesignConfig;
  subtitleConfig?: SubtitleConfig;
  brandingConfig?: BrandingConfig;
  bgmConfig?: BgmConfig;
  referenceMedia?: import('./referenceMediaAnalyzer').ReferenceMediaProfile | null;
  srtOffsetSeconds?: number;
  scriptPreviewMode?: boolean;
  duration: number;
  cues: SubtitleCue[];
  englishTranslations: Record<number, string>;
  scenes: SceneSpec[];
  isDemo: boolean;
}

export const SETTING_LABELS: Record<SceneSetting, string> = {
  'school-street': 'School Road & Gate',
  'fajr-mosque': 'Fajr Dawn & Mosque',
  'tea-stall': 'Roadside Tea Stall',
  classroom: 'Classroom & Chalkboard',
  'home-night': 'Warm Home Interior',
  'monsoon-rain': 'Monsoon Courtyard',
  'river-village': 'River & Green Village',
  'city-evening': 'Evening Town Road',
  'office-studio': 'Modern Office & Studio',
  'park-nature': 'Green Park & Trees',
  'market-bazaar': 'Vibrant Town Bazaar',
  'hospital-care': 'Care & Clinic Room',
  'space-cosmos': 'Deep Space & Cosmos',
  'ocean-voyage': 'Open Ocean & Sailing Ship',
  'mountain-summit': 'Misty Mountain Summit',
  'train-journey': 'Express Train Journey',
  'tech-ai-lab': 'Futuristic AI & Tech Lab',
  'finance-growth': 'Business & Wealth Studio',
  'sports-arena': 'Floodlit Sports Stadium',
  'ancient-palace': 'Heritage Palace & Arches',
  'stage-spotlight': 'Keynote Stage & Spotlight',
  'forest-wild': 'Deep Forest & Wildlife Trail',
  'desert-dunes': 'Golden Desert & Caravan',
  'court-justice': 'Courtroom & Hall of Justice',
  'festival-celebration': 'Festival Lights & Celebration',
  'mystery-night': 'Misty Moonlit Mystery Alley',
  'library-study': 'Grand Library & Reading Desk',
  'highway-bridge': 'Suspension Bridge & Highway',
  'village-cottage': 'Village Courtyard & Cottage',
  'snow-valley': 'Winter Snow Valley & Cabin',
  'battle-camp': 'Historic Battlefield & Banners',
  'quote-epilogue': 'Sunset Moral / Quote Card',
};

export const VISUAL_STYLE_LABELS: Record<VisualStyle, { label: string; desc: string }> = {
  'storybook-warm': {
    label: 'Warm Storybook 2D',
    desc: 'Golden lighting, painterly hand-crafted cinema warmth',
  },
  'cinematic-anime': {
    label: 'Cinematic Anime',
    desc: 'Crisp anime skies, dramatic rim light & deep clouds',
  },
  'editorial-doc': {
    label: 'Editorial Documentary',
    desc: 'Clean visual storytelling for explainers & essays',
  },
  'dramatic-noir': {
    label: 'Dramatic Night Cinema',
    desc: 'High-contrast moody amber & deep twilight shadows',
  },
};

export const MOTIF_LABELS: Record<StoryMotif, string> = {
  none: 'Natural Scene Only',
  'rocket-launch': 'Launching Rocket & Stars',
  'sailing-ship': 'Sailing Ship & Waves',
  'growth-chart': 'Rising Wealth & Growth Curve',
  'clock-time': 'Cinematic Time & Clockwork',
  'glowing-heart': 'Warm Heart & Emotional Glow',
  'floating-books': 'Knowledge & Glowing Books',
  'digital-network': 'AI Neural Network & Code',
  'spotlight-mic': 'Stage Spotlight & Soundwaves',
  'stadium-ball': 'Stadium Match Action',
  'mountain-peak': 'Summit Flag & Horizon',
  'train-express': 'Moving Express Train',
  'royal-arch': 'Heritage Torchlight Arches',
  'dream-orbs': 'Floating Dream Orbs',
};

export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  dawn: 'Dawn (Fajr)',
  morning: 'Golden Morning',
  afternoon: 'Warm Afternoon',
  storm: 'Stormy Overcast',
  sunset: 'Crimson Sunset',
  night: 'Lantern Night',
};

export const WEATHER_LABELS: Record<WeatherType, string> = {
  clear: 'Clear Sky',
  mist: 'Morning Mist',
  rain: 'Light Rain',
  'heavy-storm': 'Heavy Monsoon Storm',
  fireflies: 'Evening Fireflies',
  snow: 'Falling Snow',
  embers: 'Warm Rising Embers',
  stars: 'Deep Starfield',
};

export const ACTION_LABELS: Record<SceneAction, string> = {
  'speaking-narrator': 'Expressive Human Speaking (Lip-Sync)',
  'walking-away': 'Human Walking Journey',
  conversation: 'Two Humans Talking',
  'working-desk': 'Working / Studying at Desk',
  'family-together': 'Family Care & Togetherness',
  'praying-reflecting': 'Quiet Reflection & Prayer',
  'celebrating-proud': 'Joy & Proud Achievement',
  'rickshaw-ride': 'Rickshaw Gliding',
  studying: 'Classroom & Study',
  'home-meal': 'Family Supper Table',
  'running-rain': 'Running in Monsoon',
  'boat-glide': 'Boat on River',
  'quote-card': 'Calligraphic Quote Card',
};

export const EMOTION_LABELS: Record<EmotionTone, string> = {
  calm: 'Calm & Thoughtful',
  happy: 'Warm & Joyful',
  sad: 'Emotional & Sad',
  determined: 'Focused & Determined',
  worried: 'Tense & Worried',
  emotional: 'Deeply Moved',
  inspiring: 'Inspiring & Proud',
  angry: 'Intense & Frustrated',
};

export const CHARACTER_LABELS: Record<CharacterRole, string> = {
  father: 'Father (Middle-Aged Man)',
  mother: 'Mother (Warm Saree)',
  'youth-boy': 'Young Man / Student',
  'youth-girl': 'Young Woman / Student',
  elder: 'Wise Elder',
  teacher: 'Teacher / Mentor',
  professional: 'Creator / Professional',
  doctor: 'Doctor / Caregiver',
  narrator: 'Storyteller / Host',
  friend: 'Close Friend',
};

export const CAMERA_SHOT_LABELS: Record<CameraShot, string> = {
  'wide-establishing': 'Wide Establishing Shot',
  'medium-two-shot': 'Medium Character Shot',
  'close-up-portrait': 'Close-Up Expressive Portrait',
  'tracking-pan': 'Cinematic Tracking Pan',
};

/**
 * Creates the built-in showcase project ("বাবার রিকশা") so open-source users
 * can also preview a complete animated production out of the box.
 */
export function createDemoProject(cues: SubtitleCue[]): AnimationProject {
  const presetMapping: Record<
    SceneId,
    Pick<
      SceneSpec,
      'setting' | 'timeOfDay' | 'weather' | 'action' | 'emotion' | 'cameraShot' | 'primaryCharacter' | 'secondaryCharacter'
    >
  > = {
    'morning-dropoff': {
      setting: 'school-street',
      timeOfDay: 'morning',
      weather: 'clear',
      action: 'walking-away',
      emotion: 'worried',
      cameraShot: 'wide-establishing',
      primaryCharacter: 'youth-boy',
      secondaryCharacter: 'father',
    },
    'fajr-gamchha': {
      setting: 'fajr-mosque',
      timeOfDay: 'dawn',
      weather: 'mist',
      action: 'rickshaw-ride',
      emotion: 'calm',
      cameraShot: 'tracking-pan',
      primaryCharacter: 'father',
      secondaryCharacter: 'youth-boy',
    },
    'teastall-hurt': {
      setting: 'tea-stall',
      timeOfDay: 'afternoon',
      weather: 'clear',
      action: 'conversation',
      emotion: 'sad',
      cameraShot: 'medium-two-shot',
      primaryCharacter: 'youth-boy',
      secondaryCharacter: 'friend',
    },
    'exam-dinner': {
      setting: 'home-night',
      timeOfDay: 'night',
      weather: 'clear',
      action: 'home-meal',
      emotion: 'emotional',
      cameraShot: 'medium-two-shot',
      primaryCharacter: 'father',
      secondaryCharacter: 'youth-boy',
    },
    'storm-window': {
      setting: 'classroom',
      timeOfDay: 'storm',
      weather: 'rain',
      action: 'studying',
      emotion: 'worried',
      cameraShot: 'medium-two-shot',
      primaryCharacter: 'teacher',
      secondaryCharacter: 'youth-boy',
    },
    'rain-arrival': {
      setting: 'monsoon-rain',
      timeOfDay: 'storm',
      weather: 'heavy-storm',
      action: 'running-rain',
      emotion: 'emotional',
      cameraShot: 'tracking-pan',
      primaryCharacter: 'father',
      secondaryCharacter: 'youth-boy',
    },
    'mirror-ride': {
      setting: 'city-evening',
      timeOfDay: 'afternoon',
      weather: 'clear',
      action: 'rickshaw-ride',
      emotion: 'happy',
      cameraShot: 'close-up-portrait',
      primaryCharacter: 'father',
      secondaryCharacter: 'youth-boy',
    },
    'sunset-epilogue': {
      setting: 'quote-epilogue',
      timeOfDay: 'sunset',
      weather: 'fireflies',
      action: 'quote-card',
      emotion: 'inspiring',
      cameraShot: 'wide-establishing',
      primaryCharacter: 'father',
      secondaryCharacter: 'youth-boy',
    },
  };

  const synth = synthesizeEnvelopeFromCues(cues, FILM_DURATION);
  const demoProfiles = buildCharacterRegistry(['father', 'youth-boy', 'friend', 'teacher']);
  const demoIntelligence: StoryIntelligenceProfile = {
    theme: 'পিতার নিঃস্বার্থ ত্যাগ, সন্তানের আত্মোপলব্ধি ও পরিবারের মর্যাদা',
    moralOrMessage: 'সৎ পরিশ্রমের ঘাম কখনো লজ্জার নয় — সেটাই সন্তানের সবচেয়ে বড় গর্ব।',
    beginningArc: 'ভোরের ফজর থেকে স্কুলের গেটে বাবার রিকশা লুকিয়ে সন্তানের সংকোচ',
    middleArc: 'চায়ের দোকানের অপমান ও পরীক্ষার ফি জোগাড়ে বাবার রাতভর পরিশ্রম',
    endingArc: 'ঝড়ের দিনে বাবার ভালোবাসায় সন্তানের অশ্রুসজল উপলব্ধি ও গর্বিত রিকশা যাত্রা',
    historicalCulturalContext: 'আধুনিক বাংলাদেশের মফস্বল ও শহরের মধ্যবিত্ত-শ্রমজীবী পারিবারিক আবহ',
    emotionalArc: ['worried', 'calm', 'sad', 'emotional', 'inspiring'],
    locations: ['স্কুল গেট', 'ভোরের মসজিদ রোড', 'চায়ের দোকান', 'রাতের ঘর', 'ক্লাসরুম'],
    importantObjects: ['রিকশা', 'লাল গামছা', 'পলিথিন প্যাকেট', 'স্কুল ব্যাগ', 'বই'],
    audioSrtSync: analyzeAudioSrtSync({
      hasAudio: true,
      audioDuration: FILM_DURATION,
      cues,
      hasSrt: cues.length > 0,
      hasScript: false,
    }),
  };

  const demoScenes: SceneSpec[] = STORY_SCENES.map((s) => ({
    id: s.id,
    chapterNumber: s.chapterNumber,
    titleBn: s.titleBn,
    titleEn: s.titleEn,
    summary: s.summaryEn,
    spokenExcerpt: s.summaryEn,
    visualStorytelling: s.summaryEn,
    characterIds: [
      demoProfiles.find((p) => p.role === presetMapping[s.id].primaryCharacter)?.characterId ??
        'char-father-1',
    ],
    facialExpression: presetMapping[s.id].emotion,
    bodyLanguage: presetMapping[s.id].action,
    lightingColor: s.moodColor,
    transitionToNext: 'light-leak',
    startTime: s.startTime,
    endTime: s.endTime,
    accentColor: s.moodColor,
    presetSceneId: s.id,
    ...presetMapping[s.id],
  }));

  const demoProject: AnimationProject = {
    id: 'demo-babar-rickshaw',
    title: 'বাবার রিকশা',
    subtitle: 'Father’s Rickshaw · Built-in Showcase Project',
    audioUrl: AUDIO_SRC,
    audioFileName: 'babar-rickshaw-narration.mp3',
    audioEnvelope: synth.envelope,
    audioEnvelopeHz: synth.sampleRateHz,
    phoneticFrames: synth.phoneticFrames,
    phoneticHz: synth.phoneticHz,
    characterProfiles: demoProfiles,
    characterBible: formatCharacterBibleFromProfiles(demoProfiles),
    storyIntelligence: demoIntelligence,
    analysis: {
      totalWords: cues.reduce((s, c) => s + c.text.split(/\s+/).length, 0) || 412,
      cueCount: cues.length || 65,
      sceneCount: STORY_SCENES.length,
      detectedCharacters: ['father', 'youth-boy', 'friend', 'teacher'],
      dominantEmotions: ['emotional', 'worried', 'inspiring'],
      primarySettings: ['school-street', 'fajr-mosque', 'tea-stall', 'monsoon-rain'],
      speechPace: synth.pace,
      audioSyncMode: 'cue-cadence',
      narrativeHighlights: [
        'Father & Son emotional arc detected across 8 chapters',
        'Monsoon storm climax + golden sunset epilogue synchronized to SRT',
      ],
    },
    duration: FILM_DURATION,
    cues,
    englishTranslations: ENGLISH_SUBTITLES,
    isDemo: true,
    scenes: demoScenes,
  };

  demoProject.qualityAudit = auditProjectQuality(demoProject);
  return demoProject;
}

/**
 * Converts a plain Bengali or English script into timed SubtitleCues spaced proportionally
 * across totalDuration (or estimated from word count if totalDuration is omitted).
 */
export function parseScriptToCues(scriptText: string, totalDuration?: number): SubtitleCue[] {
  const cleaned = scriptText.replace(/\r\n/g, '\n').trim();
  if (!cleaned) return [];

  // Split by Bengali dari (।), sentence punctuation, or line breaks
  const rawSegments = cleaned
    .split(/(?<=[।.!?])\s+|\n+/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.length > 0);

  // Break overly long sentences into readable subtitle chunks (~11 words max)
  const chunks: string[] = [];
  for (const seg of rawSegments) {
    const words = seg.split(' ');
    if (words.length <= 12) {
      chunks.push(seg);
    } else {
      for (let i = 0; i < words.length; i += 10) {
        chunks.push(words.slice(i, i + 10).join(' '));
      }
    }
  }

  if (chunks.length === 0) return [];

  const weights = chunks.map((c) => Math.max(3, c.split(' ').length));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const targetDuration =
    totalDuration && totalDuration > 3
      ? totalDuration
      : Math.max(12, Math.round(totalWeight * 0.45));

  let cursor = 0.15;
  const usableDuration = Math.max(2, targetDuration - 0.5);

  return chunks.map((text, idx) => {
    const segDur = (weights[idx] / totalWeight) * usableDuration;
    const startTime = Number(cursor.toFixed(2));
    const endTime = Number(Math.min(targetDuration, cursor + Math.max(0.8, segDur - 0.08)).toFixed(2));
    cursor += segDur;
    return {
      index: idx + 1,
      startTime,
      endTime,
      text,
    };
  });
}

export interface ClassificationResult {
  setting: SceneSetting;
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  action: SceneAction;
  accentColor: string;
  labelEn: string;
  emotion: EmotionTone;
  cameraShot: CameraShot;
  cameraMotion: CameraMotion;
  motif: StoryMotif;
  primaryCharacter: CharacterRole;
  secondaryCharacter: CharacterRole | null;
  prop: StoryProp;
  matchedSignals: string[];
  visualMatchReason: string;
  hasExplicitSetting?: boolean;
}

function tokenizeText(lower: string): string[] {
  return lower
    .split(/[\s।.,!?;:"'“”‘’()[\]{}\-—–/\\|]+/)
    .filter(Boolean);
}

function countKeywordHits(lower: string, keywords: string[]): string[] {
  const hits: string[] = [];
  let cachedTokens: string[] | null = null;
  const getTokens = () => {
    if (!cachedTokens) cachedTokens = tokenizeText(lower);
    return cachedTokens;
  };

  for (const kw of keywords) {
    if (kw.includes(' ')) {
      if (lower.includes(kw)) hits.push(kw);
      continue;
    }
    const isAscii = /^[a-z0-9]+$/i.test(kw);
    if ((isAscii && kw.length <= 4) || (!isAscii && kw.length <= 2)) {
      if (getTokens().includes(kw)) {
        hits.push(kw);
      }
    } else if (lower.includes(kw)) {
      hits.push(kw);
    }
  }
  return hits;
}

function detectCharacters(lower: string, storyContextLower: string): {
  primary: CharacterRole;
  secondary: CharacterRole | null;
  signals: string[];
} {
  const combined = `${lower} ${storyContextLower}`;
  const roles: Array<{ role: CharacterRole; kws: string[] }> = [
    { role: 'father', kws: ['বাবা', 'আব্বু', 'আব্বা', 'পিতা', 'father', 'dad', 'papa'] },
    { role: 'mother', kws: ['মা', 'মাকে', 'আম্মু', 'আম্মা', 'মাতা', 'মায়ের', 'মায়ের', 'mother', 'mom', 'mama'] },
    { role: 'doctor', kws: ['ডাক্তার', 'চিকিৎসক', 'হাসপাতাল', 'নার্স', 'doctor', 'nurse', 'clinic', 'hospital'] },
    { role: 'teacher', kws: ['শিক্ষক', 'স্যার', 'মাস্টার', 'ওস্তাদ', 'গুরু', 'teacher', 'professor', 'mentor', 'sir'] },
    { role: 'elder', kws: ['দাদা', 'দাদি', 'নানা', 'নানি', 'বৃদ্ধ', 'বয়স্ক', 'বয়স্ক', 'grandpa', 'grandfather', 'elder', 'old man'] },
    { role: 'youth-girl', kws: ['মেয়ে', 'মেয়ে', 'বোন', 'ছাত্রী', 'তরুণী', 'বউ', 'স্ত্রী', 'girl', 'daughter', 'sister', 'woman', 'she', 'her'] },
    { role: 'youth-boy', kws: ['ছেলে', 'ছাত্র', 'ভাই', 'রাফি', 'তরুণ', 'যুবক', 'boy', 'son', 'brother', 'student', 'kid'] },
    { role: 'friend', kws: ['বন্ধু', 'সাকিব', 'সহপাঠী', 'সাথী', 'friend', 'buddy', 'classmate', 'colleague'] },
    { role: 'professional', kws: ['অফিস', 'ব্যবসা', 'চাকরি', 'ল্যাপটপ', 'কোম্পানি', 'সফটওয়্যার', 'উদ্যোক্তা', 'কাজ', 'office', 'business', 'career', 'startup', 'laptop', 'work', 'creator', 'engineer'] },
  ];

  // Prioritize matches inside the current scene text first, then fall back to overall story cast
  const sceneMatches: Array<{ role: CharacterRole; score: number; hits: string[] }> = [];
  for (const r of roles) {
    const localHits = countKeywordHits(lower, r.kws);
    if (localHits.length > 0) {
      sceneMatches.push({ role: r.role, score: localHits.length * 3, hits: localHits });
    }
  }

  if (sceneMatches.length === 0) {
    for (const r of roles) {
      const globalHits = countKeywordHits(combined, r.kws);
      if (globalHits.length > 0) {
        sceneMatches.push({ role: r.role, score: globalHits.length, hits: globalHits });
      }
    }
  }

  sceneMatches.sort((a, b) => b.score - a.score);

  const primary = sceneMatches[0]?.role ?? 'narrator';
  const secondary = sceneMatches[1]?.role ?? (
    countKeywordHits(lower, ['কথা', 'বলল', 'জিজ্ঞেস', 'তারা', 'দুজন', 'একসাথে', 'talk', 'asked', 'together', 'they', 'we']).length > 0
      ? (primary === 'father' ? 'youth-boy' : primary === 'mother' ? 'youth-girl' : 'friend')
      : null
  );

  return {
    primary,
    secondary,
    signals: sceneMatches.slice(0, 2).flatMap((m) => m.hits.slice(0, 2)),
  };
}

function detectEmotion(lower: string, isLastScene: boolean): { emotion: EmotionTone; hits: string[] } {
  const buckets: Array<{ emotion: EmotionTone; kws: string[] }> = [
    {
      emotion: 'emotional',
      kws: ['কান্না', 'অশ্রু', 'চোখে জল', 'বুক', 'হৃদয়', 'হৃদয়', 'আবেগ', 'ভালোবাসা', 'ত্যাগ', 'tears', 'cry', 'heart', 'sacrifice', 'love', 'hug', 'touched'],
    },
    {
      emotion: 'sad',
      kws: ['কষ্ট', 'দুঃখ', 'লজ্জা', 'ব্যথা', 'একা', 'হতাশ', 'মন খারাপ', 'ভাঙা', 'sad', 'pain', 'lonely', 'ashamed', 'hurt', 'broken', 'sorry', 'loss'],
    },
    {
      emotion: 'worried',
      kws: ['ভয়', 'ভয়', 'চিন্তা', 'দুশ্চিন্তা', 'সমস্যা', 'দেরি', 'বাকি', 'জরুরি', 'আতঙ্ক', 'worried', 'fear', 'anxious', 'deadline', 'trouble', 'urgent', 'nervous'],
    },
    {
      emotion: 'inspiring',
      kws: ['গর্ব', 'সফল', 'স্বপ্ন', 'সাফল্য', 'সততা', 'হালাল', 'শিক্ষা', 'আলো', 'জয়', 'জয়', 'গৌরব', 'proud', 'success', 'dream', 'inspire', 'honest', 'wisdom', 'lesson', 'hope', 'victory'],
    },
    {
      emotion: 'determined',
      kws: ['পরিশ্রম', 'সংগ্রাম', 'লড়াই', 'লড়াই', 'চেষ্টা', 'লক্ষ্য', 'শপথ', 'অবশ্যই', 'কঠোর', 'struggle', 'hard work', 'focus', 'never give up', 'build', 'grind', 'promise', 'goal'],
    },
    {
      emotion: 'happy',
      kws: ['হাসি', 'খুশি', 'আনন্দ', 'সুখ', 'উৎসব', 'মিষ্টি', 'smile', 'happy', 'joy', 'laugh', 'celebrate', 'bright', 'peaceful'],
    },
    {
      emotion: 'angry',
      kws: ['রাগ', 'ক্ষোভ', 'চিৎকার', 'অন্যায়', 'অন্যায়', 'angry', 'furious', 'shout', 'unfair', 'rage'],
    },
  ];

  let best: { emotion: EmotionTone; hits: string[] } = {
    emotion: isLastScene ? 'inspiring' : 'calm',
    hits: [],
  };

  for (const b of buckets) {
    const hits = countKeywordHits(lower, b.kws);
    if (hits.length > best.hits.length) {
      best = { emotion: b.emotion, hits };
    }
  }
  return best;
}

function detectTimeOfDay(lower: string, defaultTime: TimeOfDay): TimeOfDay {
  if (countKeywordHits(lower, ['ভোর', 'ফজর', 'সূর্যোদয়', 'সূর্যোদয়', 'dawn', 'fajr', 'sunrise']).length > 0) {
    return 'dawn';
  }
  if (countKeywordHits(lower, ['রাত', 'মধ্যরাত', 'চাঁদ', 'নক্ষত্র', 'অন্ধকার', 'ঘুম', 'night', 'midnight', 'moon', 'dark', 'stars']).length > 0) {
    return 'night';
  }
  if (countKeywordHits(lower, ['সন্ধ্যা', 'গোধূলি', 'সূর্যাস্ত', 'বিকেল', 'sunset', 'evening', 'dusk', 'twilight']).length > 0) {
    return 'sunset';
  }
  if (countKeywordHits(lower, ['ঝড়', 'ঝড়', 'বৃষ্টি', 'কালো মেঘ', 'তুফান', 'storm', 'thunder', 'heavy rain', 'monsoon']).length > 0) {
    return 'storm';
  }
  if (countKeywordHits(lower, ['সকাল', 'রোদ', 'morning', 'daylight', 'sunshine']).length > 0) {
    return 'morning';
  }
  if (countKeywordHits(lower, ['দুপুর', 'মধ্যাহ্ন', 'afternoon', 'noon']).length > 0) {
    return 'afternoon';
  }
  return defaultTime;
}

function hasAnyTimeKeyword(lower: string): boolean {
  return (
    countKeywordHits(lower, [
      'ভোর', 'ফজর', 'সূর্যোদয়', 'সূর্যোদয়', 'dawn', 'fajr', 'sunrise',
      'রাত', 'মধ্যরাত', 'চাঁদ', 'অন্ধকার', 'night', 'midnight', 'moon',
      'সন্ধ্যা', 'গোধূলি', 'সূর্যাস্ত', 'বিকেল', 'sunset', 'evening', 'dusk',
      'ঝড়', 'ঝড়', 'বৃষ্টি', 'তুফান', 'storm', 'thunder',
      'সকাল', 'morning', 'দুপুর', 'afternoon', 'noon',
    ]).length > 0
  );
}

function detectProp(lower: string): StoryProp {
  if (countKeywordHits(lower, ['ল্যাপটপ', 'কম্পিউটার', 'কোড', 'সফটওয়্যার', 'laptop', 'computer', 'code', 'screen']).length > 0) return 'laptop';
  if (countKeywordHits(lower, ['ফোন', 'মোবাইল', 'কল', 'মেসেজ', 'phone', 'mobile', 'call', 'message']).length > 0) return 'phone';
  if (countKeywordHits(lower, ['টাকা', 'ফি', 'পয়সা', 'পয়সা', 'বেতন', 'উপার্জন', 'money', 'salary', 'fee', 'cash', 'taka']).length > 0) return 'money';
  if (countKeywordHits(lower, ['বই', 'খাতা', 'পড়া', 'পড়া', 'পরীক্ষা', 'book', 'notebook', 'study', 'read']).length > 0) return 'book';
  if (countKeywordHits(lower, ['চা', 'কফি', 'কাপ', 'tea', 'coffee', 'cup']).length > 0) return 'tea';
  if (countKeywordHits(lower, ['ছাতা', 'umbrella']).length > 0) return 'umbrella';
  if (countKeywordHits(lower, ['ব্যাগ', 'স্কুল', 'backpack', 'bag']).length > 0) return 'backpack';
  if (countKeywordHits(lower, ['হারিকেন', 'আলো', 'প্রদীপ', 'lantern', 'lamp']).length > 0) return 'lantern';
  return 'none';
}

function detectStoryMotif(lower: string, setting: SceneSetting): StoryMotif {
  if (setting === 'space-cosmos') return 'rocket-launch';
  if (setting === 'ocean-voyage') return 'sailing-ship';
  if (setting === 'finance-growth') return 'growth-chart';
  if (setting === 'tech-ai-lab') return 'digital-network';
  if (setting === 'stage-spotlight') return 'spotlight-mic';
  if (setting === 'sports-arena') return 'stadium-ball';
  if (setting === 'mountain-summit') return 'mountain-peak';
  if (setting === 'train-journey') return 'train-express';
  if (setting === 'ancient-palace') return 'royal-arch';

  if (countKeywordHits(lower, ['সময়', 'সময়', 'ঘড়ি', 'ঘড়ি', 'অতীত', 'ভবিষ্যৎ', 'বছর', 'time', 'clock', 'hour', 'years', 'future', 'past', 'deadline']).length > 0) {
    return 'clock-time';
  }
  if (countKeywordHits(lower, ['ভালোবাসা', 'হৃদয়', 'হৃদয়', 'মন', 'মায়া', 'মায়া', 'love', 'heart', 'affection', 'soul']).length > 0) {
    return 'glowing-heart';
  }
  if (countKeywordHits(lower, ['বই', 'জ্ঞান', 'পড়াশোনা', 'পড়াশোনা', 'শিক্ষা', 'book', 'knowledge', 'learn', 'wisdom', 'library']).length > 0) {
    return 'floating-books';
  }
  if (countKeywordHits(lower, ['টাকা', 'ব্যবসা', 'বিনিয়োগ', 'বিনিয়োগ', 'সাফল্য', 'লাভ', 'money', 'profit', 'growth', 'invest', 'wealth', 'revenue']).length > 0) {
    return 'growth-chart';
  }
  if (countKeywordHits(lower, ['স্বপ্ন', 'আশা', 'কল্পনা', 'dream', 'hope', 'imagine', 'vision']).length > 0) {
    return 'dream-orbs';
  }
  return 'none';
}

function buildMatchReason(labelEn: string, signals: string[], emotion: EmotionTone): string {
  const unique = Array.from(new Set(signals.filter(Boolean))).slice(0, 3);
  if (unique.length > 0) {
    return `${labelEn} · matched "${unique.join('", "')}" (${emotion})`;
  }
  return `${labelEn} · aligned to spoken mood (${emotion})`;
}

/**
 * Weighted multi-signal bilingual (Bengali + English) semantic scene analyzer.
 * Eliminates random/false-positive world jumps (e.g. Bengali "তারা" = they, "বল" = say,
 * "পানি" = drinking water, "পৃথিবী" = the world) by scoring every candidate world with
 * high-precision primary anchors (+4.0) vs. contextual supporting signals (+1.5), enforcing
 * strict minimum thresholds for specialized worlds, and preserving story-level continuity.
 */
interface SettingRule {
  setting: SceneSetting;
  labelEn: string;
  accentColor: string;
  primary: string[];
  secondary: string[];
  /** Specialized worlds require at least one unambiguous primary anchor (minScore >= 4) */
  minScore: number;
  defaultTime: TimeOfDay;
  defaultWeather: WeatherType;
  defaultAction: SceneAction;
  defaultShot: CameraShot;
  defaultMotion: CameraMotion;
  defaultMotif: StoryMotif;
  defaultProp?: StoryProp;
}

const WEIGHTED_SETTING_RULES: SettingRule[] = [
  {
    setting: 'space-cosmos',
    labelEn: 'Deep Space & Rocket Launch',
    accentColor: '#6EA8FE',
    // Strictly space/astronomy terms — NEVER generic Bengali "তারা" (they) or standalone "পৃথিবী" (world)
    primary: [
      'মহাকাশ', 'রকেট', 'নভোচারী', 'গ্যালাক্সি', 'মহাবিশ্ব', 'স্যাটেলাইট', 'মঙ্গল গ্রহ', 'সৌরজগৎ', 'অরবিট',
      'spacecraft', 'spaceship', 'rocket', 'astronaut', 'galaxy', 'cosmos', 'satellite', 'nasa', 'starship', 'outer space', 'space', 'planet', 'universe', 'mars',
    ],
    secondary: ['গ্রহ', 'নক্ষত্র', 'চাঁদ', 'পৃথিবী', 'আকাশগঙ্গা', 'orbit', 'moon', 'launch'],
    minScore: 4,
    defaultTime: 'night',
    defaultWeather: 'stars',
    defaultAction: 'speaking-narrator',
    defaultShot: 'wide-establishing',
    defaultMotion: 'tilt-up',
    defaultMotif: 'rocket-launch',
  },
  {
    setting: 'ocean-voyage',
    labelEn: 'Ocean Voyage & Sailing Ship',
    accentColor: '#4BA3C7',
    primary: [
      'সমুদ্র', 'সাগর', 'মহাসাগর', 'জাহাজ', 'পালতোলা', 'নাবিক', 'সমুদ্র সৈকত', 'সৈকত', 'লাইটহাউস', 'দ্বীপ',
      'ocean', 'sailing', 'ship', 'voyage', 'sailor', 'lighthouse', 'harbor', 'pirate', 'submarine', 'sea', 'island', 'beach',
    ],
    secondary: ['ঢেউ', 'বন্দর', 'তীর', 'waves', 'sail', 'coast'],
    minScore: 4,
    defaultTime: 'sunset',
    defaultWeather: 'clear',
    defaultAction: 'boat-glide',
    defaultShot: 'wide-establishing',
    defaultMotion: 'pan-right',
    defaultMotif: 'sailing-ship',
  },
  {
    setting: 'train-journey',
    labelEn: 'Express Train Journey',
    accentColor: '#D98E4E',
    primary: [
      'ট্রেন', 'রেলগাড়ি', 'রেলগাড়ি', 'রেলস্টেশন', 'রেললাইন', 'প্ল্যাটফর্ম', 'বগি',
      'train', 'railway', 'locomotive', 'railroad', 'train station', 'platform',
    ],
    secondary: ['স্টেশন', 'রেল', 'যাত্রা', 'express', 'station', 'ticket'],
    minScore: 4,
    defaultTime: 'sunset',
    defaultWeather: 'clear',
    defaultAction: 'walking-away',
    defaultShot: 'tracking-pan',
    defaultMotion: 'tracking',
    defaultMotif: 'train-express',
  },
  {
    setting: 'mountain-summit',
    labelEn: 'Mountain Summit & Climb',
    accentColor: '#76A9C9',
    primary: [
      'পাহাড়', 'পাহাড়', 'পর্বত', 'পর্বতশৃঙ্গ', 'হিমালয়', 'হিমালয়', 'এভারেস্ট', 'পাহাড়ের চূড়া', 'পাহাড়ের চূড়া', 'তুষারপাত', 'বরফের চূড়া',
      'mountain', 'summit', 'everest', 'himalaya', 'glacier', 'hiking', 'trekking', 'cliff', 'peak',
    ],
    secondary: ['চূড়া', 'চূড়া', 'শিখর', 'বরফ', 'তুষার', 'অভিযান', 'climb', 'snow', 'trek'],
    minScore: 4,
    defaultTime: 'dawn',
    defaultWeather: 'mist',
    defaultAction: 'celebrating-proud',
    defaultShot: 'wide-establishing',
    defaultMotion: 'tilt-up',
    defaultMotif: 'mountain-peak',
  },
  {
    setting: 'tech-ai-lab',
    labelEn: 'Futuristic AI & Tech Lab',
    accentColor: '#50C8B8',
    primary: [
      'এআই', 'কৃত্রিম বুদ্ধিমত্তা', 'রোবট', 'অ্যালগরিদম', 'কোডিং', 'প্রোগ্রামিং', 'সাইবার', 'প্রযুক্তি', 'সফটওয়্যার', 'সফটওয়্যার',
      'artificial intelligence', 'ai', 'robot', 'algorithm', 'neural', 'cyber', 'programming', 'developer', 'quantum', 'futuristic', 'coding', 'technology',
    ],
    secondary: ['ডেটা', 'ইন্টারনেট', 'অ্যাপ', 'কম্পিউটার', 'ল্যাপটপ', 'digital', 'data', 'software', 'tech'],
    minScore: 4,
    defaultTime: 'night',
    defaultWeather: 'clear',
    defaultAction: 'working-desk',
    defaultShot: 'medium-two-shot',
    defaultMotion: 'dolly-in',
    defaultMotif: 'digital-network',
    defaultProp: 'laptop',
  },
  {
    setting: 'finance-growth',
    labelEn: 'Wealth & Business Growth',
    accentColor: '#E5A93C',
    primary: [
      'বিনিয়োগ', 'বিনিয়োগ', 'শেয়ার বাজার', 'শেয়ার বাজার', 'কোটিপতি', 'মুনাফা', 'অর্থনীতি', 'ব্যবসা', 'উদ্যোক্তা', 'স্টার্টআপ', 'মার্কেটিং', 'সাফল্যের সূত্র',
      'finance', 'wealth', 'investing', 'invest', 'stock market', 'crypto', 'millionaire', 'billion', 'revenue', 'economy', 'startup', 'entrepreneur', 'profit', 'money mindset',
    ],
    secondary: ['শেয়ার', 'শেয়ার', 'ব্যাংক', 'সম্পদ', 'ধনী', 'লাভ', 'গ্রাফ', 'বাজেট', 'bank', 'stock', 'income', 'business', 'growth'],
    minScore: 4,
    defaultTime: 'sunset',
    defaultWeather: 'clear',
    defaultAction: 'speaking-narrator',
    defaultShot: 'medium-two-shot',
    defaultMotion: 'dolly-in',
    defaultMotif: 'growth-chart',
    defaultProp: 'money',
  },
  {
    setting: 'sports-arena',
    labelEn: 'Floodlit Sports Stadium',
    accentColor: '#52B788',
    // Strictly sports terms — NEVER standalone Bengali "বল" (which means "say/tell") or "মাঠ" alone!
    primary: [
      'ক্রিকেট', 'ফুটবল', 'স্টেডিয়াম', 'স্টেডিয়াম', 'বিশ্বকাপ', 'খেলোয়াড়', 'খেলোয়াড়', 'চ্যাম্পিয়ন', 'চ্যাম্পিয়ন', 'টুর্নামেন্ট', 'গোলরক্ষক',
      'cricket', 'football', 'soccer', 'stadium', 'world cup', 'athlete', 'tournament', 'trophy', 'championship', 'sports',
    ],
    secondary: ['খেলা', 'গোল', 'ব্যাট', 'ম্যাচ', 'খেলাধুলা', 'player', 'match', 'goal', 'champion'],
    minScore: 4,
    defaultTime: 'night',
    defaultWeather: 'clear',
    defaultAction: 'celebrating-proud',
    defaultShot: 'wide-establishing',
    defaultMotion: 'pan-left',
    defaultMotif: 'stadium-ball',
  },
  {
    setting: 'ancient-palace',
    labelEn: 'Ancient Palace & Heritage',
    accentColor: '#D69A4B',
    primary: [
      'রাজপ্রাসাদ', 'প্রাসাদ', 'সম্রাট', 'সাম্রাজ্য', 'সুলতান', 'দুর্গ', 'মুক্তিযুদ্ধ', 'তলোয়ার', 'তলোয়ার', 'সিংহাসন', 'রাজার দরবার',
      'emperor', 'palace', 'empire', 'kingdom', 'castle', 'sultan', 'warrior', 'fortress', 'throne', 'dynasty', 'ancient',
    ],
    secondary: ['ইতিহাস', 'রাজা', 'রাজ্য', 'যুদ্ধ', 'সৈন্য', 'প্রাচীন', 'history', 'king', 'battle', 'war'],
    minScore: 4,
    defaultTime: 'night',
    defaultWeather: 'stars',
    defaultAction: 'speaking-narrator',
    defaultShot: 'wide-establishing',
    defaultMotion: 'dolly-in',
    defaultMotif: 'royal-arch',
    defaultProp: 'lantern',
  },
  {
    setting: 'stage-spotlight',
    labelEn: 'Keynote Stage & Spotlight',
    accentColor: '#E5A93C',
    primary: [
      'মঞ্চ', 'ভাষণ', 'বক্তৃতা', 'মাইক্রোফোন', 'পডকাস্ট', 'কনফারেন্স', 'সেমিনার',
      'keynote', 'microphone', 'podcast', 'conference', 'seminar', 'ted talk', 'spotlight', 'stage', 'speech',
    ],
    secondary: ['দর্শক', 'মোটিভেশন', 'অনুপ্রেরণা', 'audience', 'motivation'],
    minScore: 4,
    defaultTime: 'night',
    defaultWeather: 'clear',
    defaultAction: 'speaking-narrator',
    defaultShot: 'close-up-portrait',
    defaultMotion: 'dolly-in',
    defaultMotif: 'spotlight-mic',
  },
  {
    setting: 'monsoon-rain',
    labelEn: 'Monsoon Rain & Storm',
    accentColor: '#4A8BB2',
    // Strictly rain/storm terms — NEVER standalone "পানি" (drinking water)!
    primary: [
      'বৃষ্টি', 'মুষলধারে', 'ঝড়', 'ঝড়', 'বিজলি', 'বজ্রপাত', 'বজ্র', 'তুফান', 'ভিজে', 'বর্ষা', 'ছাতা',
      'rain', 'raining', 'storm', 'thunder', 'monsoon', 'drenched', 'downpour', 'umbrella', 'flood',
    ],
    secondary: ['মেঘ', 'কালো মেঘ', 'ভিজতে', 'পানি', 'clouds', 'wet', 'lightning'],
    minScore: 3.5,
    defaultTime: 'storm',
    defaultWeather: 'rain',
    defaultAction: 'walking-away',
    defaultShot: 'tracking-pan',
    defaultMotion: 'tracking',
    defaultMotif: 'none',
    defaultProp: 'umbrella',
  },
  {
    setting: 'hospital-care',
    labelEn: 'Care & Clinic Room',
    accentColor: '#56A3A6',
    primary: [
      'হাসপাতাল', 'ডাক্তার', 'চিকিৎসক', 'নার্স', 'ক্লিনিক', 'চিকিৎসা', 'অপারেশন', 'রোগী',
      'hospital', 'doctor', 'nurse', 'clinic', 'patient', 'medical', 'surgery',
    ],
    secondary: ['অসুস্থ', 'ওষুধ', 'জ্বর', 'ব্যথা', 'sick', 'medicine', 'heal', 'fever'],
    minScore: 3.5,
    defaultTime: 'afternoon',
    defaultWeather: 'clear',
    defaultAction: 'family-together',
    defaultShot: 'medium-two-shot',
    defaultMotion: 'dolly-in',
    defaultMotif: 'none',
  },
  {
    setting: 'fajr-mosque',
    labelEn: 'Dawn & Mosque',
    accentColor: '#D9895B',
    primary: [
      'ফজর', 'মসজিদ', 'নামাজ', 'আজান', 'জায়নামাজ', 'জায়নামাজ', 'ইমাম', 'মোনাজাত',
      'fajr', 'mosque', 'prayer', 'azan', 'masjid',
    ],
    secondary: ['ভোর', 'দোয়া', 'দোয়া', 'প্রার্থনা', 'আল্লাহ', 'dawn', 'pray', 'sunrise'],
    minScore: 3.5,
    defaultTime: 'dawn',
    defaultWeather: 'mist',
    defaultAction: 'praying-reflecting',
    defaultShot: 'medium-two-shot',
    defaultMotion: 'dolly-in',
    defaultMotif: 'none',
  },
  {
    setting: 'office-studio',
    labelEn: 'Workspace & Office',
    accentColor: '#5A92C8',
    primary: [
      'অফিস', 'ল্যাপটপ', 'কম্পিউটার', 'মিটিং', 'চাকরি', 'কোম্পানি', 'ডেস্ক', 'ক্লায়েন্ট', 'ক্লায়েন্ট',
      'office', 'laptop', 'computer', 'meeting', 'desk', 'studio', 'workplace', 'company', 'career',
    ],
    secondary: ['প্রজেক্ট', 'কাজ', 'টিম', 'বস', 'project', 'work', 'team', 'deadline'],
    minScore: 3.5,
    defaultTime: 'morning',
    defaultWeather: 'clear',
    defaultAction: 'working-desk',
    defaultShot: 'medium-two-shot',
    defaultMotion: 'dolly-in',
    defaultMotif: 'none',
    defaultProp: 'laptop',
  },
  {
    setting: 'classroom',
    labelEn: 'In the Classroom',
    accentColor: '#5B7C99',
    primary: [
      'ক্লাস', 'ক্লাসরুম', 'শিক্ষক', 'স্যার', 'পরীক্ষা', 'কলেজ', 'বিশ্ববিদ্যালয়', 'বিশ্ববিদ্যালয়', 'মাদ্রাসা', 'পড়াশোনা', 'পড়াশোনা',
      'classroom', 'teacher', 'exam', 'chalkboard', 'college', 'university', 'lecture', 'professor',
    ],
    secondary: ['বই', 'খাতা', 'পড়া', 'পড়া', 'ফি', 'ছাত্র', 'ছাত্রী', 'study', 'book', 'student'],
    minScore: 3.5,
    defaultTime: 'morning',
    defaultWeather: 'clear',
    defaultAction: 'studying',
    defaultShot: 'medium-two-shot',
    defaultMotion: 'dolly-in',
    defaultMotif: 'floating-books',
    defaultProp: 'book',
  },
  {
    setting: 'school-street',
    labelEn: 'School Gate & Morning Road',
    accentColor: '#E5A93C',
    primary: [
      'স্কুল', 'স্কুলের গেট', 'গেট', 'রিকশা', 'রিকশাওয়ালা', 'রিকশাওয়ালা', 'প্যাডেল', 'গামছা',
      'school', 'school gate', 'rickshaw', 'backpack',
    ],
    secondary: ['ব্যাগ', 'ইউনিফর্ম', 'সকাল', 'রাস্তা', 'gate', 'student'],
    minScore: 3.5,
    defaultTime: 'morning',
    defaultWeather: 'clear',
    defaultAction: 'walking-away',
    defaultShot: 'tracking-pan',
    defaultMotion: 'tracking',
    defaultMotif: 'none',
    defaultProp: 'backpack',
  },
  {
    setting: 'tea-stall',
    labelEn: 'Roadside Tea Stall',
    accentColor: '#C87D55',
    // Strictly tea stall / cafe context — NEVER triggers just because "বন্ধু" or "কথা" appears!
    primary: [
      'চায়ের দোকান', 'চায়ের দোকান', 'টং', 'চা-দোকান', 'ঝালমুড়ি', 'ঝালমুড়ি', 'আড্ডা', 'কফি শপ', 'ক্যাফে',
      'tea stall', 'teastall', 'cafe', 'coffee shop', 'tea shop',
    ],
    secondary: ['চা', 'কফি', 'দোকান', 'কাপ', 'tea', 'coffee', 'stall'],
    minScore: 3.5,
    defaultTime: 'afternoon',
    defaultWeather: 'clear',
    defaultAction: 'conversation',
    defaultShot: 'medium-two-shot',
    defaultMotion: 'pan-right',
    defaultMotif: 'none',
    defaultProp: 'tea',
  },
  {
    setting: 'market-bazaar',
    labelEn: 'Vibrant Town Bazaar',
    accentColor: '#D48A45',
    primary: [
      'বাজার', 'হাট', 'দোকানদার', 'কেনাকাটা', 'মার্কেট', 'শপিং',
      'market', 'bazaar', 'street vendor', 'shopping', 'grocery',
    ],
    secondary: ['দোকান', 'ভিড়', 'ভিড়', 'ক্রেতা', 'বিক্রেতা', 'crowd', 'shop'],
    minScore: 3.5,
    defaultTime: 'afternoon',
    defaultWeather: 'clear',
    defaultAction: 'conversation',
    defaultShot: 'wide-establishing',
    defaultMotion: 'pan-left',
    defaultMotif: 'none',
  },
  {
    setting: 'river-village',
    labelEn: 'River & Green Village',
    accentColor: '#4E9A74',
    primary: [
      'নদী', 'নৌকা', 'নৌকো', 'মাঝি', 'গ্রাম', 'গ্রামের', 'ধানক্ষেত', 'ধান', 'খেত', 'ঘাট', 'কৃষক',
      'river', 'boat', 'village', 'paddy', 'countryside', 'fisherman', 'farmer', 'rural',
    ],
    secondary: ['মাঠ', 'বাতাস', 'সবুজ', 'পুকুর', 'field', 'stream', 'meadow'],
    minScore: 3.5,
    defaultTime: 'morning',
    defaultWeather: 'clear',
    defaultAction: 'walking-away',
    defaultShot: 'wide-establishing',
    defaultMotion: 'pan-right',
    defaultMotif: 'none',
  },
  {
    setting: 'home-night',
    labelEn: 'Warm Home Interior',
    accentColor: '#B88346',
    primary: [
      'ঘর', 'ঘরে', 'বাসা', 'বাসায়', 'বাসায়', 'বাড়ি', 'বাড়ি', 'রান্নাঘর', 'ভাত', 'খাবার', 'ডিনার', 'প্লেট', 'পরিবার', 'বিছানা',
      'home', 'house', 'dinner', 'supper', 'kitchen', 'bedroom', 'family', 'rice', 'meal',
    ],
    secondary: ['রাত', 'খাওয়া', 'খাওয়া', 'মা', 'বাবা', 'হারিকেন', 'ল্যাম্প', 'night', 'room', 'eat'],
    minScore: 3.5,
    defaultTime: 'night',
    defaultWeather: 'clear',
    defaultAction: 'family-together',
    defaultShot: 'medium-two-shot',
    defaultMotion: 'dolly-in',
    defaultMotif: 'none',
  },
  {
    setting: 'forest-wild',
    labelEn: 'Deep Forest & Wildlife Trail',
    accentColor: '#3E8E63',
    primary: [
      'জঙ্গল', 'অরণ্য', 'গভীর বন', 'বনের', 'বনভূমি', 'বাঘ', 'সিংহ', 'হরিণ', 'শিয়াল', 'শিয়াল', 'ক্যাম্পফায়ার', 'ক্যাম্পফায়ার',
      'forest', 'jungle', 'wilderness', 'woods', 'wildlife', 'deer', 'tiger', 'lion', 'campfire', 'rainforest',
    ],
    secondary: ['বন', 'গাছপালা', 'পাখির ডাক', 'বন্য', 'পাতা', 'tree', 'bird', 'trail'],
    minScore: 3.5,
    defaultTime: 'morning',
    defaultWeather: 'mist',
    defaultAction: 'walking-away',
    defaultShot: 'wide-establishing',
    defaultMotion: 'pan-right',
    defaultMotif: 'none',
  },
  {
    setting: 'desert-dunes',
    labelEn: 'Golden Desert & Caravan',
    accentColor: '#D99345',
    primary: [
      'মরুভূমি', 'মরুভূমির', 'বালু', 'বালিয়াড়ি', 'বালিয়াড়ি', 'উট', 'কাফেলা', 'মরূদ্যান', 'মরীচিকা',
      'desert', 'dunes', 'sahara', 'camel', 'caravan', 'oasis', 'sandstorm', 'arabian',
    ],
    secondary: ['বালি', 'তপ্ত', 'রোদ', 'sand', 'arid', 'nomad'],
    minScore: 4,
    defaultTime: 'sunset',
    defaultWeather: 'clear',
    defaultAction: 'walking-away',
    defaultShot: 'wide-establishing',
    defaultMotion: 'pan-right',
    defaultMotif: 'none',
  },
  {
    setting: 'court-justice',
    labelEn: 'Courtroom & Hall of Justice',
    accentColor: '#C9974C',
    primary: [
      'আদালত', 'বিচার', 'বিচারক', 'বিচারালয়', 'বিচারালয়', 'আইনজীবী', 'উকিল', 'মামলা', 'রায়', 'রায়', 'সাক্ষী', 'থানা', 'পুলিশ', 'কারাগার', 'জেল',
      'court', 'courtroom', 'judge', 'justice', 'lawyer', 'verdict', 'trial', 'prison', 'jail', 'police', 'detective',
    ],
    secondary: ['আইন', 'সত্য', 'ন্যায়', 'ন্যায়', 'অপরাধ', 'law', 'crime', 'witness'],
    minScore: 3.5,
    defaultTime: 'afternoon',
    defaultWeather: 'clear',
    defaultAction: 'conversation',
    defaultShot: 'medium-two-shot',
    defaultMotion: 'dolly-in',
    defaultMotif: 'none',
  },
  {
    setting: 'festival-celebration',
    labelEn: 'Festival Lights & Celebration',
    accentColor: '#E5A93C',
    primary: [
      'বিয়ে', 'বিয়ে', 'বিবাহ', 'উৎসব', 'ঈদ', 'পহেলা বৈশাখ', 'পূজা', 'মেলা', 'আতশবাজি', 'আলোকসজ্জা', 'জন্মদিন', 'গায়ে হলুদ', 'গায়ে হলুদ',
      'wedding', 'festival', 'celebration', 'fireworks', 'eid', 'carnival', 'party', 'birthday', 'fair', 'feast',
    ],
    secondary: ['অনুষ্ঠান', 'আনন্দ', 'আলো', 'উপহার', 'মিষ্টি', 'music', 'dance', 'joy'],
    minScore: 3.5,
    defaultTime: 'night',
    defaultWeather: 'fireflies',
    defaultAction: 'celebrating-proud',
    defaultShot: 'wide-establishing',
    defaultMotion: 'dolly-out',
    defaultMotif: 'none',
  },
  {
    setting: 'mystery-night',
    labelEn: 'Misty Moonlit Mystery Alley',
    accentColor: '#7E8CE0',
    primary: [
      'রহস্য', 'রহস্যময়', 'রহস্যময়', 'ভৌতিক', 'ভূত', 'প্রেত', 'পরিত্যক্ত', 'কবরস্থান', 'অন্ধকার গলি', 'নির্জন', 'গুপ্তধন', 'গোয়েন্দা', 'গোয়েন্দা', 'ভয়ংকর', 'ভয়ংকর',
      'mystery', 'haunted', 'ghost', 'cemetery', 'abandoned', 'alley', 'midnight', 'clue', 'secret', 'horror', 'eerie',
    ],
    secondary: ['অন্ধকার', 'ছায়া', 'ছায়া', 'ভয়', 'ভয়', 'কুয়াশা', 'কুয়াশা', 'shadow', 'fog', 'darkness'],
    minScore: 3.5,
    defaultTime: 'night',
    defaultWeather: 'mist',
    defaultAction: 'walking-away',
    defaultShot: 'tracking-pan',
    defaultMotion: 'dolly-in',
    defaultMotif: 'none',
    defaultProp: 'lantern',
  },
  {
    setting: 'library-study',
    labelEn: 'Grand Library & Reading Desk',
    accentColor: '#C98A4B',
    primary: [
      'লাইব্রেরি', 'গ্রন্থাগার', 'পাঠাগার', 'বইয়ের তাক', 'বইয়ের তাক', 'পাণ্ডুলিপি', 'পুঁথি', 'গ্রন্থ', 'প্রাচীন বই', 'বই খুলে', 'ডায়েরি', 'ডায়েরি', 'পুরনো চিঠি', 'চিঠি',
      'library', 'bookshelf', 'archive', 'manuscript', 'ancient book', 'diary', 'journal', 'reading room', 'reading desk', 'letter', 'scroll',
    ],
    secondary: ['বই', 'টেবিল', 'খাতা', 'পাতা', 'গবেষণা', 'পড়া', 'পড়া', 'অধ্যয়ন', 'অধ্যয়ন', 'জ্ঞান', 'book', 'desk', 'study', 'read'],
    minScore: 3.5,
    defaultTime: 'night',
    defaultWeather: 'clear',
    defaultAction: 'studying',
    defaultShot: 'medium-two-shot',
    defaultMotion: 'dolly-in',
    defaultMotif: 'floating-books',
    defaultProp: 'book',
  },
  {
    setting: 'highway-bridge',
    labelEn: 'Suspension Bridge & Highway',
    accentColor: '#5A92C8',
    primary: [
      'ব্রিজ', 'সেতু', 'পদ্মা সেতু', 'হাইওয়ে', 'হাইওয়ে', 'মহাসড়ক', 'মহাসড়ক', 'ফ্লাইওভার', 'বাস', 'গাড়ি', 'গাড়ি', 'ড্রাইভার', 'ট্যাক্সি', 'মোটরসাইকেল',
      'bridge', 'highway', 'freeway', 'overpass', 'bus', 'car', 'driving', 'taxi', 'traffic', 'road trip',
    ],
    secondary: ['যাত্রা', 'ভ্রমণ', 'শহর', 'রাস্তা', 'drive', 'road', 'commute'],
    minScore: 3.5,
    defaultTime: 'sunset',
    defaultWeather: 'clear',
    defaultAction: 'walking-away',
    defaultShot: 'tracking-pan',
    defaultMotion: 'pan-right',
    defaultMotif: 'none',
  },
  {
    setting: 'village-cottage',
    labelEn: 'Village Courtyard & Cottage',
    accentColor: '#D49456',
    primary: [
      'কুঁড়েঘর', 'কুঁড়েঘর', 'কুড়েঘর', 'উঠান', 'উঠোন', 'মাটির ঘর', 'পল্লী', 'খামার', 'ফসল', 'বটগাছ', 'বাঁশঝাড়', 'বাঁশঝাড়', 'চাষী',
      'cottage', 'hut', 'courtyard', 'farm', 'harvest', 'barn', 'homestead', 'banyan', 'mud house',
    ],
    secondary: ['গ্রাম', 'গ্রামের', 'ধান', 'কৃষক', 'কুয়াশা', 'village', 'rural', 'paddy'],
    minScore: 3.5,
    defaultTime: 'sunset',
    defaultWeather: 'fireflies',
    defaultAction: 'family-together',
    defaultShot: 'wide-establishing',
    defaultMotion: 'pan-right',
    defaultMotif: 'none',
    defaultProp: 'lantern',
  },
  {
    setting: 'snow-valley',
    labelEn: 'Winter Snow Valley & Cabin',
    accentColor: '#86B8DC',
    primary: [
      'শীতকাল', 'শীতের সকাল', 'শীতের রাত', 'তুষারপাত', 'বরফ ঢাকা', 'পাইন বন', 'তুষারঝড়', 'তুষারঝড়',
      'winter', 'snowfall', 'blizzard', 'cabin', 'frozen', 'pine forest', 'snowy', 'igloo',
    ],
    secondary: ['শীত', 'বরফ', 'তুষার', 'ঠান্ডা', 'snow', 'ice', 'cold'],
    minScore: 4,
    defaultTime: 'dawn',
    defaultWeather: 'snow',
    defaultAction: 'walking-away',
    defaultShot: 'wide-establishing',
    defaultMotion: 'pan-left',
    defaultMotif: 'none',
  },
  {
    setting: 'battle-camp',
    labelEn: 'Historic Battlefield & Banners',
    accentColor: '#C96846',
    primary: [
      'যুদ্ধক্ষেত্র', 'রণাঙ্গন', 'সেনাবাহিনী', 'মুক্তিযোদ্ধা', 'সৈনিক', 'বিপ্লব', 'শহীদ', 'স্বাধীনতা যুদ্ধ', 'লড়াই', 'লড়াই',
      'battlefield', 'soldiers', 'army', 'revolution', 'freedom fighter', 'siege', 'frontline', 'combat',
    ],
    secondary: ['যুদ্ধ', 'সৈন্য', 'সংগ্রাম', 'মশাল', 'পতাকা', 'battle', 'war', 'fight'],
    minScore: 4,
    defaultTime: 'sunset',
    defaultWeather: 'embers',
    defaultAction: 'walking-away',
    defaultShot: 'wide-establishing',
    defaultMotion: 'tracking',
    defaultMotif: 'none',
    defaultProp: 'lantern',
  },
  {
    setting: 'park-nature',
    labelEn: 'Green Park & Nature',
    accentColor: '#58A173',
    primary: [
      'বাগান', 'পার্ক', 'ফুলবাগান', 'প্রকৃতি', 'পাখি', 'উদ্যান',
      'park', 'garden', 'nature', 'meadow', 'botanical', 'orchard',
    ],
    secondary: ['গাছ', 'ফুল', 'সবুজ', 'ছায়া', 'ছায়া', 'tree', 'flower', 'bird'],
    minScore: 3.5,
    defaultTime: 'morning',
    defaultWeather: 'clear',
    defaultAction: 'speaking-narrator',
    defaultShot: 'wide-establishing',
    defaultMotion: 'pan-right',
    defaultMotif: 'none',
  },
  {
    setting: 'quote-epilogue',
    labelEn: 'Closing Reflection',
    accentColor: '#E8A849',
    primary: [
      'রাসূল', 'হাদিস', 'উপসংহার', 'হালাল উপার্জন', 'গল্পের শিক্ষা', 'নীতির কথা',
      'moral of the story', 'moral', 'lesson learned', 'hadith', 'prophet', 'epilogue', 'quote',
    ],
    secondary: ['শিক্ষা', 'হালাল', 'গর্ব', 'সম্মান', 'সততা', 'wisdom', 'lesson', 'remember', 'honest'],
    minScore: 4,
    defaultTime: 'sunset',
    defaultWeather: 'fireflies',
    defaultAction: 'quote-card',
    defaultShot: 'close-up-portrait',
    defaultMotion: 'dolly-out',
    defaultMotif: 'none',
  },
];

function scoreSettingRules(lower: string): Array<{
  rule: SettingRule;
  score: number;
  hits: string[];
}> {
  const scored: Array<{ rule: SettingRule; score: number; hits: string[] }> = [];

  for (const rule of WEIGHTED_SETTING_RULES) {
    const primaryHits = countKeywordHits(lower, rule.primary);
    const secondaryHits = countKeywordHits(lower, rule.secondary);

    // Prevent secondary-only accidental triggers on high-precision specialized worlds
    if (primaryHits.length === 0 && rule.minScore >= 4) {
      continue;
    }

    const score = primaryHits.length * 4 + secondaryHits.length * 1.5;
    if (score >= rule.minScore) {
      scored.push({
        rule,
        score,
        hits: [...primaryHits, ...secondaryHits],
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

export function classifySceneText(
  text: string,
  sceneIndex: number,
  totalScenes: number,
  fullStoryContext = '',
  previousSetting?: SceneSetting
): ClassificationResult {
  const lower = text.toLowerCase();
  const contextLower = fullStoryContext.toLowerCase();
  const hasAny = (keywords: string[]) => countKeywordHits(lower, keywords).length > 0;

  const isLastScene = sceneIndex === totalScenes - 1 && totalScenes >= 2;
  const charInfo = detectCharacters(lower, contextLower);
  const emotionInfo = detectEmotion(lower, isLastScene);
  const prop = detectProp(lower);
  const motions: CameraMotion[] = ['dolly-in', 'pan-right', 'tracking', 'dolly-out', 'pan-left', 'tilt-up'];
  const defaultMotion = motions[sceneIndex % motions.length];

  const makeResult = (
    base: Omit<ClassificationResult, 'cameraMotion' | 'motif' | 'visualMatchReason'> & {
      cameraMotion?: CameraMotion;
      motif?: StoryMotif;
    }
  ): ClassificationResult => {
    const motif = base.motif ?? detectStoryMotif(lower, base.setting);
    return {
      ...base,
      cameraMotion: base.cameraMotion ?? defaultMotion,
      motif,
      visualMatchReason: buildMatchReason(base.labelEn, base.matchedSignals, base.emotion),
    };
  };

  // Explicit moral epilogue on the final scene when reflection words appear
  if (
    isLastScene &&
    hasAny([
      'শিক্ষা', 'হালাল', 'গর্ব', 'উপসংহার', 'রাসূল', 'হাদিস', 'মনে রেখো', 'ভালোবাসা', 'সফল', 'স্বপ্ন',
      'moral', 'lesson', 'wisdom', 'proud', 'remember', 'quote', 'forever',
    ])
  ) {
    const epilogueHits = countKeywordHits(lower, [
      'শিক্ষা', 'হালাল', 'গর্ব', 'উপসংহার', 'রাসূল', 'হাদিস', 'ভালোবাসা', 'সফল', 'স্বপ্ন',
      'moral', 'lesson', 'wisdom', 'proud', 'remember', 'quote',
    ]);
    return makeResult({
      setting: 'quote-epilogue',
      timeOfDay: 'sunset',
      weather: 'fireflies',
      action: 'quote-card',
      accentColor: '#E8A849',
      labelEn: 'Closing Reflection',
      emotion: 'inspiring',
      cameraShot: 'close-up-portrait',
      cameraMotion: 'dolly-out',
      primaryCharacter: charInfo.primary,
      secondaryCharacter: charInfo.secondary,
      prop,
      matchedSignals: [...epilogueHits, ...charInfo.signals],
    });
  }

  // Score ALL 21 weighted worlds and pick the genuine highest-relevance match
  const candidates = scoreSettingRules(lower);
  if (candidates.length > 0) {
    const top = candidates[0];
    const rule = top.rule;
    const tod = detectTimeOfDay(lower, rule.defaultTime);

    let weather: WeatherType = rule.defaultWeather;
    if (rule.setting === 'ocean-voyage' && hasAny(['ঝড়', 'ঝড়', 'তুফান', 'storm', 'tempest'])) {
      weather = 'heavy-storm';
    } else if (rule.setting === 'monsoon-rain') {
      weather = hasAny(['মুষলধারে', 'ঝড়', 'ঝড়', 'বিজলি', 'তুফান', 'heavy', 'storm', 'thunder', 'drenched'])
        ? 'heavy-storm'
        : 'rain';
    } else if (rule.setting === 'mountain-summit' && hasAny(['বরফ', 'তুষার', 'হিমালয়', 'এভারেস্ট', 'snow', 'winter', 'glacier'])) {
      weather = 'snow';
    } else if (rule.setting === 'ancient-palace' && hasAny(['যুদ্ধ', 'আগুন', 'battle', 'war', 'fire'])) {
      weather = 'embers';
    } else if (rule.setting === 'train-journey' && hasAny(['বৃষ্টি', 'rain'])) {
      weather = 'rain';
    } else if ((rule.setting === 'river-village' || rule.setting === 'park-nature') && tod === 'sunset') {
      weather = 'fireflies';
    }

    let action: SceneAction = rule.defaultAction;
    if (rule.setting === 'monsoon-rain' && hasAny(['দৌড়', 'দৌড়', 'ছুট', 'run', 'rush', 'hurry'])) {
      action = 'running-rain';
    } else if (rule.setting === 'river-village' && hasAny(['নৌকা', 'নৌকো', 'মাঝি', 'ভেসে', 'boat', 'sail', 'row'])) {
      action = 'boat-glide';
    } else if (rule.setting === 'fajr-mosque' && (hasAny(['রিকশা', 'rickshaw']) || contextLower.includes('রিকশা'))) {
      action = 'rickshaw-ride';
    } else if (rule.setting === 'school-street' && hasAny(['রিকশা', 'rickshaw'])) {
      action = 'rickshaw-ride';
    } else if (rule.setting === 'home-night' && hasAny(['ভাত', 'খাওয়া', 'খাওয়া', 'প্লেট', 'খাবার', 'dinner', 'supper', 'rice', 'meal', 'eat'])) {
      action = 'home-meal';
    } else if (rule.setting === 'office-studio' && hasAny(['মিটিং', 'আলোচনা', 'টিম', 'কথা', 'meeting', 'team', 'discuss'])) {
      action = 'conversation';
    }

    let primaryChar = charInfo.primary;
    let secondaryChar = charInfo.secondary;
    if (rule.setting === 'hospital-care') {
      primaryChar = 'doctor';
      secondaryChar = charInfo.primary === 'doctor' ? 'mother' : charInfo.primary;
    } else if (rule.setting === 'classroom' && primaryChar === 'narrator') {
      primaryChar = 'teacher';
      secondaryChar = secondaryChar ?? 'youth-boy';
    } else if ((rule.setting === 'office-studio' || rule.setting === 'tech-ai-lab' || rule.setting === 'finance-growth') && primaryChar === 'narrator') {
      primaryChar = 'professional';
    } else if (rule.setting === 'sports-arena' && primaryChar === 'narrator') {
      primaryChar = 'youth-boy';
    } else if (rule.setting === 'ancient-palace' && primaryChar === 'narrator') {
      primaryChar = 'elder';
    } else if (rule.setting === 'home-night' && !secondaryChar) {
      secondaryChar = primaryChar === 'mother' ? 'youth-boy' : 'mother';
    } else if ((rule.setting === 'tea-stall' || rule.setting === 'market-bazaar') && !secondaryChar) {
      secondaryChar = 'friend';
    }

    const emotion =
      emotionInfo.hits.length > 0
        ? emotionInfo.emotion
        : rule.setting === 'space-cosmos' || rule.setting === 'finance-growth' || rule.setting === 'stage-spotlight'
          ? 'inspiring'
          : rule.setting === 'monsoon-rain' || rule.setting === 'home-night'
            ? 'emotional'
            : rule.setting === 'hospital-care'
              ? 'worried'
              : rule.setting === 'sports-arena'
                ? 'happy'
                : 'determined';

    return makeResult({
      setting: rule.setting,
      timeOfDay: tod,
      weather,
      action,
      accentColor: rule.accentColor,
      labelEn: rule.labelEn,
      emotion,
      cameraShot: rule.defaultShot,
      cameraMotion: rule.defaultMotion,
      motif: rule.defaultMotif,
      primaryCharacter: primaryChar,
      secondaryCharacter: secondaryChar,
      prop: prop !== 'none' ? prop : (rule.defaultProp ?? 'none'),
      matchedSignals: [...top.hits.slice(0, 3), ...charInfo.signals],
      hasExplicitSetting: true,
    });
  }

  // Story-Coherent Continuity Fallback:
  // When a spoken beat is pure narration/dialogue without a brand-new physical location,
  // stay anchored to the previous beat's setting (or the story's overall primary world)
  // rather than jumping to a random unrelated backdrop!
  const storyCandidates = fullStoryContext ? scoreSettingRules(contextLower) : [];
  const storyAnchorSetting =
    previousSetting && previousSetting !== 'quote-epilogue'
      ? previousSetting
      : storyCandidates[0]?.rule.setting;

  const tod = detectTimeOfDay(
    lower,
    sceneIndex === 0 ? 'morning' : isLastScene ? 'sunset' : sceneIndex % 2 === 0 ? 'afternoon' : 'sunset'
  );
  const hasDialogue =
    hasAny(['বলল', 'বলেন', 'জিজ্ঞেস', 'কথা', 'শোনো', 'তুমি', 'আমি', 'said', 'asked', 'told', 'listen', 'you', 'talk']) ||
    charInfo.secondary !== null;
  const isCelebration = emotionInfo.emotion === 'happy' || emotionInfo.emotion === 'inspiring';
  const isWalking = hasAny(['পথ', 'চলে', 'হাঁট', 'যাত্রা', 'রাস্তা', 'শহর', 'road', 'street', 'walk', 'journey', 'city', 'move']);

  const setting: SceneSetting =
    storyAnchorSetting ??
    (tod === 'night'
      ? 'home-night'
      : isWalking
        ? 'city-evening'
        : isCelebration
          ? 'park-nature'
          : 'city-evening');

  const action: SceneAction = isCelebration
    ? 'celebrating-proud'
    : isWalking
      ? 'walking-away'
      : hasDialogue
        ? 'conversation'
        : 'speaking-narrator';

  const cameraShot: CameraShot =
    action === 'speaking-narrator'
      ? 'close-up-portrait'
      : action === 'conversation'
        ? 'medium-two-shot'
        : 'tracking-pan';

  const labelByAction: Record<SceneAction, string> = {
    'speaking-narrator': 'Expressive Storytelling',
    conversation: 'Heartfelt Dialogue',
    'walking-away': 'Along the Journey',
    'celebrating-proud': 'Moment of Pride',
    'working-desk': 'Dedicated Focus',
    'family-together': 'Family Bond',
    'praying-reflecting': 'Quiet Reflection',
    'rickshaw-ride': 'Town Ride',
    studying: 'Learning',
    'home-meal': 'Evening Together',
    'running-rain': 'Through the Storm',
    'boat-glide': 'River Crossing',
    'quote-card': 'Closing Thought',
  };

  return makeResult({
    setting,
    timeOfDay: tod,
    weather: tod === 'sunset' ? 'fireflies' : 'clear',
    action,
    accentColor:
      emotionInfo.emotion === 'sad' || emotionInfo.emotion === 'worried'
        ? '#6088AD'
        : emotionInfo.emotion === 'inspiring' || emotionInfo.emotion === 'happy'
          ? '#E5A93C'
          : '#D49456',
    labelEn: labelByAction[action],
    emotion: emotionInfo.emotion,
    cameraShot,
    primaryCharacter: charInfo.primary,
    secondaryCharacter: charInfo.secondary,
    prop,
    matchedSignals: [...charInfo.signals, ...emotionInfo.hits],
    hasExplicitSetting: false,
  });
}

export interface CompileStoryInput {
  title?: string;
  srtText?: string;
  scriptText?: string;
  cuesOverride?: SubtitleCue[];
  visualStyle?: VisualStyle;
  audioUrl?: string | null;
  audioFileName?: string | null;
  audioDuration?: number;
  audioEnvelope?: number[];
  audioEnvelopeHz?: number;
  phoneticFrames?: PhoneticAudioFrame[];
  phoneticHz?: number;
  speechPace?: SpeechPace;
  audioSyncMode?: 'decoded-audio' | 'cue-cadence';
}

/**
 * Automatically derives a clean, concise video title from the user's explicit title,
 * or falls back to extracting a natural opening phrase from the script / SRT cues,
 * or cleans up the uploaded audio filename.
 */
export function deriveTitleFromContent(
  explicitTitle?: string,
  scriptText?: string,
  cues: SubtitleCue[] = [],
  audioFileName?: string | null
): string {
  const manual = explicitTitle?.trim();
  if (manual) return manual;

  const sourceText =
    scriptText?.trim() ||
    cues
      .slice(0, 3)
      .map((c) => c.text)
      .join(' ')
      .trim();

  if (sourceText) {
    const firstSentence = sourceText
      .split(/[।.!?\n]+/)
      .map((s) => s.replace(/^["'“”‘’\-\s]+|["'“”‘’\-\s]+$/g, '').trim())
      .find((s) => s.length >= 4);

    const candidate = firstSentence || sourceText.trim();
    const words = candidate.split(/\s+/).filter(Boolean);
    if (words.length <= 6 && candidate.length <= 42) {
      return candidate;
    }

    let acc = '';
    for (const w of words) {
      const next = acc ? `${acc} ${w}` : w;
      if (next.length > 38 && acc.length >= 10) break;
      acc = next;
      if (acc.split(/\s+/).length >= 5) break;
    }
    return acc.replace(/[,;:—-]+$/g, '').trim() || 'আমার অ্যানিমেশন গল্প';
  }

  if (audioFileName) {
    const cleaned = audioFileName
      .replace(/\.[^.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleaned.length >= 2) {
      return cleaned.length > 40 ? `${cleaned.slice(0, 40).trim()}…` : cleaned;
    }
  }

  return 'আমার অ্যানিমেশন গল্প';
}

/**
 * Compiles uploaded Audio + SRT + Script into a deeply analyzed, story-faithful
 * multi-scene AnimationProject ready for live 16:9 & 9:16 playback and video export.
 */
export function compileStoryProject(input: CompileStoryInput): AnimationProject {
  const srtCues =
    input.cuesOverride && input.cuesOverride.length > 0
      ? input.cuesOverride
      : input.srtText?.trim()
        ? parseSrt(input.srtText)
        : [];
  const cues =
    srtCues.length > 0
      ? srtCues
      : parseScriptToCues(input.scriptText ?? '', input.audioDuration);
  const cleanTitle = deriveTitleFromContent(
    input.title,
    input.scriptText,
    cues,
    input.audioFileName
  );

  const lastCueEnd = cues.length > 0 ? cues[cues.length - 1].endTime : 0;
  const duration = Math.max(
    6,
    input.audioDuration && Number.isFinite(input.audioDuration) ? input.audioDuration : 0,
    lastCueEnd + 1.5
  );

  // Full narrative context (combining script + SRT cues) helps maintain character consistency across scenes
  const fullStoryContext = [input.title ?? '', input.scriptText ?? '', cues.map((c) => c.text).join(' ')].join(' ');
  const totalWords = fullStoryContext
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const scenes: SceneSpec[] = [];

  const storyGenreProfile = classifyStoryGenre(fullStoryContext);
  const storySeed = computeStorySeed(`${cleanTitle}::${fullStoryContext.slice(0, 1200)}`);

  if (cues.length === 0) {
    const segmentCount = Math.max(3, Math.min(8, Math.round(duration / 12) || 4));
    const segLen = duration / segmentCount;
    const hz = input.audioEnvelopeHz ?? 10;
    const env = input.audioEnvelope ?? [];
    const companionPool = storyGenreProfile.companionSettings;

    for (let i = 0; i < segmentCount; i++) {
      const startTime = Number((i * segLen).toFixed(2));
      const endTime = Number(((i + 1) * segLen).toFixed(2));

      let segEnergy = 0.45;
      if (env.length > 0) {
        const sIdx = Math.floor(startTime * hz);
        const eIdx = Math.min(env.length, Math.max(sIdx + 1, Math.floor(endTime * hz)));
        let sum = 0;
        for (let k = sIdx; k < eIdx; k++) sum += env[k];
        segEnergy = sum / Math.max(1, eIdx - sIdx);
      }

      const isFinal = i === segmentCount - 1;
      const emotion: EmotionTone = isFinal
        ? 'inspiring'
        : segEnergy > 0.56
          ? 'determined'
          : segEnergy < 0.28
            ? 'calm'
            : 'emotional';
      const chosenSetting: SceneSetting = isFinal
        ? 'quote-epilogue'
        : companionPool[(storySeed + i) % companionPool.length] ?? 'park-nature';

      scenes.push({
        id: `scene-${i + 1}`,
        chapterNumber: String(i + 1).padStart(2, '0'),
        titleBn: `${cleanTitle} — পর্ব ${i + 1}`,
        titleEn: isFinal ? 'Closing Message' : SETTING_LABELS[chosenSetting],
        summary: `Voice-synced animated sequence ${i + 1} driven by voiceover amplitude & cadence.`,
        visualMatchReason: `Audio energy beat (${Math.round(segEnergy * 100)}% vocal intensity · ${storyGenreProfile.labelBn})`,
        startTime,
        endTime,
        setting: chosenSetting,
        timeOfDay: isFinal ? 'sunset' : i === 0 ? 'dawn' : i % 2 === 1 ? 'afternoon' : 'sunset',
        weather: isFinal ? 'fireflies' : storyGenreProfile.defaultWeather,
        action: isFinal ? 'quote-card' : i % 2 === 0 ? 'speaking-narrator' : 'walking-away',
        accentColor:
          storyGenreProfile.preferredAccents[(storySeed + i) % storyGenreProfile.preferredAccents.length] ||
          '#E5A93C',
        emotion,
        cameraShot: i === 0 ? 'wide-establishing' : i % 2 === 0 ? 'close-up-portrait' : 'medium-two-shot',
        cameraMotion: i % 2 === 0 ? 'dolly-in' : 'pan-right',
        motif: i === 0 ? 'none' : 'none',
        focalPointX: i % 3 === 0 ? 0.5 : i % 3 === 1 ? 0.45 : 0.55,
        visualSeed: computeStorySeed(`${storySeed}:audio-only:${i}`),
        storyGenre: storyGenreProfile.genre,
        primaryCharacter: 'narrator',
        secondaryCharacter: null,
        prop: 'none',
        headlineText: isFinal ? cleanTitle : undefined,
      });
    }
  } else {
    // Dynamic Semantic-Boundary Beat Grouping (NO hardcoded 24-scene cap!):
    // Analyzes every cue's setting, time-of-day, emotion, and cast before cutting natural scenes.
    const cueSignals = cues.map((cue) => {
      const lower = cue.text.toLowerCase();
      const explicitCandidates = scoreSettingRules(lower);
      const explicitSetting = explicitCandidates[0]?.rule.setting ?? null;
      const explicitTime = hasAnyTimeKeyword(lower) ? detectTimeOfDay(lower, 'afternoon') : null;
      const emotionInfo = detectEmotion(lower, false);
      const charInfo = detectCharacters(lower, '');
      return {
        cue,
        explicitSetting,
        explicitTime,
        emotion: emotionInfo.emotion,
        primaryCharacter: charInfo.primary,
      };
    });

    const groups = segmentStoryIntoBeats(cueSignals, duration);

    let previousSetting: SceneSetting | undefined;
    const directedHistory: Array<{
      setting: SceneSetting;
      action: SceneAction;
      cameraShot: CameraShot;
      cameraMotion: CameraMotion;
      timeOfDay: TimeOfDay;
    }> = [];

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const combinedText = group.map((c) => c.text).join(' ');
      const cls = classifySceneText(
        combinedText,
        i,
        groups.length,
        fullStoryContext,
        previousSetting
      );

      const directed = directBeatProgression({
        sceneIndex: i,
        totalScenes: groups.length,
        storySeed,
        genreProfile: storyGenreProfile,
        spokenText: combinedText,
        hasExplicitSetting: Boolean(cls.hasExplicitSetting),
        baseSetting: cls.setting,
        baseTimeOfDay: cls.timeOfDay,
        baseAction: cls.action,
        baseCameraShot: cls.cameraShot,
        baseCameraMotion: cls.cameraMotion,
        baseAccentColor: cls.accentColor,
        emotion: cls.emotion,
        hasSecondaryCharacter: Boolean(cls.secondaryCharacter),
        previousScenes: directedHistory,
      });

      previousSetting = directed.setting;
      directedHistory.push({
        setting: directed.setting,
        action: directed.action,
        cameraShot: directed.cameraShot,
        cameraMotion: directed.cameraMotion,
        timeOfDay: directed.timeOfDay,
      });

      const startTime = i === 0 ? 0 : Number(group[0].startTime.toFixed(2));
      const endTime =
        i === groups.length - 1
          ? Number(duration.toFixed(2))
          : Number(groups[i + 1][0].startTime.toFixed(2));

      const shortTitle =
        group[0].text.length > 34 ? `${group[0].text.slice(0, 34).trim()}…` : group[0].text;
      const summary =
        combinedText.length > 130 ? `${combinedText.slice(0, 130).trim()}…` : combinedText;
      const effectiveLabelEn =
        directed.setting !== cls.setting ? SETTING_LABELS[directed.setting] : cls.labelEn;

      scenes.push({
        id: `scene-${i + 1}`,
        chapterNumber: String(i + 1).padStart(2, '0'),
        titleBn: shortTitle,
        titleEn: effectiveLabelEn,
        summary,
        spokenExcerpt: combinedText,
        visualMatchReason:
          directed.setting !== cls.setting
            ? `${effectiveLabelEn} (${storyGenreProfile.labelBn} · ${cls.emotion})`
            : cls.visualMatchReason,
        startTime,
        endTime: Math.max(startTime + 0.5, endTime),
        setting: directed.setting,
        timeOfDay: directed.timeOfDay,
        weather: cls.weather,
        action: directed.action,
        accentColor: directed.accentColor,
        emotion: cls.emotion,
        cameraShot: directed.cameraShot,
        cameraMotion: directed.cameraMotion,
        motif: cls.motif,
        focalPointX: directed.focalPointX,
        visualSeed: directed.visualSeed,
        sceneElements: directed.sceneElements,
        storyGenre: storyGenreProfile.genre,
        primaryCharacter: cls.primaryCharacter,
        secondaryCharacter: cls.secondaryCharacter,
        prop: cls.prop,
        matchedSignals: cls.matchedSignals,
        visualPrompt: `${effectiveLabelEn} depicting: "${summary}"`,
        headlineText:
          directed.setting === 'quote-epilogue'
            ? group[group.length - 1].text
            : i === 0
              ? cleanTitle
              : undefined,
      });
    }
  }

  // Synthesize speech envelope from cues if decoded waveform wasn't supplied
  const fallbackAudio = synthesizeEnvelopeFromCues(cues, duration);
  const envelope =
    input.audioEnvelope && input.audioEnvelope.length > 0
      ? input.audioEnvelope
      : fallbackAudio.envelope;
  const envelopeHz = input.audioEnvelopeHz ?? fallbackAudio.sampleRateHz;
  const phoneticFrames =
    input.phoneticFrames && input.phoneticFrames.length > 0
      ? input.phoneticFrames
      : fallbackAudio.phoneticFrames;
  const phoneticHz = input.phoneticHz ?? fallbackAudio.phoneticHz;
  const speechPace = input.speechPace ?? fallbackAudio.pace;
  const audioSyncMode = input.audioSyncMode ?? (input.audioEnvelope ? 'decoded-audio' : 'cue-cadence');

  // Build transparent analysis summary for the Processing screen & Studio header
  const charSet = new Set<CharacterRole>();
  const emotionSet = new Set<EmotionTone>();
  const settingSet = new Set<SceneSetting>();
  for (const sc of scenes) {
    if (sc.primaryCharacter) charSet.add(sc.primaryCharacter);
    if (sc.secondaryCharacter) charSet.add(sc.secondaryCharacter);
    if (sc.emotion) emotionSet.add(sc.emotion);
    settingSet.add(sc.setting);
  }

  const detectedCharacters = Array.from(charSet);
  const dominantEmotions = Array.from(emotionSet);
  const primarySettings = Array.from(settingSet);

  const characterProfiles = buildCharacterRegistry(detectedCharacters);
  const characterBible = formatCharacterBibleFromProfiles(characterProfiles);
  const transitions: SceneTransitionName[] = [
    'cross-dissolve',
    'light-leak',
    'iris-glow',
    'directional-wipe',
  ];

  // Enrich every scene with locked character IDs, detailed visual storytelling, and smooth transitions
  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];
    const ids: string[] = [];
    const pProf = characterProfiles.find((p) => p.role === (sc.primaryCharacter ?? 'narrator'));
    if (pProf) ids.push(pProf.characterId);
    if (sc.secondaryCharacter) {
      const sProf = characterProfiles.find((p) => p.role === sc.secondaryCharacter);
      if (sProf && !ids.includes(sProf.characterId)) ids.push(sProf.characterId);
    }
    sc.characterIds = ids;
    sc.visualStorytelling = sc.visualStorytelling || sc.visualPrompt || sc.summary;
    sc.characterActions = sc.characterActions || ACTION_LABELS[sc.action];
    sc.facialExpression = sc.facialExpression || EMOTION_LABELS[sc.emotion ?? 'calm'];
    sc.bodyLanguage =
      sc.bodyLanguage ||
      (sc.action === 'walking-away'
        ? 'Steady purposeful stride matching narration cadence'
        : sc.action === 'celebrating-proud'
          ? 'Lifted posture, open expressive arms'
          : 'Natural expressive gestures synced to voiceover');
    sc.environmentDetails = sc.environmentDetails || SETTING_LABELS[sc.setting];
    sc.importantProps =
      sc.importantProps ?? (sc.prop && sc.prop !== 'none' ? [sc.prop] : []);
    sc.lightingColor = sc.lightingColor || `${TIME_OF_DAY_LABELS[sc.timeOfDay]} · ${sc.accentColor}`;
    sc.transitionToNext = sc.transitionToNext || transitions[i % transitions.length];
  }

  const audioSrtSync = analyzeAudioSrtSync({
    hasAudio: Boolean(input.audioUrl),
    audioDuration: input.audioDuration ?? duration,
    cues,
    hasSrt: Boolean(input.srtText?.trim()),
    hasScript: Boolean(input.scriptText?.trim()),
  });

  const propSet = new Set<string>();
  for (const sc of scenes) {
    if (sc.prop && sc.prop !== 'none') propSet.add(sc.prop);
    if (sc.motif && sc.motif !== 'none') propSet.add(MOTIF_LABELS[sc.motif]);
  }

  const firstSummary = scenes[0]?.summary || cleanTitle;
  const midSummary = scenes[Math.floor(scenes.length / 2)]?.summary || firstSummary;
  const lastSummary = scenes[scenes.length - 1]?.summary || midSummary;

  const storyIntelligence: StoryIntelligenceProfile = {
    theme: `${cleanTitle} — ${SETTING_LABELS[primarySettings[0] ?? 'park-nature']}`,
    moralOrMessage: lastSummary,
    beginningArc: firstSummary,
    middleArc: midSummary,
    endingArc: lastSummary,
    historicalCulturalContext: /[\u0980-\u09FF]/.test(fullStoryContext)
      ? 'Bengali cultural & contemporary narrative atmosphere'
      : 'Cinematic contemporary storytelling environment',
    emotionalArc: scenes.map((s) => s.emotion ?? 'calm'),
    locations: primarySettings.map((s) => SETTING_LABELS[s]),
    importantObjects: Array.from(propSet),
    audioSrtSync,
  };

  const narrativeHighlights: string[] = [
    `${scenes.length} story-matched scenes directed across ${SETTING_LABELS[primarySettings[0]]}${primarySettings.length > 1 ? ` & ${primarySettings.length - 1} more` : ''}`,
    `Cast locked (${characterProfiles.length}): ${characterProfiles.slice(0, 3).map((c) => c.name.split(' (')[0]).join(', ')}`,
    audioSyncMode === 'decoded-audio'
      ? `Voiceover waveform decoded (${speechPace} pace) for live lip-sync & gestures`
      : `Script cadence mapped (${speechPace} pace) for lip-sync & expressive acting`,
  ];

  const builtProject: AnimationProject = {
    id: `custom-${Date.now()}`,
    title: cleanTitle,
    subtitle: `${scenes.length} analyzed scenes · 16:9 & 9:16 ready`,
    audioUrl: input.audioUrl ?? null,
    audioFileName: input.audioFileName ?? null,
    audioEnvelope: envelope,
    audioEnvelopeHz: envelopeHz,
    phoneticFrames,
    phoneticHz,
    visualStyle: input.visualStyle ?? 'storybook-warm',
    characterBible,
    characterProfiles,
    storyIntelligence,
    directorEngine: 'local-engine',
    analysis: {
      totalWords,
      cueCount: cues.length,
      sceneCount: scenes.length,
      storyGenre: storyGenreProfile.genre,
      detectedCharacters,
      dominantEmotions,
      primarySettings,
      speechPace,
      audioSyncMode,
      narrativeHighlights,
    },
    duration,
    cues,
    englishTranslations: {},
    scenes,
    isDemo: false,
  };

  builtProject.qualityAudit = auditProjectQuality(builtProject);
  return builtProject;
}

/**
 * Re-directs a single scene (used by automated Quality Control retry / user scene regeneration)
 * keeping character consistency locked while diversifying camera, action, and setting when flagged.
 */
export function redirectSingleSceneLocally(
  project: AnimationProject,
  sceneId: string,
  customInstruction?: string
): AnimationProject {
  const idx = project.scenes.findIndex((s) => s.id === sceneId);
  if (idx < 0) return project;

  const target = project.scenes[idx];
  const prev = idx > 0 ? project.scenes[idx - 1] : undefined;
  const fullStoryContext = [
    project.title,
    project.cues.map((c) => c.text).join(' '),
  ].join(' ');
  const combinedSource = [
    customInstruction?.trim() || '',
    target.spokenExcerpt || target.summary,
  ]
    .filter(Boolean)
    .join(' ');

  const cls = classifySceneText(
    combinedSource,
    idx + 1,
    project.scenes.length,
    fullStoryContext,
    prev?.setting
  );

  const motions: CameraMotion[] = [
    'dolly-in',
    'pan-right',
    'tracking',
    'dolly-out',
    'pan-left',
    'tilt-up',
  ];
  const nextMotion =
    cls.cameraMotion === target.cameraMotion
      ? motions[(motions.indexOf(target.cameraMotion ?? 'dolly-in') + 1) % motions.length]
      : cls.cameraMotion;

  const altActions: SceneAction[] = [
    'conversation',
    'speaking-narrator',
    'walking-away',
    'celebrating-proud',
    'studying',
    'working-desk',
  ];
  const altShots: CameraShot[] = [
    'close-up-portrait',
    'medium-two-shot',
    'wide-establishing',
    'tracking-pan',
  ];
  const altEmotions: EmotionTone[] = [
    'determined',
    'emotional',
    'calm',
    'inspiring',
    'worried',
  ];

  const isRepetitiveWithNeighbors =
    cls.setting === target.setting &&
    cls.action === target.action &&
    ((prev && prev.setting === cls.setting && prev.action === cls.action) ||
      !customInstruction?.trim());

  const nextAction = isRepetitiveWithNeighbors
    ? altActions[(altActions.indexOf(target.action) + 1) % altActions.length]
    : cls.action;
  const nextShot = isRepetitiveWithNeighbors
    ? altShots[(altShots.indexOf(target.cameraShot ?? 'medium-two-shot') + 1) % altShots.length]
    : cls.cameraShot;
  const nextEmotion = isRepetitiveWithNeighbors
    ? altEmotions[(altEmotions.indexOf(target.emotion ?? 'calm') + 1) % altEmotions.length]
    : cls.emotion;

  const updatedScenes = project.scenes.map((s) =>
    s.id === sceneId
      ? {
          ...s,
          setting: cls.setting,
          timeOfDay: cls.timeOfDay,
          weather: cls.weather,
          action: nextAction,
          emotion: nextEmotion,
          cameraShot: nextShot,
          cameraMotion: nextMotion,
          motif: cls.motif,
          accentColor: cls.accentColor,
          prop: cls.prop,
          focalPointX: 0.5,
          visualMatchReason: customInstruction?.trim()
            ? `Re-directed: ${customInstruction.trim().slice(0, 64)}`
            : `${cls.labelEn} (${nextShot.replace(/-/g, ' ')})`,
          visualPrompt: customInstruction?.trim()
            ? `${cls.labelEn}: ${customInstruction.trim()}`
            : s.visualPrompt,
          presetSceneId: undefined,
          customSvg: undefined,
        }
      : s
  );

  const updated: AnimationProject = {
    ...project,
    scenes: updatedScenes,
  };
  updated.qualityAudit = auditProjectQuality(updated);
  return updated;
}

export function getProjectSceneAtTime(project: AnimationProject, timeSeconds: number): SceneSpec {
  const clamped = Math.max(0, Math.min(timeSeconds, project.duration));
  for (let i = 0; i < project.scenes.length; i++) {
    const s = project.scenes[i];
    if (clamped >= s.startTime && clamped < s.endTime) {
      return s;
    }
  }
  return project.scenes[project.scenes.length - 1];
}

export function exportProjectToJson(project: AnimationProject): string {
  const serializable = {
    version: 4,
    title: project.title,
    subtitle: project.subtitle,
    visualStyle: project.visualStyle ?? 'storybook-warm',
    characterBible: project.characterBible,
    characterProfiles: project.characterProfiles,
    storyIntelligence: project.storyIntelligence,
    qualityAudit: project.qualityAudit,
    directorEngine: project.directorEngine ?? 'local-engine',
    duration: project.duration,
    cues: project.cues,
    englishTranslations: project.englishTranslations,
    scenes: project.scenes,
    analysis: project.analysis,
  };
  return JSON.stringify(serializable, null, 2);
}

export function parseProjectFromJson(rawJson: string): AnimationProject {
  const parsed = JSON.parse(rawJson);
  if (!parsed || typeof parsed.title !== 'string' || !Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
    throw new Error('Invalid project JSON: missing title or scenes.');
  }
  const duration = typeof parsed.duration === 'number' && parsed.duration > 1 ? parsed.duration : 30;
  const cues: SubtitleCue[] = Array.isArray(parsed.cues) ? parsed.cues : [];
  const synth = synthesizeEnvelopeFromCues(cues, duration);
  const imported: AnimationProject = {
    id: `imported-${Date.now()}`,
    title: parsed.title,
    subtitle: typeof parsed.subtitle === 'string' ? parsed.subtitle : 'Imported Open-Source Project',
    audioUrl: null,
    audioFileName: null,
    audioEnvelope: synth.envelope,
    audioEnvelopeHz: synth.sampleRateHz,
    phoneticFrames: synth.phoneticFrames,
    phoneticHz: synth.phoneticHz,
    visualStyle: parsed.visualStyle ?? 'storybook-warm',
    characterBible: typeof parsed.characterBible === 'string' ? parsed.characterBible : undefined,
    characterProfiles: Array.isArray(parsed.characterProfiles) ? parsed.characterProfiles : undefined,
    storyIntelligence: parsed.storyIntelligence,
    directorEngine: parsed.directorEngine === 'gemini-ai' ? 'gemini-ai' : 'local-engine',
    analysis: parsed.analysis,
    duration,
    cues,
    englishTranslations:
      parsed.englishTranslations && typeof parsed.englishTranslations === 'object'
        ? parsed.englishTranslations
        : {},
    scenes: parsed.scenes,
    isDemo: false,
  };
  imported.qualityAudit = auditProjectQuality(imported);
  return imported;
}
