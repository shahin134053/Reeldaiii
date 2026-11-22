import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  Captions,
  SkipBack,
  SkipForward,
  Monitor,
  Smartphone,
  Columns2,
  Download,
  ZoomIn,
  FileText,
  FileJson,
} from 'lucide-react';
import { getActiveCue } from '../lib/srtParser';
import {
  AnimationProject,
  AspectRatio,
  SceneSpec,
  exportProjectToJson,
  getProjectSceneAtTime,
} from '../lib/storyCompiler';
import { formatTimecode } from '../lib/storyboard';
import { formatCuesToSrt } from '../lib/storyIntelligence';
import {
  DIMENSIONS_BY_RATIO,
  SubtitleMode,
  SubtitleStyle,
  renderProjectFrame,
} from '../animation/renderer';
import { onStudioAssetLoaded } from '../animation/assetCanvasRenderer';
import { onSvgSceneLoaded } from '../lib/svgSanitizer';
import { LiveBgmPlayer } from '../lib/bgmEngine';
import { DEFAULT_BGM_CONFIG } from '../lib/redesignAndStudio';
import { sampleSpeechEnergy } from '../lib/audioAnalyzer';
import { sampleVisemePose } from '../lib/visemeEngine';
import { AppLang, L } from '../lib/i18n';

export type PreviewMode = '16:9' | '9:16' | 'dual';
export type ExportFormatChoice = 'both' | '16:9' | '9:16';

interface VideoPlayerProps {
  lang: AppLang;
  project: AnimationProject;
  currentTime: number;
  isPlaying: boolean;
  subtitleMode: SubtitleMode;
  subtitleStyle: SubtitleStyle;
  previewMode: PreviewMode;
  portraitZoom: number;
  onTimeUpdate: (time: number) => void;
  onPlayingChange: (playing: boolean) => void;
  onSubtitleModeChange: (mode: SubtitleMode) => void;
  onSubtitleStyleChange: (style: SubtitleStyle) => void;
  onPreviewModeChange: (mode: PreviewMode) => void;
  onPortraitZoomChange: (zoom: number) => void;
  onRequestDownload: (format: ExportFormatChoice) => void;
  seekRequest: { time: number; id: number } | null;
}

const SPEEDS = [0.75, 1, 1.25, 1.5] as const;

const PREVIEW_DIMS: Record<AspectRatio, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  lang,
  project,
  currentTime,
  isPlaying,
  subtitleMode,
  subtitleStyle,
  previewMode,
  portraitZoom,
  onTimeUpdate,
  onPlayingChange,
  onSubtitleModeChange,
  onSubtitleStyleChange,
  onPreviewModeChange,
  onPortraitZoomChange,
  onRequestDownload,
  seekRequest,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasLandscapeRef = useRef<HTMLCanvasElement | null>(null);
  const canvasPortraitRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [duration, setDuration] = useState<number>(project.duration);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverXPercent, setHoverXPercent] = useState<number>(0);

  const projectRef = useRef(project);
  const subtitleModeRef = useRef(subtitleMode);
  const subtitleStyleRef = useRef(subtitleStyle);
  const previewModeRef = useRef(previewMode);
  const portraitZoomRef = useRef(portraitZoom);
  const isPlayingRef = useRef(isPlaying);
  const timeRef = useRef(currentTime);
  const lastUiSyncRef = useRef(0);
  const lastFrameTsRef = useRef<number | null>(null);
  const playbackRateRef = useRef(playbackRate);
  const durationRef = useRef(duration);
  const bgmPlayerRef = useRef<LiveBgmPlayer | null>(null);

  projectRef.current = project;
  subtitleModeRef.current = subtitleMode;
  subtitleStyleRef.current = subtitleStyle;
  previewModeRef.current = previewMode;
  portraitZoomRef.current = portraitZoom;
  isPlayingRef.current = isPlaying;
  playbackRateRef.current = playbackRate;
  durationRef.current = duration;

  // Prepare emotion-synced BGM buffer when BGM preset/scenes/duration change
  useEffect(() => {
    if (!bgmPlayerRef.current) {
      bgmPlayerRef.current = new LiveBgmPlayer();
    }
    const bgm = project.bgmConfig ?? DEFAULT_BGM_CONFIG;
    bgmPlayerRef.current.prepare({
      duration: project.duration,
      bgm,
      scenes: project.scenes,
      audioEnvelope: project.audioEnvelope,
      audioEnvelopeHz: project.audioEnvelopeHz ?? 10,
    });
    if (isPlayingRef.current && bgm.enabled && bgm.preset !== 'off') {
      bgmPlayerRef.current.start(timeRef.current, isMuted, volume);
    } else {
      bgmPlayerRef.current.stop();
    }
  }, [
    project.id,
    project.duration,
    project.bgmConfig,
    project.scenes,
    project.audioEnvelope,
    project.audioEnvelopeHz,
    isMuted,
    volume,
  ]);

  useEffect(() => {
    return () => {
      bgmPlayerRef.current?.dispose();
    };
  }, []);

  // Reset duration whenever a new project is generated or loaded
  useEffect(() => {
    setDuration(project.duration);
    durationRef.current = project.duration;
  }, [project.id, project.duration]);

  const activeScene: SceneSpec = getProjectSceneAtTime(project, currentTime);
  const activeCue = getActiveCue(project.cues, currentTime);
  const activeSpeechEnergy = sampleSpeechEnergy(
    project.audioEnvelope,
    currentTime,
    project.audioEnvelopeHz ?? 10
  );
  const activeViseme = sampleVisemePose({
    cues: project.cues,
    phoneticFrames: project.phoneticFrames,
    phoneticHz: project.phoneticHz,
    audioEnvelope: project.audioEnvelope,
    audioEnvelopeHz: project.audioEnvelopeHz,
    time: currentTime,
    speechEnergy: activeSpeechEnergy,
  });

  const drawCanvas = useCallback(
    (canvas: HTMLCanvasElement | null, ratio: AspectRatio, t: number) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      renderProjectFrame(ctx, {
        project: projectRef.current,
        time: t,
        aspectRatio: ratio,
        subtitleMode: subtitleModeRef.current,
        subtitleStyle: subtitleStyleRef.current,
        portraitZoom: portraitZoomRef.current,
        outputWidth: canvas.width,
        outputHeight: canvas.height,
        showLetterbox: ratio === '16:9',
      });
    },
    []
  );

  const drawAtTime = useCallback(
    (t: number) => {
      const mode = previewModeRef.current;
      if (mode === '16:9' || mode === 'dual') {
        drawCanvas(canvasLandscapeRef.current, '16:9', t);
      }
      if (mode === '9:16' || mode === 'dual') {
        drawCanvas(canvasPortraitRef.current, '9:16', t);
      }
    },
    [drawCanvas]
  );

  // Redraw immediately when project, scenes, subtitle mode/style, zoom, or preview mode changes
  useEffect(() => {
    drawAtTime(timeRef.current);
  }, [project, subtitleMode, subtitleStyle, previewMode, portraitZoom, drawAtTime]);

  // Repaint instantly whenever a bespoke AI SVG layer or 2D studio image finishes async decoding
  useEffect(() => {
    const unsubSvg = onSvgSceneLoaded(() => {
      drawAtTime(timeRef.current);
    });
    const unsubAsset = onStudioAssetLoaded(() => {
      drawAtTime(timeRef.current);
    });
    return () => {
      unsubSvg();
      unsubAsset();
    };
  }, [drawAtTime]);

  // Apply explicit seek requests from parent
  useEffect(() => {
    if (!seekRequest) return;
    const clamped = Math.max(0, Math.min(seekRequest.time, durationRef.current));
    timeRef.current = clamped;
    if (audioRef.current && projectRef.current.audioUrl && Number.isFinite(clamped)) {
      try {
        audioRef.current.currentTime = clamped;
      } catch {
        // Synced on loadedmetadata
      }
    }
    onTimeUpdate(clamped);
    drawAtTime(clamped);
  }, [seekRequest, onTimeUpdate, drawAtTime]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (isPlayingRef.current) {
      audio?.pause();
      onPlayingChange(false);
      return;
    }

    if (timeRef.current >= durationRef.current - 0.3) {
      timeRef.current = 0;
      if (audio && projectRef.current.audioUrl) audio.currentTime = 0;
      onTimeUpdate(0);
    }

    onPlayingChange(true);
    if (audio && projectRef.current.audioUrl) {
      try {
        audio.currentTime = timeRef.current;
        audio.playbackRate = playbackRateRef.current;
        await audio.play();
      } catch {
        // Fallback wall clock drives animation smoothly
      }
    }
  }, [onPlayingChange, onTimeUpdate]);

  useEffect(() => {
    const audio = audioRef.current;
    const bgm = project.bgmConfig ?? DEFAULT_BGM_CONFIG;
    if (isPlaying) {
      if (audio && project.audioUrl && audio.paused) {
        audio.playbackRate = playbackRate;
        audio.play().catch(() => {});
      }
      if (bgm.enabled && bgm.preset !== 'off') {
        bgmPlayerRef.current?.start(timeRef.current, isMuted, volume);
      }
    } else {
      if (audio && !audio.paused) {
        audio.pause();
      }
      bgmPlayerRef.current?.stop();
    }
  }, [isPlaying, playbackRate, project.audioUrl, project.bgmConfig, isMuted, volume]);

  // Master 60fps animation loop synced to live audio with stalled-audio resilience
  useEffect(() => {
    let rafId = 0;
    let lastAudioTime = -1;
    let audioStallMs = 0;
    let lastPaintTs = 0;

    const tick = (now: number) => {
      const dt =
        lastFrameTsRef.current !== null
          ? Math.min(0.1, Math.max(0, (now - lastFrameTsRef.current) / 1000))
          : 0;

      if (isPlayingRef.current) {
        const audio = audioRef.current;
        const hasAudio = Boolean(projectRef.current.audioUrl);
        let nextTime = timeRef.current;

        if (hasAudio && audio && !audio.paused && !audio.ended && audio.readyState >= 2) {
          const aTime = audio.currentTime;
          if (Math.abs(aTime - lastAudioTime) > 0.001) {
            lastAudioTime = aTime;
            audioStallMs = 0;
            nextTime = aTime;
          } else {
            audioStallMs += dt * 1000;
            if (audioStallMs > 120) {
              nextTime = timeRef.current + dt * playbackRateRef.current;
            }
          }
        } else {
          audioStallMs = 0;
          lastAudioTime = -1;
          nextTime = timeRef.current + dt * playbackRateRef.current;
        }

        if (nextTime >= durationRef.current) {
          nextTime = durationRef.current;
          timeRef.current = nextTime;
          drawAtTime(nextTime);
          onTimeUpdate(nextTime);
          onPlayingChange(false);
        } else {
          timeRef.current = nextTime;
          if (now - lastPaintTs >= 32) {
            lastPaintTs = now;
            drawAtTime(nextTime);
          }
          if (now - lastUiSyncRef.current > 100) {
            lastUiSyncRef.current = now;
            onTimeUpdate(nextTime);
          }
        }
      } else {
        lastAudioTime = -1;
        audioStallMs = 0;
      }

      lastFrameTsRef.current = now;
      rafId = requestAnimationFrame(tick);
    };

    drawAtTime(timeRef.current);
    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [drawAtTime, onPlayingChange, onTimeUpdate]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = isMuted;
      audio.volume = volume;
      audio.playbackRate = playbackRate;
    }
    bgmPlayerRef.current?.setOutputVolume(isMuted, volume);
  }, [isMuted, volume, playbackRate]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleSeek = useCallback(
    (newTime: number) => {
      const clamped = Math.max(0, Math.min(newTime, durationRef.current));
      timeRef.current = clamped;
      if (audioRef.current && projectRef.current.audioUrl) {
        try {
          audioRef.current.currentTime = clamped;
        } catch {
          // Wait for metadata
        }
      }
      const bgm = projectRef.current.bgmConfig ?? DEFAULT_BGM_CONFIG;
      if (isPlayingRef.current && bgm.enabled && bgm.preset !== 'off') {
        bgmPlayerRef.current?.start(clamped, isMuted, volume);
      }
      onTimeUpdate(clamped);
      drawAtTime(clamped);
    },
    [drawAtTime, onTimeUpdate, isMuted, volume]
  );

  const cycleSubtitleMode = useCallback(() => {
    const hasTranslations = Object.keys(projectRef.current.englishTranslations).length > 0;
    const next: SubtitleMode = hasTranslations
      ? subtitleMode === 'bilingual'
        ? 'bn'
        : subtitleMode === 'bn'
          ? 'off'
          : 'bilingual'
      : subtitleMode === 'off'
        ? 'bn'
        : 'off';
    onSubtitleModeChange(next);
  }, [subtitleMode, onSubtitleModeChange]);

  const cycleSpeed = useCallback(() => {
    const idx = SPEEDS.indexOf(playbackRate as (typeof SPEEDS)[number]);
    setPlaybackRate(SPEEDS[(idx + 1) % SPEEDS.length]);
  }, [playbackRate]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  const jumpChapter = useCallback(
    (delta: -1 | 1) => {
      const scenes = projectRef.current.scenes;
      const idx = scenes.findIndex((s) => s.id === activeScene.id);
      const nextIdx = Math.max(0, Math.min(scenes.length - 1, idx + delta));
      handleSeek(scenes[nextIdx].startTime + 0.1);
    },
    [activeScene.id, handleSeek]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSeek(timeRef.current + 5);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSeek(timeRef.current - 5);
      } else if (e.key.toLowerCase() === 'm') {
        setIsMuted((prev) => !prev);
      } else if (e.key.toLowerCase() === 'c') {
        cycleSubtitleMode();
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [togglePlay, handleSeek, cycleSubtitleMode, toggleFullscreen]);

  const handleDownloadSrt = useCallback(() => {
    const activeProject = projectRef.current;
    const cuesToFormat =
      activeProject.cues.length > 0
        ? activeProject.cues
        : activeProject.scenes.map((sc, idx) => ({
            index: idx + 1,
            startTime: sc.startTime,
            endTime: sc.endTime,
            text: sc.spokenExcerpt || sc.summary || sc.titleBn,
          }));
    const srtContent = formatCuesToSrt(cuesToFormat);
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName =
      activeProject.title.toLowerCase().replace(/[^a-z0-9\u0980-\u09ff]+/gi, '-') ||
      'reeldaiii-subtitles';
    a.download = `${baseName}.srt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  const handleDownloadJson = useCallback(() => {
    const activeProject = projectRef.current;
    const json = exportProjectToJson(activeProject);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName =
      activeProject.title.toLowerCase().replace(/[^a-z0-9\u0980-\u09ff]+/gi, '-') ||
      'reeldaiii-project';
    a.download = `${baseName}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  const progressPct = Math.max(0, Math.min(100, (currentTime / Math.max(1, duration)) * 100));
  const hasTranslations = Object.keys(project.englishTranslations).length > 0;
  const subtitleLabel =
    subtitleMode === 'off'
      ? L(lang, 'Subtitles Off', 'সাবটাইটেল বন্ধ')
      : subtitleMode === 'bilingual' && hasTranslations
        ? 'BN + EN'
        : L(lang, 'Subtitles On', 'সাবটাইটেল চালু');

  const getSceneTitle = (sc: SceneSpec) =>
    lang === 'en' ? sc.titleEn || sc.titleBn : sc.titleBn;

  return (
    <section
      id="studio"
      ref={containerRef}
      data-testid="cinema-player"
      data-state={isPlaying ? 'playing' : 'paused'}
      data-scene={activeScene.id}
      data-preview={previewMode}
      data-time={currentTime.toFixed(1)}
      data-active-viseme={activeViseme.id}
      className="w-full"
    >
      {project.audioUrl && (
        <audio
          key={project.audioUrl}
          ref={audioRef}
          src={project.audioUrl}
          preload="auto"
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (Number.isFinite(d) && d > 1) {
              setDuration(d);
              durationRef.current = d;
            }
            if (timeRef.current > 0) {
              e.currentTarget.currentTime = timeRef.current;
            }
          }}
          onEnded={() => onPlayingChange(false)}
        />
      )}

      {/* Format Switcher Bar (16:9 Landscape | 9:16 Vertical | Dual Simultaneous View) */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="truncate text-lg font-semibold text-[var(--ck-text)] sm:text-xl">
            {project.title}
          </h1>
          <span className="text-[var(--ck-border-strong)]" aria-hidden="true">
            ·
          </span>
          <span className="text-xs text-[var(--ck-text-muted)] whitespace-nowrap">
            {project.scenes.length} {L(lang, 'scenes', 'দৃশ্য')}
          </span>
        </div>

        <div
          role="group"
          aria-label={L(lang, 'Output aspect ratio preview', 'ভিডিও ফরম্যাট প্রিভিউ')}
          className="flex items-center gap-1 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] p-1"
        >
          <button
            type="button"
            onClick={() => onPreviewModeChange('16:9')}
            aria-pressed={previewMode === '16:9'}
            className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              previewMode === '16:9'
                ? 'bg-[var(--ck-accent-soft)] text-[var(--ck-accent-soft-text)]'
                : 'text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]'
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>16:9</span>
          </button>

          <button
            type="button"
            onClick={() => onPreviewModeChange('9:16')}
            aria-pressed={previewMode === '9:16'}
            className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              previewMode === '9:16'
                ? 'bg-[var(--ck-accent-soft)] text-[var(--ck-accent-soft-text)]'
                : 'text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>9:16</span>
          </button>

          <button
            type="button"
            onClick={() => onPreviewModeChange('dual')}
            aria-pressed={previewMode === 'dual'}
            className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              previewMode === 'dual'
                ? 'bg-[var(--ck-accent-soft)] text-[var(--ck-accent-soft-text)]'
                : 'text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]'
            }`}
          >
            <Columns2 className="h-3.5 w-3.5" />
            <span>{L(lang, 'Dual 16:9 + 9:16', 'ডুয়াল ১৬:৯ + ৯:১৬')}</span>
          </button>
        </div>
      </div>

      {/* Cinema Frame (canvas stage stays obsidian dark for cinema contrast in both themes) */}
      <div className="relative w-full overflow-hidden rounded-xl border border-[var(--ck-border)] bg-[#060608] shadow-xl">
        <div className="relative w-full bg-[#060608]">
          {previewMode === '16:9' && (
            <div className="relative aspect-video w-full">
              <canvas
                ref={canvasLandscapeRef}
                width={PREVIEW_DIMS['16:9'].width}
                height={PREVIEW_DIMS['16:9'].height}
                data-testid="film-canvas-16x9"
                onClick={togglePlay}
                className="block h-full w-full cursor-pointer object-contain"
              />
            </div>
          )}

          {previewMode === '9:16' && (
            <div className="flex items-center justify-center bg-[#07070A] py-4 px-4">
              <div className="relative aspect-[9/16] h-[520px] max-h-[68vh] overflow-hidden rounded-lg border border-white/15 bg-black shadow-xl">
                <canvas
                  ref={canvasPortraitRef}
                  width={PREVIEW_DIMS['9:16'].width}
                  height={PREVIEW_DIMS['9:16'].height}
                  data-testid="film-canvas-9x16"
                  onClick={togglePlay}
                  className="block h-full w-full cursor-pointer object-contain"
                />
              </div>
            </div>
          )}

          {previewMode === 'dual' && (
            <div className="grid grid-cols-1 gap-4 bg-[#08080C] p-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0">
                <div className="mb-1.5 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <span>{L(lang, '16:9 Landscape · YouTube', '১৬:৯ ল্যান্ডস্কেপ · YouTube')}</span>
                  <span>{L(lang, '1080p Preview · 4K Export', '1080p প্রিভিউ · 4K এক্সপোর্ট')}</span>
                </div>
                <div className="aspect-video w-full overflow-hidden rounded-lg border border-white/15 bg-black">
                  <canvas
                    ref={canvasLandscapeRef}
                    width={PREVIEW_DIMS['16:9'].width}
                    height={PREVIEW_DIMS['16:9'].height}
                    data-testid="film-canvas-16x9"
                    onClick={togglePlay}
                    className="block h-full w-full cursor-pointer object-contain"
                  />
                </div>
              </div>

              <div className="mx-auto flex flex-col items-center">
                <div className="mb-1.5 flex w-full items-center justify-between gap-2 text-[11px] font-mono text-neutral-400">
                  <span>{L(lang, '9:16 Vertical', '৯:১৬ ভার্টিকাল')}</span>
                  <span className="text-[#E5A93C]">
                    {portraitZoom.toFixed(2)}× {L(lang, 'Zoom', 'জুম')}
                  </span>
                </div>
                <div className="aspect-[9/16] h-[340px] sm:h-[360px] overflow-hidden rounded-lg border border-white/15 bg-black">
                  <canvas
                    ref={canvasPortraitRef}
                    width={PREVIEW_DIMS['9:16'].width}
                    height={PREVIEW_DIMS['9:16'].height}
                    data-testid="film-canvas-9x16"
                    onClick={togglePlay}
                    className="block h-full w-full cursor-pointer object-contain"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Subtle center Play overlay when paused */}
          {!isPlaying && (
            <button
              type="button"
              onClick={togglePlay}
              aria-label="Play animated film"
              className="group absolute inset-0 flex items-center justify-center bg-black/18 transition-colors duration-200 hover:bg-black/28 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)]"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ck-accent)] text-[var(--ck-accent-fg)] shadow-xl transition-transform duration-200 group-hover:scale-105">
                {currentTime >= duration - 0.5 ? (
                  <RotateCcw className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 translate-x-0.5 fill-current" />
                )}
              </span>
            </button>
          )}
        </div>

        {/* Cinema Transport Bar */}
        <div className="border-t border-[var(--ck-border-subtle)] bg-[var(--ck-surface)] px-4 py-3 sm:px-5">
          {/* Interactive Timeline with Dynamic Scene Markers */}
          <div
            className="relative mb-2.5 flex h-6 items-center"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              setHoverTime(ratio * duration);
              setHoverXPercent(ratio * 100);
            }}
            onMouseLeave={() => setHoverTime(null)}
          >
            {hoverTime !== null && (
              <div
                className="pointer-events-none absolute -top-9 z-20 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--ck-border-strong)] bg-[var(--ck-surface)] px-2.5 py-1 text-xs text-[var(--ck-text)] shadow-lg"
                style={{ left: `${Math.max(10, Math.min(90, hoverXPercent))}%` }}
              >
                <span className="font-mono tabular-nums text-[var(--ck-accent)]">
                  {formatTimecode(hoverTime)}
                </span>
                <span className="mx-1.5 text-[var(--ck-text-faint)]">·</span>
                <span>{getSceneTitle(getProjectSceneAtTime(project, hoverTime))}</span>
              </div>
            )}

            <div className="pointer-events-none absolute inset-x-0 h-1.5 overflow-hidden rounded-full bg-[var(--ck-inset-deep)]">
              <div className="h-full bg-[var(--ck-accent)]" style={{ width: `${progressPct}%` }} />
            </div>

            {project.scenes.slice(1).map((scene) => {
              const leftPct = (scene.startTime / Math.max(1, duration)) * 100;
              return (
                <span
                  key={scene.id}
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 h-2.5 w-0.5 -translate-y-1/2 bg-[var(--ck-surface)]/90"
                  style={{ left: `${leftPct}%` }}
                />
              );
            })}

            <input
              type="range"
              aria-label="Film timeline scrubber"
              min={0}
              max={duration}
              step={0.1}
              value={Math.min(currentTime, duration)}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="cinema-scrubber relative z-10 h-6 w-full"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause film' : 'Play film'}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--ck-accent)] text-[var(--ck-accent-fg)] transition-colors hover:bg-[var(--ck-accent-bright)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)]"
              >
                {isPlaying ? (
                  <Pause className="h-4.5 w-4.5 fill-current" />
                ) : (
                  <Play className="h-4.5 w-4.5 translate-x-0.5 fill-current" />
                )}
              </button>

              <button
                type="button"
                onClick={() => jumpChapter(-1)}
                aria-label="Previous chapter"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--ck-text-secondary)] transition-colors hover:bg-[var(--ck-surface-hover)] hover:text-[var(--ck-text)]"
              >
                <SkipBack className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => jumpChapter(1)}
                aria-label="Next chapter"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--ck-text-secondary)] transition-colors hover:bg-[var(--ck-surface-hover)] hover:text-[var(--ck-text)]"
              >
                <SkipForward className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1.5 pl-1">
                <button
                  type="button"
                  onClick={() => setIsMuted((m) => !m)}
                  aria-label={isMuted ? 'Unmute narration' : 'Mute narration'}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--ck-text-secondary)] transition-colors hover:bg-[var(--ck-surface-hover)] hover:text-[var(--ck-text)]"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
                <div className="relative hidden h-5 w-18 items-center sm:flex">
                  <div className="pointer-events-none absolute inset-x-0 h-1 overflow-hidden rounded-full bg-[var(--ck-inset-deep)]">
                    <div
                      className="h-full bg-[var(--ck-accent)]"
                      style={{ width: `${Math.round((isMuted ? 0 : volume) * 100)}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    aria-label="Audio volume"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setVolume(v);
                      if (v > 0 && isMuted) setIsMuted(false);
                    }}
                    className="cinema-scrubber relative z-10 h-5 w-full"
                  />
                </div>
              </div>

              <div className="pl-1.5 font-mono text-xs tabular-nums text-[var(--ck-text-muted)] whitespace-nowrap">
                <span className="text-[var(--ck-text)]">{formatTimecode(currentTime)}</span>
                <span className="mx-1 text-[var(--ck-text-faint)]">/</span>
                <span>{formatTimecode(duration)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={cycleSpeed}
                aria-label={`Playback speed ${playbackRate}x`}
                className="inline-flex h-10 items-center justify-center rounded-lg px-2.5 font-mono text-xs tabular-nums text-[var(--ck-text-secondary)] transition-colors hover:bg-[var(--ck-surface-hover)] hover:text-[var(--ck-text)] whitespace-nowrap shrink-0"
              >
                {playbackRate}x
              </button>

              <button
                type="button"
                onClick={cycleSubtitleMode}
                aria-label={`Toggle subtitles, current mode ${subtitleLabel}`}
                className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  subtitleMode !== 'off'
                    ? 'bg-[var(--ck-accent-soft)] text-[var(--ck-accent-soft-text)]'
                    : 'text-[var(--ck-text-muted)] hover:bg-[var(--ck-surface-hover)] hover:text-[var(--ck-text)]'
                }`}
              >
                <Captions className="h-4 w-4" />
                <span>{subtitleLabel}</span>
              </button>

              {subtitleMode !== 'off' && (
                <button
                  type="button"
                  onClick={() =>
                    onSubtitleStyleChange(
                      subtitleStyle === 'kinetic'
                        ? 'bold-pop'
                        : subtitleStyle === 'bold-pop'
                          ? 'cinema'
                          : 'kinetic'
                    )
                  }
                  aria-label={`Caption style ${subtitleStyle}`}
                  className="inline-flex h-10 items-center rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface-alt)] px-2.5 text-xs font-medium text-[var(--ck-text)] transition-colors hover:border-[var(--ck-accent)] whitespace-nowrap shrink-0"
                >
                  {subtitleStyle === 'kinetic'
                    ? 'Kinetic'
                    : subtitleStyle === 'bold-pop'
                      ? 'Bold Pop'
                      : 'Cinema'}
                </button>
              )}

              <button
                type="button"
                data-testid="portrait-zoom-toggle"
                onClick={() =>
                  onPortraitZoomChange(
                    portraitZoom < 1.25
                      ? 1.38
                      : portraitZoom < 1.55
                        ? 1.65
                        : 1.08
                  )
                }
                aria-label={`9:16 portrait zoom ${portraitZoom.toFixed(2)}x`}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface-alt)] px-2.5 text-xs font-medium text-[var(--ck-text)] transition-colors hover:border-[var(--ck-accent)] whitespace-nowrap shrink-0"
              >
                <ZoomIn className="h-3.5 w-3.5 text-[var(--ck-accent)]" />
                <span>
                  9:16{' '}
                  {portraitZoom >= 1.55
                    ? L(lang, 'Close', 'ক্লোজ')
                    : portraitZoom >= 1.25
                      ? L(lang, 'Auto', 'অটো')
                      : L(lang, 'Wide', 'ওয়াইড')}
                </span>
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? L(lang, 'Exit fullscreen', 'ফুলস্ক্রিন বন্ধ করুন') : L(lang, 'Enter fullscreen', 'ফুলস্ক্রিন চালু করুন')}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--ck-text-secondary)] transition-colors hover:bg-[var(--ck-surface-hover)] hover:text-[var(--ck-text)]"
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quiet Editorial Now-Playing Metadata + Visual Match Reason + Format Download Bar */}
      <div className="mt-3.5 flex flex-col gap-3 rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-mono text-xs tabular-nums text-[var(--ck-accent)]">
              {L(lang, `Scene ${activeScene.chapterNumber}`, `দৃশ্য ${activeScene.chapterNumber}`)}
            </span>
            <span className="text-[var(--ck-border-strong)]" aria-hidden="true">
              ·
            </span>
            <span className="text-sm font-semibold text-[var(--ck-text)]">
              {getSceneTitle(activeScene)}
            </span>
            {activeScene.visualMatchReason && (
              <>
                <span className="text-[var(--ck-border-strong)]" aria-hidden="true">
                  ·
                </span>
                <span className="text-xs text-[var(--ck-success)]">
                  {activeScene.visualMatchReason}
                </span>
              </>
            )}
          </div>
          <p
            aria-live="polite"
            data-testid="active-caption-text"
            className="mt-0.5 truncate text-xs text-[var(--ck-text-muted)]"
          >
            {activeCue ? activeCue.text : activeScene.summary}
          </p>
        </div>

        {/* User's Choice: Download 16:9, 9:16, Both, .SRT Subtitles, or .JSON Project */}
        <div
          role="group"
          aria-label={L(lang, 'Download format options', 'ডাউনলোড ফরম্যাট অপশন')}
          className="flex flex-wrap items-center gap-2 shrink-0"
        >
          <button
            type="button"
            data-testid="download-srt-btn"
            onClick={handleDownloadSrt}
            aria-label={L(lang, 'Download SRT subtitle file', 'SRT সাবটাইটেল ফাইল ডাউনলোড')}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--ck-border-strong)] bg-[var(--ck-surface-alt)] px-2.5 text-xs font-medium text-[var(--ck-text)] transition-colors hover:border-[var(--ck-accent)] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)]"
          >
            <FileText className="h-3.5 w-3.5 text-[var(--ck-accent)]" />
            <span>.SRT</span>
          </button>

          <button
            type="button"
            data-testid="download-json-btn"
            onClick={handleDownloadJson}
            aria-label={L(lang, 'Download Storyboard Project JSON', 'প্রোজেক্ট JSON ডাউনলোড')}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--ck-border-strong)] bg-[var(--ck-surface-alt)] px-2.5 text-xs font-medium text-[var(--ck-text)] transition-colors hover:border-[var(--ck-accent)] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)]"
          >
            <FileJson className="h-3.5 w-3.5 text-[var(--ck-accent)]" />
            <span>.JSON</span>
          </button>

          <button
            type="button"
            onClick={() => onRequestDownload('16:9')}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--ck-border-strong)] bg-[var(--ck-surface-alt)] px-3 text-xs font-medium text-[var(--ck-text)] transition-colors hover:border-[var(--ck-accent)] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)]"
          >
            <Monitor className="h-3.5 w-3.5 text-[var(--ck-accent)]" />
            <span>{L(lang, 'Download 16:9', '১৬:৯ ডাউনলোড')}</span>
          </button>

          <button
            type="button"
            onClick={() => onRequestDownload('9:16')}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--ck-border-strong)] bg-[var(--ck-surface-alt)] px-3 text-xs font-medium text-[var(--ck-text)] transition-colors hover:border-[var(--ck-accent)] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)]"
          >
            <Smartphone className="h-3.5 w-3.5 text-[var(--ck-accent)]" />
            <span>{L(lang, 'Download 9:16', '৯:১৬ ডাউনলোড')}</span>
          </button>

          <button
            type="button"
            onClick={() => onRequestDownload('both')}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--ck-accent)] px-3 text-xs font-semibold text-[var(--ck-accent-fg)] transition-colors hover:bg-[var(--ck-accent-bright)] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{L(lang, 'Download Both', 'দুটোই ডাউনলোড')}</span>
          </button>
        </div>
      </div>
    </section>
  );
};
