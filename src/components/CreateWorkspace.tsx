import React, { useEffect, useRef, useState } from 'react';
import {
  Upload,
  FileAudio,
  FileText,
  Sparkles,
  FileCode2,
  X,
  Check,
  Film,
  FolderUp,
  Clock,
  ChevronDown,
  AlertCircle,
  SlidersHorizontal,
  Mic,
  UserCog,
  Layers,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import {
  AnimationProject,
  VISUAL_STYLE_LABELS,
  VisualStyle,
  deriveTitleFromContent,
  parseProjectFromJson,
} from '../lib/storyCompiler';
import { parseSrt } from '../lib/srtParser';
import { formatTimecode } from '../lib/storyboard';
import {
  CharacterProfile,
  CharacterRenderMode,
  analyzeAudioSrtSync,
  buildSampleNarrationWavUrl,
  validateGenerationInputs,
} from '../lib/storyIntelligence';
import { SavedDraftRecord } from '../lib/redesignAndStudio';
import { StoryTemplateId, StoryTemplatePreset } from '../lib/storyTemplates';
import { VoiceRecorderPanel } from './VoiceRecorderPanel';
import { StoryTemplatePicker } from './StoryTemplatePicker';
import { ReferenceMediaUploader } from './ReferenceMediaUploader';
import {
  ReferenceMediaProfile,
  analyzeReferenceMediaFile,
} from '../lib/referenceMediaAnalyzer';
import { getWatermarkImage } from '../animation/renderer';
import { AppLang, L } from '../lib/i18n';
import {
  getCharacterAssetById,
  getEnvironmentAssetById,
} from '../lib/studioAssetLibrary';
import type { AssetPickerTab } from './StudioAssetPickerModal';

export interface StoryIntakePayload {
  title?: string;
  srtText: string;
  scriptText: string;
  visualStyle: VisualStyle;
  audioUrl: string | null;
  audioFileName: string | null;
  audioDuration?: number;
  allowScriptOnly?: boolean;
  templateId?: StoryTemplateId;
  customCharacter?: CharacterProfile | null;
  lockCustomCharacter?: boolean;
  referenceMedia?: ReferenceMediaProfile | null;
  selectedCharacterAssetId?: string | null;
  selectedCharacterMode?: CharacterRenderMode;
  selectedEnvironmentAssetId?: string | null;
  autoUseIllustratedWorlds?: boolean;
}

interface CreateWorkspaceProps {
  lang: AppLang;
  onStartProcessing: (payload: StoryIntakePayload) => void;
  onImportProject: (project: AnimationProject) => void;
  onLoadDemo: () => void;
  recentProjects: AnimationProject[];
  onSelectRecentProject: (project: AnimationProject) => void;
  savedDrafts?: SavedDraftRecord[];
  onResumeDraft?: (draft: SavedDraftRecord) => void;
  onDeleteDraft?: (draftId: string) => void;
  aiDirectorAvailable: boolean;
  customCharacter?: CharacterProfile | null;
  lockCustomCharacter?: boolean;
  onOpenCharacterDesigner?: () => void;
  onClearCustomCharacter?: () => void;
  selectedCharacterAssetId?: string | null;
  selectedCharacterMode?: CharacterRenderMode;
  selectedEnvironmentAssetId?: string | null;
  autoUseIllustratedWorlds?: boolean;
  onOpenAssetPicker?: (tab: AssetPickerTab) => void;
  onChangeCharacterMode?: (mode: CharacterRenderMode) => void;
  onChangeAutoIllustrated?: (enabled: boolean) => void;
  onClearAssetSelections?: () => void;
  initialInputMode?: 'upload' | 'record' | 'script';
}

const SAMPLE_STORIES = [
  {
    id: 'forest-library',
    labelEn: 'Forest & Ancient Library',
    labelBn: 'জঙ্গল ও প্রাচীন লাইব্রেরি',
    scriptEn:
      'A lone traveler walked slowly through the deep green forest at dawn. In the quiet midnight mist, warm lantern light shone from an old library. Opening an ancient book on the wooden table, he uncovered a long-forgotten truth.',
    scriptBn:
      'গভীর সবুজ জঙ্গলের ভেতর দিয়ে একজন পথিক হাঁটছিল। মাঝরাতে রহস্যময় কুয়াশায় একটি পুরনো লাইব্রেরির আলো দেখা গেল। ভেতরে টেবিলের ওপর প্রাচীন বই খুলে সে বহু বছরের হারানো সত্য খুঁজে পেল।',
  },
  {
    id: 'desert-festival',
    labelEn: 'Desert, Courtroom & Festival',
    labelBn: 'মরুভূমি, আদালত ও উৎসব',
    scriptEn:
      'Across golden desert dunes at sunset, the camel caravan marched toward the distant city. Inside the grand courtroom, the judge raised the scales of justice and declared the truth. That night, the entire city celebrated with glowing lanterns and fireworks.',
    scriptBn:
      'উত্তপ্ত মরুভূমির বালির টিলা পেরিয়ে উটের কাফেলা এগিয়ে চলল। নগরের আদালতে বিচারক ন্যায়ের দাঁড়িপাল্লা হাতে রায় শোনালেন। সেই আনন্দে পুরো শহরে আতশবাজি আর আলোকসজ্জার বিশাল উৎসব শুরু হলো।',
  },
  {
    id: 'space-journey',
    labelEn: 'Outer Space & Rocket',
    labelBn: 'মহাকাশ ও রকেট',
    scriptEn:
      'Humanity’s boldest dream has always been exploring outer space. Piercing the starry night sky, a roaring rocket climbs toward distant worlds. Inside the science lab, researchers track every signal in search of new horizons.',
    scriptBn:
      'মানুষের সবচেয়ে বড় স্বপ্ন ছিল মহাকাশ জয় করা। রাতের অন্ধকার ভেদ করে গর্জন তুলে রকেট আকাশের দিকে ছুটে চলে। বিজ্ঞানীরা ল্যাবে বসে প্রতিটি সংকেত পর্যবেক্ষণ করে নতুন পৃথিবীর সন্ধান করেন।',
  },
];

const STYLE_KEYS: VisualStyle[] = [
  'storybook-warm',
  'cinematic-anime',
  'editorial-doc',
  'dramatic-noir',
];

export const CreateWorkspace: React.FC<CreateWorkspaceProps> = ({
  lang,
  onStartProcessing,
  onImportProject,
  onLoadDemo,
  recentProjects,
  onSelectRecentProject,
  savedDrafts = [],
  onResumeDraft,
  onDeleteDraft,
  aiDirectorAvailable,
  customCharacter = null,
  lockCustomCharacter = true,
  onOpenCharacterDesigner,
  onClearCustomCharacter,
  selectedCharacterAssetId = null,
  selectedCharacterMode = 'rig-sync',
  selectedEnvironmentAssetId = null,
  autoUseIllustratedWorlds = false,
  onOpenAssetPicker,
  onChangeCharacterMode,
  onChangeAutoIllustrated,
  onClearAssetSelections,
  initialInputMode,
}) => {
  const [title, setTitle] = useState<string>('');
  const [scriptText, setScriptText] = useState<string>('');
  const [srtText, setSrtText] = useState<string>('');
  const [srtFileName, setSrtFileName] = useState<string | null>(null);
  const [srtCueCount, setSrtCueCount] = useState<number>(0);
  const [scriptFileName, setScriptFileName] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | undefined>(undefined);
  const [allowScriptOnly, setAllowScriptOnly] = useState<boolean>(initialInputMode === 'script');
  const [audioInputTab, setAudioInputTab] = useState<'upload' | 'record'>(
    initialInputMode === 'record' ? 'record' : 'upload'
  );

  useEffect(() => {
    if (initialInputMode === 'record') {
      setAllowScriptOnly(false);
      setAudioInputTab('record');
    } else if (initialInputMode === 'script') {
      setAllowScriptOnly(true);
    } else if (initialInputMode === 'upload') {
      setAllowScriptOnly(false);
      setAudioInputTab('upload');
    }
  }, [initialInputMode]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<StoryTemplateId | null>(null);
  const [referenceMedia, setReferenceMedia] = useState<ReferenceMediaProfile | null>(null);
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('storybook-warm');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [attachNotice, setAttachNotice] = useState<string | null>(null);

  const multiInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const srtInputRef = useRef<HTMLInputElement | null>(null);
  const scriptInputRef = useRef<HTMLInputElement | null>(null);
  const jsonInputRef = useRef<HTMLInputElement | null>(null);
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
    setAllowScriptOnly(false);
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

  const handleJsonFile = async (file: File) => {
    try {
      const text = await file.text();
      const imported = parseProjectFromJson(text);
      onImportProject(imported);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : L(lang, 'Unable to read project JSON file.', 'প্রোজেক্ট JSON ফাইলটি পড়া যায়নি।')
      );
    }
  };

  const ingestFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setFormError(null);
    const attached: string[] = [];

    for (const file of files) {
      const lower = file.name.toLowerCase();
      if (
        file.type.startsWith('image/') ||
        file.type.startsWith('video/') ||
        /\.(png|jpg|jpeg|webp|mp4|mov|m4v)$/i.test(lower)
      ) {
        try {
          const profile = await analyzeReferenceMediaFile(file);
          if (profile.thumbnailDataUrl) {
            getWatermarkImage(profile.thumbnailDataUrl);
          }
          setReferenceMedia(profile);
          setVisualStyle(profile.matchedVisualStyle);
          attached.push(`${L(lang, 'Reference', 'রেফারেন্স')}: ${file.name}`);
        } catch {
          setFormError(
            L(
              lang,
              `Could not read reference file “${file.name}”.`,
              `রেফারেন্স ফাইল “${file.name}” পড়া যায়নি।`
            )
          );
        }
      } else if (
        file.type.startsWith('audio/') ||
        /\.(mp3|wav|m4a|ogg|aac|flac|webm)$/i.test(lower)
      ) {
        handleAudioFile(file);
        attached.push(`${L(lang, 'Audio', 'অডিও')}: ${file.name}`);
      } else if (lower.endsWith('.srt')) {
        await handleSrtFile(file);
        attached.push(`SRT: ${file.name}`);
      } else if (lower.endsWith('.json')) {
        await handleJsonFile(file);
        return;
      } else if (file.type.startsWith('text/') || /\.(txt|md)$/i.test(lower)) {
        await handleScriptFile(file);
        attached.push(`${L(lang, 'Script', 'স্ক্রিপ্ট')}: ${file.name}`);
      } else {
        setFormError(
          L(
            lang,
            `“${file.name}” is not supported. Please attach .mp3/.wav audio, .srt subtitles, .txt script, or a reference image/video.`,
            `“${file.name}” ফাইলটি সাপোর্টেড নয়। অনুগ্রহ করে .mp3/.wav অডিও, .srt সাবটাইটেল, .txt স্ক্রিপ্ট অথবা রেফারেন্স ইমেজ/ভিডিও দিন।`
          )
        );
      }
    }

    if (attached.length > 0) {
      setAttachNotice(`${L(lang, 'Attached', 'যুক্ত হয়েছে')}: ${attached.join(' · ')}`);
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
    if (dragDepthRef.current === 0) setIsDragging(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validationPreview.valid) {
      setFormError(validationPreview.errors.join(' '));
      return;
    }

    submittedAudioUrlRef.current = audioUrl;
    onStartProcessing({
      title: title.trim() || undefined,
      srtText,
      scriptText,
      visualStyle,
      audioUrl,
      audioFileName,
      audioDuration,
      allowScriptOnly,
      templateId: selectedTemplateId ?? undefined,
      customCharacter,
      lockCustomCharacter,
      referenceMedia,
      selectedCharacterAssetId,
      selectedCharacterMode,
      selectedEnvironmentAssetId,
      autoUseIllustratedWorlds,
    });
  };

  const handleSelectStoryTemplate = (tpl: StoryTemplatePreset) => {
    setSelectedTemplateId(tpl.id);
    setVisualStyle(tpl.visualStyle);
    setAttachNotice(
      L(
        lang,
        `Template selected: ${tpl.nameEn} (${tpl.cameraMotionLabelEn} · ${tpl.subtitleFontLabelEn})`,
        `টেমপ্লেট নির্বাচিত: ${tpl.nameBn} (${tpl.cameraMotionLabelBn} · ${tpl.subtitleFontLabelBn})`
      )
    );
  };

  const handleLoadTemplateScript = (tpl: StoryTemplatePreset) => {
    setSelectedTemplateId(tpl.id);
    setVisualStyle(tpl.visualStyle);
    const tplTitle = lang === 'bn' ? tpl.starterTitleBn : tpl.starterTitleEn;
    const tplScript = lang === 'bn' ? tpl.starterScriptBn : tpl.starterScriptEn;
    setTitle(tplTitle);
    setScriptText(tplScript);
    setScriptFileName(null);
    setSrtText('');
    setSrtFileName(null);
    setSrtCueCount(0);
    setFormError(null);
    if (!allowScriptOnly && !audioUrl) {
      setAllowScriptOnly(true);
    }
    setAttachNotice(
      L(
        lang,
        `Loaded ${tpl.nameEn} template & sample story: “${tplTitle}”`,
        `${tpl.nameBn} টেমপ্লেট ও নমুনা গল্প লোড হয়েছে: “${tplTitle}”`
      )
    );
  };

  const previewAutoTitle =
    !title.trim() && (scriptText.trim() || srtText.trim() || audioFileName)
      ? deriveTitleFromContent(undefined, scriptText, parsedSrtCues, audioFileName)
      : null;

  return (
    <section
      data-testid="create-workspace"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="mx-auto max-w-[860px] space-y-6"
    >
      {/* Calm, Clear Header */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ck-text-muted)]">
          <span className="font-semibold text-[var(--ck-accent)]">
            {L(lang, 'New Project', 'নতুন প্রোজেক্ট')}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {L(lang, '16:9 YouTube & 9:16 Reels together', '১৬:৯ ইউটিউব ও ৯:১৬ রিলস একসাথে')}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {aiDirectorAvailable
              ? L(lang, 'AI Visual Director active', 'AI ভিজ্যুয়াল ডিরেক্টর সক্রিয়')
              : L(lang, '32+ story-matched 2D worlds', '৩২+ গল্প-সামঞ্জস্যপূর্ণ ২ডি পরিবেশ')}
          </span>
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--ck-text)] sm:text-3xl">
          {L(
            lang,
            'Create a 2D Animation from Your Story',
            'আপনার গল্প থেকে ২ডি অ্যানিমেশন তৈরি করুন'
          )}
        </h1>
        <p className="text-sm text-[var(--ck-text-muted)]">
          {L(
            lang,
            'Upload voiceover audio & SRT subtitles, or write a script directly for an instant animated preview.',
            'ভয়েসওভার ও SRT আপলোড করুন, অথবা অডিও ছাড়াই সরাসরি বাংলা গল্প লিখে প্রিভিউ দেখুন।'
          )}
        </p>
      </div>

      {/* Main Clean Single-Elevation Creation Form */}
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface)]"
      >
        {/* Clean 3-Mode Switcher (Upload Audio | Record Mic | Script-Only) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ck-border-subtle)] bg-[var(--ck-surface-alt)] px-5 py-3">
          <div
            role="tablist"
            aria-label={L(lang, 'Project creation mode', 'প্রোজেক্ট তৈরির মোড')}
            className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={!allowScriptOnly && audioInputTab === 'upload'}
              onClick={() => {
                setAllowScriptOnly(false);
                setAudioInputTab('upload');
                setFormError(null);
              }}
              className={`h-8 rounded-md px-3 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                !allowScriptOnly && audioInputTab === 'upload'
                  ? 'bg-[var(--ck-accent-soft)] text-[var(--ck-accent-soft-text)]'
                  : 'text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]'
              }`}
            >
              {L(lang, 'Audio + SRT Upload', 'অডিও + SRT আপলোড')}
            </button>
            <button
              type="button"
              role="tab"
              data-testid="record-voice-tab"
              aria-selected={!allowScriptOnly && audioInputTab === 'record'}
              onClick={() => {
                setAllowScriptOnly(false);
                setAudioInputTab('record');
                setFormError(null);
              }}
              className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                !allowScriptOnly && audioInputTab === 'record'
                  ? 'bg-[var(--ck-accent-soft)] text-[var(--ck-accent-soft-text)]'
                  : 'text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]'
              }`}
            >
              <Mic className="h-3.5 w-3.5" />
              <span>{L(lang, 'Record Voice', 'ভয়েস রেকর্ড')}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={allowScriptOnly}
              data-testid="script-only-toggle"
              onClick={() => {
                setAllowScriptOnly(true);
                setFormError(null);
              }}
              className={`h-8 rounded-md px-3 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                allowScriptOnly
                  ? 'bg-[var(--ck-accent-soft)] text-[var(--ck-accent-soft-text)]'
                  : 'text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]'
              }`}
            >
              {L(lang, 'Script-Only (Quick Preview)', 'শুধু স্ক্রিপ্ট (Quick Preview)')}
            </button>
          </div>

          <button
            type="button"
            onClick={onLoadDemo}
            className="inline-flex h-8 items-center gap-1.5 text-xs font-medium text-[var(--ck-accent)] underline-offset-4 hover:underline whitespace-nowrap shrink-0"
          >
            <Film className="h-3.5 w-3.5" />
            <span>{L(lang, 'Watch Demo Film', 'ডেমো ফিল্ম দেখুন')}</span>
          </button>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {/* Hidden File Inputs */}
          <input
            ref={multiInputRef}
            type="file"
            multiple
            accept="audio/*,.srt,.txt,.md,.json"
            className="sr-only"
            aria-label={L(
              lang,
              'Upload audio, SRT, or script files',
              'অডিও, SRT অথবা স্ক্রিপ্ট ফাইল আপলোড করুন'
            )}
            onChange={(e) => {
              if (e.target.files) void ingestFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            className="sr-only"
            aria-label={L(lang, 'Select voiceover audio file', 'ভয়েসওভার অডিও ফাইল নির্বাচন')}
            onChange={(e) => {
              if (e.target.files?.[0]) handleAudioFile(e.target.files[0]);
              e.target.value = '';
            }}
          />
          <input
            ref={srtInputRef}
            type="file"
            accept=".srt,text/plain"
            className="sr-only"
            aria-label={L(lang, 'Select SRT subtitle file', 'SRT সাবটাইটেল ফাইল নির্বাচন')}
            onChange={(e) => {
              if (e.target.files?.[0]) void handleSrtFile(e.target.files[0]);
              e.target.value = '';
            }}
          />
          <input
            ref={scriptInputRef}
            type="file"
            accept=".txt,.md"
            className="sr-only"
            aria-label={L(lang, 'Select script text file', 'স্ক্রিপ্ট টেক্সট ফাইল নির্বাচন')}
            onChange={(e) => {
              if (e.target.files?.[0]) void handleScriptFile(e.target.files[0]);
              e.target.value = '';
            }}
          />
          <input
            ref={jsonInputRef}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            aria-label={L(lang, 'Import saved project JSON', 'সংরক্ষিত প্রোজেক্ট JSON ইম্পোর্ট')}
            onChange={(e) => {
              if (e.target.files?.[0]) void handleJsonFile(e.target.files[0]);
              e.target.value = '';
            }}
          />

          {/* Mode A1: In-Browser Voiceover Recorder */}
          {!allowScriptOnly && audioInputTab === 'record' && (
            <VoiceRecorderPanel
              lang={lang}
              scriptPreviewText={scriptText}
              attachedFileName={audioFileName}
              onAttachRecording={({ audioUrl: recUrl, fileName, duration }) => {
                revokeUnusedAudioUrl(audioUrl);
                setAudioUrl(recUrl);
                setAudioFileName(fileName);
                setAudioDuration(duration);
                setAllowScriptOnly(false);
                setFormError(null);
                setAttachNotice(
                  L(
                    lang,
                    `Voice recording attached: ${fileName} (${formatTimecode(duration)})`,
                    `ভয়েস রেকর্ডিং যুক্ত হয়েছে: ${fileName} (${formatTimecode(duration)})`
                  )
                );
              }}
            />
          )}

          {/* Mode A2: Unified Audio + SRT Dropzone */}
          {!allowScriptOnly && audioInputTab === 'upload' && (
            <div className="space-y-3">
              <div
                data-testid="smart-dropzone"
                data-dragging={isDragging ? 'true' : 'false'}
                className={`rounded-xl border-2 border-dashed px-5 py-6 text-center transition-colors ${
                  isDragging
                    ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)]'
                    : 'border-[var(--ck-border-strong)] bg-[var(--ck-inset)] hover:border-[var(--ck-accent)]'
                }`}
              >
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--ck-accent-soft)] text-[var(--ck-accent)]">
                  <Upload className="h-5 w-5" />
                </div>
                <h2 className="mt-3 text-sm font-semibold text-[var(--ck-text)] sm:text-base">
                  {isDragging
                    ? L(lang, 'Release to attach files', 'ফাইলগুলো এখানে ছেড়ে দিন')
                    : L(
                        lang,
                        'Drop your Voiceover Audio & SRT file here',
                        'ভয়েসওভার অডিও ও SRT ফাইল এখানে ড্রপ করুন'
                      )}
                </h2>
                <p className="mt-1 text-xs text-[var(--ck-text-muted)]">
                  {L(
                    lang,
                    'Attach .mp3 / .wav audio and .srt subtitles together in one drop',
                    'একসাথে .mp3 / .wav অডিও এবং .srt সাবটাইটেল সিলেক্ট করতে পারবেন'
                  )}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => audioInputRef.current?.click()}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--ck-border-strong)] bg-[var(--ck-surface)] px-3.5 text-xs font-medium text-[var(--ck-text)] transition-colors hover:border-[var(--ck-accent)] whitespace-nowrap"
                  >
                    <FileAudio className="h-3.5 w-3.5 text-[var(--ck-accent)]" />
                    <span>
                      {audioFileName
                        ? L(lang, 'Change Audio', 'অডিও বদলান')
                        : L(lang, 'Select Audio (.mp3/.wav)', 'অডিও সিলেক্ট (.mp3/.wav)')}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => srtInputRef.current?.click()}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--ck-border-strong)] bg-[var(--ck-surface)] px-3.5 text-xs font-medium text-[var(--ck-text)] transition-colors hover:border-[var(--ck-accent)] whitespace-nowrap"
                  >
                    <FileText className="h-3.5 w-3.5 text-[var(--ck-accent)]" />
                    <span>
                      {srtFileName
                        ? L(lang, 'Change SRT', 'SRT বদলান')
                        : L(lang, 'Select SRT (.srt)', 'SRT সিলেক্ট (.srt)')}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => multiInputRef.current?.click()}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-[var(--ck-text-muted)] transition-colors hover:bg-[var(--ck-surface-hover)] hover:text-[var(--ck-text)] whitespace-nowrap"
                  >
                    <span>{L(lang, 'Browse all files', 'একসাথে সব ফাইল ব্রাউজ')}</span>
                  </button>
                </div>
              </div>

              {/* Clean Attached Files Summary */}
              {(audioFileName || srtFileName) && (
                <div className="flex flex-wrap items-center gap-2.5">
                  {audioFileName && (
                    <div className="inline-flex items-center gap-2 rounded-lg border border-[var(--ck-success-border)] bg-[var(--ck-success-bg)] px-3 py-1.5 text-xs text-[var(--ck-success-text)]">
                      <FileAudio className="h-3.5 w-3.5 shrink-0 text-[var(--ck-success)]" />
                      <span className="max-w-[220px] truncate font-medium">{audioFileName}</span>
                      {audioDuration && (
                        <span className="font-mono text-[11px] tabular-nums opacity-80">
                          {formatTimecode(audioDuration)}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          revokeUnusedAudioUrl(audioUrl);
                          setAudioUrl(null);
                          setAudioFileName(null);
                          setAudioDuration(undefined);
                        }}
                        aria-label={L(lang, 'Remove audio', 'অডিও সরান')}
                        className="rounded p-0.5 hover:bg-black/10"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {srtFileName && (
                    <div className="inline-flex items-center gap-2 rounded-lg border border-[var(--ck-success-border)] bg-[var(--ck-success-bg)] px-3 py-1.5 text-xs text-[var(--ck-success-text)]">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-[var(--ck-success)]" />
                      <span className="max-w-[220px] truncate font-medium">{srtFileName}</span>
                      <span className="font-mono text-[11px] tabular-nums opacity-80">
                        {L(lang, `${srtCueCount} cues`, `${srtCueCount} লাইন`)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSrtText('');
                          setSrtFileName(null);
                          setSrtCueCount(0);
                        }}
                        aria-label={L(lang, 'Remove SRT', 'SRT সরান')}
                        className="rounded p-0.5 hover:bg-black/10"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Ready-Made Story Template Library */}
          <StoryTemplatePicker
            lang={lang}
            selectedTemplateId={selectedTemplateId}
            onSelectTemplate={handleSelectStoryTemplate}
            onLoadTemplateScript={handleLoadTemplateScript}
          />

          {/* Animated 2D Character Cast (17 Characters) + Built-in Default Worlds */}
          {onOpenAssetPicker && (
            <div
              data-testid="studio-asset-pack-strip"
              className="space-y-3 rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface-alt)] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--ck-accent-soft)] text-[var(--ck-accent)]">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[var(--ck-text)]">
                      {L(
                        lang,
                        '2D Animated Character Cast (17 Ready)',
                        'অ্যানিমেটেড ২ডি ক্যারেক্টার কাস্ট (১৭টি রেডি)'
                      )}
                    </h3>
                    <p className="text-[11px] text-[var(--ck-text-muted)]">
                      {L(
                        lang,
                        'Choose any of the 17 2D animated characters—they stride, gesture, and perform dynamically across all 32+ default worlds.',
                        '১৭টি ২ডি চরিত্রের যেকোনোটি বেছে নিন — প্রতিটি চরিত্র ৩২+ ডিফল্ট পরিবেশে প্রপার অ্যানিমেশনসহ চলমান ও জীবন্ত হয়ে উঠবে।'
                      )}
                    </p>
                  </div>
                </div>

                {selectedCharacterAssetId &&
                  onClearAssetSelections && (
                    <button
                      type="button"
                      data-testid="clear-asset-pack-btn"
                      onClick={onClearAssetSelections}
                      className="inline-flex h-7 items-center gap-1 rounded-md border border-[var(--ck-border)] px-2 text-[11px] text-[var(--ck-text-muted)] hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)]"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>{L(lang, 'Reset Cast', 'রিসেট')}</span>
                    </button>
                  )}
              </div>

              {(() => {
                const pickedChar = getCharacterAssetById(selectedCharacterAssetId);
                return (
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {/* Selected Character Card */}
                    <div className="flex flex-col justify-between gap-2 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] p-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {pickedChar ? (
                          <img
                            src={pickedChar.url}
                            alt={lang === 'bn' ? pickedChar.nameBn : pickedChar.nameEn}
                            className="h-12 w-12 shrink-0 rounded-md border border-[var(--ck-border)] bg-[#141720] object-contain p-0.5"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-dashed border-[var(--ck-border-strong)] bg-[var(--ck-inset)] text-[var(--ck-text-muted)]">
                            <UserCog className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--ck-text-muted)]">
                            {L(lang, '2D Animated Character', '২ডি অ্যানিমেটেড ক্যারেক্টার')}
                          </div>
                          <div className="truncate text-xs font-semibold text-[var(--ck-text)]">
                            {pickedChar
                              ? lang === 'bn'
                                ? pickedChar.nameBn
                                : pickedChar.nameEn
                              : L(lang, 'Auto / Story-Matched Cast', 'গল্প অনুযায়ী অটো চরিত্র')}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
                        {pickedChar && onChangeCharacterMode ? (
                          <div
                            role="group"
                            aria-label={L(lang, 'Character render style', 'ক্যারেক্টার রেন্ডার স্টাইল')}
                            className="inline-flex rounded-md border border-[var(--ck-border)] bg-[var(--ck-inset)] p-0.5"
                          >
                            <button
                              type="button"
                              data-testid="create-mode-cutout-btn"
                              onClick={() => onChangeCharacterMode('illustrated-cutout')}
                              className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                                selectedCharacterMode === 'illustrated-cutout'
                                  ? 'bg-[var(--ck-accent)] text-[var(--ck-accent-fg)]'
                                  : 'text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]'
                              }`}
                            >
                              {L(lang, '2D Cutout', '২ডি অ্যানিমেশন')}
                            </button>
                            <button
                              type="button"
                              data-testid="create-mode-rig-btn"
                              onClick={() => onChangeCharacterMode('rig-sync')}
                              className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                                selectedCharacterMode === 'rig-sync'
                                  ? 'bg-[var(--ck-accent)] text-[var(--ck-accent-fg)]'
                                  : 'text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]'
                              }`}
                            >
                              {L(lang, 'Rig Lip-Sync', 'লিপ-সিঙ্ক রিগ')}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[var(--ck-text-faint)]">
                            {L(lang, '17 animated characters ready', '১৭টি অ্যানিমেটেড চরিত্র')}
                          </span>
                        )}

                        <button
                          type="button"
                          data-testid="browse-2d-characters-btn"
                          onClick={() => onOpenAssetPicker('characters')}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-[var(--ck-accent)]/60 bg-[var(--ck-accent-soft)] px-2.5 text-[11px] font-semibold text-[var(--ck-accent-soft-text)] hover:bg-[var(--ck-accent-soft-hover)] whitespace-nowrap"
                        >
                          <span>{L(lang, 'Choose Character (17)', '১৭টি চরিত্র দেখুন')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Built-in Default Worlds Card */}
                    <div className="flex flex-col justify-between gap-2 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] p-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-[var(--ck-border)] bg-[var(--ck-accent-soft)] text-[var(--ck-accent)]">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--ck-text-muted)]">
                            {L(lang, 'Default Cinema Environments', 'ডিফল্ট অ্যানিমেটেড পরিবেশ')}
                          </div>
                          <div className="truncate text-xs font-semibold text-[var(--ck-text)]">
                            {L(lang, '32+ Built-In Procedural Worlds', '৩২+ বিল্ট-ইন প্রোসিডিউরাল জগৎ')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1.5 pt-0.5 text-[10px] text-[var(--ck-text-muted)]">
                        <span>
                          {L(
                            lang,
                            'Village, city, school, hospital, river, cosmos & more adapt per scene.',
                            'গ্রাম, শহর, স্কুল, হাসপাতাল, নদী, মহাকাশসহ প্রতিটি দৃশ্যে অটো ম্যাচ হয়।'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Custom Character Designer Strip */}
          {onOpenCharacterDesigner && (
            <div
              data-testid="custom-character-strip"
              className="flex flex-col gap-3 rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface-alt)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                {(() => {
                  const customAsset = customCharacter?.sourceAssetId
                    ? getCharacterAssetById(customCharacter.sourceAssetId)
                    : null;
                  if (customAsset) {
                    return (
                      <img
                        src={customAsset.url}
                        alt={customCharacter?.name ?? (lang === 'bn' ? customAsset.nameBn : customAsset.nameEn)}
                        className="h-11 w-11 shrink-0 rounded-lg border border-[var(--ck-border)] bg-[#141720] object-contain p-0.5"
                      />
                    );
                  }
                  return (
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-black/15 dark:border-white/10"
                      style={{
                        backgroundColor: customCharacter ? customCharacter.outfitColor : 'var(--ck-accent-soft)',
                      }}
                    >
                      {customCharacter ? (
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-black/25"
                          style={{ backgroundColor: customCharacter.skinTone }}
                        />
                      ) : (
                        <UserCog className="h-4 w-4 text-[var(--ck-accent)]" />
                      )}
                    </div>
                  );
                })()}
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-[var(--ck-text)]">
                    {customCharacter
                      ? L(
                          lang,
                          `Custom Lead Character: ${customCharacter.name}`,
                          `কাস্টম চরিত্র: ${customCharacter.name}`
                        )
                      : L(lang, 'Custom Character Designer (Optional)', 'কাস্টম ক্যারেক্টার ডিজাইনার (ঐচ্ছিক)')}
                  </div>
                  <p className="truncate text-[11px] text-[var(--ck-text-muted)]">
                    {customCharacter
                      ? `${customCharacter.clothing}${
                          customCharacter.sourceAssetId
                            ? customCharacter.renderMode === 'illustrated-cutout'
                              ? lang === 'bn'
                                ? ' · ২ডি কাটআউট'
                                : ' · 2D Cutout'
                              : lang === 'bn'
                                ? ' · লিপ-সিঙ্ক রিগ'
                                : ' · Lip-Sync Rig'
                            : ''
                        }${lockCustomCharacter ? (lang === 'bn' ? ' · সব দৃশ্যে লকড' : ' · Locked across all scenes') : ''}`
                      : L(
                          lang,
                          'Customize outfit color, hairstyle, glasses, hat/tupi & name to keep one consistent character across the story.',
                          'পোশাকের রঙ, চুলের ধরন, চশমা বা টুপি ও নাম ঠিক করে পুরো গল্পে একই চরিত্র ধরে রাখুন।'
                        )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {customCharacter && onClearCustomCharacter && (
                  <button
                    type="button"
                    onClick={onClearCustomCharacter}
                    className="h-8 rounded-lg border border-[var(--ck-border)] px-2.5 text-xs text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]"
                  >
                    {L(lang, 'Reset', 'রিসেট')}
                  </button>
                )}
                <button
                  type="button"
                  data-testid="open-character-designer-btn"
                  onClick={onOpenCharacterDesigner}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--ck-accent)]/60 bg-[var(--ck-accent-soft)] px-3 text-xs font-semibold text-[var(--ck-accent-soft-text)] transition-colors hover:bg-[var(--ck-accent-soft-hover)] whitespace-nowrap"
                >
                  <UserCog className="h-3.5 w-3.5" />
                  <span>
                    {customCharacter
                      ? L(lang, 'Edit Character', 'চরিত্র পরিবর্তন')
                      : L(lang, 'Design Character', 'চরিত্র সাজান')}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Reference Animation Image or Video Uploader */}
          <ReferenceMediaUploader
            lang={lang}
            referenceMedia={referenceMedia}
            onChangeReference={(profile) => {
              setReferenceMedia(profile);
              if (profile) {
                setVisualStyle(profile.matchedVisualStyle);
                setAttachNotice(
                  L(
                    lang,
                    `Matched reference style: ${profile.summaryEn}`,
                    `রেফারেন্স স্টাইল ম্যাচ হয়েছে: ${profile.summaryBn}`
                  )
                );
              }
            }}
          />

          {/* Story Script Field */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="create-script-input"
                className="text-xs font-semibold text-[var(--ck-text)]"
              >
                {allowScriptOnly
                  ? L(lang, 'Write or paste your story script', 'আপনার গল্পের স্ক্রিপ্ট লিখুন')
                  : L(lang, 'Story Script (optional if SRT is attached)', 'গল্পের স্ক্রিপ্ট (SRT না থাকলে)')}
              </label>

              <button
                type="button"
                onClick={() => scriptInputRef.current?.click()}
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--ck-accent)] hover:underline whitespace-nowrap"
              >
                <FileCode2 className="h-3.5 w-3.5" />
                <span>
                  {scriptFileName
                    ? L(lang, 'Replace .txt', 'নতুন .txt দিন')
                    : L(lang, 'Load from .txt file', '.txt ফাইল থেকে নিন')}
                </span>
              </button>
            </div>

            <textarea
              id="create-script-input"
              rows={allowScriptOnly ? 5 : 4}
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder={L(
                lang,
                'Write or paste your English or Bengali story here — distinct 2D worlds like forest, desert, courtroom, festival, village, library, ocean, or outer space will match your scenes automatically...',
                'আপনার বাংলা বা ইংরেজি গল্পের স্ক্রিপ্ট এখানে লিখুন অথবা পেস্ট করুন — জঙ্গল, মরুভূমি, আদালত, উৎসব, গ্রামবাংলা, লাইব্রেরি, সমুদ্র বা মহাকাশ অনুযায়ী আলাদা ২ডি দৃশ্য তৈরি হবে...'
              )}
              className="w-full resize-y rounded-lg border border-[var(--ck-border)] bg-[var(--ck-inset)] p-3.5 text-sm leading-relaxed text-[var(--ck-text)] placeholder:text-[var(--ck-text-faint)] focus:border-[var(--ck-accent)] focus:outline-none"
            />

            {/* Quick Sample Stories Row */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-[var(--ck-text-muted)]">
              <span>{L(lang, 'Try a sample:', 'দ্রুত পরীক্ষা করুন:')}</span>
              {SAMPLE_STORIES.map((sample) => {
                const sampleLabel = lang === 'bn' ? sample.labelBn : sample.labelEn;
                const sampleScript = lang === 'bn' ? sample.scriptBn : sample.scriptEn;
                return (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => {
                      if (!allowScriptOnly) {
                        revokeUnusedAudioUrl(audioUrl);
                        const wordCount = sampleScript.trim().split(/\s+/).length;
                        const sampleDur = Math.max(14, Math.min(28, Math.round(wordCount * 0.45)));
                        const sampleUrl = buildSampleNarrationWavUrl(sampleDur);
                        setAudioUrl(sampleUrl);
                        setAudioFileName(`${sample.id}-narration.wav`);
                        setAudioDuration(sampleDur);
                        setAttachNotice(
                          L(
                            lang,
                            `Loaded sample story and ${sampleDur}s narration track.`,
                            `নমুনা গল্প ও ${sampleDur} সেকেন্ডের ভয়েস ট্র্যাক লোড হয়েছে।`
                          )
                        );
                      } else {
                        setAttachNotice(
                          L(
                            lang,
                            `Loaded sample story: ${sampleLabel}`,
                            `নমুনা গল্প লোড হয়েছে: ${sampleLabel}`
                          )
                        );
                      }
                      setScriptText(sampleScript);
                      setScriptFileName(null);
                      setSrtText('');
                      setSrtFileName(null);
                      setSrtCueCount(0);
                      setFormError(null);
                    }}
                    className="rounded-md border border-[var(--ck-border)] bg-[var(--ck-surface-alt)] px-2.5 py-1 text-xs text-[var(--ck-text-secondary)] transition-colors hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)] whitespace-nowrap"
                  >
                    {sampleLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Collapsible Optional & Style Settings */}
          <div className="border-t border-[var(--ck-border-subtle)] pt-4">
            <button
              type="button"
              aria-expanded={showAdvanced}
              data-testid="create-advanced-toggle"
              onClick={() => setShowAdvanced((s) => !s)}
              className="flex w-full items-center justify-between gap-2 text-left text-xs font-medium text-[var(--ck-text-secondary)] transition-colors hover:text-[var(--ck-text)]"
            >
              <span className="inline-flex items-center gap-2">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--ck-accent)]" />
                <span>
                  {L(
                    lang,
                    'Optional Settings (Title, Visual Style & JSON Import)',
                    'অপশনাল সেটিংস (শিরোনাম, ভিজ্যুয়াল স্টাইল ও JSON ইম্পোর্ট)'
                  )}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--ck-text-muted)]">
                <span>{VISUAL_STYLE_LABELS[visualStyle].label}</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-150 ${showAdvanced ? 'rotate-180' : ''}`}
                />
              </span>
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="create-title-input"
                      className="text-xs font-medium text-[var(--ck-text-secondary)]"
                    >
                      {L(
                        lang,
                        'Video Title (optional — auto-detected from script if blank)',
                        'ভিডিওর শিরোনাম (ঐচ্ছিক — না দিলে গল্প থেকে অটো নেবে)'
                      )}
                    </label>
                    {previewAutoTitle && (
                      <span
                        data-testid="auto-title-preview"
                        className="max-w-[220px] truncate text-[11px] font-medium text-[var(--ck-accent)]"
                      >
                        {L(lang, 'Auto', 'অটো')}: “{previewAutoTitle}”
                      </span>
                    )}
                  </div>
                  <input
                    id="create-title-input"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={L(
                      lang,
                      'e.g. The Hidden Forest Trail',
                      'যেমন: গভীর জঙ্গলের অজানা পথ'
                    )}
                    className="mt-1.5 h-10 w-full rounded-lg border border-[var(--ck-border)] bg-[var(--ck-inset)] px-3 text-sm text-[var(--ck-text)] placeholder:text-[var(--ck-text-faint)] focus:border-[var(--ck-accent)] focus:outline-none"
                  />
                </div>

                <div>
                  <div className="mb-2 text-xs font-medium text-[var(--ck-text-secondary)]">
                    {L(lang, 'Animation Visual Style', 'অ্যানিমেশন ভিজ্যুয়াল স্টাইল')}
                  </div>
                  <div
                    role="radiogroup"
                    aria-label={L(lang, 'Visual animation style', 'ভিজ্যুয়াল অ্যানিমেশন স্টাইল')}
                    className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                  >
                    {STYLE_KEYS.map((key) => {
                      const active = visualStyle === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setVisualStyle(key)}
                          className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${
                            active
                              ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)] text-[var(--ck-text)]'
                              : 'border-[var(--ck-border)] bg-[var(--ck-inset)] text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]'
                          }`}
                        >
                          <span className="block truncate">{VISUAL_STYLE_LABELS[key].label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-[var(--ck-text-muted)]">
                    {L(
                      lang,
                      'Have a previously saved .json project?',
                      'আগে সংরক্ষিত কোনো .json প্রোজেক্ট আছে?'
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => jsonInputRef.current?.click()}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--ck-border-strong)] bg-[var(--ck-surface-alt)] px-3 text-xs font-medium text-[var(--ck-text-secondary)] hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)]"
                  >
                    <FolderUp className="h-3.5 w-3.5 text-[var(--ck-accent)]" />
                    <span>{L(lang, 'Import JSON', 'JSON ইম্পোর্ট করুন')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quiet Contextual Feedback Messages */}
          {(audioUrl || srtText.trim() || scriptText.trim()) && (
            <div
              data-testid="audio-srt-sync-indicator"
              className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs ${
                syncReport.status === 'synced' || syncReport.status === 'script-timed'
                  ? 'border-[var(--ck-success-border)] bg-[var(--ck-success-bg)] text-[var(--ck-success-text)]'
                  : syncReport.status === 'minor-drift'
                    ? 'border-[var(--ck-warn-border)] bg-[var(--ck-warn-bg)] text-[var(--ck-warn-text)]'
                    : 'border-[var(--ck-danger-border)] bg-[var(--ck-danger-bg)] text-[var(--ck-danger-text)]'
              }`}
            >
              {syncReport.status === 'synced' || syncReport.status === 'script-timed' ? (
                <Check className="h-4 w-4 shrink-0 text-[var(--ck-success)]" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-[var(--ck-accent)]" />
              )}
              <span>{syncReport.message}</span>
            </div>
          )}

          {attachNotice && !formError && (
            <div className="flex items-center gap-2 text-xs text-[var(--ck-success-text)]">
              <Check className="h-3.5 w-3.5 shrink-0 text-[var(--ck-success)]" />
              <span>{attachNotice}</span>
            </div>
          )}

          {formError && (
            <div
              role="alert"
              data-testid="intake-validation-error"
              className="rounded-lg border border-[var(--ck-danger-border)] bg-[var(--ck-danger-bg)] px-4 py-2.5 text-xs text-[var(--ck-danger-text)]"
            >
              {formError}
            </div>
          )}
        </div>

        {/* Clean Single-CTA Footer Bar */}
        <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-[var(--ck-border-subtle)] bg-[var(--ck-surface-alt)] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <div className="text-xs text-[var(--ck-text-muted)]">
            {allowScriptOnly
              ? L(
                  lang,
                  'Script-Only Mode: builds instant 2D animation & lip-sync preview',
                  'স্ক্রিপ্ট-অনলি মোড: তাৎক্ষণিক ২ডি অ্যানিমেশন ও লিপ-সিঙ্ক তৈরি হবে'
                )
              : L(
                  lang,
                  '16:9 Landscape & 9:16 Vertical — both formats generated together',
                  '১৬:৯ ল্যান্ডস্কেপ ও ৯:১৬ ভার্টিকাল — দুটি ফরম্যাটই একসাথে তৈরি হবে'
                )}
          </div>

          <button
            type="submit"
            data-testid="start-analysis-btn"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--ck-accent)] px-6 text-sm font-semibold text-[var(--ck-accent-fg)] transition-colors hover:bg-[var(--ck-accent-bright)] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)]"
          >
            <Sparkles className="h-4 w-4" />
            <span>{L(lang, 'Generate Animation', 'অ্যানিমেশন তৈরি করুন')}</span>
          </button>
        </div>
      </form>

      {/* Session History */}
      {recentProjects.length > 0 && (
        <div data-testid="recent-projects-bar" className="space-y-2.5 pt-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ck-text-secondary)]">
            <Clock className="h-3.5 w-3.5 text-[var(--ck-accent)]" />
            <span>
              {L(
                lang,
                `Recent Projects (${recentProjects.length})`,
                `সাম্প্রতিক প্রোজেক্ট (${recentProjects.length})`
              )}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentProjects.map((rp) => (
              <button
                key={rp.id}
                type="button"
                onClick={() => onSelectRecentProject(rp)}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] px-3 py-2 text-xs text-[var(--ck-text)] transition-colors hover:border-[var(--ck-accent)]"
              >
                <span className="max-w-[180px] truncate font-medium">{rp.title}</span>
                <span className="font-mono text-[11px] tabular-nums text-[var(--ck-text-muted)]">
                  {L(
                    lang,
                    `${rp.scenes.length} scenes · ${formatTimecode(rp.duration)}`,
                    `${rp.scenes.length} দৃশ্য · ${formatTimecode(rp.duration)}`
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Auto-Saved Browser Drafts Library */}
      {savedDrafts.length > 0 && (
        <div data-testid="saved-drafts-library" className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between text-xs text-[var(--ck-text-muted)]">
            <span className="inline-flex items-center gap-2 font-semibold text-[var(--ck-text-secondary)]">
              <Clock className="h-3.5 w-3.5 text-[var(--ck-accent)]" />
              {L(
                lang,
                `Saved Draft Library (${savedDrafts.length})`,
                `সংরক্ষিত ড্রাফট লাইব্রেরি (${savedDrafts.length})`
              )}
            </span>
            <span className="text-[11px]">
              {L(lang, 'Auto-saved in browser', 'ব্রাউজারে অটো-সেভড')}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {savedDrafts.map((draft) => (
              <div
                key={draft.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] px-3.5 py-2.5 text-xs"
              >
                <button
                  type="button"
                  onClick={() => onResumeDraft?.(draft)}
                  className="min-w-0 flex-1 text-left hover:text-[var(--ck-accent)]"
                >
                  <div className="truncate font-semibold text-[var(--ck-text)]">{draft.title}</div>
                  <div className="mt-0.5 font-mono text-[11px] tabular-nums text-[var(--ck-text-muted)]">
                    {L(
                      lang,
                      `${draft.sceneCount} scenes · ${formatTimecode(draft.duration)}`,
                      `${draft.sceneCount} দৃশ্য · ${formatTimecode(draft.duration)}`
                    )}
                  </div>
                </button>
                {onDeleteDraft && (
                  <button
                    type="button"
                    onClick={() => onDeleteDraft(draft.id)}
                    aria-label={L(
                      lang,
                      `Delete draft ${draft.title}`,
                      `${draft.title} ড্রাফট মুছুন`
                    )}
                    className="rounded p-1 text-[var(--ck-text-faint)] hover:bg-[var(--ck-danger-bg)] hover:text-[var(--ck-danger)]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
