import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Clapperboard,
  Download,
  Film,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ShieldCheck,
  Users,
  RotateCcw,
  BookOpen,
  Undo2,
  Sun,
  Moon,
  Keyboard,
  Maximize2,
  Minimize2,
  X,
  Globe,
  UserCog,
} from 'lucide-react';
import { SubtitleCue, parseSrt } from './lib/srtParser';
import { SRT_SRC } from './lib/storyboard';
import { analyzeAudioUrl, synthesizeEnvelopeFromCues } from './lib/audioAnalyzer';
import { synthesizePhoneticTrackFromCues } from './lib/visemeEngine';
import {
  AnimationProject,
  SceneSpec,
  VisualStyle,
  compileStoryProject,
  createDemoProject,
  deriveTitleFromContent,
  getProjectSceneAtTime,
  parseScriptToCues,
  redirectSingleSceneLocally,
} from './lib/storyCompiler';
import {
  fetchAiDirectorStatus,
  illustrateBeatWithAiDirector,
  planStoryWithAiDirector,
  regenerateSceneWithAiDirector,
  transcribeVoiceoverViaServer,
} from './lib/aiDirectorClient';
import {
  AudioSrtSyncReport,
  CharacterProfile,
  PipelineStepState,
  PipelineStepStatus,
  SceneStatusEntry,
  analyzeAudioSrtSync,
  auditProjectQuality,
  buildCharacterRegistry,
  computePipelineProgressPct,
  createInitialPipelineSteps,
  formatCharacterBibleFromProfiles,
  validateGenerationInputs,
} from './lib/storyIntelligence';
import { preloadSceneSvgs } from './lib/svgSanitizer';
import { SubtitleMode, SubtitleStyle, getWatermarkImage } from './animation/renderer';
import { REELDAIII_BRAND } from './lib/brandAssets';
import { VideoPlayer, PreviewMode, ExportFormatChoice } from './components/VideoPlayer';
import { StudioSidebar } from './components/StudioSidebar';
import { ChapterGrid } from './components/ChapterGrid';
import { TranscriptPanel } from './components/TranscriptPanel';
import { ExportModal } from './components/ExportModal';
import { CreateWorkspace, StoryIntakePayload } from './components/CreateWorkspace';
import { ProcessingOverlay } from './components/ProcessingOverlay';
import { RedesignModal } from './components/RedesignModal';
import { CharacterDesignerModal } from './components/CharacterDesignerModal';
import { TimelineEditor } from './components/TimelineEditor';
import { HomePage } from './components/HomePage';
import { StudioColumn } from './components/StudioColumn';
import { DeveloperPage } from './components/DeveloperPage';
import { UserManualPage } from './components/UserManualPage';
import { HomeShowcaseStory, KEYBOARD_SHORTCUTS } from './lib/manualContent';
import {
  StoryTemplateId,
  applyStoryTemplateToProject,
  getStoryTemplateById,
} from './lib/storyTemplates';
import {
  CustomCharacterDraft,
  applyCustomCharacterToProject,
  draftFromCharacterProfile,
} from './lib/characterDesigner';
import {
  ReferenceMediaProfile,
  applyReferenceMediaToProject,
} from './lib/referenceMediaAnalyzer';
import {
  AppPage,
  StudioSection,
  isStudioSectionPopulated,
  resolveInitialNavigation,
} from './lib/appNavigation';
import {
  AppTheme,
  applyAppTheme,
  readStoredTheme,
  toggleAppTheme,
} from './lib/themePreference';
import {
  AppLang,
  L,
  applyAppLang,
  readStoredLang,
  toggleAppLang,
} from './lib/i18n';
import {
  BgmConfig,
  BrandingConfig,
  DEFAULT_BGM_CONFIG,
  DEFAULT_BRANDING_CONFIG,
  DEFAULT_DESIGN_CONFIG,
  DEFAULT_SUBTITLE_CONFIG,
  DesignConfig,
  DesignSnapshot,
  SavedDraftRecord,
  SubtitleConfig,
  adjustSceneBoundary,
  captureDesignSnapshot,
  createScriptPreviewEnvelope,
  deleteSavedDraft,
  listSavedDrafts,
  mergeSceneWithNext,
  remixProjectDesign,
  restoreDesignSnapshot,
  saveProjectDraft,
  shiftSrtCuesOffset,
  splitSceneAtMidpoint,
} from './lib/redesignAndStudio';

type WorkspacePhase = 'upload' | 'processing' | 'ready';

export default function App() {
  const demoCuesRef = useRef<SubtitleCue[]>([]);
  const processingRunIdRef = useRef<number>(0);

  const initialNavRef = useRef(
    resolveInitialNavigation(typeof window !== 'undefined' ? window.location.search : '')
  );

  const [theme, setTheme] = useState<AppTheme>(() => readStoredTheme());
  const [lang, setLang] = useState<AppLang>(() => readStoredLang());
  const [activePage, setActivePage] = useState<AppPage>(() => initialNavRef.current.page);
  const [studioSection, setStudioSection] = useState<StudioSection>(
    () => initialNavRef.current.studioSection
  );
  const [hasLoadedProject, setHasLoadedProject] = useState<boolean>(
    () => initialNavRef.current.openDemoReady
  );

  useEffect(() => {
    applyAppTheme(theme);
  }, [theme]);

  useEffect(() => {
    applyAppLang(lang);
  }, [lang]);

  useEffect(() => {
    // Preload the official Reeldaiii transparent icon for instant canvas watermarking
    getWatermarkImage(REELDAIII_BRAND.faviconUrl);
  }, []);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => toggleAppTheme(prev));
  }, []);

  const handleToggleLang = useCallback(() => {
    setLang((prev) => toggleAppLang(prev));
  }, []);
  const [workspacePhase, setWorkspacePhase] = useState<WorkspacePhase>(() =>
    initialNavRef.current.openDemoReady ? 'ready' : 'upload'
  );
  const [project, setProject] = useState<AnimationProject>(() => createDemoProject([]));
  const [recentProjects, setRecentProjects] = useState<AnimationProject[]>([]);
  const [aiDirectorAvailable, setAiDirectorAvailable] = useState<boolean>(false);
  const [directorNotice, setDirectorNotice] = useState<string | null>(null);

  const [isLoadingCues, setIsLoadingCues] = useState<boolean>(true);
  const [srtError, setSrtError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [subtitleMode, setSubtitleMode] = useState<SubtitleMode>('bilingual');
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>('kinetic');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('dual');
  const [portraitZoom, setPortraitZoom] = useState<number>(1.38);
  const [seekRequest, setSeekRequest] = useState<{ time: number; id: number } | null>(null);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<ExportFormatChoice>('both');

  // 1% -> 100% Real 15-Stage Pipeline State
  const [processingPct, setProcessingPct] = useState<number>(1);
  const [processingElapsed, setProcessingElapsed] = useState<number>(0);
  const [processingDraftTitle, setProcessingDraftTitle] = useState<string>('');
  const [processingStageMsg, setProcessingStageMsg] = useState<string>('');
  const [processingResult, setProcessingResult] = useState<AnimationProject | null>(null);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStepState[]>(() =>
    createInitialPipelineSteps()
  );
  const [sceneStatuses, setSceneStatuses] = useState<SceneStatusEntry[]>([]);
  const [processingSyncReport, setProcessingSyncReport] = useState<AudioSrtSyncReport | null>(null);
  const [regeneratingSceneId, setRegeneratingSceneId] = useState<string | null>(null);

  // Redesign Studio, Custom Character Designer, Undo History, Focus Mode & Local Draft Library
  const [designHistory, setDesignHistory] = useState<DesignSnapshot[]>([]);
  const [isRedesignOpen, setIsRedesignOpen] = useState<boolean>(false);
  const [isCharacterDesignerOpen, setIsCharacterDesignerOpen] = useState<boolean>(false);
  const [customCharacterProfile, setCustomCharacterProfile] = useState<CharacterProfile | null>(null);
  const [customCharacterDraft, setCustomCharacterDraft] = useState<CustomCharacterDraft | null>(null);
  const [focusCinemaMode, setFocusCinemaMode] = useState<boolean>(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState<boolean>(false);
  const [savedDrafts, setSavedDrafts] = useState<SavedDraftRecord[]>(() => listSavedDrafts());

  // Check if server-side Gemini AI Director is available
  useEffect(() => {
    let active = true;
    fetchAiDirectorStatus().then((status) => {
      if (active) setAiDirectorAvailable(status.available);
    });
    return () => {
      active = false;
    };
  }, []);

  // Preload built-in showcase SRT silently in background for optional Demo preview
  useEffect(() => {
    let active = true;
    fetch(SRT_SRC)
      .then((res) => {
        if (!res.ok) throw new Error('Unable to load demo subtitle script.');
        return res.text();
      })
      .then((text) => {
        if (!active) return;
        const parsed = parseSrt(text);
        demoCuesRef.current = parsed;
        setProject((prev) => {
          if (!prev.isDemo) return prev;
          const base = createDemoProject(parsed);
          return {
            ...base,
            brandingConfig: prev.brandingConfig ?? base.brandingConfig,
            subtitleConfig: prev.subtitleConfig ?? base.subtitleConfig,
            designConfig: prev.designConfig ?? base.designConfig,
            bgmConfig: prev.bgmConfig ?? base.bgmConfig,
            visualStyle: prev.visualStyle ?? base.visualStyle,
          };
        });
        setIsLoadingCues(false);
      })
      .catch((err) => {
        if (!active) return;
        setSrtError(err instanceof Error ? err.message : 'Subtitle loading error.');
        setIsLoadingCues(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Support deep-link URL params (?page=home|studio|developer, ?demo=1, ?t=<seconds>, ?mode=..., ?autostart=1)
  useEffect(() => {
    const nav = initialNavRef.current;
    if (nav.previewMode) {
      setPreviewMode(nav.previewMode);
    }
    if (nav.seekTime !== null) {
      setSeekRequest({ time: nav.seekTime, id: Date.now() });
      setCurrentTime(nav.seekTime);
    }
    if (nav.autostart) {
      setIsPlaying(true);
    }
  }, []);

  const activeScene = getProjectSceneAtTime(project, currentTime);

  const handleSeekTo = useCallback((time: number, autoPlay = false) => {
    setSeekRequest({ time, id: Date.now() + Math.random() });
    setCurrentTime(time);
    if (autoPlay) setIsPlaying(true);
  }, []);

  // Auto-save non-demo projects to browser localStorage drafts
  useEffect(() => {
    if (workspacePhase !== 'ready' || project.isDemo) return;
    const timer = window.setTimeout(() => {
      setSavedDrafts(saveProjectDraft(project));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [workspacePhase, project]);

  const revealProjectInStudio = useCallback((readyProject: AnimationProject) => {
    setIsPlaying(false);
    setProject(readyProject);
    setDesignHistory([]);
    setIsRedesignOpen(false);
    setRecentProjects((prev) => {
      const filtered = prev.filter((p) => p.id !== readyProject.id);
      return [readyProject, ...filtered].slice(0, 6);
    });
    if (!readyProject.isDemo) {
      setSavedDrafts(saveProjectDraft(readyProject));
    }
    setSeekRequest({ time: 0, id: Date.now() + Math.random() });
    setCurrentTime(0);
    setSubtitleMode(
      Object.keys(readyProject.englishTranslations).length > 0 ? 'bilingual' : 'bn'
    );
    setHasLoadedProject(true);
    setWorkspacePhase('ready');
    setActivePage('studio');
    setStudioSection('preview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  /**
   * Executes real 15-Stage Context-Aware Storytelling Pipeline:
   * Input Validation -> Audio Decoding -> Speech Cadence -> SRT Sync -> Story Intelligence
   * -> Character Consistency DNA -> World Continuity -> Beat Segmentation -> Acting Direction
   * -> Camera Choreography -> 16:9 & 9:16 Calibration -> Scene Illustration -> Motion Sync
   * -> Automated Quality Control -> Dual-Format Studio Ready (100%).
   */
  const handleStartProcessing = useCallback(
    async (payload: StoryIntakePayload) => {
      const runId = ++processingRunIdRef.current;
      const isCurrent = () => processingRunIdRef.current === runId;

      const initialCues = payload.srtText.trim()
        ? parseSrt(payload.srtText)
        : parseScriptToCues(payload.scriptText, payload.audioDuration);
      const draftTitle = deriveTitleFromContent(
        payload.title,
        payload.scriptText,
        initialCues,
        payload.audioFileName
      );

      let workingSteps = createInitialPipelineSteps();
      let dynamicFloorPct = 2;

      const setStep = (
        id: PipelineStepState['id'],
        status: PipelineStepStatus,
        detail: string
      ) => {
        workingSteps = workingSteps.map((s) => (s.id === id ? { ...s, status, detail } : s));
        dynamicFloorPct = Math.max(dynamicFloorPct, computePipelineProgressPct(workingSteps));
        if (isCurrent()) {
          setPipelineSteps(workingSteps);
        }
      };

      const pauseMs = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

      setIsPlaying(false);
      setDirectorNotice(null);
      setProcessingPct(1);
      setProcessingElapsed(0);
      setProcessingDraftTitle(draftTitle);
      setProcessingStageMsg('Validating Voiceover Audio, SRT Subtitles & Script…');
      setProcessingResult(null);
      setSceneStatuses([]);
      setPipelineSteps(workingSteps);
      setActivePage('studio');
      setWorkspacePhase('processing');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      const startedAt = performance.now();
      let analysisDone = false;
      let compiledProject: AnimationProject | null = null;

      const analysisPromise = (async () => {
        // Step 1: Upload Validation
        setStep('upload-validation', 'processing', 'Checking audio, SRT cues & script…');
        const validation = validateGenerationInputs({
          hasAudio: Boolean(payload.audioUrl),
          audioFileName: payload.audioFileName,
          audioDuration: payload.audioDuration,
          srtText: payload.srtText,
          scriptText: payload.scriptText,
          allowScriptOnly: payload.allowScriptOnly,
        });
        if (isCurrent()) setProcessingSyncReport(validation.syncReport);
        if (!validation.valid) {
          setStep('upload-validation', 'failed', validation.errors[0] || 'Invalid inputs');
          return;
        }
        setStep(
          'upload-validation',
          'completed',
          `${payload.audioFileName ?? (payload.allowScriptOnly ? 'Script-Only Preview' : 'Voiceover')} · ${validation.parsedCueCount > 0 ? `${validation.parsedCueCount} SRT cues` : 'Script text'} verified`
        );

        let effectiveCues = initialCues;
        let effectiveScript = payload.scriptText;

        // Step 2: Audio Decoding (or Script-Only Cadence Synthesis)
        setStep(
          'audio-decoding',
          'processing',
          payload.audioUrl
            ? 'Decoding voiceover waveform & duration…'
            : 'Building script-paced speech cadence envelope…'
        );
        if (
          aiDirectorAvailable &&
          payload.audioUrl &&
          !payload.srtText.trim() &&
          !payload.scriptText.trim()
        ) {
          try {
            const transcribed = await transcribeVoiceoverViaServer(
              payload.audioUrl,
              payload.audioDuration
            );
            if (transcribed && transcribed.cues.length > 0) {
              effectiveCues = transcribed.cues;
              effectiveScript = transcribed.transcript;
            }
          } catch (err) {
            if (isCurrent()) {
              setDirectorNotice(
                `Auto-transcription skipped (${err instanceof Error ? err.message : 'unavailable'}). Synced using audio waveform cadence.`
              );
            }
          }
        }

        const estimatedDur = Math.max(
          8,
          payload.audioDuration ??
            (effectiveCues.length > 0
              ? effectiveCues[effectiveCues.length - 1].endTime + 1.5
              : 24)
        );
        const audioAnalysis = payload.audioUrl
          ? await analyzeAudioUrl(payload.audioUrl, effectiveCues, estimatedDur)
          : payload.allowScriptOnly
            ? (() => {
                const phonetic = synthesizePhoneticTrackFromCues(effectiveCues, estimatedDur, 20);
                return {
                  duration: estimatedDur,
                  envelope: createScriptPreviewEnvelope(effectiveCues, estimatedDur),
                  sampleRateHz: 10,
                  phoneticFrames: phonetic.frames,
                  phoneticHz: phonetic.phoneticHz,
                  pace: 'moderate' as const,
                  source: 'cue-cadence' as const,
                };
              })()
            : synthesizeEnvelopeFromCues(effectiveCues, estimatedDur);

        setStep(
          'audio-decoding',
          'completed',
          `${audioAnalysis.duration.toFixed(1)}s ${payload.audioUrl ? 'decoded' : 'synthesized'} (${audioAnalysis.source})`
        );

        // Step 3: Speech Cadence Mapping
        setStep('speech-energy', 'processing', 'Mapping vocal energy peaks & pauses…');
        await pauseMs(120);
        setStep(
          'speech-energy',
          'completed',
          `${audioAnalysis.pace} speaking cadence · ${audioAnalysis.envelope.length} energy samples`
        );

        // Step 4: Subtitle Sync
        setStep('subtitle-sync', 'processing', 'Checking Audio vs SRT timestamp drift…');
        const syncReport = analyzeAudioSrtSync({
          hasAudio: Boolean(payload.audioUrl),
          audioDuration: audioAnalysis.duration,
          cues: effectiveCues,
          hasSrt: Boolean(payload.srtText.trim()),
          hasScript: Boolean(effectiveScript.trim()),
          allowScriptOnly: payload.allowScriptOnly,
        });
        if (isCurrent()) setProcessingSyncReport(syncReport);
        setStep(
          'subtitle-sync',
          syncReport.status === 'mismatch' ? 'failed' : 'completed',
          syncReport.message
        );

        // Step 5–11: Local baseline semantic compilation
        setStep('story-understanding', 'processing', 'Analyzing theme, arc & cultural context…');
        const localBuilt = compileStoryProject({
          title: payload.title,
          srtText: payload.srtText,
          scriptText: effectiveScript,
          cuesOverride: effectiveCues.length > 0 ? effectiveCues : undefined,
          visualStyle: payload.visualStyle,
          audioUrl: payload.audioUrl,
          audioFileName: payload.audioFileName,
          audioDuration: payload.audioDuration ?? audioAnalysis.duration,
          audioEnvelope: audioAnalysis.envelope,
          audioEnvelopeHz: audioAnalysis.sampleRateHz,
          phoneticFrames: audioAnalysis.phoneticFrames,
          phoneticHz: audioAnalysis.phoneticHz,
          speechPace: audioAnalysis.pace,
          audioSyncMode: audioAnalysis.source,
        });
        localBuilt.scriptPreviewMode = !payload.audioUrl && Boolean(payload.allowScriptOnly);

        let finalProject: AnimationProject = localBuilt;

        // Optional AI Director Upgrade (strictly server-side gemini-4-hydrogen)
        if (aiDirectorAvailable && (effectiveCues.length > 0 || effectiveScript.trim().length > 0)) {
          try {
            if (isCurrent()) {
              setProcessingStageMsg('AI Director extracting story intelligence, character cast & acting plan…');
            }
            const aiPlan = await planStoryWithAiDirector({
              title: payload.title,
              cues: effectiveCues,
              scriptText: effectiveScript,
              duration: localBuilt.duration,
              visualStyle: payload.visualStyle,
            });

            if (aiPlan.beats.length > 0) {
              const aiRoles = Array.from(
                new Set(aiPlan.beats.map((b) => b.primaryCharacter))
              );
              const lockedProfiles = buildCharacterRegistry(
                aiRoles,
                aiPlan.characters as Partial<CharacterProfile>[] | undefined
              );
              const lockedBible =
                aiPlan.characterBible || formatCharacterBibleFromProfiles(lockedProfiles);

              const plannedScenes: SceneSpec[] = aiPlan.beats.map((b, idx) => ({
                id: `ai-scene-${Date.now()}-${idx + 1}`,
                chapterNumber: String(idx + 1).padStart(2, '0'),
                titleBn: b.titleBn,
                titleEn: b.titleEn,
                summary: b.summary,
                spokenExcerpt: b.spokenExcerpt,
                visualMatchReason: b.visualMatchReason,
                visualStorytelling: b.visualStorytelling || b.visualMatchReason,
                characterIds: b.characterIds,
                characterActions: b.characterActions,
                facialExpression: b.facialExpression,
                bodyLanguage: b.bodyLanguage,
                environmentDetails: b.environmentDetails,
                importantProps: b.importantProps,
                lightingColor: b.lightingColor,
                transitionToNext: b.transitionToNext ?? 'light-leak',
                startTime: b.startTime,
                endTime: b.endTime,
                setting: b.setting,
                timeOfDay: b.timeOfDay,
                weather: b.weather,
                action: b.action,
                emotion: b.emotion,
                cameraShot: b.cameraShot,
                cameraMotion: b.cameraMotion,
                primaryCharacter: b.primaryCharacter,
                secondaryCharacter: b.secondaryCharacter,
                motif: b.motif,
                accentColor: b.accentColor,
                focalPointX: b.focalPointX,
                visualPrompt: b.visualPrompt,
              }));

              const mergedIntelligence = {
                ...localBuilt.storyIntelligence!,
                theme: aiPlan.storyIntelligence?.theme || localBuilt.storyIntelligence!.theme,
                moralOrMessage:
                  aiPlan.storyIntelligence?.moralOrMessage ||
                  localBuilt.storyIntelligence!.moralOrMessage,
                beginningArc:
                  aiPlan.storyIntelligence?.beginningArc ||
                  localBuilt.storyIntelligence!.beginningArc,
                middleArc:
                  aiPlan.storyIntelligence?.middleArc || localBuilt.storyIntelligence!.middleArc,
                endingArc:
                  aiPlan.storyIntelligence?.endingArc || localBuilt.storyIntelligence!.endingArc,
                historicalCulturalContext:
                  aiPlan.storyIntelligence?.historicalCulturalContext ||
                  localBuilt.storyIntelligence!.historicalCulturalContext,
                emotionalArc:
                  aiPlan.storyIntelligence?.emotionalArc &&
                  aiPlan.storyIntelligence.emotionalArc.length > 0
                    ? aiPlan.storyIntelligence.emotionalArc
                    : plannedScenes.map((s) => s.emotion ?? 'calm'),
                locations:
                  aiPlan.storyIntelligence?.locations &&
                  aiPlan.storyIntelligence.locations.length > 0
                    ? aiPlan.storyIntelligence.locations
                    : localBuilt.storyIntelligence!.locations,
                importantObjects:
                  aiPlan.storyIntelligence?.importantObjects &&
                  aiPlan.storyIntelligence.importantObjects.length > 0
                    ? aiPlan.storyIntelligence.importantObjects
                    : localBuilt.storyIntelligence!.importantObjects,
                audioSrtSync: syncReport,
              };

              finalProject = {
                ...localBuilt,
                title: payload.title?.trim() || aiPlan.title || localBuilt.title,
                characterBible: lockedBible,
                characterProfiles: lockedProfiles,
                storyIntelligence: mergedIntelligence,
                directorEngine: 'gemini-ai',
                scenes: plannedScenes,
                analysis: localBuilt.analysis
                  ? {
                      ...localBuilt.analysis,
                      sceneCount: plannedScenes.length,
                      primarySettings: Array.from(new Set(plannedScenes.map((s) => s.setting))),
                      narrativeHighlights:
                        aiPlan.narrativeHighlights.length > 0
                          ? aiPlan.narrativeHighlights
                          : localBuilt.analysis.narrativeHighlights,
                    }
                  : undefined,
              };
            }
          } catch (err) {
            if (isCurrent()) {
              setDirectorNotice(
                `Gemini AI Director unavailable (${err instanceof Error ? err.message : 'fallback active'}). Rendered with 22-World Context Cinema Engine.`
              );
            }
          }
        }

        if (!isCurrent()) return;
        setProcessingDraftTitle(finalProject.title);
        setProcessingResult(finalProject);

        // Mark steps 5 -> 11 cleanly with real extracted metadata
        setStep(
          'story-understanding',
          'completed',
          finalProject.storyIntelligence?.theme || 'Theme & 3-act narrative mapped'
        );
        await pauseMs(90);

        setStep(
          'character-profiles',
          'completed',
          `${finalProject.characterProfiles?.length ?? 1} persistent cast profiles locked`
        );
        await pauseMs(90);

        setStep(
          'location-continuity',
          'completed',
          `${finalProject.storyIntelligence?.locations.slice(0, 2).join(', ') || 'Matched worlds'} mapped`
        );
        await pauseMs(90);

        setStep(
          'scene-segmentation',
          'completed',
          `${finalProject.scenes.length} story-driven beats segmented`
        );
        await pauseMs(90);

        setStep(
          'acting-direction',
          'completed',
          'Facial expressions, lip-sync & posture cues assigned'
        );
        await pauseMs(90);

        setStep(
          'camera-choreography',
          'completed',
          'Dolly, pan, tracking & cross-scene wipes choreographed'
        );
        await pauseMs(90);

        setStep(
          'framing-calibration',
          'completed',
          '9:16 portrait safe-zones (14%–86%) & 16:9 widescreen calibrated'
        );

        // Step 12: Scene Illustration (per-scene status updates)
        let workingStatuses: SceneStatusEntry[] = finalProject.scenes.map((sc) => ({
          sceneId: sc.id,
          chapterNumber: sc.chapterNumber,
          titleBn: sc.titleBn,
          status: 'generating',
          message: 'Composing layered scene…',
        }));
        if (isCurrent()) setSceneStatuses(workingStatuses);
        setStep(
          'scene-illustration',
          'processing',
          `Preparing 0/${finalProject.scenes.length} layered visual scenes…`
        );

        const paintedScenes = [...finalProject.scenes];
        let builtCount = 0;

        if (finalProject.directorEngine === 'gemini-ai' && aiDirectorAvailable) {
          for (let i = 0; i < paintedScenes.length; i += 2) {
            if (!isCurrent()) return;
            const batchIndices = [i, i + 1].filter((idx) => idx < paintedScenes.length);
            await Promise.all(
              batchIndices.map(async (idx) => {
                const beat = paintedScenes[idx];
                try {
                  const art = await illustrateBeatWithAiDirector({
                    spokenExcerpt: beat.spokenExcerpt || beat.summary,
                    visualPrompt: beat.visualPrompt || beat.summary,
                    characterBible: finalProject.characterBible || '',
                    visualStyle: payload.visualStyle,
                    timeOfDay: beat.timeOfDay,
                    emotion: beat.emotion ?? 'calm',
                    accentColor: beat.accentColor,
                  });
                  if (art.customSvg) {
                    paintedScenes[idx] = { ...beat, customSvg: art.customSvg };
                  }
                  workingStatuses = workingStatuses.map((st) =>
                    st.sceneId === beat.id
                      ? { ...st, status: 'ready', message: 'Bespoke AI + 2D world ready' }
                      : st
                  );
                } catch {
                  workingStatuses = workingStatuses.map((st) =>
                    st.sceneId === beat.id
                      ? { ...st, status: 'ready', message: '22-world procedural cinema ready' }
                      : st
                  );
                } finally {
                  builtCount += 1;
                  if (isCurrent()) {
                    setSceneStatuses(workingStatuses);
                    setStep(
                      'scene-illustration',
                      'processing',
                      `Rendered ${builtCount}/${paintedScenes.length} custom visual scenes…`
                    );
                  }
                }
              })
            );
          }
        } else {
          for (let i = 0; i < paintedScenes.length; i++) {
            if (!isCurrent()) return;
            const beat = paintedScenes[i];
            workingStatuses = workingStatuses.map((st) =>
              st.sceneId === beat.id
                ? { ...st, status: 'ready', message: 'Layered procedural scene ready' }
                : st
            );
            builtCount = i + 1;
            if (isCurrent()) {
              setSceneStatuses(workingStatuses);
              setStep(
                'scene-illustration',
                'processing',
                `Rendered ${builtCount}/${paintedScenes.length} layered visual scenes…`
              );
            }
            await pauseMs(75);
          }
        }

        setStep(
          'scene-illustration',
          'completed',
          `All ${paintedScenes.length} visual scenes composed`
        );

        // Step 13: Motion Sync & SVG Preload
        setStep('motion-sync', 'processing', 'Syncing lip-sync & spring transitions…');
        await preloadSceneSvgs(
          paintedScenes.map((s) => s.customSvg).filter((s): s is string => Boolean(s))
        );
        setStep('motion-sync', 'completed', 'Audio envelope, blinks & transitions synchronized');

        // Step 14: Apply Selected Story Template & Custom Character Lock + Automated QC Audit
        setStep('quality-control', 'processing', 'Auditing consistency, repetition & 9:16 bounds…');
        let auditedProject: AnimationProject = {
          ...finalProject,
          scenes: paintedScenes,
        };
        if (payload.templateId) {
          auditedProject = applyStoryTemplateToProject(auditedProject, payload.templateId);
        }
        const effectiveCustomChar = payload.customCharacter ?? customCharacterProfile;
        if (effectiveCustomChar) {
          auditedProject = applyCustomCharacterToProject(
            auditedProject,
            effectiveCustomChar,
            payload.lockCustomCharacter ?? customCharacterDraft?.lockAcrossAllScenes ?? true
          );
        }
        if (payload.referenceMedia) {
          auditedProject = applyReferenceMediaToProject(auditedProject, payload.referenceMedia);
        }
        const qcReport = auditProjectQuality(auditedProject);
        auditedProject.qualityAudit = qcReport;

        if (qcReport.flaggedSceneIds.length > 0) {
          workingStatuses = workingStatuses.map((st) =>
            qcReport.flaggedSceneIds.includes(st.sceneId)
              ? { ...st, status: 'flagged', message: 'QC flagged — retryable in studio' }
              : st
          );
          if (isCurrent()) setSceneStatuses(workingStatuses);
        }

        setStep(
          'quality-control',
          'completed',
          `QC Score ${qcReport.score}/100 · ${qcReport.issues.length} alerts`
        );

        // Step 15: Export Ready
        setStep('export-ready', 'completed', '16:9 Landscape & 9:16 Vertical ready');
        compiledProject = auditedProject;
        analysisDone = true;
        if (isCurrent()) {
          setProcessingResult(auditedProject);
          setProcessingStageMsg('Dual 16:9 & 9:16 Animated Film Complete — Opening Studio…');
        }
      })();

      // Smooth 1% -> 100% progress animation synchronized with real pipeline progress
      const TARGET_DURATION_MS = aiDirectorAvailable ? 4200 : 2800;

      await new Promise<void>((resolve) => {
        const tick = () => {
          if (!isCurrent()) {
            resolve();
            return;
          }
          const elapsedMs = performance.now() - startedAt;
          setProcessingElapsed(elapsedMs / 1000);

          const stepPct = computePipelineProgressPct(workingSteps);
          const timePct = 1 + Math.floor((elapsedMs / TARGET_DURATION_MS) * 99);
          const merged = Math.max(dynamicFloorPct, Math.min(stepPct + 4, timePct));
          const cappedPct = analysisDone ? Math.min(100, Math.max(stepPct, timePct)) : Math.min(94, merged);
          setProcessingPct(Math.max(1, cappedPct));

          if (analysisDone && cappedPct >= 100) {
            resolve();
            return;
          }
          window.setTimeout(tick, 45);
        };
        tick();
      });

      await analysisPromise;
      if (!isCurrent() || !compiledProject) return;

      setProcessingPct(100);
      await pauseMs(260);

      if (isCurrent() && compiledProject) {
        revealProjectInStudio(compiledProject);
      }
    },
    [aiDirectorAvailable, customCharacterDraft?.lockAcrossAllScenes, customCharacterProfile, revealProjectInStudio]
  );

  const handleLoadDemo = useCallback(async () => {
    const runId = ++processingRunIdRef.current;
    const isCurrent = () => processingRunIdRef.current === runId;
    const demo = createDemoProject(demoCuesRef.current);
    demo.qualityAudit = auditProjectQuality(demo);

    let steps = createInitialPipelineSteps();
    setIsPlaying(false);
    setDirectorNotice(null);
    setProcessingPct(1);
    setProcessingElapsed(0);
    setProcessingDraftTitle(demo.title);
    setProcessingStageMsg('Loading showcase Bengali cinema film & synchronized SRT…');
    setProcessingResult(demo);
    setProcessingSyncReport(null);
    setPipelineSteps(steps);
    setSceneStatuses(
      demo.scenes.map((s) => ({
        sceneId: s.id,
        chapterNumber: s.chapterNumber,
        titleBn: s.titleBn,
        status: 'ready',
        message: 'Showcase scene ready',
      }))
    );
    setActivePage('studio');
    setWorkspacePhase('processing');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const startedAt = performance.now();
    const DEMO_DURATION_MS = 1800;

    await new Promise<void>((resolve) => {
      const tick = () => {
        if (!isCurrent()) {
          resolve();
          return;
        }
        const elapsedMs = performance.now() - startedAt;
        setProcessingElapsed(elapsedMs / 1000);
        const pct = Math.min(100, 1 + Math.floor((elapsedMs / DEMO_DURATION_MS) * 99));
        setProcessingPct(pct);

        const doneCount = Math.floor((pct / 100) * steps.length);
        steps = steps.map((st, idx) => ({
          ...st,
          status: idx < doneCount ? 'completed' : idx === doneCount ? 'processing' : 'pending',
          detail: idx < doneCount ? 'Completed' : st.labelBn,
        }));
        setPipelineSteps(steps);

        if (pct >= 100) {
          resolve();
          return;
        }
        window.setTimeout(tick, 40);
      };
      tick();
    });

    if (!isCurrent()) return;
    await new Promise((r) => window.setTimeout(r, 180));
    if (isCurrent()) {
      const readyDemo = createDemoProject(demoCuesRef.current);
      readyDemo.qualityAudit = auditProjectQuality(readyDemo);
      revealProjectInStudio(readyDemo);
    }
  }, [revealProjectInStudio]);

  const handleImportProject = useCallback(
    (imported: AnimationProject) => {
      setDirectorNotice(null);
      revealProjectInStudio(imported);
    },
    [revealProjectInStudio]
  );

  const handleSelectRecentProject = useCallback(
    (selected: AnimationProject) => {
      setDirectorNotice(null);
      revealProjectInStudio(selected);
    },
    [revealProjectInStudio]
  );

  const handleUpdateScene = useCallback((sceneId: string, patch: Partial<SceneSpec>) => {
    setProject((prev) => {
      const nextScenes = prev.scenes.map((s) => (s.id === sceneId ? { ...s, ...patch } : s));
      const next: AnimationProject = { ...prev, scenes: nextScenes };
      next.qualityAudit = auditProjectQuality(next);
      return next;
    });
  }, []);

  const handleUpdateProjectStyle = useCallback((style: VisualStyle) => {
    setProject((prev) => {
      const snap = captureDesignSnapshot(prev, `Style → ${style}`);
      setDesignHistory((h) => [snap, ...h].slice(0, 20));
      return {
        ...prev,
        visualStyle: style,
      };
    });
  }, []);

  const handleFullRemix = useCallback((options?: { clearCustomSvg?: boolean }) => {
    setProject((prev) => {
      const snap = captureDesignSnapshot(prev, 'Before Full Redesign');
      setDesignHistory((h) => [snap, ...h].slice(0, 20));
      const remixed = remixProjectDesign(prev, options);
      remixed.qualityAudit = auditProjectQuality(remixed);
      return remixed;
    });
  }, []);

  const handleApplyStoryTemplate = useCallback((templateId: StoryTemplateId) => {
    const tpl = getStoryTemplateById(templateId);
    setProject((prev) => {
      const snap = captureDesignSnapshot(prev, `Template → ${tpl.nameEn}`);
      setDesignHistory((h) => [snap, ...h].slice(0, 20));
      const styled = applyStoryTemplateToProject(prev, templateId);
      styled.qualityAudit = auditProjectQuality(styled);
      return styled;
    });
  }, []);

  const handleApplyReferenceMedia = useCallback((profile: ReferenceMediaProfile | null) => {
    setProject((prev) => {
      const snap = captureDesignSnapshot(
        prev,
        profile ? `Reference → ${profile.fileName}` : 'Clear Reference Media'
      );
      setDesignHistory((h) => [snap, ...h].slice(0, 20));
      if (!profile) {
        const cleared: AnimationProject = { ...prev, referenceMedia: null };
        cleared.qualityAudit = auditProjectQuality(cleared);
        return cleared;
      }
      const matched = applyReferenceMediaToProject(prev, profile);
      matched.qualityAudit = auditProjectQuality(matched);
      return matched;
    });
  }, []);

  const handleApplyCustomCharacter = useCallback(
    (profile: CharacterProfile, draft: CustomCharacterDraft) => {
      setCustomCharacterProfile(profile);
      setCustomCharacterDraft(draft);
      if (hasLoadedProject) {
        setProject((prev) => {
          const updated = applyCustomCharacterToProject(
            prev,
            profile,
            draft.lockAcrossAllScenes
          );
          updated.qualityAudit = auditProjectQuality(updated);
          return updated;
        });
      }
    },
    [hasLoadedProject]
  );

  const handleOpenCharacterDesigner = useCallback(() => {
    if (!customCharacterDraft && hasLoadedProject && project.characterProfiles?.length) {
      setCustomCharacterDraft(draftFromCharacterProfile(project.characterProfiles[0], true));
    }
    setIsCharacterDesignerOpen(true);
  }, [customCharacterDraft, hasLoadedProject, project.characterProfiles]);

  const handleUpdateDesignConfig = useCallback((patch: Partial<DesignConfig>) => {
    setProject((prev) => {
      const current = prev.designConfig ?? DEFAULT_DESIGN_CONFIG;
      const structuralChange =
        (patch.layoutMode && patch.layoutMode !== current.layoutMode) ||
        (patch.colorPalette && patch.colorPalette !== current.colorPalette);
      if (structuralChange) {
        const snap = captureDesignSnapshot(
          prev,
          `${patch.layoutMode ?? current.layoutMode} · ${patch.colorPalette ?? current.colorPalette}`
        );
        setDesignHistory((h) => [snap, ...h].slice(0, 20));
      }
      return {
        ...prev,
        designConfig: {
          ...current,
          ...patch,
        },
      };
    });
  }, []);

  const handleUndoDesign = useCallback(() => {
    setDesignHistory((prevHistory) => {
      if (prevHistory.length === 0) return prevHistory;
      const [latest, ...rest] = prevHistory;
      setProject((prevProject) => {
        const restored = restoreDesignSnapshot(prevProject, latest);
        restored.qualityAudit = auditProjectQuality(restored);
        return restored;
      });
      return rest;
    });
  }, []);

  const handleRestoreSnapshot = useCallback(
    (snapshotId: string) => {
      const found = designHistory.find((s) => s.id === snapshotId);
      if (!found) return;
      setProject((prev) => {
        const snap = captureDesignSnapshot(prev, 'Before Restore');
        setDesignHistory((h) => [snap, ...h.filter((item) => item.id !== snapshotId)].slice(0, 20));
        const restored = restoreDesignSnapshot(prev, found);
        restored.qualityAudit = auditProjectQuality(restored);
        return restored;
      });
    },
    [designHistory]
  );

  const handleUpdateSubtitleConfig = useCallback((patch: Partial<SubtitleConfig>) => {
    setProject((prev) => ({
      ...prev,
      subtitleConfig: {
        ...(prev.subtitleConfig ?? DEFAULT_SUBTITLE_CONFIG),
        ...patch,
      },
    }));
  }, []);

  const handleUpdateBrandingConfig = useCallback((patch: Partial<BrandingConfig>) => {
    setProject((prev) => ({
      ...prev,
      brandingConfig: {
        ...(prev.brandingConfig ?? DEFAULT_BRANDING_CONFIG),
        ...patch,
      },
    }));
  }, []);

  const handleUpdateBgmConfig = useCallback((patch: Partial<BgmConfig>) => {
    setProject((prev) => ({
      ...prev,
      bgmConfig: {
        ...(prev.bgmConfig ?? DEFAULT_BGM_CONFIG),
        ...patch,
      },
    }));
  }, []);

  const handleAdjustSceneBoundary = useCallback(
    (sceneId: string, edge: 'start' | 'end', deltaSec: number) => {
      setProject((prev) => {
        const nextScenes = adjustSceneBoundary(
          prev.scenes,
          sceneId,
          edge,
          deltaSec,
          prev.duration
        );
        const next: AnimationProject = { ...prev, scenes: nextScenes };
        next.qualityAudit = auditProjectQuality(next);
        return next;
      });
    },
    []
  );

  const handleSplitScene = useCallback((sceneId: string) => {
    setProject((prev) => {
      const nextScenes = splitSceneAtMidpoint(prev.scenes, sceneId);
      const next: AnimationProject = { ...prev, scenes: nextScenes };
      next.qualityAudit = auditProjectQuality(next);
      return next;
    });
  }, []);

  const handleMergeScene = useCallback((sceneId: string) => {
    setProject((prev) => {
      const nextScenes = mergeSceneWithNext(prev.scenes, sceneId);
      const next: AnimationProject = { ...prev, scenes: nextScenes };
      next.qualityAudit = auditProjectQuality(next);
      return next;
    });
  }, []);

  const handleShiftSrtOffset = useCallback((deltaSec: number) => {
    setProject((prev) => {
      const nextCues = shiftSrtCuesOffset(prev.cues, deltaSec);
      const resynth =
        prev.scriptPreviewMode || prev.analysis?.audioSyncMode === 'cue-cadence'
          ? synthesizePhoneticTrackFromCues(nextCues, prev.duration, prev.phoneticHz ?? 20)
          : null;
      return {
        ...prev,
        srtOffsetSeconds: Number(((prev.srtOffsetSeconds ?? 0) + deltaSec).toFixed(2)),
        cues: nextCues,
        phoneticFrames: resynth ? resynth.frames : prev.phoneticFrames,
      };
    });
  }, []);

  const handleResetSrtOffset = useCallback(() => {
    setProject((prev) => {
      const currentOffset = prev.srtOffsetSeconds ?? 0;
      if (Math.abs(currentOffset) < 0.001) return prev;
      const nextCues = shiftSrtCuesOffset(prev.cues, -currentOffset);
      const resynth =
        prev.scriptPreviewMode || prev.analysis?.audioSyncMode === 'cue-cadence'
          ? synthesizePhoneticTrackFromCues(nextCues, prev.duration, prev.phoneticHz ?? 20)
          : null;
      return {
        ...prev,
        srtOffsetSeconds: 0,
        cues: nextCues,
        phoneticFrames: resynth ? resynth.frames : prev.phoneticFrames,
      };
    });
  }, []);

  const handleResumeDraft = useCallback(
    (draft: SavedDraftRecord) => {
      const snap = draft.projectSnapshot;
      const hydrated =
        snap.phoneticFrames && snap.phoneticFrames.length > 0
          ? snap
          : (() => {
              const ph = synthesizePhoneticTrackFromCues(snap.cues, snap.duration, 20);
              return { ...snap, phoneticFrames: ph.frames, phoneticHz: ph.phoneticHz };
            })();
      setDirectorNotice(
        hydrated.scriptPreviewMode
          ? 'Resumed Script-Only draft from local library.'
          : 'Resumed auto-saved draft. Note: re-attach original audio file in Upload tab if exporting.'
      );
      revealProjectInStudio(hydrated);
    },
    [revealProjectInStudio]
  );

  const handleDeleteDraft = useCallback((draftId: string) => {
    setSavedDrafts(deleteSavedDraft(draftId));
  }, []);

  const handleRegenerateScene = useCallback(
    async (
      sceneId: string,
      instruction?: string,
      options?: { repaintAiArt?: boolean }
    ) => {
      const target = project.scenes.find((s) => s.id === sceneId);
      if (!target) return;

      setRegeneratingSceneId(sceneId);
      try {
        if (aiDirectorAvailable) {
          try {
            const { updatedBeat } = await regenerateSceneWithAiDirector({
              scene: target,
              characterBible: project.characterBible || '',
              visualStyle: project.visualStyle ?? 'storybook-warm',
              customInstruction: instruction,
            });

            let customSvg = target.customSvg;
            if (options?.repaintAiArt || target.customSvg) {
              const art = await illustrateBeatWithAiDirector({
                spokenExcerpt: target.spokenExcerpt || target.summary,
                visualPrompt:
                  updatedBeat.visualPrompt ||
                  instruction ||
                  target.visualPrompt ||
                  target.summary,
                characterBible: project.characterBible || '',
                visualStyle: project.visualStyle ?? 'storybook-warm',
                timeOfDay: (updatedBeat.timeOfDay as SceneSpec['timeOfDay']) ?? target.timeOfDay,
                emotion: (updatedBeat.emotion as SceneSpec['emotion']) ?? target.emotion ?? 'calm',
                accentColor: updatedBeat.accentColor ?? target.accentColor,
              });
              if (art.customSvg) {
                await preloadSceneSvgs([art.customSvg]);
                customSvg = art.customSvg;
              }
            }

            setProject((prev) => {
              const nextScenes = prev.scenes.map((s) =>
                s.id === sceneId
                  ? {
                      ...s,
                      ...updatedBeat,
                      customSvg,
                      presetSceneId: undefined,
                    }
                  : s
              );
              const next: AnimationProject = { ...prev, scenes: nextScenes };
              next.qualityAudit = auditProjectQuality(next);
              return next;
            });
            return;
          } catch {
            // Fall through cleanly to local story-matched re-direction
          }
        }

        setProject((prev) => redirectSingleSceneLocally(prev, sceneId, instruction));
      } finally {
        setRegeneratingSceneId(null);
      }
    },
    [aiDirectorAvailable, project]
  );

  const handleAddScene = useCallback(() => {
    setProject((prev) => {
      const last = prev.scenes[prev.scenes.length - 1];
      const newStart = Number(prev.duration.toFixed(2));
      const newEnd = Number((prev.duration + 12).toFixed(2));
      const nextNum = String(prev.scenes.length + 1).padStart(2, '0');
      const newScene: SceneSpec = {
        id: `scene-${Date.now()}`,
        chapterNumber: nextNum,
        titleBn: `নতুন দৃশ্য ${nextNum}`,
        titleEn: 'New Animated Scene',
        summary: 'Custom animated scene added in Scene Director.',
        visualMatchReason: 'Custom scene added manually',
        startTime: newStart,
        endTime: newEnd,
        setting: last ? last.setting : 'park-nature',
        timeOfDay: 'sunset',
        weather: 'clear',
        action: 'speaking-narrator',
        emotion: 'calm',
        cameraShot: 'medium-two-shot',
        cameraMotion: 'dolly-in',
        motif: 'none',
        primaryCharacter: last?.primaryCharacter ?? 'narrator',
        secondaryCharacter: null,
        accentColor: '#E5A93C',
      };
      const next: AnimationProject = {
        ...prev,
        duration: newEnd,
        scenes: [...prev.scenes, newScene],
      };
      next.qualityAudit = auditProjectQuality(next);
      return next;
    });
  }, []);

  const handleDeleteScene = useCallback(
    (sceneId: string) => {
      setProject((prev) => {
        if (prev.scenes.length <= 1) return prev;
        const remaining = prev.scenes
          .filter((s) => s.id !== sceneId)
          .map((s, idx) => ({
            ...s,
            chapterNumber: String(idx + 1).padStart(2, '0'),
          }));
        const totalDur = prev.duration;
        const segDur = totalDur / remaining.length;
        const stitched = remaining.map((s, idx) => ({
          ...s,
          startTime: Number((idx * segDur).toFixed(2)),
          endTime: Number(((idx + 1) * segDur).toFixed(2)),
        }));
        const next: AnimationProject = { ...prev, scenes: stitched };
        next.qualityAudit = auditProjectQuality(next);
        return next;
      });
      handleSeekTo(0, false);
    },
    [handleSeekTo]
  );

  const handleOpenExport = useCallback((format: ExportFormatChoice) => {
    setIsPlaying(false);
    setExportFormat(format);
    setIsExportOpen(true);
  }, []);

  const handleSelectChapter = useCallback(
    (scene: SceneSpec) => {
      handleSeekTo(scene.startTime + 0.1, false);
      setStudioSection('preview');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [handleSeekTo]
  );

  const handleBackToUpload = useCallback(() => {
    processingRunIdRef.current += 1;
    setIsPlaying(false);
    setActivePage('studio');
    setStudioSection('create');
    if (workspacePhase === 'processing') {
      setWorkspacePhase(hasLoadedProject ? 'ready' : 'upload');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [hasLoadedProject, workspacePhase]);

  const handleNavigatePage = useCallback((page: AppPage) => {
    if (page !== 'studio') {
      setIsPlaying(false);
    }
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const [studioInitialInputMode, setStudioInitialInputMode] = useState<'upload' | 'record' | 'script' | undefined>(undefined);

  const handleEnterStudio = useCallback(() => {
    setStudioInitialInputMode(undefined);
    setActivePage('studio');
    if (workspacePhase !== 'processing') {
      setStudioSection(hasLoadedProject ? 'preview' : 'create');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [hasLoadedProject, workspacePhase]);

  const handleOpenVoiceRecorder = useCallback(() => {
    setIsPlaying(false);
    setStudioInitialInputMode('record');
    setActivePage('studio');
    if (workspacePhase !== 'processing') {
      setStudioSection('create');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [workspacePhase]);

  const handleSelectStudioSection = useCallback(
    (section: StudioSection) => {
      if (workspacePhase === 'processing') return;
      if (section !== 'preview') {
        setIsPlaying(false);
      }
      setActivePage('studio');
      setStudioSection(section);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [workspacePhase]
  );

  const handleTryHomeStory = useCallback(
    (story: HomeShowcaseStory) => {
      void handleStartProcessing({
        title: lang === 'bn' ? story.titleBn : story.titleEn,
        srtText: '',
        scriptText: lang === 'bn' ? story.fullScriptBn : story.fullScriptEn,
        visualStyle: story.visualStyle,
        audioUrl: null,
        audioFileName: null,
        allowScriptOnly: true,
      });
    },
    [handleStartProcessing, lang]
  );

  // Global keyboard shortcuts for effortless Studio playback & Focus Mode
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isFormField =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (e.key === 'Escape') {
        setShowShortcutsHelp(false);
        return;
      }

      if (isFormField || isExportOpen || isRedesignOpen || isCharacterDesignerOpen) return;
      if (activePage !== 'studio' || !hasLoadedProject || studioSection !== 'preview') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setFocusCinemaMode((v) => !v);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const idx = project.scenes.findIndex((s) => s.id === activeScene.id);
        const nextIdx = Math.max(
          0,
          Math.min(project.scenes.length - 1, idx + (e.key === 'ArrowRight' ? 1 : -1))
        );
        const nextScene = project.scenes[nextIdx];
        if (nextScene) {
          handleSeekTo(nextScene.startTime + 0.05, false);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    activePage,
    activeScene.id,
    handleSeekTo,
    hasLoadedProject,
    isExportOpen,
    isRedesignOpen,
    isCharacterDesignerOpen,
    project.scenes,
    studioSection,
  ]);

  return (
    <div className="min-h-screen bg-[var(--ck-bg)] text-[var(--ck-text)] transition-colors duration-200">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 border-b border-[var(--ck-border-subtle)] bg-[var(--ck-header-bg)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1420px] items-center justify-between gap-1.5 px-2.5 py-2.5 sm:gap-6 sm:px-6 sm:py-3">
          {/* Zone 1: Official Uploaded Reeldaiii Brand Logo (Compact icon on mobile, full wordmark on sm+) */}
          <button
            type="button"
            data-testid="brand-logo-btn"
            onClick={() => handleNavigatePage('home')}
            aria-label="Reeldaiii Home"
            className="inline-flex items-center gap-1.5 font-display text-[13px] font-bold tracking-tight text-[var(--ck-text)] whitespace-nowrap shrink-0 text-left hover:opacity-95 transition-opacity sm:gap-2 sm:text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)] rounded"
          >
            <img
              src={REELDAIII_BRAND.faviconUrl}
              alt="Reeldaiii"
              className="h-7 w-7 rounded-md object-contain sm:hidden"
            />
            <img
              data-testid="header-brand-logo-img"
              src={theme === 'dark' ? REELDAIII_BRAND.logoDarkBgUrl : REELDAIII_BRAND.logoLightBgUrl}
              alt="Reeldaiii"
              className="hidden h-8 w-auto max-w-[155px] rounded-md object-contain sm:block md:h-9 md:max-w-[185px]"
            />
            <span className="sr-only">Reeldaiii</span>
          </button>

          {/* Zone 2: Clean Single-Line Navigation Links */}
          <nav
            aria-label={L(lang, 'Primary navigation', 'প্রধান নেভিগেশন')}
            className="flex items-center gap-2 text-[11px] font-medium text-[var(--ck-text-muted)] sm:gap-7 sm:text-sm"
          >
            <button
              type="button"
              data-testid="nav-home"
              onClick={() => handleNavigatePage('home')}
              aria-current={activePage === 'home' ? 'page' : undefined}
              className={`relative py-1 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)] rounded ${
                activePage === 'home'
                  ? 'text-[var(--ck-text)] after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:bg-[var(--ck-accent)]'
                  : 'hover:text-[var(--ck-text)]'
              }`}
            >
              {L(lang, 'Home', 'হোম')}
            </button>
            <button
              type="button"
              data-testid="nav-studio"
              onClick={handleEnterStudio}
              aria-current={activePage === 'studio' ? 'page' : undefined}
              className={`relative py-1 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)] rounded ${
                activePage === 'studio'
                  ? 'text-[var(--ck-text)] after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:bg-[var(--ck-accent)]'
                  : 'hover:text-[var(--ck-text)]'
              }`}
            >
              {L(lang, 'Studio', 'স্টুডিও')}
            </button>
            <button
              type="button"
              data-testid="nav-manual"
              onClick={() => handleNavigatePage('manual')}
              aria-current={activePage === 'manual' ? 'page' : undefined}
              className={`relative py-1 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)] rounded ${
                activePage === 'manual'
                  ? 'text-[var(--ck-text)] after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:bg-[var(--ck-accent)]'
                  : 'hover:text-[var(--ck-text)]'
              }`}
            >
              {L(lang, 'Manual', 'ম্যানুয়াল')}
            </button>
            <button
              type="button"
              data-testid="nav-developer"
              onClick={() => handleNavigatePage('developer')}
              aria-current={activePage === 'developer' ? 'page' : undefined}
              className={`relative py-1 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)] rounded ${
                activePage === 'developer'
                  ? 'text-[var(--ck-text)] after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:bg-[var(--ck-accent)]'
                  : 'hover:text-[var(--ck-text)]'
              }`}
            >
              <span className="sm:hidden">{L(lang, 'Dev', 'ডেভ')}</span>
              <span className="hidden sm:inline">{L(lang, 'Developer', 'ডেভেলপার')}</span>
            </button>
          </nav>

          {/* Zone 3: Language Switcher + Theme Switcher + Single Primary Action */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              type="button"
              data-testid="lang-toggle-btn"
              onClick={handleToggleLang}
              aria-label={
                lang === 'en'
                  ? 'Switch language to Bengali'
                  : 'ভাষা ইংরেজিতে পরিবর্তন করুন'
              }
              title={
                lang === 'en'
                  ? 'Switch to Bengali (বাংলা)'
                  : 'Switch to International English'
              }
              className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] px-2 text-[11px] font-semibold text-[var(--ck-text-secondary)] transition-colors hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)] whitespace-nowrap shrink-0 sm:h-10 sm:gap-1.5 sm:px-3 sm:text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)]"
            >
              <Globe className="hidden h-3.5 w-3.5 text-[var(--ck-accent)] shrink-0 sm:inline-block" />
              <span>{lang === 'en' ? 'বাংলা' : 'EN'}</span>
            </button>

            <button
              type="button"
              data-testid="theme-toggle-btn"
              onClick={handleToggleTheme}
              aria-label={
                theme === 'dark'
                  ? L(lang, 'Switch to Light mode', 'লাইট মোডে পরিবর্তন করুন')
                  : L(lang, 'Switch to Dark mode', 'ডার্ক মোডে পরিবর্তন করুন')
              }
              title={
                theme === 'dark'
                  ? L(lang, 'Enable Light Theme', 'লাইট থিম চালু করুন')
                  : L(lang, 'Enable Dark Theme', 'ডার্ক থিম চালু করুন')
              }
              className="inline-flex h-8 w-8 items-center justify-center gap-1.5 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] text-xs font-medium text-[var(--ck-text-secondary)] transition-colors hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)] whitespace-nowrap shrink-0 sm:h-10 sm:w-auto sm:px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)]"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-[var(--ck-accent)]" />
                  <span className="hidden lg:inline">{L(lang, 'Light', 'লাইট')}</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-[var(--ck-accent)]" />
                  <span className="hidden lg:inline">{L(lang, 'Dark', 'ডার্ক')}</span>
                </>
              )}
            </button>

            {activePage === 'studio' && workspacePhase === 'processing' ? (
              <span className="font-mono text-[11px] font-semibold tabular-nums text-[var(--ck-accent)] whitespace-nowrap shrink-0 sm:text-xs">
                {L(lang, `${processingPct}%`, `${processingPct}%`)}
              </span>
            ) : activePage === 'studio' && hasLoadedProject && studioSection !== 'create' ? (
              <button
                type="button"
                aria-label={L(lang, 'Export Video', 'এক্সপোর্ট ভিডিও')}
                onClick={() => handleOpenExport('both')}
                className="inline-flex h-8 w-8 items-center justify-center gap-1.5 rounded-lg bg-[var(--ck-accent)] text-xs font-semibold text-[var(--ck-accent-fg)] transition-colors hover:bg-[var(--ck-accent-bright)] whitespace-nowrap shrink-0 sm:h-10 sm:w-auto sm:gap-2 sm:px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)]"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{L(lang, 'Export Video', 'এক্সপোর্ট ভিডিও')}</span>
              </button>
            ) : activePage === 'studio' ? (
              <button
                type="button"
                onClick={handleLoadDemo}
                className="hidden sm:inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--ck-accent)] px-4 text-xs font-semibold text-[var(--ck-accent-fg)] transition-colors hover:bg-[var(--ck-accent-bright)] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{L(lang, 'Demo Film', 'ডেমো ফিল্ম')}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEnterStudio}
                className="hidden sm:inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--ck-accent)] px-4 text-xs font-semibold text-[var(--ck-accent-fg)] transition-colors hover:bg-[var(--ck-accent-bright)] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)]"
              >
                <Clapperboard className="h-3.5 w-3.5" />
                <span>{L(lang, 'Open Studio', 'স্টুডিওতে যান')}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-[1420px] px-4 py-6 sm:px-6 sm:py-8">
        {/* PAGE 1: Bilingual Front Page */}
        {activePage === 'home' && (
          <HomePage
            lang={lang}
            onEnterStudio={handleEnterStudio}
            onOpenVoiceRecorder={handleOpenVoiceRecorder}
            onLaunchDemo={handleLoadDemo}
            onOpenManual={() => handleNavigatePage('manual')}
            onOpenDeveloper={() => handleNavigatePage('developer')}
            onTryStoryInStudio={handleTryHomeStory}
            savedDraftCount={savedDrafts.length}
          />
        )}

        {/* PAGE 2: Dedicated Studio Workspace with Left Studio Column */}
        {activePage === 'studio' && (
          <div
            className="flex flex-col lg:flex-row lg:items-start lg:gap-6"
            data-testid="studio-workspace-shell"
          >
            <StudioColumn
              lang={lang}
              activeSection={studioSection}
              hasActiveProject={hasLoadedProject}
              isProcessing={workspacePhase === 'processing'}
              projectTitle={project.title}
              sceneCount={project.scenes.length}
              cueCount={project.cues.length}
              duration={project.duration}
              savedDraftCount={savedDrafts.length}
              onSelectSection={handleSelectStudioSection}
              onOpenRedesign={() => setIsRedesignOpen(true)}
              onOpenCharacterDesigner={handleOpenCharacterDesigner}
              onOpenExport={() => handleOpenExport('both')}
              onLoadDemo={handleLoadDemo}
              onOpenManual={() => handleNavigatePage('manual')}
            />

            <div className="min-w-0 flex-1 space-y-6">
              {srtError && hasLoadedProject && studioSection !== 'create' && (
                <div
                  role="alert"
                  className="rounded-lg border border-[var(--ck-danger-border)] bg-[var(--ck-danger-bg)] px-4 py-3 text-sm text-[var(--ck-danger-text)]"
                >
                  {srtError}
                </div>
              )}

              {directorNotice && hasLoadedProject && studioSection !== 'create' && (
                <div
                  role="status"
                  className="flex items-start gap-2.5 rounded-lg border border-[var(--ck-warn-border)] bg-[var(--ck-warn-bg)] px-4 py-3 text-xs text-[var(--ck-warn-text)]"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ck-accent)]" />
                  <span>{directorNotice}</span>
                </div>
              )}

              {/* Active 1% -> 100% Pipeline */}
              {workspacePhase === 'processing' && (
                <ProcessingOverlay
                  lang={lang}
                  percent={processingPct}
                  elapsedSeconds={processingElapsed}
                  draftTitle={processingDraftTitle}
                  stageMessage={processingStageMsg}
                  analyzedProject={processingResult}
                  pipelineSteps={pipelineSteps}
                  sceneStatuses={sceneStatuses}
                  syncReport={processingSyncReport}
                  onRetryScene={(sceneId) => {
                    if (!processingResult) return;
                    const updated = redirectSingleSceneLocally(processingResult, sceneId);
                    setProcessingResult(updated);
                    setSceneStatuses((prev) =>
                      prev.map((st) =>
                        st.sceneId === sceneId
                          ? { ...st, status: 'ready', message: 'Re-directed cleanly' }
                          : st
                      )
                    );
                  }}
                  onCancel={handleBackToUpload}
                />
              )}

              {/* Studio Section: New Project / Upload */}
              {workspacePhase !== 'processing' && studioSection === 'create' && (
                <CreateWorkspace
                  lang={lang}
                  onStartProcessing={handleStartProcessing}
                  onImportProject={handleImportProject}
                  onLoadDemo={handleLoadDemo}
                  recentProjects={recentProjects}
                  onSelectRecentProject={handleSelectRecentProject}
                  savedDrafts={savedDrafts}
                  onResumeDraft={handleResumeDraft}
                  onDeleteDraft={handleDeleteDraft}
                  aiDirectorAvailable={aiDirectorAvailable}
                  customCharacter={customCharacterProfile}
                  lockCustomCharacter={customCharacterDraft?.lockAcrossAllScenes ?? true}
                  onOpenCharacterDesigner={handleOpenCharacterDesigner}
                  onClearCustomCharacter={() => {
                    setCustomCharacterProfile(null);
                    setCustomCharacterDraft(null);
                  }}
                  initialInputMode={studioInitialInputMode}
                />
              )}

              {/* Guided Empty State if user opens Preview/Storyboard/Script/Quality before generating */}
              {workspacePhase !== 'processing' &&
                !isStudioSectionPopulated(studioSection, hasLoadedProject) && (
                  <section
                    data-testid="studio-empty-state"
                    className="rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface)] px-6 py-12 text-center sm:px-10"
                  >
                    <Film className="mx-auto h-10 w-10 text-[var(--ck-accent)]" />
                    <h2 className="mt-4 font-display text-xl font-semibold text-[var(--ck-text)]">
                      {L(
                        lang,
                        'No Animation Project Loaded Yet',
                        'এখনো কোনো অ্যানিমেশন প্রোজেক্ট তৈরি করা হয়নি'
                      )}
                    </h2>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--ck-text-muted)]">
                      {L(
                        lang,
                        'Your live 16:9 & 9:16 preview, storyboard chapters, synced script, and quality audit appear here. Start by uploading a voiceover or script, or launch the demo film.',
                        'এই অংশে আপনার ভিডিও প্রিভিউ, স্টোরিবোর্ড, সিঙ্কড স্ক্রিপ্ট এবং কোয়ালিটি রিপোর্ট দেখা যাবে। শুরু করতে নতুন ভয়েসওভার বা স্ক্রিপ্ট দিন অথবা ডেমো ফিল্ম চালু করুন।'
                      )}
                    </p>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleSelectStudioSection('create')}
                        className="inline-flex h-11 items-center gap-2 rounded-lg bg-[var(--ck-accent)] px-5 text-sm font-semibold text-[var(--ck-accent-fg)] transition-colors hover:bg-[var(--ck-accent-bright)] whitespace-nowrap"
                      >
                        <Plus className="h-4 w-4" />
                        <span>{L(lang, 'Create New Project', 'নতুন প্রোজেক্ট তৈরি করুন')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleLoadDemo}
                        className="inline-flex h-11 items-center gap-2 rounded-lg border border-[var(--ck-border-strong)] bg-[var(--ck-surface-alt)] px-5 text-sm font-medium text-[var(--ck-text-secondary)] transition-colors hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)] whitespace-nowrap"
                      >
                        <Film className="h-4 w-4 text-[var(--ck-accent)]" />
                        <span>{L(lang, 'Watch Demo Film', 'ডেমো ফিল্ম দেখুন')}</span>
                      </button>
                    </div>
                  </section>
                )}

              {/* Calm Single-Line Studio Workspace Header Bar */}
              {workspacePhase !== 'processing' &&
                hasLoadedProject &&
                studioSection !== 'create' && (
                  <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ck-border-subtle)] pb-3">
                    <div className="flex min-w-0 items-center gap-2 text-xs text-[var(--ck-text-muted)]">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--ck-success)]" />
                      <span className="truncate font-semibold text-[var(--ck-text)]">
                        {project.title}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums whitespace-nowrap">
                        {project.scenes.length} {L(lang, 'scenes', 'দৃশ্য')}
                      </span>
                      {project.qualityAudit && (
                        <>
                          <span aria-hidden="true">·</span>
                          <button
                            type="button"
                            onClick={() => handleSelectStudioSection('quality')}
                            className={`font-mono font-semibold tabular-nums hover:underline whitespace-nowrap ${
                              project.qualityAudit.passed ? 'text-[var(--ck-success)]' : 'text-[var(--ck-accent)]'
                            }`}
                          >
                            QC {project.qualityAudit.score}/100
                          </button>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {recentProjects.length > 1 && (
                        <div className="flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-[var(--ck-text-muted)]" />
                          <label htmlFor="recent-project-switcher" className="sr-only">
                            {L(lang, 'Switch recent project', 'সাম্প্রতিক প্রোজেক্ট পরিবর্তন করুন')}
                          </label>
                          <select
                            id="recent-project-switcher"
                            data-testid="recent-project-switcher"
                            value={project.id}
                            onChange={(e) => {
                              const found = recentProjects.find((p) => p.id === e.target.value);
                              if (found) handleSelectRecentProject(found);
                            }}
                            className="h-8 max-w-[180px] rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] px-2.5 text-xs text-[var(--ck-text)] focus:border-[var(--ck-accent)] focus:outline-none"
                          >
                            {recentProjects.map((rp) => (
                              <option key={rp.id} value={rp.id}>
                                {rp.title} ({rp.scenes.length})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {designHistory.length > 0 && (
                        <button
                          type="button"
                          data-testid="undo-design-btn"
                          onClick={handleUndoDesign}
                          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] px-2.5 text-xs font-medium text-[var(--ck-text-secondary)] transition-colors hover:border-[var(--ck-accent)] whitespace-nowrap"
                        >
                          <Undo2 className="h-3.5 w-3.5 text-[var(--ck-accent)]" />
                          <span>{L(lang, 'Undo', 'আনডু')}</span>
                        </button>
                      )}

                      {studioSection === 'preview' && (
                        <button
                          type="button"
                          data-testid="focus-mode-toggle"
                          onClick={() => setFocusCinemaMode((v) => !v)}
                          aria-pressed={focusCinemaMode}
                          className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
                            focusCinemaMode
                              ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)] text-[var(--ck-accent-soft-text)]'
                              : 'border-[var(--ck-border)] bg-[var(--ck-surface)] text-[var(--ck-text-secondary)] hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)]'
                          }`}
                        >
                          {focusCinemaMode ? (
                            <>
                              <Minimize2 className="h-3.5 w-3.5" />
                              <span>{L(lang, 'Show Director', 'ডিরেক্টর দেখান')}</span>
                            </>
                          ) : (
                            <>
                              <Maximize2 className="h-3.5 w-3.5" />
                              <span>{L(lang, 'Focus Mode', 'ফোকাস মোড')}</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        data-testid="shortcuts-help-btn"
                        onClick={() => setShowShortcutsHelp((s) => !s)}
                        aria-expanded={showShortcutsHelp}
                        aria-label={L(lang, 'Show keyboard shortcuts', 'কিবোর্ড শর্টকাট দেখুন')}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] text-[var(--ck-text-muted)] transition-colors hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)]"
                      >
                        <Keyboard className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {showShortcutsHelp && (
                      <div
                        role="dialog"
                        aria-label={L(lang, 'Keyboard shortcuts', 'কিবোর্ড শর্টকাট')}
                        className="absolute right-0 top-11 z-20 w-72 rounded-xl border border-[var(--ck-border-strong)] bg-[var(--ck-surface)] p-3.5 shadow-xl"
                      >
                        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[var(--ck-text)]">
                          <span>{L(lang, 'Keyboard Shortcuts', 'কিবোর্ড শর্টকাট')}</span>
                          <button
                            type="button"
                            onClick={() => setShowShortcutsHelp(false)}
                            aria-label={L(lang, 'Close', 'বন্ধ করুন')}
                            className="rounded p-1 text-[var(--ck-text-muted)] hover:bg-[var(--ck-surface-hover)]"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          {KEYBOARD_SHORTCUTS.map((sc) => (
                            <div key={sc.keys} className="flex items-center justify-between gap-2">
                              <span className="text-[var(--ck-text-secondary)]">
                                {lang === 'bn' ? sc.actionBn : sc.actionEn}
                              </span>
                              <kbd className="rounded border border-[var(--ck-border)] bg-[var(--ck-inset)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--ck-text)] shrink-0">
                                {sc.keys}
                              </kbd>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              {/* Studio Section: Live Preview, Timeline & Scene Director */}
              {workspacePhase !== 'processing' &&
                hasLoadedProject &&
                studioSection === 'preview' && (
                  <div
                    className={`grid grid-cols-1 gap-6 ${
                      focusCinemaMode ? 'xl:grid-cols-1' : 'xl:grid-cols-12 xl:items-start'
                    }`}
                    data-testid="ready-studio"
                  >
                    <div className={`${focusCinemaMode ? '' : 'xl:col-span-8'} space-y-5`}>
                      <VideoPlayer
                        lang={lang}
                        project={project}
                        currentTime={currentTime}
                        isPlaying={isPlaying}
                        subtitleMode={subtitleMode}
                        subtitleStyle={subtitleStyle}
                        previewMode={previewMode}
                        portraitZoom={portraitZoom}
                        onTimeUpdate={setCurrentTime}
                        onPlayingChange={setIsPlaying}
                        onSubtitleModeChange={setSubtitleMode}
                        onSubtitleStyleChange={setSubtitleStyle}
                        onPreviewModeChange={setPreviewMode}
                        onPortraitZoomChange={setPortraitZoom}
                        onRequestDownload={handleOpenExport}
                        seekRequest={seekRequest}
                      />

                      <TimelineEditor
                        lang={lang}
                        project={project}
                        activeScene={activeScene}
                        currentTime={currentTime}
                        onSeekTo={(time) => handleSeekTo(time, false)}
                        onAdjustSceneBoundary={handleAdjustSceneBoundary}
                        onSplitScene={handleSplitScene}
                        onMergeScene={handleMergeScene}
                        onShiftSrtOffset={handleShiftSrtOffset}
                        onResetSrtOffset={handleResetSrtOffset}
                        onUpdateBgm={handleUpdateBgmConfig}
                      />
                    </div>

                    {!focusCinemaMode && (
                      <div className="xl:col-span-4">
                        <StudioSidebar
                          lang={lang}
                          project={project}
                          activeScene={activeScene}
                          aiDirectorAvailable={aiDirectorAvailable}
                          portraitZoom={portraitZoom}
                          onPortraitZoomChange={setPortraitZoom}
                          onStartProcessing={handleStartProcessing}
                          onImportProject={handleImportProject}
                          onLoadDemo={handleLoadDemo}
                          onUpdateScene={handleUpdateScene}
                          onUpdateProjectStyle={handleUpdateProjectStyle}
                          onApplyReferenceMedia={handleApplyReferenceMedia}
                          onUpdateSubtitleConfig={handleUpdateSubtitleConfig}
                          onUpdateBrandingConfig={handleUpdateBrandingConfig}
                          onRegenerateScene={handleRegenerateScene}
                          onAddScene={handleAddScene}
                          onDeleteScene={handleDeleteScene}
                        />
                      </div>
                    )}
                  </div>
                )}

              {/* Studio Section: Visual Storyboard Grid */}
              {workspacePhase !== 'processing' &&
                hasLoadedProject &&
                studioSection === 'storyboard' && (
                  <ChapterGrid
                    lang={lang}
                    project={project}
                    activeSceneId={activeScene.id}
                    thumbnailRatio={previewMode === '9:16' ? '9:16' : '16:9'}
                    portraitZoom={portraitZoom}
                    onSelectChapter={handleSelectChapter}
                  />
                )}

              {/* Studio Section: Synchronized Script & SRT Panel */}
              {workspacePhase !== 'processing' &&
                hasLoadedProject &&
                studioSection === 'script' && (
                  <TranscriptPanel
                    lang={lang}
                    project={project}
                    isLoading={isLoadingCues && project.isDemo}
                    currentTime={currentTime}
                    onSeekToCue={(startTime) => {
                      handleSeekTo(startTime, true);
                      setStudioSection('preview');
                    }}
                  />
                )}

              {/* Studio Section: Story Intelligence, Cast & Automated QC */}
              {workspacePhase !== 'processing' &&
                hasLoadedProject &&
                studioSection === 'quality' && (
                  <section
                    id="quality-audit"
                    data-testid="intelligence-qc-panel"
                    className="grid grid-cols-1 gap-4 lg:grid-cols-12"
                  >
                    <div className="rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface)] p-4 sm:p-5 lg:col-span-7 space-y-4">
                      {project.storyIntelligence && (
                        <div>
                          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ck-text)]">
                            <BookOpen className="h-4 w-4 text-[var(--ck-accent)]" />
                            <span>
                              {L(
                                lang,
                                'Story Intelligence & Continuity Map',
                                'স্টোরি ইন্টেলিজেন্স ও কনটিনিউটি ম্যাপ'
                              )}
                            </span>
                          </div>
                          <p className="mt-1.5 text-xs leading-relaxed text-[var(--ck-text-secondary)]">
                            {project.storyIntelligence.theme}
                          </p>
                          <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3 text-[11px]">
                            <div className="rounded-lg border border-[var(--ck-border-subtle)] bg-[var(--ck-inset)] p-2.5">
                              <div className="font-mono text-[10px] uppercase text-[var(--ck-accent)]">
                                {L(lang, 'Beginning', 'শুরু')}
                              </div>
                              <p className="mt-1 line-clamp-2 text-[var(--ck-text-muted)]">
                                {project.storyIntelligence.beginningArc}
                              </p>
                            </div>
                            <div className="rounded-lg border border-[var(--ck-border-subtle)] bg-[var(--ck-inset)] p-2.5">
                              <div className="font-mono text-[10px] uppercase text-[var(--ck-accent)]">
                                {L(lang, 'Middle', 'মধ্যভাগ')}
                              </div>
                              <p className="mt-1 line-clamp-2 text-[var(--ck-text-muted)]">
                                {project.storyIntelligence.middleArc}
                              </p>
                            </div>
                            <div className="rounded-lg border border-[var(--ck-border-subtle)] bg-[var(--ck-inset)] p-2.5">
                              <div className="font-mono text-[10px] uppercase text-[var(--ck-accent)]">
                                {L(lang, 'Ending / Moral', 'সমাপ্তি / বার্তা')}
                              </div>
                              <p className="mt-1 line-clamp-2 text-[var(--ck-text-muted)]">
                                {project.storyIntelligence.endingArc}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {project.characterProfiles && project.characterProfiles.length > 0 && (
                        <div>
                          <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-[var(--ck-text)]">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-[var(--ck-accent)]" />
                              <span>
                                {L(
                                  lang,
                                  `Locked Character Cast (${project.characterProfiles.length})`,
                                  `লকড চরিত্রের তালিকা (${project.characterProfiles.length})`
                                )}
                              </span>
                            </div>
                            <button
                              type="button"
                              data-testid="quality-customize-character-btn"
                              onClick={handleOpenCharacterDesigner}
                              className="inline-flex items-center gap-1 rounded-md border border-[var(--ck-border)] bg-[var(--ck-surface-alt)] px-2 py-1 text-[11px] font-medium text-[var(--ck-accent)] transition-colors hover:border-[var(--ck-accent)]"
                            >
                              <UserCog className="h-3 w-3" />
                              <span>{L(lang, 'Customize', 'কাস্টমাইজ')}</span>
                            </button>
                          </div>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {project.characterProfiles.map((char) => (
                              <div
                                key={char.characterId}
                                className="flex items-start gap-2.5 rounded-lg border border-[var(--ck-border-subtle)] bg-[var(--ck-inset)] px-3 py-2"
                              >
                                <div
                                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-black/15 dark:border-white/10"
                                  style={{ backgroundColor: char.outfitColor }}
                                  title={`Outfit ${char.outfitColor}`}
                                >
                                  <span
                                    className="h-2.5 w-2.5 rounded-full border border-black/30"
                                    style={{ backgroundColor: char.skinTone }}
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-xs font-semibold text-[var(--ck-text)]">
                                    {char.name}
                                  </div>
                                  <div className="truncate text-[11px] text-[var(--ck-text-muted)]">
                                    {char.clothing}
                                  </div>
                                  {char.accessories.length > 0 && (
                                    <div className="mt-0.5 truncate font-mono text-[10px] text-[var(--ck-success)]">
                                      {char.accessories.join(', ')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {project.qualityAudit && (
                      <div className="rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface)] p-4 sm:p-5 lg:col-span-5 flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ck-text)]">
                              <ShieldCheck
                                className={`h-4 w-4 ${
                                  project.qualityAudit.passed ? 'text-[var(--ck-success)]' : 'text-[var(--ck-accent)]'
                                }`}
                              />
                              <span>
                                {L(lang, 'Automated Quality Control', 'অটোমেটেড কোয়ালিটি কন্ট্রোল')}
                              </span>
                            </div>
                            <span
                              data-testid="qc-score-badge"
                              className={`font-mono text-sm font-bold tabular-nums ${
                                project.qualityAudit.passed ? 'text-[var(--ck-success)]' : 'text-[var(--ck-accent)]'
                              }`}
                            >
                              {project.qualityAudit.score}/100
                            </span>
                          </div>

                          <p className="mt-1.5 text-xs leading-relaxed text-[var(--ck-text-muted)]">
                            {project.qualityAudit.summary}
                          </p>

                          {project.qualityAudit.issues.length > 0 ? (
                            <div className="mt-3 space-y-2 max-h-[190px] overflow-y-auto pr-1">
                              {project.qualityAudit.issues.map((issue) => (
                                <div
                                  key={issue.id}
                                  className="flex items-center justify-between gap-2 rounded-lg border border-[var(--ck-warn-border)] bg-[var(--ck-warn-bg)] px-3 py-2 text-[11px]"
                                >
                                  <span className="text-[var(--ck-warn-text)]">{issue.message}</span>
                                  {issue.sceneId && (
                                    <button
                                      type="button"
                                      disabled={regeneratingSceneId === issue.sceneId}
                                      onClick={() => void handleRegenerateScene(issue.sceneId!)}
                                      className="inline-flex h-6 shrink-0 items-center gap-1 rounded border border-[var(--ck-accent)]/60 bg-[var(--ck-accent-soft)] px-2 text-[10px] font-medium text-[var(--ck-accent-soft-text)] hover:bg-[var(--ck-accent-soft-hover)] disabled:opacity-50"
                                    >
                                      <RotateCcw className="h-2.5 w-2.5" />
                                      <span>
                                        {regeneratingSceneId === issue.sceneId
                                          ? L(lang, 'Fixing…', 'ঠিক হচ্ছে…')
                                          : L(lang, 'Regenerate', 'রিজেনারেট')}
                                      </span>
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-3 rounded-lg border border-[var(--ck-success-border)] bg-[var(--ck-success-bg)] px-3 py-2.5 text-[11px] text-[var(--ck-success-text)]">
                              {L(
                                lang,
                                'Audio sync, subtitle cadence, character consistency, scene diversity, and 9:16 portrait safe-zones verified.',
                                'অডিও সিঙ্ক, সাবটাইটেল টাইমিং, চরিত্রের ধারাবাহিকতা, দৃশ্যের বৈচিত্র্য এবং ৯:১৬ সেফ-জোন যাচাই করা হয়েছে।'
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between border-t border-[var(--ck-border-subtle)] pt-2.5 text-[11px] text-[var(--ck-text-muted)]">
                          <span>
                            {L(
                              lang,
                              `Active Scene ${activeScene.chapterNumber}`,
                              `সক্রিয় দৃশ্য ${activeScene.chapterNumber}`
                            )}
                          </span>
                          <button
                            type="button"
                            disabled={regeneratingSceneId === activeScene.id}
                            onClick={() => void handleRegenerateScene(activeScene.id)}
                            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-[var(--ck-border-strong)] bg-[var(--ck-surface-alt)] px-2.5 text-[11px] font-medium text-[var(--ck-text-secondary)] hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)] disabled:opacity-50"
                          >
                            <RotateCcw className="h-3 w-3 text-[var(--ck-accent)]" />
                            <span>
                              {regeneratingSceneId === activeScene.id
                                ? L(lang, 'Regenerating…', 'পুনর্গঠন হচ্ছে…')
                                : L(
                                    lang,
                                    `Regenerate Scene ${activeScene.chapterNumber}`,
                                    `দৃশ্য ${activeScene.chapterNumber} পুনর্গঠন`
                                  )}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </section>
                )}
            </div>
          </div>
        )}

        {/* PAGE 3: Comprehensive Bilingual User Manual */}
        {activePage === 'manual' && (
          <UserManualPage
            lang={lang}
            onEnterStudio={handleEnterStudio}
            onLaunchDemo={handleLoadDemo}
            onGoHome={() => handleNavigatePage('home')}
          />
        )}

        {/* PAGE 4: Dedicated Developer Page */}
        {activePage === 'developer' && (
          <DeveloperPage
            lang={lang}
            onEnterStudio={handleEnterStudio}
            onGoHome={() => handleNavigatePage('home')}
          />
        )}
      </main>

      <footer className="mt-14 border-t border-[var(--ck-border-subtle)]">
        <div className="mx-auto flex max-w-[1380px] flex-col gap-3 px-4 py-6 text-xs text-[var(--ck-text-faint)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2.5">
            <img
              src={REELDAIII_BRAND.faviconUrl}
              alt="Reeldaiii Icon"
              className="h-5 w-5 rounded object-contain shrink-0"
            />
            <span>
              {L(
                lang,
                'Reeldaiii · Context-Aware 2D Storytelling Animation Studio',
                'Reeldaiii · কনটেক্সট-অ্যাওয়্যার ২ডি স্টোরি অ্যানিমেশন স্টুডিও'
              )}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => handleNavigatePage('home')}
              className="transition-colors hover:text-[var(--ck-text)] whitespace-nowrap"
            >
              {L(lang, 'Home', 'হোম')}
            </button>
            <button
              type="button"
              onClick={handleEnterStudio}
              className="transition-colors hover:text-[var(--ck-text)] whitespace-nowrap"
            >
              {L(lang, 'Studio', 'স্টুডিও')}
            </button>
            <button
              type="button"
              onClick={() => handleNavigatePage('manual')}
              className="transition-colors hover:text-[var(--ck-text)] whitespace-nowrap"
            >
              {L(lang, 'User Manual', 'ইউজার ম্যানুয়াল')}
            </button>
            <button
              type="button"
              onClick={() => handleNavigatePage('developer')}
              className="transition-colors hover:text-[var(--ck-text)] whitespace-nowrap"
            >
              {L(lang, 'Developer', 'ডেভেলপার পরিচিতি')}
            </button>
            <button
              type="button"
              onClick={handleToggleLang}
              className="font-medium text-[var(--ck-accent)] transition-colors hover:underline whitespace-nowrap"
            >
              {lang === 'en' ? 'বাংলা সংস্করণ' : 'English Version'}
            </button>
          </div>
        </div>
      </footer>

      <ExportModal
        lang={lang}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        project={project}
        activeScene={activeScene}
        defaultSubtitleMode={subtitleMode}
        subtitleStyle={subtitleStyle}
        portraitZoom={portraitZoom}
        initialFormat={exportFormat}
      />

      <RedesignModal
        lang={lang}
        isOpen={isRedesignOpen}
        onClose={() => setIsRedesignOpen(false)}
        project={project}
        history={designHistory}
        onFullRemix={handleFullRemix}
        onUpdateDesign={handleUpdateDesignConfig}
        onUpdateVisualStyle={handleUpdateProjectStyle}
        onApplyStoryTemplate={handleApplyStoryTemplate}
        onUndoLast={handleUndoDesign}
        onRestoreSnapshot={handleRestoreSnapshot}
      />

      <CharacterDesignerModal
        lang={lang}
        isOpen={isCharacterDesignerOpen}
        onClose={() => setIsCharacterDesignerOpen(false)}
        initialDraft={customCharacterDraft}
        hasActiveProject={hasLoadedProject}
        onApplyCharacter={handleApplyCustomCharacter}
      />
    </div>
  );
}
