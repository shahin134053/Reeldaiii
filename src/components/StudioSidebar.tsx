import React, { useRef, useState } from 'react';
import {
  Upload,
  FileAudio,
  FileText,
  Sparkles,
  RotateCcw,
  FolderUp,
  Save,
  Sliders,
  Plus,
  Trash2,
  X,
  Check,
  FileCode2,
  AlertCircle,
  Type,
  Image as ImageIcon,
  ChevronDown,
  KeyRound,
  ShieldCheck,
  Crown,
} from 'lucide-react';
import {
  ACTION_LABELS,
  AnimationProject,
  CAMERA_SHOT_LABELS,
  CHARACTER_LABELS,
  CameraShot,
  CharacterRole,
  EMOTION_LABELS,
  EmotionTone,
  MOTIF_LABELS,
  SETTING_LABELS,
  SceneAction,
  SceneSetting,
  SceneSpec,
  StoryMotif,
  TIME_OF_DAY_LABELS,
  TimeOfDay,
  VISUAL_STYLE_LABELS,
  VisualStyle,
  WEATHER_LABELS,
  WeatherType,
  deriveTitleFromContent,
  exportProjectToJson,
  parseProjectFromJson,
} from '../lib/storyCompiler';
import { parseSrt } from '../lib/srtParser';
import { formatTimecode } from '../lib/storyboard';
import {
  analyzeAudioSrtSync,
  buildSampleNarrationWavUrl,
  CharacterRenderMode,
  validateGenerationInputs,
} from '../lib/storyIntelligence';
import {
  BrandingConfig,
  DEFAULT_BRANDING_CONFIG,
  DEFAULT_SUBTITLE_CONFIG,
  SubtitleConfig,
  SubtitleFontId,
  SubtitlePosition,
  WatermarkPosition,
} from '../lib/redesignAndStudio';
import { StoryIntakePayload } from './CreateWorkspace';
import { ReferenceMediaUploader } from './ReferenceMediaUploader';
import { ReferenceMediaProfile } from '../lib/referenceMediaAnalyzer';
import { AppLang, L } from '../lib/i18n';
import {
  REELDAIII_BRAND,
  isStoredPaidUser,
  setStoredPaidUser,
  verifyCustomBrandAccessCode,
} from '../lib/brandAssets';
import {
  getCharacterAssetById,
  getEnvironmentAssetById,
} from '../lib/studioAssetLibrary';
import type { AssetPickerTab } from './StudioAssetPickerModal';

type StudioTab = 'director' | 'style' | 'upload';

interface StudioSidebarProps {
  lang: AppLang;
  project: AnimationProject;
  activeScene: SceneSpec;
  aiDirectorAvailable?: boolean;
  portraitZoom?: number;
  onPortraitZoomChange?: (zoom: number) => void;
  onStartProcessing: (payload: StoryIntakePayload) => void;
  onImportProject: (project: AnimationProject) => void;
  onLoadDemo: () => void;
  onUpdateScene: (sceneId: string, patch: Partial<SceneSpec>) => void;
  onUpdateProjectStyle?: (style: VisualStyle) => void;
  onUpdateSubtitleConfig?: (patch: Partial<SubtitleConfig>) => void;
  onUpdateBrandingConfig?: (patch: Partial<BrandingConfig>) => void;
  onApplyReferenceMedia?: (profile: ReferenceMediaProfile | null) => void;
  onOpenAssetPicker?: (tab: AssetPickerTab) => void;
  onToggleSceneCharacterMode?: (mode: CharacterRenderMode) => void;
  onClearSceneEnvironment?: () => void;
  onClearSceneCharacter?: (slot: 'primary' | 'secondary') => void;
  onRegenerateScene?: (
    sceneId: string,
    instruction?: string,
    options?: { repaintAiArt?: boolean }
  ) => Promise<void>;
  onAddScene: () => void;
  onDeleteScene: (sceneId: string) => void;
}

const SAMPLE_SCRIPT_EN =
  'Dawn by the river. Every morning golden sunlight rises over the quiet village. A mother stands in the courtyard and blesses her son before his journey. A wooden boat glides slowly across the calm water. By noon dark clouds gather and heavy monsoon rain begins to fall. Yet people keep moving forward with courage. By sunset life teaches us the quiet pride of honesty and hard work.';

const SAMPLE_SCRIPT_BN =
  'নদীর পাড়ের ভোর। প্রতিদিন ফজরের আজানের পর গ্রামে সোনালি সকাল নামে। মা ঘরের উঠোনে দাঁড়িয়ে ছেলেকে দোয়া করে বিদায় দেন। শান্ত নদীর জলে কাঠের নৌকাটি ধীরে ধীরে ভেসে চলে। দুপুরে হঠাৎ কালো মেঘ জমে মুষলধারে বৃষ্টি শুরু হয়। তবু মানুষ থেমে থাকে না। সন্ধ্যার আলোয় জীবন আমাদের শেখায় পরিশ্রম ও সততার গর্ব।';

export const StudioSidebar: React.FC<StudioSidebarProps> = ({
  lang,
  project,
  activeScene,
  aiDirectorAvailable = false,
  portraitZoom = 1.38,
  onPortraitZoomChange,
  onStartProcessing,
  onImportProject,
  onLoadDemo,
  onUpdateScene,
  onUpdateProjectStyle,
  onUpdateSubtitleConfig,
  onUpdateBrandingConfig,
  onApplyReferenceMedia,
  onOpenAssetPicker,
  onToggleSceneCharacterMode,
  onClearSceneEnvironment,
  onClearSceneCharacter,
  onRegenerateScene,
  onAddScene,
  onDeleteScene,
}) => {
  const [tab, setTab] = useState<StudioTab>('director');
  const [allowScriptOnly, setAllowScriptOnly] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [scriptText, setScriptText] = useState<string>('');
  const [srtText, setSrtText] = useState<string>('');
  const [srtFileName, setSrtFileName] = useState<string | null>(null);
  const [srtCueCount, setSrtCueCount] = useState<number>(0);
  const [scriptFileName, setScriptFileName] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | undefined>(undefined);
  const [uploadVisualStyle, setUploadVisualStyle] = useState<VisualStyle>(
    project.visualStyle ?? 'storybook-warm'
  );
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [regenPrompt, setRegenPrompt] = useState<string>('');
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [regenError, setRegenError] = useState<string | null>(null);
  const [showAdvancedDirector, setShowAdvancedDirector] = useState<boolean>(false);
  const [secretCodeInput, setSecretCodeInput] = useState<string>('');
  const [secretCodeError, setSecretCodeError] = useState<string | null>(null);

  const multiFileInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const srtInputRef = useRef<HTMLInputElement | null>(null);
  const scriptInputRef = useRef<HTMLInputElement | null>(null);
  const jsonInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef<number>(0);
  const submittedAudioUrlRef = useRef<string | null>(null);

  const revokeUnusedAudioUrl = (url: string | null) => {
    if (url && url.startsWith('blob:') && url !== submittedAudioUrlRef.current) {
      URL.revokeObjectURL(url);
    }
  };

  const handleAudioFile = (file: File) => {
    revokeUnusedAudioUrl(audioUrl);
    const objectUrl = URL.createObjectURL(file);
    setAudioUrl(objectUrl);
    setAudioFileName(file.name);
    setAudioDuration(undefined);
    setFormError(null);

    const probe = new Audio(objectUrl);
    probe.addEventListener(
      'loadedmetadata',
      () => {
        if (Number.isFinite(probe.duration) && probe.duration > 0) {
          setAudioDuration(probe.duration);
        }
      },
      { once: true }
    );
    probe.load();
  };

  const handleSrtFile = async (file: File) => {
    const text = await file.text();
    const parsed = parseSrt(text);
    setSrtText(text);
    setSrtFileName(file.name);
    setSrtCueCount(parsed.length);
    setFormError(null);
  };

  const handleScriptFile = async (file: File) => {
    const text = await file.text();
    setScriptText(text);
    setScriptFileName(file.name);
    setFormError(null);
  };

  const handleImportJson = async (file: File) => {
    try {
      const text = await file.text();
      const imported = parseProjectFromJson(text);
      onImportProject(imported);
      setFeedback(`Loaded project “${imported.title}” (${imported.scenes.length} scenes).`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to parse project JSON file.');
    }
  };

  const ingestFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setFormError(null);
    const attached: string[] = [];

    for (const file of files) {
      const nameLower = file.name.toLowerCase();
      if (
        file.type.startsWith('audio/') ||
        /\.(mp3|wav|m4a|ogg|aac|flac|webm)$/i.test(nameLower)
      ) {
        handleAudioFile(file);
        attached.push(`Audio (${file.name})`);
      } else if (nameLower.endsWith('.srt')) {
        await handleSrtFile(file);
        attached.push(`SRT (${file.name})`);
      } else if (nameLower.endsWith('.json')) {
        await handleImportJson(file);
        return;
      } else if (
        file.type.startsWith('text/') ||
        /\.(txt|md)$/i.test(nameLower)
      ) {
        await handleScriptFile(file);
        attached.push(`Script (${file.name})`);
      } else {
        setFormError(
          `Unsupported file “${file.name}”. Please drop .mp3/.wav audio, .srt subtitles, or .txt script files.`
        );
      }
    }

    if (attached.length > 0) {
      setFeedback(`Attached: ${attached.join(' · ')}. Click Analyze & Generate.`);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await ingestFiles(e.dataTransfer.files);
    }
  };

  const parsedSrtCues = srtText.trim() ? parseSrt(srtText) : [];
  const syncReport = analyzeAudioSrtSync({
    hasAudio: Boolean(audioUrl),
    audioDuration: audioDuration ?? null,
    cues: parsedSrtCues,
    hasSrt: srtText.trim().length > 0,
    hasScript: scriptText.trim().length > 0,
    allowScriptOnly,
  });

  const validationPreview = validateGenerationInputs({
    hasAudio: Boolean(audioUrl),
    audioFileName,
    audioDuration,
    srtText,
    scriptText,
    allowScriptOnly,
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFeedback(null);

    if (!validationPreview.valid) {
      setFormError(validationPreview.errors.join(' '));
      return;
    }

    submittedAudioUrlRef.current = audioUrl;
    onStartProcessing({
      title: title.trim() || undefined,
      srtText,
      scriptText,
      visualStyle: uploadVisualStyle,
      audioUrl,
      audioFileName,
      audioDuration,
      allowScriptOnly,
    });
  };

  const handleLogoFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateBrandingConfig?.({
          enabled: true,
          logoDataUrl: reader.result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const subtitleCfg = project.subtitleConfig ?? DEFAULT_SUBTITLE_CONFIG;
  const brandingCfg = project.brandingConfig ?? DEFAULT_BRANDING_CONFIG;
  const isPaidUser = Boolean(brandingCfg.customAccessUnlocked);

  React.useEffect(() => {
    if (!brandingCfg.customAccessUnlocked && isStoredPaidUser()) {
      onUpdateBrandingConfig?.({ customAccessUnlocked: true });
    }
  }, [brandingCfg.customAccessUnlocked, onUpdateBrandingConfig]);

  const handleApplySecretCode = () => {
    if (verifyCustomBrandAccessCode(secretCodeInput)) {
      setStoredPaidUser(true);
      onUpdateBrandingConfig?.({
        customAccessUnlocked: true,
        enabled: true,
        position: brandingCfg.position || 'top-right',
      });
      setSecretCodeError(null);
      setSecretCodeInput('');
    } else {
      setSecretCodeError(
        L(
          lang,
          'Invalid secret access code. Please check your code and try again.',
          'সঠিক সিক্রেট কোড নয়। অনুগ্রহ করে সঠিক কোডটি লিখে আবার চেষ্টা করুন।'
        )
      );
    }
  };

  const handleExportJson = () => {
    const json = exportProjectToJson(project);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/[^a-z0-9\u0980-\u09ff]+/gi, '-') || 'story-project'}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const previewAutoTitle =
    !title.trim() && (scriptText.trim() || srtText.trim() || audioFileName)
      ? deriveTitleFromContent(
          undefined,
          scriptText,
          parsedSrtCues,
          audioFileName
        )
      : null;

  return (
    <aside className="flex flex-col rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface)]">
      {/* Studio Inspector Tabs */}
      <div
        role="tablist"
        aria-label={L(lang, 'Studio tools', 'স্টুডিও টুলস')}
        className="grid grid-cols-3 gap-1 border-b border-[var(--ck-border-subtle)] p-1.5"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'director'}
          onClick={() => setTab('director')}
          className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium transition-colors whitespace-nowrap ${
            tab === 'director'
              ? 'bg-[var(--ck-surface-hover)] text-[var(--ck-text)]'
              : 'text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]'
          }`}
        >
          <Sliders className="h-3.5 w-3.5 shrink-0" />
          <span>{L(lang, 'Director', 'ডিরেক্টর')}</span>
        </button>

        <button
          type="button"
          role="tab"
          data-testid="sidebar-style-tab"
          aria-selected={tab === 'style'}
          onClick={() => setTab('style')}
          className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium transition-colors whitespace-nowrap ${
            tab === 'style'
              ? 'bg-[var(--ck-surface-hover)] text-[var(--ck-text)]'
              : 'text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]'
          }`}
        >
          <Type className="h-3.5 w-3.5 shrink-0" />
          <span>{L(lang, 'Sub & Brand', 'সাব ও ব্র্যান্ড')}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tab === 'upload'}
          onClick={() => setTab('upload')}
          className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium transition-colors whitespace-nowrap ${
            tab === 'upload'
              ? 'bg-[var(--ck-surface-hover)] text-[var(--ck-text)]'
              : 'text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]'
          }`}
        >
          <Upload className="h-3.5 w-3.5 shrink-0" />
          <span>{L(lang, 'Upload', 'আপলোড')}</span>
        </button>
      </div>

      {tab === 'style' ? (
        <div className="flex flex-col gap-4 p-4 sm:p-5" data-testid="subtitle-branding-panel">
          {/* Card 1: Brand Watermark & Paid User Secret Access Code Section */}
          <div
            data-testid="branding-watermark-section"
            className="space-y-3.5 rounded-xl border border-[var(--ck-border)] bg-[var(--ck-inset)] p-3.5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-[var(--ck-accent)]" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--ck-text)]">
                  {L(lang, 'Brand Logo & Watermark', 'ব্র্যান্ড লোগো ও ওয়াটারমার্ক')}
                </h2>
              </div>

              {isPaidUser ? (
                <span
                  data-testid="paid-user-badge"
                  className="inline-flex items-center gap-1 rounded-md border border-[var(--ck-success-border)] bg-[var(--ck-success-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--ck-success-text)]"
                >
                  <Crown className="h-3 w-3 text-[var(--ck-accent)]" />
                  <span>{L(lang, 'Paid User Active', 'পেইড ইউজার অ্যাক্টিভ')}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md border border-[var(--ck-border)] bg-[var(--ck-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--ck-text-muted)]">
                  <KeyRound className="h-2.5 w-2.5 text-[var(--ck-accent)]" />
                  <span>{L(lang, 'Standard Mode', 'স্ট্যান্ডার্ড মোড')}</span>
                </span>
              )}
            </div>

            {/* Default Reeldaiii Promotional Watermark Status */}
            <div className="flex items-center gap-2.5 rounded-lg border border-[var(--ck-border-subtle)] bg-[var(--ck-surface)] p-2.5">
              <img
                src={REELDAIII_BRAND.faviconUrl}
                alt="Reeldaiii icon"
                className="h-7 w-7 shrink-0 rounded-md object-contain"
              />
              <div className="min-w-0 flex-1 text-[11px] leading-snug">
                <div className="font-semibold text-[var(--ck-text)]">
                  {L(
                    lang,
                    'Reeldaiii Watermark (Bottom-Right)',
                    'Reeldaiii ওয়াটারমার্ক (নিচে ডান পাশে)'
                  )}
                </div>
                <p className="mt-0.5 text-[var(--ck-text-muted)]">
                  {isPaidUser
                    ? brandingCfg.hideOfficialWatermark
                      ? L(
                          lang,
                          'Paid User Mode: Default Reeldaiii watermark is turned off.',
                          'পেইড ইউজার মোড: ডিফল্ট Reeldaiii ওয়াটারমার্ক বন্ধ রাখা হয়েছে।'
                        )
                      : brandingCfg.enabled && (brandingCfg.logoDataUrl || brandingCfg.brandName.trim())
                        ? L(
                            lang,
                            'Paid User Mode: Your custom brand is active; Reeldaiii stays at 30% opacity.',
                            'পেইড ইউজার মোড: আপনার নিজস্ব ব্র্যান্ড চালু আছে এবং নিচে ৩০% অপাসিটিতে Reeldaiii রয়েছে।'
                          )
                        : L(
                            lang,
                            'Paid User Mode: You have full control over logo, text, position & watermark.',
                            'পেইড ইউজার মোড: আপনি নিজের মতো লোগো, নাম, পজিশন ও ওয়াটারমার্ক নিয়ন্ত্রণ করতে পারবেন।'
                          )
                    : L(
                        lang,
                        'Active in the bottom-right corner of videos by default.',
                        'প্রতিটি ভিডিওর নিচে ডান দিকে এই ওয়াটারমার্কটি ডিফল্ট হিসেবে যুক্ত থাকে।'
                      )}
                </p>
              </div>
            </div>

            {/* Have Access Code Section (Shown when Paid User is not unlocked yet) */}
            {!isPaidUser ? (
              <div
                data-testid="have-access-code-section"
                className="space-y-2.5 rounded-xl border border-[var(--ck-border-strong)] bg-[var(--ck-surface)] p-3"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ck-text)]">
                  <KeyRound className="h-3.5 w-3.5 text-[var(--ck-accent)]" />
                  <span>{L(lang, 'Have Access Code?', 'সিক্রেট অ্যাক্সেস কোড আছে? (Have Access Code)')}</span>
                </div>

                <p className="text-[11px] leading-relaxed text-[var(--ck-text-muted)]">
                  {L(
                    lang,
                    'Apply your secret access code to activate Paid User status and unlock full custom logo, brand name, and watermark controls.',
                    'আপনার সিক্রেট কোডটি বসিয়ে এপ্লাই করলেই আপনি পেইড ইউজার হিসেবে গণ্য হবেন এবং নিজের মতো লোগো, ব্র্যান্ডিং ও ওয়াটারমার্ক কাস্টমাইজ করতে পারবেন।'
                  )}
                </p>

                <div className="flex items-center gap-1.5 pt-0.5">
                  <label htmlFor="secret-access-code-input" className="sr-only">
                    {L(lang, 'Enter Secret Access Code', 'সিক্রেট অ্যাক্সেস কোড লিখুন')}
                  </label>
                  <input
                    id="secret-access-code-input"
                    data-testid="secret-access-code-input"
                    type="text"
                    inputMode="text"
                    value={secretCodeInput}
                    onChange={(e) => {
                      setSecretCodeInput(e.target.value);
                      setSecretCodeError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplySecretCode();
                      }
                    }}
                    placeholder={L(lang, 'Enter secret code…', 'সিক্রেট কোড বসান…')}
                    className="h-9 flex-1 rounded-lg border border-[var(--ck-border-strong)] bg-[var(--ck-inset)] px-3 font-mono text-xs text-[var(--ck-text)] placeholder:font-sans placeholder:text-[var(--ck-text-faint)] focus:border-[var(--ck-accent)] focus:outline-none"
                  />
                  <button
                    type="button"
                    data-testid="apply-secret-code-btn"
                    onClick={handleApplySecretCode}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[var(--ck-accent)] px-3.5 text-xs font-semibold text-[var(--ck-accent-fg)] transition-colors hover:bg-[var(--ck-accent-bright)] whitespace-nowrap"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>{L(lang, 'Apply Code', 'কোড এপ্লাই করুন')}</span>
                  </button>
                </div>

                {secretCodeError && (
                  <p
                    data-testid="secret-code-error"
                    className="text-[11px] font-medium text-[var(--ck-danger-text)]"
                  >
                    {secretCodeError}
                  </p>
                )}
              </div>
            ) : (
              /* Paid User Unlocked Controls: Full Freedom over Custom Brand & Watermark */
              <div className="space-y-3 pt-0.5" data-testid="paid-user-branding-controls">
                <div className="flex items-center justify-between rounded-lg border border-[var(--ck-success-border)] bg-[var(--ck-success-bg)] px-3 py-2 text-[11px] text-[var(--ck-success-text)]">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5 text-[var(--ck-success)]" />
                    <span>
                      {L(
                        lang,
                        'Paid User Unlocked — Full Custom Branding',
                        'পেইড ইউজার আনলকড — সম্পূর্ণ কাস্টম ব্র্যান্ডিং চালু'
                      )}
                    </span>
                  </span>
                  <button
                    type="button"
                    data-testid="reset-paid-access-btn"
                    onClick={() => {
                      setStoredPaidUser(false);
                      onUpdateBrandingConfig?.({
                        customAccessUnlocked: false,
                        enabled: false,
                        hideOfficialWatermark: false,
                      });
                    }}
                    className="text-[10px] underline opacity-85 hover:opacity-100 hover:no-underline"
                  >
                    {L(lang, 'Change Code', 'কোড পরিবর্তন')}
                  </button>
                </div>

                {/* Quick Toggles: Custom Brand On/Off + Default Reeldaiii Watermark On/Off */}
                <div className="grid grid-cols-1 gap-2 rounded-lg border border-[var(--ck-border-subtle)] bg-[var(--ck-surface)] p-2.5 text-xs">
                  <label className="flex cursor-pointer items-center justify-between gap-2">
                    <span className="font-medium text-[var(--ck-text)]">
                      {L(lang, 'Show My Custom Logo / Brand', 'আমার কাস্টম লোগো / ব্র্যান্ড দেখান')}
                    </span>
                    <input
                      type="checkbox"
                      data-testid="branding-enable-toggle"
                      checked={brandingCfg.enabled}
                      onChange={(e) => onUpdateBrandingConfig?.({ enabled: e.target.checked })}
                      className="h-4 w-4 accent-[var(--ck-accent)]"
                    />
                  </label>

                  <label className="flex cursor-pointer items-center justify-between gap-2 border-t border-[var(--ck-border-subtle)] pt-2">
                    <span className="text-[11px] text-[var(--ck-text-secondary)]">
                      {L(
                        lang,
                        'Remove Default Reeldaiii Watermark',
                        'ডিফল্ট Reeldaiii ওয়াটারমার্ক সম্পূর্ণ রিমুভ করুন'
                      )}
                    </span>
                    <input
                      type="checkbox"
                      data-testid="toggle-hide-official-watermark"
                      checked={Boolean(brandingCfg.hideOfficialWatermark)}
                      onChange={(e) =>
                        onUpdateBrandingConfig?.({ hideOfficialWatermark: e.target.checked })
                      }
                      className="h-4 w-4 accent-[var(--ck-accent)]"
                    />
                  </label>
                </div>

                {/* Custom Logo Upload + Thumbnail Preview */}
                <div className="space-y-1.5">
                  <span className="block text-[11px] font-medium text-[var(--ck-text-secondary)]">
                    {L(lang, 'Custom Brand Logo (.png, .svg, .jpg)', 'নিজস্ব ব্র্যান্ড লোগো আপলোড')}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="sr-only"
                      aria-label={L(lang, 'Upload channel logo', 'চ্যানেল লোগো আপলোড')}
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleLogoFile(e.target.files[0]);
                        e.target.value = '';
                      }}
                    />
                    {brandingCfg.logoDataUrl && (
                      <img
                        src={brandingCfg.logoDataUrl}
                        alt="Uploaded brand logo"
                        className="h-9 w-9 shrink-0 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] object-contain p-1"
                      />
                    )}
                    <button
                      type="button"
                      data-testid="upload-custom-logo-btn"
                      onClick={() => logoInputRef.current?.click()}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--ck-border-strong)] bg-[var(--ck-surface)] px-3 text-xs font-medium text-[var(--ck-text)] transition-colors hover:border-[var(--ck-accent)]"
                    >
                      <Upload className="h-3.5 w-3.5 text-[var(--ck-accent)]" />
                      <span>
                        {brandingCfg.logoDataUrl
                          ? L(lang, 'Change Logo Image', 'লোগো পরিবর্তন করুন')
                          : L(lang, 'Upload Brand Logo', 'ব্র্যান্ড লোগো আপলোড করুন')}
                      </span>
                    </button>
                    {brandingCfg.logoDataUrl && (
                      <button
                        type="button"
                        onClick={() => onUpdateBrandingConfig?.({ logoDataUrl: null })}
                        aria-label="Remove logo"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--ck-border-strong)] bg-[var(--ck-surface)] text-[var(--ck-danger)] hover:bg-[var(--ck-danger-bg)]"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Custom Channel / Brand Name */}
                <div>
                  <label htmlFor="brand-name-input" className="block text-[11px] font-medium text-[var(--ck-text-secondary)]">
                    {L(lang, 'Brand / Channel Name', 'আপনার ব্র্যান্ড বা চ্যানেলের নাম')}
                  </label>
                  <input
                    id="brand-name-input"
                    data-testid="brand-name-input"
                    type="text"
                    value={brandingCfg.brandName}
                    onChange={(e) =>
                      onUpdateBrandingConfig?.({
                        brandName: e.target.value,
                        enabled: e.target.value.trim().length > 0 ? true : brandingCfg.enabled,
                      })
                    }
                    placeholder={L(lang, 'e.g. My Story Channel', 'যেমন: আমার স্টোরি চ্যানেল')}
                    className="mt-1 h-9 w-full rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] px-3 text-xs text-[var(--ck-text)] placeholder:text-[var(--ck-text-faint)] focus:border-[var(--ck-accent)] focus:outline-none"
                  />
                </div>

                {/* 4-Corner Placement Pill Selector */}
                <div>
                  <label htmlFor="brand-pos-select" className="block text-[11px] font-medium text-[var(--ck-text-secondary)]">
                    {L(lang, 'Logo / Brand Position on Video', 'ভিডিওতে লোগোর অবস্থান (Position)')}
                  </label>
                  <select
                    id="brand-pos-select"
                    data-testid="brand-pos-select"
                    value={brandingCfg.position}
                    onChange={(e) =>
                      onUpdateBrandingConfig?.({ position: e.target.value as WatermarkPosition })
                    }
                    className="mt-1 h-9 w-full rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] px-2.5 text-xs text-[var(--ck-text)] focus:border-[var(--ck-accent)] focus:outline-none"
                  >
                    <option value="top-right">{L(lang, 'Top Right (Recommended)', 'উপরে ডান পাশে (Top Right)')}</option>
                    <option value="top-left">{L(lang, 'Top Left', 'উপরে বাম পাশে (Top Left)')}</option>
                    <option value="bottom-right">{L(lang, 'Bottom Right', 'নিচে ডান পাশে (Bottom Right)')}</option>
                    <option value="bottom-left">{L(lang, 'Bottom Left', 'নিচে বাম পাশে (Bottom Left)')}</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <div className="flex items-center justify-between text-[11px]">
                      <label htmlFor="brand-opacity-slider" className="text-[var(--ck-text-secondary)]">
                        {L(lang, 'Logo Opacity', 'লোগো অপাসিটি')}
                      </label>
                      <span className="font-mono text-[var(--ck-accent)]">{Math.round(brandingCfg.opacity * 100)}%</span>
                    </div>
                    <input
                      id="brand-opacity-slider"
                      type="range"
                      min={0.2}
                      max={1.0}
                      step={0.05}
                      value={brandingCfg.opacity}
                      onChange={(e) => onUpdateBrandingConfig?.({ opacity: Number(e.target.value) })}
                      className="mt-1 h-1.5 w-full cursor-pointer accent-[var(--ck-accent)]"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[11px]">
                      <label htmlFor="brand-scale-slider" className="text-[var(--ck-text-secondary)]">
                        {L(lang, 'Logo Size', 'লোগো সাইজ')}
                      </label>
                      <span className="font-mono text-[var(--ck-accent)]">{brandingCfg.scale.toFixed(2)}×</span>
                    </div>
                    <input
                      id="brand-scale-slider"
                      type="range"
                      min={0.6}
                      max={1.5}
                      step={0.05}
                      value={brandingCfg.scale}
                      onChange={(e) => onUpdateBrandingConfig?.({ scale: Number(e.target.value) })}
                      className="mt-1 h-1.5 w-full cursor-pointer accent-[var(--ck-accent)]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Subtitle Styling with 1-Click Quick Presets */}
          <div className="space-y-3 rounded-xl border border-[var(--ck-border)] bg-[var(--ck-inset)] p-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-[var(--ck-accent)]" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--ck-text)]">
                  {L(lang, 'Subtitle Typography & Colors', 'সাবটাইটেল ফন্ট ও রঙ')}
                </h2>
              </div>
            </div>

            {/* 1-Click Quick Subtitle Style Presets */}
            <div className="space-y-1.5">
              <span className="block text-[11px] font-medium text-[var(--ck-text-secondary)]">
                {L(lang, 'Quick Style Presets (1-Click)', '১-ক্লিক সাবটাইটেল প্রিসেট')}
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  {
                    id: 'reeldaiii-gold',
                    label: L(lang, 'Reeldaiii Gold', 'গোল্ডেন সিনেমা'),
                    patch: {
                      fontFamily: 'hind-siliguri' as SubtitleFontId,
                      primaryColor: '#FAF8F3',
                      highlightColor: '#FFAC1C',
                      boxOpacity: 0.82,
                    },
                  },
                  {
                    id: 'clean-broadcast',
                    label: L(lang, 'Clean White', 'ক্লিন হোয়াইট'),
                    patch: {
                      fontFamily: 'hind-siliguri' as SubtitleFontId,
                      primaryColor: '#FFFFFF',
                      highlightColor: '#38BDF8',
                      boxOpacity: 0.75,
                    },
                  },
                  {
                    id: 'storybook-serif',
                    label: L(lang, 'Storybook Serif', 'গল্পের বই ফন্ট'),
                    patch: {
                      fontFamily: 'noto-serif' as SubtitleFontId,
                      primaryColor: '#FFF8EC',
                      highlightColor: '#F59E0B',
                      boxOpacity: 0.85,
                    },
                  },
                  {
                    id: 'minimal-no-box',
                    label: L(lang, 'Minimal Floating', 'মিনিমাল (বক্স ছাড়া)'),
                    patch: {
                      fontFamily: 'hind-siliguri' as SubtitleFontId,
                      primaryColor: '#FFFFFF',
                      highlightColor: '#FFAC1C',
                      boxOpacity: 0.25,
                    },
                  },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    data-testid={`subtitle-preset-${preset.id}`}
                    onClick={() => onUpdateSubtitleConfig?.(preset.patch)}
                    className="flex h-8 items-center justify-between rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] px-2.5 text-[11px] font-medium text-[var(--ck-text-secondary)] transition-colors hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)]"
                  >
                    <span className="truncate">{preset.label}</span>
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/20"
                      style={{ backgroundColor: preset.patch.highlightColor }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="sub-font-select" className="block text-[11px] font-medium text-[var(--ck-text-secondary)]">
                  {L(lang, 'Font Family', 'ফন্টের ধরন')}
                </label>
                <select
                  id="sub-font-select"
                  data-testid="subtitle-font-select"
                  value={subtitleCfg.fontFamily}
                  onChange={(e) =>
                    onUpdateSubtitleConfig?.({ fontFamily: e.target.value as SubtitleFontId })
                  }
                  className="mt-1 h-8 w-full rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] px-2 text-xs text-[var(--ck-text)] focus:border-[var(--ck-accent)] focus:outline-none"
                >
                  <option value="hind-siliguri">Hind Siliguri (Clean)</option>
                  <option value="noto-serif">Noto Serif Bengali</option>
                  <option value="fraunces">Fraunces Editorial</option>
                  <option value="jetbrains-mono">JetBrains Mono</option>
                </select>
              </div>

              <div>
                <label htmlFor="sub-pos-select" className="block text-[11px] font-medium text-[var(--ck-text-secondary)]">
                  {L(lang, 'Vertical Position', 'সাবটাইটেল অবস্থান')}
                </label>
                <select
                  id="sub-pos-select"
                  data-testid="subtitle-position-select"
                  value={subtitleCfg.position}
                  onChange={(e) =>
                    onUpdateSubtitleConfig?.({ position: e.target.value as SubtitlePosition })
                  }
                  className="mt-1 h-8 w-full rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] px-2 text-xs text-[var(--ck-text)] focus:border-[var(--ck-accent)] focus:outline-none"
                >
                  <option value="bottom">{L(lang, 'Bottom Safe-Zone', 'নিচে (Bottom)')}</option>
                  <option value="middle">{L(lang, 'Center Story Stage', 'মাঝখানে (Center)')}</option>
                  <option value="top">{L(lang, 'Top Broadcast Bar', 'উপরে (Top)')}</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px]">
                <label htmlFor="sub-size-slider" className="font-medium text-[var(--ck-text-secondary)]">
                  {L(lang, 'Text Size Scale', 'লেখার আকার')}
                </label>
                <span className="font-mono tabular-nums text-[var(--ck-accent)]">
                  {subtitleCfg.fontSizeScale.toFixed(2)}×
                </span>
              </div>
              <input
                id="sub-size-slider"
                type="range"
                min={0.8}
                max={1.35}
                step={0.05}
                value={subtitleCfg.fontSizeScale}
                onChange={(e) =>
                  onUpdateSubtitleConfig?.({ fontSizeScale: Number(e.target.value) })
                }
                className="mt-1.5 h-1.5 w-full cursor-pointer accent-[var(--ck-accent)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="sub-primary-color" className="block text-[11px] font-medium text-[var(--ck-text-secondary)]">
                  {L(lang, 'Primary Text', 'মূল লেখার রঙ')}
                </label>
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] px-2 py-1">
                  <input
                    id="sub-primary-color"
                    type="color"
                    value={subtitleCfg.primaryColor}
                    onChange={(e) => onUpdateSubtitleConfig?.({ primaryColor: e.target.value })}
                    className="h-6 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                  <span className="font-mono text-[11px] text-[var(--ck-text-secondary)]">
                    {subtitleCfg.primaryColor}
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="sub-highlight-color" className="block text-[11px] font-medium text-[var(--ck-text-secondary)]">
                  {L(lang, 'Spoken Word Glow', 'উচ্চারিত শব্দের গ্লো')}
                </label>
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] px-2 py-1">
                  <input
                    id="sub-highlight-color"
                    type="color"
                    value={subtitleCfg.highlightColor}
                    onChange={(e) => onUpdateSubtitleConfig?.({ highlightColor: e.target.value })}
                    className="h-6 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                  <span className="font-mono text-[11px] text-[var(--ck-text-secondary)]">
                    {subtitleCfg.highlightColor}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px]">
                <label htmlFor="sub-box-opacity" className="font-medium text-[var(--ck-text-secondary)]">
                  {L(lang, 'Caption Backdrop Opacity', 'সাবটাইটেল বক্স অপাসিটি')}
                </label>
                <span className="font-mono tabular-nums text-[var(--ck-accent)]">
                  {Math.round(subtitleCfg.boxOpacity * 100)}%
                </span>
              </div>
              <input
                id="sub-box-opacity"
                type="range"
                min={0}
                max={0.95}
                step={0.05}
                value={subtitleCfg.boxOpacity}
                onChange={(e) =>
                  onUpdateSubtitleConfig?.({ boxOpacity: Number(e.target.value) })
                }
                className="mt-1.5 h-1.5 w-full cursor-pointer accent-[var(--ck-accent)]"
              />
            </div>
          </div>
        </div>
      ) : tab === 'upload' ? (
        <form
          onSubmit={handleGenerate}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="flex flex-col gap-4 p-4 sm:p-5"
        >
          <div>
            <h2 className="text-base font-semibold text-[var(--ck-text)]">
              Analyze New Story
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[var(--ck-text-muted)]">
              Drop voiceover, SRT, and script files below. We run a 1–100% analysis and build new 16:9 & 9:16 videos.
            </p>
          </div>

          {/* Unified Smart Multi-File Drag & Drop Zone */}
          <div
            data-testid="sidebar-dropzone"
            data-dragging={isDragging ? 'true' : 'false'}
            className={`relative rounded-xl border-2 border-dashed p-4 text-center transition-colors duration-150 ${
              isDragging
                ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)]'
                : 'border-[var(--ck-border-strong)] bg-[var(--ck-inset)] hover:border-[var(--ck-accent)]'
            }`}
          >
            <input
              ref={multiFileInputRef}
              type="file"
              multiple
              accept="audio/*,.srt,.txt,.md,.json"
              className="sr-only"
              aria-label="Upload multiple voiceover, SRT, or script files"
              onChange={(e) => {
                if (e.target.files) void ingestFiles(e.target.files);
                e.target.value = '';
              }}
            />

            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--ck-accent-soft)] text-[var(--ck-accent)]">
              <Upload className="h-4.5 w-4.5" />
            </div>

            <p className="mt-2 text-xs font-medium text-[var(--ck-text)]">
              {isDragging
                ? 'Drop files here to attach'
                : 'Drag & drop Audio, SRT & Script'}
            </p>

            <button
              type="button"
              onClick={() => multiFileInputRef.current?.click()}
              className="mt-2.5 inline-flex h-8 items-center justify-center rounded-md border border-[var(--ck-border-strong)] bg-[var(--ck-surface)] px-3 text-xs font-medium text-[var(--ck-text)] transition-colors hover:border-[var(--ck-accent)]"
            >
              Browse Files
            </button>
          </div>

          {/* Individual Audio & SRT Slots */}
          <div className="space-y-2">
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              className="sr-only"
              aria-label="Upload voiceover audio file"
              onChange={(e) => {
                if (e.target.files?.[0]) handleAudioFile(e.target.files[0]);
                e.target.value = '';
              }}
            />
            <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-inset)] px-3 py-2 text-[11px] text-[var(--ck-text-secondary)]">
              <span>Script-Only Quick Preview (no audio needed)</span>
              <input
                type="checkbox"
                checked={allowScriptOnly}
                onChange={(e) => setAllowScriptOnly(e.target.checked)}
                className="h-3.5 w-3.5 accent-[var(--ck-accent)]"
              />
            </label>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-inset)] px-3 py-2">
              <button
                type="button"
                onClick={() => audioInputRef.current?.click()}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
              >
                <FileAudio
                  className={`h-4 w-4 shrink-0 ${audioFileName ? 'text-[var(--ck-success)]' : 'text-[var(--ck-accent)]'}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-[var(--ck-text)]">
                    {audioFileName ?? (allowScriptOnly ? 'Voiceover Audio (Optional)' : 'Voiceover Audio (Required)')}
                  </div>
                  <div className="font-mono text-[11px] tabular-nums text-[var(--ck-text-muted)]">
                    {audioFileName
                      ? audioDuration
                        ? `Loaded · ${formatTimecode(audioDuration)}`
                        : 'Audio attached'
                      : allowScriptOnly
                        ? 'Script-only mode enabled'
                        : 'Required · Click or drop .mp3 / .wav'}
                  </div>
                </div>
              </button>
              {audioFileName && (
                <button
                  type="button"
                  onClick={() => {
                    revokeUnusedAudioUrl(audioUrl);
                    setAudioUrl(null);
                    setAudioFileName(null);
                    setAudioDuration(undefined);
                  }}
                  aria-label="Remove uploaded audio"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--ck-text-muted)] hover:bg-[var(--ck-surface-hover)] hover:text-[var(--ck-text)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <input
              ref={srtInputRef}
              type="file"
              accept=".srt,text/plain"
              className="sr-only"
              aria-label="Upload SRT subtitle file"
              onChange={(e) => {
                if (e.target.files?.[0]) void handleSrtFile(e.target.files[0]);
                e.target.value = '';
              }}
            />
            <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-inset)] px-3 py-2">
              <button
                type="button"
                onClick={() => srtInputRef.current?.click()}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
              >
                <FileText
                  className={`h-4 w-4 shrink-0 ${srtFileName ? 'text-[var(--ck-success)]' : 'text-[var(--ck-accent)]'}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-[var(--ck-text)]">
                    {srtFileName ?? 'SRT Subtitles'}
                  </div>
                  <div className="font-mono text-[11px] tabular-nums text-[var(--ck-text-muted)]">
                    {srtFileName
                      ? `${srtCueCount} timed cues parsed`
                      : 'Click or drop .srt file'}
                  </div>
                </div>
              </button>
              {srtFileName && (
                <button
                  type="button"
                  onClick={() => {
                    setSrtText('');
                    setSrtFileName(null);
                    setSrtCueCount(0);
                  }}
                  aria-label="Remove uploaded SRT"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--ck-text-muted)] hover:bg-[var(--ck-surface-hover)] hover:text-[var(--ck-text)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Script Text Input */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="script-textarea" className="text-xs font-medium text-[var(--ck-text-secondary)]">
                Story Script
              </label>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    revokeUnusedAudioUrl(audioUrl);
                    const sampleDur = 20;
                    setAudioUrl(buildSampleNarrationWavUrl(sampleDur));
                    setAudioFileName('sample-river-dawn.wav');
                    setAudioDuration(sampleDur);
                    setScriptText(lang === 'bn' ? SAMPLE_SCRIPT_BN : SAMPLE_SCRIPT_EN);
                    setScriptFileName(null);
                    setSrtText('');
                    setSrtFileName(null);
                    setSrtCueCount(0);
                    setFormError(null);
                    setFeedback(
                      L(
                        lang,
                        'Sample story & 20s narration track loaded.',
                        'স্যাম্পল গল্প ও ২০ সেকেন্ডের ন্যারেশন ট্র্যাক লোড হয়েছে।'
                      )
                    );
                  }}
                  className="text-[11px] font-medium text-[var(--ck-text-muted)] hover:text-[var(--ck-accent)]"
                >
                  {L(lang, 'Try Sample', 'স্যাম্পল নিন')}
                </button>
                <input
                  ref={scriptInputRef}
                  type="file"
                  accept=".txt,.md"
                  className="sr-only"
                  aria-label="Upload text script file"
                  onChange={(e) => {
                    if (e.target.files?.[0]) void handleScriptFile(e.target.files[0]);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => scriptInputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--ck-accent)] hover:underline"
                >
                  <FileCode2 className="h-3 w-3" />
                  <span>{scriptFileName ? 'Replace .txt' : 'Upload .txt'}</span>
                </button>
              </div>
            </div>

            <textarea
              id="script-textarea"
              rows={3}
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder="Paste Bengali or English script here..."
              className="mt-1.5 w-full resize-y rounded-lg border border-[var(--ck-border)] bg-[var(--ck-inset)] p-2.5 text-xs leading-relaxed text-[var(--ck-text)] placeholder:text-[var(--ck-text-faint)] focus:border-[var(--ck-accent)] focus:outline-none"
            />
          </div>

          {/* Optional Video Title */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="project-title-input" className="text-xs font-medium text-[var(--ck-text-secondary)]">
                Video Title <span className="font-normal text-[var(--ck-text-faint)]">(Optional)</span>
              </label>
              {previewAutoTitle && (
                <span className="max-w-[170px] truncate text-[11px] text-[var(--ck-accent)]">
                  Auto: “{previewAutoTitle}”
                </span>
              )}
            </div>
            <input
              id="project-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Leave blank to auto-detect from script"
              className="mt-1.5 h-9 w-full rounded-lg border border-[var(--ck-border)] bg-[var(--ck-inset)] px-3 text-xs text-[var(--ck-text)] placeholder:text-[var(--ck-text-faint)] focus:border-[var(--ck-accent)] focus:outline-none"
            />
          </div>

          {/* Visual Animation Style */}
          <div>
            <label htmlFor="upload-visual-style" className="block text-xs font-medium text-[var(--ck-text-secondary)]">
              Visual Style
            </label>
            <select
              id="upload-visual-style"
              value={uploadVisualStyle}
              onChange={(e) => setUploadVisualStyle(e.target.value as VisualStyle)}
              className="mt-1.5 h-9 w-full rounded-lg border border-[var(--ck-border)] bg-[var(--ck-inset)] px-2.5 text-xs text-[var(--ck-text)] focus:border-[var(--ck-accent)] focus:outline-none"
            >
              {(Object.keys(VISUAL_STYLE_LABELS) as VisualStyle[]).map((k) => (
                <option key={k} value={k}>
                  {VISUAL_STYLE_LABELS[k].label}
                </option>
              ))}
            </select>
          </div>

          {(audioUrl || srtText.trim() || scriptText.trim()) && (
            <div
              className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-[11px] ${
                syncReport.status === 'synced' || syncReport.status === 'script-timed'
                  ? 'border-[var(--ck-success-border)] bg-[var(--ck-success-bg)] text-[var(--ck-success-text)]'
                  : syncReport.status === 'minor-drift'
                    ? 'border-[var(--ck-warn-border)] bg-[var(--ck-warn-bg)] text-[var(--ck-warn-text)]'
                    : 'border-[var(--ck-danger-border)] bg-[var(--ck-danger-bg)] text-[var(--ck-danger-text)]'
              }`}
            >
              {syncReport.status === 'synced' || syncReport.status === 'script-timed' ? (
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--ck-success)]" />
              ) : (
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--ck-accent)]" />
              )}
              <span>{syncReport.message}</span>
            </div>
          )}

          {formError && (
            <div
              role="alert"
              className="rounded-lg border border-[var(--ck-danger-border)] bg-[var(--ck-danger-bg)] px-3 py-2 text-xs text-[var(--ck-danger-text)]"
            >
              {formError}
            </div>
          )}

          {feedback && (
            <div className="flex items-start gap-2 rounded-lg border border-[var(--ck-success-border)] bg-[var(--ck-success-bg)] px-3 py-2 text-xs text-[var(--ck-success-text)]">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--ck-success)]" />
              <span>{feedback}</span>
            </div>
          )}

          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--ck-accent)] px-4 text-xs font-semibold text-[var(--ck-accent-fg)] transition-colors hover:bg-[var(--ck-accent-bright)] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)]"
          >
            <Sparkles className="h-4 w-4" />
            <span>{L(lang, 'Analyze & Generate 16:9 + 9:16', 'বিশ্লেষণ ও ১৬:৯ + ৯:১৬ তৈরি')}</span>
          </button>

          {/* Portability Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--ck-border-subtle)] pt-3">
            <button
              type="button"
              onClick={onLoadDemo}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-[var(--ck-text-muted)] transition-colors hover:bg-[var(--ck-surface-hover)] hover:text-[var(--ck-text)]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{L(lang, 'Demo Film', 'ডেমো ফিল্ম')}</span>
            </button>

            <div className="flex items-center gap-1.5">
              <input
                ref={jsonInputRef}
                type="file"
                accept=".json,application/json"
                className="sr-only"
                aria-label={L(lang, 'Import project JSON file', 'প্রোজেক্ট JSON ইম্পোর্ট')}
                onChange={(e) => {
                  if (e.target.files?.[0]) void handleImportJson(e.target.files[0]);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => jsonInputRef.current?.click()}
                className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-[var(--ck-text-muted)] transition-colors hover:bg-[var(--ck-surface-hover)] hover:text-[var(--ck-text)]"
              >
                <FolderUp className="h-3.5 w-3.5" />
                <span>{L(lang, 'Import', 'ইম্পোর্ট')}</span>
              </button>

              <button
                type="button"
                onClick={handleExportJson}
                className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-[var(--ck-text-muted)] transition-colors hover:bg-[var(--ck-surface-hover)] hover:text-[var(--ck-text)]"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{L(lang, 'Save JSON', 'JSON সেভ')}</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-3.5 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[var(--ck-text)]">
                {L(
                  lang,
                  `Chapter ${activeScene.chapterNumber} Director`,
                  `অধ্যায় ${activeScene.chapterNumber} ডিরেক্টর`
                )}
              </h2>
              <p className="mt-0.5 font-mono text-xs tabular-nums text-[var(--ck-text-muted)]">
                {formatTimecode(activeScene.startTime)} – {formatTimecode(activeScene.endTime)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onAddScene}
                aria-label={L(lang, 'Add new scene', 'নতুন দৃশ্য যোগ করুন')}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-[var(--ck-border-strong)] px-2.5 text-xs text-[var(--ck-text)] hover:bg-[var(--ck-surface-hover)]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{L(lang, 'Add', 'যোগ')}</span>
              </button>
              {project.scenes.length > 1 && (
                <button
                  type="button"
                  onClick={() => onDeleteScene(activeScene.id)}
                  aria-label={L(lang, 'Delete active scene', 'সক্রিয় দৃশ্য মুছুন')}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--ck-border-strong)] text-[var(--ck-danger)] hover:bg-[var(--ck-danger-bg)]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Spoken-to-Visual Match + Acting Direction Context */}
          {(activeScene.spokenExcerpt ||
            activeScene.visualMatchReason ||
            activeScene.visualStorytelling ||
            activeScene.facialExpression) && (
            <div className="rounded-lg border border-[var(--ck-border-subtle)] bg-[var(--ck-inset)] px-3 py-2.5 space-y-1">
              <div className="text-[11px] font-medium text-[var(--ck-accent)]">
                {L(lang, 'Scene Dialogue Excerpt', 'এই দৃশ্যের সংলাপ')}
              </div>
              {activeScene.spokenExcerpt && (
                <p className="line-clamp-2 text-xs leading-relaxed text-[var(--ck-text)]">
                  “{activeScene.spokenExcerpt}”
                </p>
              )}
            </div>
          )}

          {/* Essential 4 Controls — Always Visible & Easy to Use */}
          <div>
            <label htmlFor="scene-title-bn" className="block text-xs font-medium text-[var(--ck-text-secondary)]">
              {L(lang, 'Scene Title', 'দৃশ্যের শিরোনাম')}
            </label>
            <input
              id="scene-title-bn"
              type="text"
              value={lang === 'en' ? activeScene.titleEn || activeScene.titleBn : activeScene.titleBn}
              onChange={(e) =>
                onUpdateScene(
                  activeScene.id,
                  lang === 'en' ? { titleEn: e.target.value } : { titleBn: e.target.value }
                )
              }
              className="mt-1 h-9 w-full rounded-lg border border-[var(--ck-border)] bg-[var(--ck-inset)] px-3 text-xs text-[var(--ck-text)] focus:border-[var(--ck-accent)] focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="scene-setting" className="block text-xs font-medium text-[var(--ck-text-secondary)]">
                {L(lang, '2D Environment (32+ Worlds)', '২ডি পরিবেশ (৩২+ জগৎ)')}
              </label>
              {onOpenAssetPicker && (
                <button
                  type="button"
                  data-testid="sidebar-browse-2d-env-btn"
                  onClick={() => onOpenAssetPicker('environments')}
                  className="text-[11px] font-semibold text-[var(--ck-accent)] hover:underline whitespace-nowrap"
                >
                  {L(lang, 'Browse 27 Illustrated', '২৭টি ২ডি দৃশ্য দেখুন')}
                </button>
              )}
            </div>
            <select
              id="scene-setting"
              value={activeScene.setting}
              onChange={(e) =>
                onUpdateScene(activeScene.id, {
                  setting: e.target.value as SceneSetting,
                  customBackgroundAssetId: undefined,
                  customBackgroundUrl: undefined,
                  presetSceneId: undefined,
                  customSvg: undefined,
                })
              }
              className="mt-1 h-9 w-full rounded-lg border border-[var(--ck-border)] bg-[var(--ck-inset)] px-2.5 text-xs text-[var(--ck-text)] focus:border-[var(--ck-accent)] focus:outline-none"
            >
              {(Object.keys(SETTING_LABELS) as SceneSetting[]).map((k) => (
                <option key={k} value={k}>
                  {SETTING_LABELS[k]}
                </option>
              ))}
            </select>

            {activeScene.customBackgroundAssetId && (
              <div
                data-testid="active-illustrated-env-badge"
                className="mt-1.5 flex items-center justify-between gap-2 rounded-lg border border-[var(--ck-accent)]/40 bg-[var(--ck-accent-soft)] px-2.5 py-1.5"
              >
                {(() => {
                  const envInfo = getEnvironmentAssetById(activeScene.customBackgroundAssetId);
                  return (
                    <>
                      <div className="flex min-w-0 items-center gap-2">
                        {envInfo && (
                          <img
                            src={envInfo.url}
                            alt={lang === 'bn' ? envInfo.nameBn : envInfo.nameEn}
                            className="h-7 w-10 shrink-0 rounded object-cover border border-black/15"
                          />
                        )}
                        <span className="truncate text-[11px] font-semibold text-[var(--ck-accent-soft-text)]">
                          {envInfo
                            ? lang === 'bn'
                              ? envInfo.nameBn
                              : envInfo.nameEn
                            : activeScene.customBackgroundAssetId}
                        </span>
                      </div>
                      {onClearSceneEnvironment && (
                        <button
                          type="button"
                          data-testid="sidebar-use-procedural-env-btn"
                          onClick={onClearSceneEnvironment}
                          className="shrink-0 rounded border border-[var(--ck-border)] bg-[var(--ck-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--ck-text)] hover:border-[var(--ck-accent)]"
                        >
                          {L(lang, 'Use Procedural', 'প্রোসিডিউরাল')}
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <div>
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="scene-character" className="block text-xs font-medium text-[var(--ck-text-secondary)]">
                  {L(lang, 'Primary Character', 'প্রধান চরিত্র')}
                </label>
                {onOpenAssetPicker && (
                  <button
                    type="button"
                    data-testid="sidebar-swap-2d-char-btn"
                    onClick={() => onOpenAssetPicker('characters')}
                    className="text-[11px] font-semibold text-[var(--ck-accent)] hover:underline whitespace-nowrap"
                  >
                    {L(lang, 'Swap from 27 Characters', '২৭টি চরিত্র থেকে নিন')}
                  </button>
                )}
              </div>
              <select
                id="scene-character"
                value={activeScene.primaryCharacter ?? 'narrator'}
                onChange={(e) =>
                  onUpdateScene(activeScene.id, {
                    primaryCharacter: e.target.value as CharacterRole,
                    presetSceneId: undefined,
                  })
                }
                className="mt-1 h-9 w-full rounded-lg border border-[var(--ck-border)] bg-[var(--ck-inset)] px-2.5 text-xs text-[var(--ck-text)] focus:border-[var(--ck-accent)] focus:outline-none"
              >
                {(Object.keys(CHARACTER_LABELS) as CharacterRole[]).map((k) => (
                  <option key={k} value={k}>
                    {CHARACTER_LABELS[k]}
                  </option>
                ))}
              </select>

              {(activeScene.primaryCharacterAssetId || activeScene.secondaryCharacterAssetId) && (
                <div className="mt-1.5 space-y-1.5 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-inset)] p-2">
                  {activeScene.primaryCharacterAssetId && (() => {
                    const pChar = getCharacterAssetById(activeScene.primaryCharacterAssetId);
                    const curMode = activeScene.characterRenderMode ?? 'rig-sync';
                    return (
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex min-w-0 items-center gap-2">
                          {pChar && (
                            <img
                              src={pChar.url}
                              alt={lang === 'bn' ? pChar.nameBn : pChar.nameEn}
                              className="h-7 w-9 shrink-0 rounded object-cover border border-[var(--ck-border)]"
                            />
                          )}
                          <span className="truncate text-[11px] font-semibold text-[var(--ck-text)]">
                            {pChar
                              ? lang === 'bn'
                                ? pChar.nameBn
                                : pChar.nameEn
                              : activeScene.primaryCharacterAssetId}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {onToggleSceneCharacterMode && (
                            <div className="inline-flex rounded border border-[var(--ck-border)] bg-[var(--ck-surface)] p-0.5">
                              <button
                                type="button"
                                data-testid="sidebar-mode-rig-btn"
                                onClick={() => onToggleSceneCharacterMode('rig-sync')}
                                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                  curMode === 'rig-sync'
                                    ? 'bg-[var(--ck-accent)] text-[var(--ck-accent-fg)]'
                                    : 'text-[var(--ck-text-muted)]'
                                }`}
                              >
                                {L(lang, 'Rig', 'রিগ')}
                              </button>
                              <button
                                type="button"
                                data-testid="sidebar-mode-cutout-btn"
                                onClick={() => onToggleSceneCharacterMode('illustrated-cutout')}
                                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                  curMode === 'illustrated-cutout'
                                    ? 'bg-[var(--ck-accent)] text-[var(--ck-accent-fg)]'
                                    : 'text-[var(--ck-text-muted)]'
                                }`}
                              >
                                {L(lang, '2D Cutout', 'কাটআউট')}
                              </button>
                            </div>
                          )}
                          {onClearSceneCharacter && (
                            <button
                              type="button"
                              onClick={() => onClearSceneCharacter('primary')}
                              aria-label={L(lang, 'Reset primary 2D character', 'প্রধান চরিত্র রিসেট')}
                              className="rounded p-1 text-[var(--ck-text-faint)] hover:text-[var(--ck-danger)]"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {activeScene.secondaryCharacterAssetId && (() => {
                    const sChar = getCharacterAssetById(activeScene.secondaryCharacterAssetId);
                    return (
                      <div className="flex items-center justify-between gap-2 border-t border-[var(--ck-border-subtle)] pt-1.5">
                        <div className="flex min-w-0 items-center gap-2">
                          {sChar && (
                            <img
                              src={sChar.url}
                              alt={lang === 'bn' ? sChar.nameBn : sChar.nameEn}
                              className="h-6 w-8 shrink-0 rounded object-cover border border-[var(--ck-border)]"
                            />
                          )}
                          <span className="truncate text-[10px] text-[var(--ck-text-muted)]">
                            {L(lang, 'Co-Star #2:', 'সহ-চরিত্র ২:')}{' '}
                            <strong className="text-[var(--ck-text)]">
                              {sChar
                                ? lang === 'bn'
                                  ? sChar.nameBn
                                  : sChar.nameEn
                                : activeScene.secondaryCharacterAssetId}
                            </strong>
                          </span>
                        </div>
                        {onClearSceneCharacter && (
                          <button
                            type="button"
                            onClick={() => onClearSceneCharacter('secondary')}
                            aria-label={L(lang, 'Remove Co-Star 2D character', 'সহ-চরিত্র সরান')}
                            className="rounded p-1 text-[var(--ck-text-faint)] hover:text-[var(--ck-danger)]"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="scene-emotion" className="block text-xs font-medium text-[var(--ck-text-secondary)]">
                {L(lang, 'Expression & Mood', 'অভিব্যক্তি ও আবেগ')}
              </label>
              <select
                id="scene-emotion"
                value={activeScene.emotion ?? 'calm'}
                onChange={(e) =>
                  onUpdateScene(activeScene.id, {
                    emotion: e.target.value as EmotionTone,
                    presetSceneId: undefined,
                  })
                }
                className="mt-1 h-9 w-full rounded-lg border border-[var(--ck-border)] bg-[var(--ck-inset)] px-2.5 text-xs text-[var(--ck-text)] focus:border-[var(--ck-accent)] focus:outline-none"
              >
                {(Object.keys(EMOTION_LABELS) as EmotionTone[]).map((k) => (
                  <option key={k} value={k}>
                    {EMOTION_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {onApplyReferenceMedia && (
            <ReferenceMediaUploader
              lang={lang}
              compact
              referenceMedia={project.referenceMedia ?? null}
              onChangeReference={onApplyReferenceMedia}
            />
          )}

          {/* Progressive Disclosure for Fine-Tuning Controls */}
          <div className="border-t border-[var(--ck-border-subtle)] pt-3">
            <button
              type="button"
              data-testid="director-advanced-toggle"
              aria-expanded={showAdvancedDirector}
              onClick={() => setShowAdvancedDirector((v) => !v)}
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface-alt)] px-3 py-2 text-xs font-medium text-[var(--ck-text-secondary)] transition-colors hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)]"
            >
              <span>
                {L(
                  lang,
                  'Advanced Controls (Lighting, Camera, Zoom & Style)',
                  'অ্যাডভান্সড কন্ট্রোল (আলো, ক্যামেরা, জুম ও স্টাইল)'
                )}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 ${
                  showAdvancedDirector ? 'rotate-180 text-[var(--ck-accent)]' : ''
                }`}
              />
            </button>

            {showAdvancedDirector && (
              <div className="mt-3 space-y-3">
                {onUpdateProjectStyle && (
                  <div>
                    <label htmlFor="project-visual-style" className="block text-xs font-medium text-[var(--ck-text-secondary)]">
                      {L(lang, 'Visual Style', 'ভিজ্যুয়াল স্টাইল')}
                    </label>
                    <select
                      id="project-visual-style"
                      value={project.visualStyle ?? 'storybook-warm'}
                      onChange={(e) => onUpdateProjectStyle(e.target.value as VisualStyle)}
                      className="mt-1 h-9 w-full rounded-lg border border-[var(--ck-border)] bg-[var(--ck-inset)] px-2.5 text-xs text-[var(--ck-text)] focus:border-[var(--ck-accent)] focus:outline-none"
                    >
                      {(Object.keys(VISUAL_STYLE_LABELS) as VisualStyle[]).map((k) => (
                        <option key={k} value={k}>
                          {VISUAL_STYLE_LABELS[k].label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {onPortraitZoomChange && (
                  <div className="rounded-lg border border-[var(--ck-border)] bg-[var(--ck-inset)] px-3 py-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <label htmlFor="portrait-zoom-slider" className="font-medium text-[var(--ck-text-secondary)]">
                        {L(lang, '9:16 Vertical Zoom', '৯:১৬ ভার্টিকাল জুম')}
                      </label>
                      <span className="font-mono text-[11px] tabular-nums text-[var(--ck-accent)]">
                        {portraitZoom.toFixed(2)}×
                      </span>
                    </div>
                    <input
                      id="portrait-zoom-slider"
                      type="range"
                      min={1.0}
                      max={1.8}
                      step={0.05}
                      value={portraitZoom}
                      onChange={(e) => onPortraitZoomChange(Number(e.target.value))}
                      className="mt-2 h-1.5 w-full cursor-pointer accent-[var(--ck-accent)]"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="scene-motif" className="block text-xs font-medium text-[var(--ck-text-secondary)]">
                    {L(lang, 'Visual Prop / Motif', 'ভিজ্যুয়াল প্রপ / মোটিফ')}
                  </label>
                  <select
                    id="scene-motif"
                    value={activeScene.motif ?? 'none'}
                    onChange={(e) =>
                      onUpdateScene(activeScene.id, {
                        motif: e.target.value as StoryMotif,
                        presetSceneId: undefined,
                      })
                    }
                    className="mt-1 h-9 w-full rounded-lg border border-[var(--ck-border)] bg-[var(--ck-inset)] px-2.5 text-xs text-[var(--ck-text)] focus:border-[var(--ck-accent)] focus:outline-none"
                  >
                    {(Object.keys(MOTIF_LABELS) as StoryMotif[]).map((k) => (
                      <option key={k} value={k}>
                        {MOTIF_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="scene-time" className="block text-xs font-medium text-[var(--ck-text-secondary)]">
                      {L(lang, 'Time & Lighting', 'সময় ও আলো')}
                    </label>
                    <select
                      id="scene-time"
                      value={activeScene.timeOfDay}
                      onChange={(e) =>
                        onUpdateScene(activeScene.id, {
                          timeOfDay: e.target.value as TimeOfDay,
                          presetSceneId: undefined,
                        })
                      }
                      className="mt-1 h-9 w-full rounded-lg border border-[var(--ck-border)] bg-[var(--ck-inset)] px-2 text-xs text-[var(--ck-text)] focus:border-[var(--ck-accent)] focus:outline-none"
                    >
                      {(Object.keys(TIME_OF_DAY_LABELS) as TimeOfDay[]).map((k) => (
                        <option key={k} value={k}>
                          {TIME_OF_DAY_LABELS[k]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="scene-weather" className="block text-xs font-medium text-[var(--ck-text-secondary)]">
                      {L(lang, 'Weather', 'আবহাওয়া')}
                    </label>
                    <select
                      id="scene-weather"
                      value={activeScene.weather}
                      onChange={(e) =>
                        onUpdateScene(activeScene.id, {
                          weather: e.target.value as WeatherType,
                          presetSceneId: undefined,
                        })
                      }
                      className="mt-1 h-9 w-full rounded-lg border border-[var(--ck-border)] bg-[var(--ck-inset)] px-2 text-xs text-[var(--ck-text)] focus:border-[var(--ck-accent)] focus:outline-none"
                    >
                      {(Object.keys(WEATHER_LABELS) as WeatherType[]).map((k) => (
                        <option key={k} value={k}>
                          {WEATHER_LABELS[k]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="scene-action" className="block text-xs font-medium text-[var(--ck-text-secondary)]">
                      {L(lang, 'Action', 'অ্যাকশন')}
                    </label>
                    <select
                      id="scene-action"
                      value={activeScene.action}
                      onChange={(e) =>
                        onUpdateScene(activeScene.id, {
                          action: e.target.value as SceneAction,
                          presetSceneId: undefined,
                        })
                      }
                      className="mt-1 h-9 w-full rounded-lg border border-[var(--ck-border)] bg-[var(--ck-inset)] px-2 text-xs text-[var(--ck-text)] focus:border-[var(--ck-accent)] focus:outline-none"
                    >
                      {(Object.keys(ACTION_LABELS) as SceneAction[]).map((k) => (
                        <option key={k} value={k}>
                          {ACTION_LABELS[k]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="scene-camera" className="block text-xs font-medium text-[var(--ck-text-secondary)]">
                      {L(lang, 'Camera Shot', 'ক্যামেরা শট')}
                    </label>
                    <select
                      id="scene-camera"
                      value={activeScene.cameraShot ?? 'medium-two-shot'}
                      onChange={(e) =>
                        onUpdateScene(activeScene.id, {
                          cameraShot: e.target.value as CameraShot,
                          presetSceneId: undefined,
                        })
                      }
                      className="mt-1 h-9 w-full rounded-lg border border-[var(--ck-border)] bg-[var(--ck-inset)] px-2 text-xs text-[var(--ck-text)] focus:border-[var(--ck-accent)] focus:outline-none"
                    >
                      {(Object.keys(CAMERA_SHOT_LABELS) as CameraShot[]).map((k) => (
                        <option key={k} value={k}>
                          {CAMERA_SHOT_LABELS[k]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {onRegenerateScene && (
                  <div className="rounded-lg border border-[var(--ck-border)] bg-[var(--ck-inset)] p-3 space-y-2">
                    <label htmlFor="ai-scene-prompt" className="block text-xs font-medium text-[var(--ck-accent)]">
                      {L(lang, 'Re-direct Scene with Prompt', 'নির্দেশনা দিয়ে দৃশ্য পুনরায় সাজান')}
                    </label>
                    <textarea
                      id="ai-scene-prompt"
                      rows={2}
                      value={regenPrompt}
                      onChange={(e) => setRegenPrompt(e.target.value)}
                      placeholder={L(
                        lang,
                        'e.g. Evening river, monsoon rain, emotional close-up...',
                        'যেমন: সন্ধ্যার নদী, বৃষ্টি, আবেগঘন ক্লোজ-আপ...'
                      )}
                      className="w-full resize-none rounded-md border border-[var(--ck-border)] bg-[var(--ck-surface)] p-2 text-xs text-[var(--ck-text)] placeholder:text-[var(--ck-text-faint)] focus:border-[var(--ck-accent)] focus:outline-none"
                    />
                    {regenError && (
                      <p className="text-[11px] text-[var(--ck-danger)]">{regenError}</p>
                    )}
                    <button
                      type="button"
                      disabled={isRegenerating}
                      onClick={async () => {
                        const targetPrompt = regenPrompt.trim() || undefined;
                        setIsRegenerating(true);
                        setRegenError(null);
                        try {
                          await onRegenerateScene(activeScene.id, targetPrompt, {
                            repaintAiArt: aiDirectorAvailable,
                          });
                          setRegenPrompt('');
                        } catch (err) {
                          setRegenError(
                            err instanceof Error
                              ? err.message
                              : L(lang, 'Unable to redirect scene.', 'দৃশ্যটি পুনরায় সাজানো যায়নি।')
                          );
                        } finally {
                          setIsRegenerating(false);
                        }
                      }}
                      className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-[var(--ck-accent)] bg-[var(--ck-accent-soft)] px-3 text-xs font-medium text-[var(--ck-accent-soft-text)] transition-colors hover:bg-[var(--ck-accent-soft-hover)] disabled:opacity-50"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>
                        {isRegenerating
                          ? L(lang, 'Re-directing…', 'সাজানো হচ্ছে…')
                          : L(lang, 'Re-direct This Scene', 'এই দৃশ্যটি পুনরায় সাজান')}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Portability Footer inside Director tab */}
          <div className="flex items-center justify-between border-t border-[var(--ck-border-subtle)] pt-3">
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-[var(--ck-text-muted)] transition-colors hover:bg-[var(--ck-surface-hover)] hover:text-[var(--ck-text)]"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{L(lang, 'Save JSON', 'JSON ব্যাকআপ')}</span>
            </button>
            <button
              type="button"
              onClick={onLoadDemo}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-[var(--ck-text-muted)] transition-colors hover:bg-[var(--ck-surface-hover)] hover:text-[var(--ck-text)]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{L(lang, 'Demo Film', 'ডেমো ফিল্ম')}</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
