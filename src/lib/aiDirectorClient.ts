import { SubtitleCue } from './srtParser';
import {
  CameraMotion,
  CameraShot,
  CharacterRole,
  EmotionTone,
  SceneAction,
  SceneSetting,
  SceneSpec,
  SceneTransitionName,
  StoryMotif,
  TimeOfDay,
  VisualStyle,
  WeatherType,
} from './storyCompiler';
import { CharacterProfile } from './storyIntelligence';

export interface AiDirectorStatus {
  available: boolean;
  model: string;
}

export interface AiDirectedBeat {
  titleBn: string;
  titleEn: string;
  summary: string;
  visualMatchReason: string;
  spokenExcerpt: string;
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
  emotion: EmotionTone;
  cameraShot: CameraShot;
  cameraMotion: CameraMotion;
  primaryCharacter: CharacterRole;
  secondaryCharacter: CharacterRole | null;
  motif: StoryMotif;
  accentColor: string;
  focalPointX: number;
  visualPrompt: string;
  customSvg?: string;
}

export interface AiStoryIntelligencePayload {
  theme?: string;
  moralOrMessage?: string;
  beginningArc?: string;
  middleArc?: string;
  endingArc?: string;
  historicalCulturalContext?: string;
  emotionalArc?: string[];
  locations?: string[];
  importantObjects?: string[];
}

export interface AiDirectorPlanResponse {
  title: string;
  characterBible: string;
  narrativeHighlights: string[];
  storyIntelligence?: AiStoryIntelligencePayload;
  characters?: CharacterProfile[];
  beats: AiDirectedBeat[];
}

export async function fetchAiDirectorStatus(): Promise<AiDirectorStatus> {
  try {
    const res = await fetch('/api/director/status');
    if (!res.ok) return { available: false, model: 'offline' };
    return (await res.json()) as AiDirectorStatus;
  } catch {
    return { available: false, model: 'offline' };
  }
}

/**
 * Transcribes an audio Blob URL into timed SubtitleCues using the server-side Gemini endpoint.
 */
export async function transcribeVoiceoverViaServer(
  audioUrl: string,
  duration?: number
): Promise<{ cues: SubtitleCue[]; transcript: string } | null> {
  const blobRes = await fetch(audioUrl);
  const blob = await blobRes.blob();
  if (blob.size > 12 * 1024 * 1024) {
    throw new Error('Voiceover file is larger than 12MB for auto-transcription; please attach an .srt file.');
  }

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result ?? '');
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Failed to read audio file for transcription.'));
    reader.readAsDataURL(blob);
  });

  const res = await fetch('/api/director/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64: base64,
      mimeType: blob.type || 'audio/mpeg',
      duration,
    }),
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(errBody.error || `Transcription failed (${res.status})`);
  }

  return (await res.json()) as { cues: SubtitleCue[]; transcript: string };
}

/**
 * Asks the server-side Gemini Film Director to analyze the full SRT/script into tightly
 * matched visual beats aligned to exact spoken timestamps.
 */
export async function planStoryWithAiDirector(params: {
  title?: string;
  cues: SubtitleCue[];
  scriptText: string;
  duration: number;
  visualStyle: VisualStyle;
}): Promise<AiDirectorPlanResponse> {
  const res = await fetch('/api/director/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(errBody.error || `AI Director planning failed (${res.status})`);
  }

  return (await res.json()) as AiDirectorPlanResponse;
}

/**
 * Generates a bespoke multi-layered 1280x720 animated vector cinema illustration (SVG)
 * tailored literally to a single beat's spoken dialogue and visual direction.
 */
export async function illustrateBeatWithAiDirector(params: {
  spokenExcerpt: string;
  visualPrompt: string;
  characterBible: string;
  visualStyle: VisualStyle;
  timeOfDay: TimeOfDay;
  emotion: EmotionTone;
  accentColor: string;
}): Promise<{ customSvg: string }> {
  const res = await fetch('/api/director/illustrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(errBody.error || `Scene illustration failed (${res.status})`);
  }

  return (await res.json()) as { customSvg: string };
}

/**
 * Re-directs a single flagged or selected scene via the AI Director while preserving character consistency.
 */
export async function regenerateSceneWithAiDirector(params: {
  scene: SceneSpec;
  characterBible: string;
  visualStyle: VisualStyle;
  customInstruction?: string;
}): Promise<{ updatedBeat: Partial<AiDirectedBeat> }> {
  const res = await fetch('/api/director/regenerate-scene', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(errBody.error || `Scene regeneration failed (${res.status})`);
  }

  return (await res.json()) as { updatedBeat: Partial<AiDirectedBeat> };
}
