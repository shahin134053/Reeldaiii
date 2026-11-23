import { SubtitleCue, parseSrt } from './srtParser';

export type CharacterBodyStructure = 'slim' | 'average' | 'broad';
export type CharacterAccessory =
  | 'glasses'
  | 'mustache'
  | 'beard'
  | 'gamchha'
  | 'scarf'
  | 'stethoscope'
  | 'cap'
  | 'tupi'
  | 'hat'
  | 'crown'
  | 'watch';

export type CharacterRenderMode = 'rig-sync' | 'illustrated-cutout';

export interface CharacterProfile {
  characterId: string;
  role:
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
  name: string;
  ageAppearance: string;
  hairStyle: string;
  hairStyleId?: string;
  clothing: string;
  skinTone: string;
  skinShadow: string;
  skinHighlight: string;
  hairColor: string;
  hairHighlight: string;
  outfitColor: string;
  outfitShadow: string;
  pantsColor: string;
  accentColor: string;
  bodyStructure: CharacterBodyStructure;
  personality: string;
  isFemale: boolean;
  isElder: boolean;
  accessories: CharacterAccessory[];
  isCustom?: boolean;
  /** Optional link to one of the 17 animated 2D Character artwork assets */
  sourceAssetId?: string;
  /** Optional resolved URL of the uploaded 2D Character Sheet artwork */
  referenceSheetUrl?: string;
  /** Render mode: 'rig-sync' (full 10-viseme animated rig) or 'illustrated-cutout' (2D sheet artwork cutout) */
  renderMode?: CharacterRenderMode;
}

export interface AudioSrtSyncReport {
  hasAudio: boolean;
  hasSrt: boolean;
  hasScript: boolean;
  audioDurationSeconds: number | null;
  srtDurationSeconds: number | null;
  driftSeconds: number | null;
  status: 'synced' | 'minor-drift' | 'mismatch' | 'script-timed' | 'missing';
  message: string;
}

export interface StoryIntelligenceProfile {
  theme: string;
  moralOrMessage: string;
  beginningArc: string;
  middleArc: string;
  endingArc: string;
  historicalCulturalContext: string;
  emotionalArc: string[];
  locations: string[];
  importantObjects: string[];
  audioSrtSync: AudioSrtSyncReport;
}

export type PipelineStepStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface PipelineStepState {
  stepNumber: number;
  id:
    | 'upload-validation'
    | 'audio-decoding'
    | 'speech-energy'
    | 'subtitle-sync'
    | 'story-understanding'
    | 'character-profiles'
    | 'location-continuity'
    | 'scene-segmentation'
    | 'acting-direction'
    | 'camera-choreography'
    | 'framing-calibration'
    | 'scene-illustration'
    | 'motion-sync'
    | 'quality-control'
    | 'export-ready';
  label: string;
  labelBn: string;
  status: PipelineStepStatus;
  detail: string;
}

export type SceneBuildStatus = 'pending' | 'generating' | 'ready' | 'flagged' | 'failed';

export interface SceneStatusEntry {
  sceneId: string;
  chapterNumber: string;
  titleBn: string;
  status: SceneBuildStatus;
  message?: string;
}

export interface QualityAuditIssue {
  id: string;
  severity: 'error' | 'warning';
  sceneId?: string;
  chapterNumber?: string;
  category:
    | 'audio'
    | 'subtitles'
    | 'relevance'
    | 'consistency'
    | 'repetition'
    | 'aspect-ratio';
  message: string;
}

export interface QualityAuditReport {
  score: number;
  passed: boolean;
  checkedAt: string;
  issues: QualityAuditIssue[];
  flaggedSceneIds: string[];
  summary: string;
}

export interface InputValidationInput {
  hasAudio: boolean;
  audioFileName?: string | null;
  audioDuration?: number;
  srtText: string;
  scriptText: string;
  allowScriptOnly?: boolean;
}

export interface InputValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  parsedCueCount: number;
  syncReport: AudioSrtSyncReport;
}

const VALID_AUDIO_EXT_RE = /\.(mp3|wav|m4a|ogg|aac|flac|webm)$/i;

/**
 * Checks whether an uploaded audio filename has a supported browser-decodable audio format.
 */
export function isSupportedAudioFileName(fileName?: string | null): boolean {
  if (!fileName) return true;
  return VALID_AUDIO_EXT_RE.test(fileName.trim());
}

/**
 * Compares Voiceover Audio duration against SRT cue timestamps to verify timing alignment.
 */
export function analyzeAudioSrtSync(params: {
  hasAudio: boolean;
  audioDuration?: number | null;
  cues: SubtitleCue[];
  hasSrt: boolean;
  hasScript: boolean;
  allowScriptOnly?: boolean;
}): AudioSrtSyncReport {
  const { hasAudio, audioDuration, cues, hasSrt, hasScript, allowScriptOnly = false } = params;
  const audioDur =
    typeof audioDuration === 'number' && Number.isFinite(audioDuration) && audioDuration > 0
      ? Number(audioDuration.toFixed(2))
      : null;
  const srtDur =
    cues.length > 0 ? Number(cues[cues.length - 1].endTime.toFixed(2)) : null;

  if (!hasAudio) {
    if (allowScriptOnly && (hasScript || hasSrt)) {
      return {
        hasAudio: false,
        hasSrt,
        hasScript,
        audioDurationSeconds: null,
        srtDurationSeconds: srtDur,
        driftSeconds: 0,
        status: 'script-timed',
        message: 'Script-Only Quick Preview: স্ক্রিপ্ট ও সাবটাইটেল থেকে অটো-টাইমলাইন তৈরি হবে।',
      };
    }
    return {
      hasAudio: false,
      hasSrt,
      hasScript,
      audioDurationSeconds: audioDur,
      srtDurationSeconds: srtDur,
      driftSeconds: null,
      status: 'missing',
      message: 'Voiceover অডিও পাওয়া যায়নি। নির্ভুল সিঙ্ক ও রেন্ডারের জন্য অডিও যুক্ত করুন।',
    };
  }

  if (!hasSrt && hasScript) {
    return {
      hasAudio: true,
      hasSrt: false,
      hasScript: true,
      audioDurationSeconds: audioDur,
      srtDurationSeconds: srtDur,
      driftSeconds: 0,
      status: 'script-timed',
      message: audioDur
        ? `Script-কে ${audioDur.toFixed(1)}s অডিওর সাথে স্বয়ংক্রিয়ভাবে টাইম-সিঙ্ক করা হয়েছে।`
        : 'Script থেকে স্বয়ংক্রিয় টাইমলাইন তৈরি করা হয়েছে।',
    };
  }

  if (audioDur !== null && srtDur !== null) {
    const drift = Number(Math.abs(audioDur - srtDur).toFixed(2));
    if (drift <= 2.5) {
      return {
        hasAudio: true,
        hasSrt,
        hasScript,
        audioDurationSeconds: audioDur,
        srtDurationSeconds: srtDur,
        driftSeconds: drift,
        status: 'synced',
        message: `Audio (${audioDur.toFixed(1)}s) ও SRT (${srtDur.toFixed(1)}s) নিখুঁতভাবে সিঙ্ক আছে (পার্থক্য ${drift.toFixed(1)}s)।`,
      };
    }
    if (drift <= 6.5) {
      return {
        hasAudio: true,
        hasSrt,
        hasScript,
        audioDurationSeconds: audioDur,
        srtDurationSeconds: srtDur,
        driftSeconds: drift,
        status: 'minor-drift',
        message: `Audio (${audioDur.toFixed(1)}s) ও SRT (${srtDur.toFixed(1)}s)-এর মধ্যে ${drift.toFixed(1)}s সময়ের সামান্য ব্যবধান রয়েছে।`,
      };
    }
    return {
      hasAudio: true,
      hasSrt,
      hasScript,
      audioDurationSeconds: audioDur,
      srtDurationSeconds: srtDur,
      driftSeconds: drift,
      status: 'mismatch',
      message: `Audio (${audioDur.toFixed(1)}s) এবং SRT (${srtDur.toFixed(1)}s)-এর দৈর্ঘ্যে ${drift.toFixed(1)}s পার্থক্য শনাক্ত হয়েছে।`,
    };
  }

  return {
    hasAudio: true,
    hasSrt,
    hasScript,
    audioDurationSeconds: audioDur,
    srtDurationSeconds: srtDur,
    driftSeconds: null,
    status: 'synced',
    message: 'Voiceover এবং টাইমলাইন সংযুক্ত আছে।',
  };
}

/**
 * Enforces mandatory Voiceover Audio + at least one of SRT or Script, plus format & timestamp checks.
 */
export function validateGenerationInputs(
  input: InputValidationInput
): InputValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const hasSrt = input.srtText.trim().length > 0;
  const hasScript = input.scriptText.trim().length > 0;
  const parsedCues = hasSrt ? parseSrt(input.srtText) : [];

  if (!input.hasAudio && !input.allowScriptOnly) {
    errors.push(
      'Voiceover Audio বাধ্যতামূলক। অনুগ্রহ করে একটি .mp3, .wav বা .m4a ভয়েসওভার ফাইল আপলোড করুন।'
    );
  } else if (input.hasAudio && !isSupportedAudioFileName(input.audioFileName)) {
    errors.push(
      `অডিও ফরম্যাট সমর্থিত নয় (“${input.audioFileName}”)। অনুগ্রহ করে .mp3, .wav বা .m4a ব্যবহার করুন।`
    );
  }

  if (!hasSrt && !hasScript) {
    errors.push(
      'SRT Subtitle অথবা Story Script-এর মধ্যে অন্তত একটি প্রদান করতে হবে।'
    );
  }

  if (hasSrt && parsedCues.length === 0) {
    errors.push(
      'আপলোড করা SRT ফাইলটিতে কোনো বৈধ টাইমস্ট্যাম্প (00:00:00,000 --> 00:00:04,000) পাওয়া যায়নি।'
    );
  }

  const syncReport = analyzeAudioSrtSync({
    hasAudio: input.hasAudio,
    audioDuration: input.audioDuration ?? null,
    cues: parsedCues,
    hasSrt,
    hasScript,
    allowScriptOnly: input.allowScriptOnly,
  });

  if (syncReport.status === 'mismatch' || syncReport.status === 'minor-drift') {
    warnings.push(syncReport.message);
  } else if (input.allowScriptOnly && !input.hasAudio) {
    warnings.push('Script-Only Preview মোড চালু আছে — পরে চাইলে অডিও আপলোড করে চূড়ান্ত এক্সপোর্ট করতে পারবেন।');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    parsedCueCount: parsedCues.length,
    syncReport,
  };
}

export const PIPELINE_STEP_DEFINITIONS: Array<{
  stepNumber: number;
  id: PipelineStepState['id'];
  label: string;
  labelBn: string;
}> = [
  { stepNumber: 1, id: 'upload-validation', label: 'Upload Validation', labelBn: 'ইনপুট ও ফরম্যাট যাচাই' },
  { stepNumber: 2, id: 'audio-decoding', label: 'Voiceover Decoding', labelBn: 'ভয়েসওভার ওয়েভফর্ম ডিকোডিং' },
  { stepNumber: 3, id: 'speech-energy', label: 'Speech Cadence Mapping', labelBn: 'বক্তব্যের গতি ও বিরতি বিশ্লেষণ' },
  { stepNumber: 4, id: 'subtitle-sync', label: 'SRT / Script Time Sync', labelBn: 'সাবটাইটেল ও অডিও সময় মিলানো' },
  { stepNumber: 5, id: 'story-understanding', label: 'Story Intelligence', labelBn: 'সম্পূর্ণ গল্প ও আবেগ বিশ্লেষণ' },
  { stepNumber: 6, id: 'character-profiles', label: 'Character Consistency DNA', labelBn: 'ধারাবাহিক চরিত্রের প্রোফাইল তৈরি' },
  { stepNumber: 7, id: 'location-continuity', label: 'World & Prop Continuity', labelBn: 'লোকেশন ও গুরুত্বপূর্ণ বস্তুর ম্যাপ' },
  { stepNumber: 8, id: 'scene-segmentation', label: 'Beat Segmentation', labelBn: 'অর্থপূর্ণ দৃশ্য বিভাজন' },
  { stepNumber: 9, id: 'acting-direction', label: 'Acting & Expression Plan', labelBn: 'অভিনয়, মুখভঙ্গি ও দেহভঙ্গি নির্ধারণ' },
  { stepNumber: 10, id: 'camera-choreography', label: 'Camera Choreography', labelBn: 'ডলি, প্যান ও শট পরিকল্পনা' },
  { stepNumber: 11, id: 'framing-calibration', label: '16:9 & 9:16 Safe Framing', labelBn: '১৬:৯ ও ৯:১৬ সেফ-জোন ফ্রেমিং' },
  { stepNumber: 12, id: 'scene-illustration', label: 'Visual World Rendering', labelBn: 'দৃশ্যপট ও লেয়ার্ড আর্ট নির্মাণ' },
  { stepNumber: 13, id: 'motion-sync', label: 'Lip-Sync & Living Motion', labelBn: 'লিপ-সিঙ্ক ও পরিবেশ অ্যানিমেশন সিঙ্ক' },
  { stepNumber: 14, id: 'quality-control', label: 'Quality Control Audit', labelBn: 'অটোমেটেড কোয়ালিটি ও ফ্রেম চেক' },
  { stepNumber: 15, id: 'export-ready', label: 'Dual-Format Studio Ready', labelBn: '১৬:৯ ও ৯:১৬ আউটপুট প্রস্তুত' },
];

export function createInitialPipelineSteps(): PipelineStepState[] {
  return PIPELINE_STEP_DEFINITIONS.map((def) => ({
    ...def,
    status: 'pending',
    detail: 'অপেক্ষমাণ…',
  }));
}

export function computePipelineProgressPct(steps: PipelineStepState[]): number {
  if (steps.length === 0) return 1;
  let score = 0;
  for (const s of steps) {
    if (s.status === 'completed') score += 1;
    else if (s.status === 'processing') score += 0.45;
  }
  return Math.max(1, Math.min(100, Math.round((score / steps.length) * 100)));
}

const DEFAULT_CHARACTER_TEMPLATES: Record<CharacterProfile['role'], Omit<CharacterProfile, 'characterId'>> = {
  father: {
    role: 'father',
    name: 'Baba (বাবা)',
    ageAppearance: 'Middle-aged (45–52), weathered warm face',
    hairStyle: 'Short dark hair with silver-gray temples',
    clothing: 'Off-white cotton shirt, indigo lungi, red checkered gamchha on shoulder',
    skinTone: '#B67D58',
    skinShadow: '#8B583B',
    skinHighlight: '#CE9873',
    hairColor: '#252120',
    hairHighlight: '#7D7B78',
    outfitColor: '#DDD5C5',
    outfitShadow: '#B5AC9B',
    pantsColor: '#27465B',
    accentColor: '#B82626',
    bodyStructure: 'average',
    personality: 'Patient, sacrificing, quiet strength',
    isFemale: false,
    isElder: false,
    accessories: ['mustache', 'gamchha'],
  },
  mother: {
    role: 'mother',
    name: 'Ma (মা)',
    ageAppearance: 'Warm middle-aged mother (40–48)',
    hairStyle: 'Tied dark bun with neat center part',
    clothing: 'Crimson handloom cotton saree with golden border and draped pallu',
    skinTone: '#C8926D',
    skinShadow: '#9B6949',
    skinHighlight: '#DFAC89',
    hairColor: '#191514',
    hairHighlight: '#3A312E',
    outfitColor: '#A93848',
    outfitShadow: '#7A2230',
    pantsColor: '#8F2938',
    accentColor: '#E8B852',
    bodyStructure: 'average',
    personality: 'Affectionate, resilient, watchful',
    isFemale: true,
    isElder: false,
    accessories: ['scarf'],
  },
  'youth-boy': {
    role: 'youth-boy',
    name: 'Rafi / Student (তরুণ)',
    ageAppearance: 'Teenager / young man (15–20)',
    hairStyle: 'Neatly parted thick dark hair',
    clothing: 'Sky-blue collared shirt and navy trousers',
    skinTone: '#CA936C',
    skinShadow: '#9E6A47',
    skinHighlight: '#E2AF8A',
    hairColor: '#171413',
    hairHighlight: '#3B3532',
    outfitColor: '#5B98CA',
    outfitShadow: '#3D729F',
    pantsColor: '#1F2C40',
    accentColor: '#E5A93C',
    bodyStructure: 'slim',
    personality: 'Reflective, observant, earnest',
    isFemale: false,
    isElder: false,
    accessories: [],
  },
  'youth-girl': {
    role: 'youth-girl',
    name: 'Ananya / Young Woman (তরুণী)',
    ageAppearance: 'Young woman (16–22)',
    hairStyle: 'Long dark hair tied neatly with scarf drape',
    clothing: 'Teal-emerald kameez with warm ochre orna',
    skinTone: '#D09B76',
    skinShadow: '#A2704E',
    skinHighlight: '#E7B796',
    hairColor: '#181413',
    hairHighlight: '#3B322E',
    outfitColor: '#3D847B',
    outfitShadow: '#285D56',
    pantsColor: '#254446',
    accentColor: '#E6A856',
    bodyStructure: 'slim',
    personality: 'Expressive, hopeful, determined',
    isFemale: true,
    isElder: false,
    accessories: ['scarf'],
  },
  elder: {
    role: 'elder',
    name: 'Wise Elder (মুরুব্বি)',
    ageAppearance: 'Senior (65–75) with kind lined eyes',
    hairStyle: 'Silver-white hair and trimmed beard',
    clothing: 'Ivory panjabi with dark waistcoat and spectacles',
    skinTone: '#B98360',
    skinShadow: '#8E5E41',
    skinHighlight: '#CFA07E',
    hairColor: '#C5C3BE',
    hairHighlight: '#E8E6E0',
    outfitColor: '#ECE7DC',
    outfitShadow: '#C7C0B2',
    pantsColor: '#3B4A58',
    accentColor: '#C9963A',
    bodyStructure: 'average',
    personality: 'Dignified, wise, calm voice',
    isFemale: false,
    isElder: true,
    accessories: ['mustache', 'beard', 'glasses'],
  },
  teacher: {
    role: 'teacher',
    name: 'Teacher / Mentor (শিক্ষক)',
    ageAppearance: 'Experienced educator (40–50)',
    hairStyle: 'Combed dark hair with light graying',
    clothing: 'Cream formal shirt, charcoal trousers, classic round glasses',
    skinTone: '#BD8762',
    skinShadow: '#8F5E3F',
    skinHighlight: '#D5A27F',
    hairColor: '#24201E',
    hairHighlight: '#5A5550',
    outfitColor: '#E2DACB',
    outfitShadow: '#B9B09E',
    pantsColor: '#2E3440',
    accentColor: '#5B4636',
    bodyStructure: 'average',
    personality: 'Firm, guiding, principled',
    isFemale: false,
    isElder: false,
    accessories: ['mustache', 'glasses'],
  },
  professional: {
    role: 'professional',
    name: 'Creator / Engineer (পেশাজীবী)',
    ageAppearance: 'Young adult (25–34)',
    hairStyle: 'Modern clean side-swept dark hair',
    clothing: 'Slate-navy blazer over crisp shirt with amber pocket accent',
    skinTone: '#C7906A',
    skinShadow: '#9A6746',
    skinHighlight: '#DFAC89',
    hairColor: '#1B1817',
    hairHighlight: '#3E3835',
    outfitColor: '#2B3A4E',
    outfitShadow: '#1C2736',
    pantsColor: '#1B222E',
    accentColor: '#E5A93C',
    bodyStructure: 'average',
    personality: 'Focused, innovative, articulate',
    isFemale: false,
    isElder: false,
    accessories: ['watch'],
  },
  doctor: {
    role: 'doctor',
    name: 'Doctor (চিকিৎসক)',
    ageAppearance: 'Adult physician (32–44)',
    hairStyle: 'Neatly styled dark hair',
    clothing: 'Crisp white medical coat over teal scrub & stethoscope',
    skinTone: '#C8926D',
    skinShadow: '#9A6847',
    skinHighlight: '#E0AE8D',
    hairColor: '#1E1B1A',
    hairHighlight: '#4A4542',
    outfitColor: '#EEF2F5',
    outfitShadow: '#CBD4DC',
    pantsColor: '#274252',
    accentColor: '#3C8D8E',
    bodyStructure: 'average',
    personality: 'Calm, attentive, reassuring',
    isFemale: false,
    isElder: false,
    accessories: ['glasses', 'stethoscope'],
  },
  narrator: {
    role: 'narrator',
    name: 'Storyteller (কথক)',
    ageAppearance: 'Expressive adult host (28–38)',
    hairStyle: 'Clean dark hair with warm studio rim lighting',
    clothing: 'Charcoal-indigo jacket with warm amber collar trim',
    skinTone: '#C68F69',
    skinShadow: '#986544',
    skinHighlight: '#DFAD8A',
    hairColor: '#1A1716',
    hairHighlight: '#423B38',
    outfitColor: '#394356',
    outfitShadow: '#242B3A',
    pantsColor: '#1B202B',
    accentColor: '#E5A93C',
    bodyStructure: 'average',
    personality: 'Charismatic, empathetic, narrative clarity',
    isFemale: false,
    isElder: false,
    accessories: [],
  },
  friend: {
    role: 'friend',
    name: 'Companion (সহপাঠী / বন্ধু)',
    ageAppearance: 'Same age peer',
    hairStyle: 'Casual tousled dark hair',
    clothing: 'Warm terracotta casual overshirt and dark denim',
    skinTone: '#C28A65',
    skinShadow: '#966343',
    skinHighlight: '#DAA581',
    hairColor: '#1A1614',
    hairHighlight: '#3E3631',
    outfitColor: '#C57B44',
    outfitShadow: '#96582B',
    pantsColor: '#273140',
    accentColor: '#E6CFA0',
    bodyStructure: 'average',
    personality: 'Lively, candid, supportive',
    isFemale: false,
    isElder: false,
    accessories: [],
  },
};

/**
 * Generates a persistent CharacterProfile registry locked across every scene in the project
 * so characters never morph hair, skin tone, clothing palette, or props between shots.
 */
export function buildCharacterRegistry(
  roles: CharacterProfile['role'][],
  aiOverrides?: Partial<CharacterProfile>[]
): CharacterProfile[] {
  const uniqueRoles = Array.from(new Set(roles.length > 0 ? roles : ['narrator'])) as CharacterProfile['role'][];

  return uniqueRoles.map((role, idx) => {
    const base = DEFAULT_CHARACTER_TEMPLATES[role] ?? DEFAULT_CHARACTER_TEMPLATES.narrator;
    const override = aiOverrides?.find(
      (o) => o.role === role || (o.characterId && o.characterId === `char-${role}`)
    );

    const outfitColor =
      override?.outfitColor && /^#[0-9a-fA-F]{6}$/.test(override.outfitColor)
        ? override.outfitColor
        : base.outfitColor;
    const skinTone =
      override?.skinTone && /^#[0-9a-fA-F]{6}$/.test(override.skinTone)
        ? override.skinTone
        : base.skinTone;
    const hairColor =
      override?.hairColor && /^#[0-9a-fA-F]{6}$/.test(override.hairColor)
        ? override.hairColor
        : base.hairColor;
    const accentColor =
      override?.accentColor && /^#[0-9a-fA-F]{6}$/.test(override.accentColor)
        ? override.accentColor
        : base.accentColor;

    return {
      ...base,
      ...override,
      characterId: override?.characterId || `char-${role}-${idx + 1}`,
      role,
      skinTone,
      hairColor,
      outfitColor,
      accentColor,
      accessories:
        Array.isArray(override?.accessories) && override.accessories.length > 0
          ? override.accessories
          : base.accessories,
    };
  });
}

export function formatCharacterBibleFromProfiles(profiles: CharacterProfile[]): string {
  return profiles
    .map(
      (p) =>
        `${p.name} [${p.characterId}]: ${p.ageAppearance}; ${p.hairStyle} (${p.hairColor}); ${p.clothing} (${p.outfitColor}); ${p.personality}.`
    )
    .join(' | ');
}

export interface AuditableSceneLike {
  id: string;
  chapterNumber: string;
  titleBn: string;
  summary: string;
  spokenExcerpt?: string;
  startTime: number;
  endTime: number;
  setting: string;
  action: string;
  emotion?: string;
  primaryCharacter?: string;
  focalPointX?: number;
}

export interface AuditableProjectLike {
  audioUrl: string | null;
  duration: number;
  cues: SubtitleCue[];
  scenes: AuditableSceneLike[];
  characterProfiles?: CharacterProfile[];
  storyIntelligence?: StoryIntelligenceProfile;
  scriptPreviewMode?: boolean;
  isDemo?: boolean;
}

/**
 * Automated Quality Control Audit verifying audio, subtitle alignment, scene relevance,
 * non-repetition, character consistency, and 9:16 portrait safe-zone framing.
 */
export function auditProjectQuality(project: AuditableProjectLike): QualityAuditReport {
  const issues: QualityAuditIssue[] = [];
  const flaggedSet = new Set<string>();
  let deductions = 0;

  // 1. Audio presence (soft warning in Script-Only Quick Preview mode; error in full audio mode)
  if (!project.audioUrl) {
    issues.push({
      id: 'qc-no-audio',
      severity: project.isDemo || project.scriptPreviewMode ? 'warning' : 'error',
      category: 'audio',
      message: project.scriptPreviewMode
        ? 'Script-Only Quick Preview মোড — ভয়েসওভার অডিও পরে যুক্ত করা যাবে।'
        : 'কোনো Voiceover অডিও সংযুক্ত নেই; ভিডিও অডিও ছাড়া প্লে হবে।',
    });
    deductions += project.scriptPreviewMode ? 6 : 22;
  }

  // 2. Audio vs SRT sync check
  const syncStatus = project.storyIntelligence?.audioSrtSync.status;
  if (syncStatus === 'mismatch') {
    issues.push({
      id: 'qc-audio-srt-drift',
      severity: 'warning',
      category: 'subtitles',
      message:
        project.storyIntelligence?.audioSrtSync.message ||
        'Audio ও SRT সময়রেখার মধ্যে বড় ব্যবধান রয়েছে।',
    });
    deductions += 10;
  }

  // 3. Subtitle overlap / invalid range check
  for (let i = 1; i < project.cues.length; i++) {
    if (project.cues[i].startTime < project.cues[i - 1].endTime - 0.35) {
      issues.push({
        id: `qc-sub-overlap-${i}`,
        severity: 'warning',
        category: 'subtitles',
        message: `সাবটাইটেল লাইন #${project.cues[i].index} পূর্ববর্তী লাইনের সময়ের সাথে ওভারল্যাপ করছে।`,
      });
      deductions += 4;
      break;
    }
  }

  // 4. Scene-level checks: relevance, timeline continuity, 9:16 focal bounds, character consistency
  const registeredRoles = new Set(
    (project.characterProfiles ?? []).map((p) => p.role)
  );

  for (let i = 0; i < project.scenes.length; i++) {
    const sc = project.scenes[i];
    const dur = sc.endTime - sc.startTime;

    if (dur < 0.8) {
      issues.push({
        id: `qc-short-${sc.id}`,
        severity: 'warning',
        sceneId: sc.id,
        chapterNumber: sc.chapterNumber,
        category: 'subtitles',
        message: `Scene ${sc.chapterNumber} খুবই সংক্ষিপ্ত (${dur.toFixed(1)}s)।`,
      });
      flaggedSet.add(sc.id);
      deductions += 5;
    }

    if (!sc.summary?.trim() && !sc.spokenExcerpt?.trim()) {
      issues.push({
        id: `qc-empty-context-${sc.id}`,
        severity: 'error',
        sceneId: sc.id,
        chapterNumber: sc.chapterNumber,
        category: 'relevance',
        message: `Scene ${sc.chapterNumber}-এর কোনো ভয়েসওভার বা গল্পের বিবরণ পাওয়া যায়নি।`,
      });
      flaggedSet.add(sc.id);
      deductions += 12;
    }

    if (
      registeredRoles.size > 0 &&
      sc.primaryCharacter &&
      !registeredRoles.has(sc.primaryCharacter as CharacterProfile['role'])
    ) {
      issues.push({
        id: `qc-char-${sc.id}`,
        severity: 'warning',
        sceneId: sc.id,
        chapterNumber: sc.chapterNumber,
        category: 'consistency',
        message: `Scene ${sc.chapterNumber}-এর চরিত্র (${sc.primaryCharacter}) মূল কাস্টের সাথে রেজিস্টার্ড নয়।`,
      });
      flaggedSet.add(sc.id);
      deductions += 6;
    }

    const fx = sc.focalPointX ?? 0.5;
    if (fx < 0.2 || fx > 0.8) {
      issues.push({
        id: `qc-aspect-${sc.id}`,
        severity: 'warning',
        sceneId: sc.id,
        chapterNumber: sc.chapterNumber,
        category: 'aspect-ratio',
        message: `Scene ${sc.chapterNumber}-এর 9:16 ফোকাল পয়েন্ট (${fx.toFixed(2)}) প্রান্তের খুব কাছাকাছি।`,
      });
      flaggedSet.add(sc.id);
      deductions += 6;
    }

    // Consecutive identical visual fingerprint check (>= 3 in a row)
    if (i >= 2) {
      const a = project.scenes[i - 2];
      const b = project.scenes[i - 1];
      if (
        a.setting === b.setting &&
        b.setting === sc.setting &&
        a.action === b.action &&
        b.action === sc.action &&
        (a.emotion ?? 'calm') === (b.emotion ?? 'calm') &&
        (b.emotion ?? 'calm') === (sc.emotion ?? 'calm')
      ) {
        issues.push({
          id: `qc-repeat-${sc.id}`,
          severity: 'warning',
          sceneId: sc.id,
          chapterNumber: sc.chapterNumber,
          category: 'repetition',
          message: `Scene ${sc.chapterNumber} পরপর ৩টি দৃশ্যে একই সেটিং ও অ্যাকশন পুনরাবৃত্তি করেছে।`,
        });
        flaggedSet.add(sc.id);
        deductions += 8;
      }
    }
  }

  const score = Math.max(0, Math.min(100, 100 - deductions));
  const hasErrors = issues.some((i) => i.severity === 'error');
  const passed = !hasErrors && score >= 75;

  const summary =
    issues.length === 0
      ? `সবগুলো কোয়ালিটি চেক উত্তীর্ণ (${score}/100) — গল্প-সামঞ্জস্য, চরিত্রের ধারাবাহিকতা ও 9:16 সেফ ফ্রেমিং যাচাইকৃত।`
      : `${score}/100 স্কোর · ${issues.length}টি বিষয় শনাক্ত হয়েছে${flaggedSet.size > 0 ? ` (${flaggedSet.size}টি দৃশ্য রি-ডিরেক্টযোগ্য)` : ''}।`;

  return {
    score,
    passed,
    checkedAt: new Date().toISOString(),
    issues,
    flaggedSceneIds: Array.from(flaggedSet),
    summary,
  };
}

/**
 * Formats SubtitleCues back into a clean standard .srt subtitle file string for download.
 */
export function formatCuesToSrt(cues: SubtitleCue[]): string {
  const pad = (n: number, len = 2) => String(Math.floor(n)).padStart(len, '0');
  const fmt = (sec: number) => {
    const safe = Math.max(0, sec);
    const hrs = Math.floor(safe / 3600);
    const mins = Math.floor((safe % 3600) / 60);
    const secs = Math.floor(safe % 60);
    const ms = Math.round((safe - Math.floor(safe)) * 1000) % 1000;
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(ms, 3)}`;
  };

  return cues
    .map(
      (cue, idx) =>
        `${idx + 1}\n${fmt(cue.startTime)} --> ${fmt(cue.endTime)}\n${cue.text.trim()}`
    )
    .join('\n\n');
}

/**
 * Generates a clean, soft ambient speech-cadence WAV Blob URL for explicit Sample Story presets
 * so users testing Sample Stories get a real playable audio track without breaking strict
 * Voiceover Audio validation on custom uploads.
 */
export function buildSampleNarrationWavUrl(durationSeconds = 18): string {
  const sampleRate = 16000;
  const totalSamples = Math.max(sampleRate * 4, Math.round(durationSeconds * sampleRate));
  const numChannels = 1;
  const bitsPerSample = 16;
  const dataBytes = totalSamples * numChannels * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);

  const writeAscii = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeAscii(36, 'data');
  view.setUint32(40, dataBytes, true);

  // Subtle warm acoustic pad pulse (low amplitude, pleasant for sample preview + real Audio decoding)
  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const phraseEnv = Math.max(0, Math.sin((t * Math.PI) / 2.4)) * 0.45 + 0.15;
    const tone =
      Math.sin(2 * Math.PI * 196 * t) * 0.03 +
      Math.sin(2 * Math.PI * 293.66 * t) * 0.018;
    const fade =
      t < 0.2 ? t / 0.2 : t > durationSeconds - 0.35 ? Math.max(0, (durationSeconds - t) / 0.35) : 1;
    const sample = Math.max(-1, Math.min(1, tone * phraseEnv * fade));
    view.setInt16(offset, Math.round(sample * 32767), true);
    offset += 2;
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}
