import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Monitor,
  Pause,
  Play,
  Smartphone,
} from 'lucide-react';
import { HOME_SHOWCASE_STORIES, HomeShowcaseStory } from '../lib/manualContent';
import { AspectRatio, compileStoryProject } from '../lib/storyCompiler';
import { renderProjectFrame } from '../animation/renderer';
import { synthesizePhoneticTrackFromCues } from '../lib/visemeEngine';
import { createScriptPreviewEnvelope } from '../lib/redesignAndStudio';
import { AppLang, L } from '../lib/i18n';

interface HomeLiveStageProps {
  lang: AppLang;
  onTryStoryInStudio: (story: HomeShowcaseStory) => void;
}

export function HomeLiveStage({ lang, onTryStoryInStudio }: HomeLiveStageProps) {
  const [selectedId, setSelectedId] = useState<string>(HOME_SHOWCASE_STORIES[0].id);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageTimeRef = useRef<number>(1.2);

  const activeStory = useMemo(
    () => HOME_SHOWCASE_STORIES.find((s) => s.id === selectedId) ?? HOME_SHOWCASE_STORIES[0],
    [selectedId]
  );

  const activeTitle = lang === 'bn' ? activeStory.titleBn : activeStory.titleEn;
  const activeSpokenLine = lang === 'bn' ? activeStory.spokenLineBn : activeStory.spokenLineEn;
  const activeCategory = lang === 'bn' ? activeStory.categoryBn : activeStory.categoryEn;

  // Compile a lightweight deterministic 1-scene preview project matching the selected story & active UI language
  const previewProject = useMemo(() => {
    const duration = 9;
    const cues = [
      {
        index: 1,
        startTime: 0.2,
        endTime: 8.6,
        text: activeSpokenLine,
      },
    ];
    const phonetic = synthesizePhoneticTrackFromCues(cues, duration, 20);
    const envelope = createScriptPreviewEnvelope(cues, duration);
    const built = compileStoryProject({
      title: activeTitle,
      srtText: '',
      scriptText: activeSpokenLine,
      cuesOverride: cues,
      visualStyle: activeStory.visualStyle,
      audioUrl: null,
      audioFileName: null,
      audioDuration: duration,
      audioEnvelope: envelope,
      audioEnvelopeHz: 10,
      phoneticFrames: phonetic.frames,
      phoneticHz: phonetic.phoneticHz,
      speechPace: 'moderate',
      audioSyncMode: 'cue-cadence',
    });

    // Lock the showcase preview to the exact featured world for crisp visual contrast
    if (built.scenes.length > 0) {
      built.scenes[0] = {
        ...built.scenes[0],
        setting: activeStory.setting,
        timeOfDay: activeStory.timeOfDay,
        weather: activeStory.weather,
        accentColor: activeStory.accentColor,
      };
    }
    return built;
  }, [activeStory, activeTitle, activeSpokenLine]);

  useEffect(() => {
    stageTimeRef.current = 1.2;
  }, [activeStory.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const dims = aspectRatio === '16:9' ? { width: 960, height: 540 } : { width: 450, height: 800 };
    canvas.width = dims.width;
    canvas.height = dims.height;

    const drawFrame = (t: number) => {
      renderProjectFrame(ctx, {
        project: previewProject,
        time: t,
        aspectRatio,
        subtitleMode: 'bn',
        subtitleStyle: 'kinetic',
        portraitZoom: 1.34,
        outputWidth: dims.width,
        outputHeight: dims.height,
        showLetterbox: false,
      });
    };

    drawFrame(stageTimeRef.current);

    if (!isPlaying || reducedMotion) {
      return;
    }

    let rafId = 0;
    let lastTick = performance.now();
    const FRAME_INTERVAL_MS = 1000 / 24;

    const loop = (now: number) => {
      const delta = now - lastTick;
      if (delta >= FRAME_INTERVAL_MS) {
        lastTick = now;
        stageTimeRef.current =
          (stageTimeRef.current + Math.min(delta / 1000, 0.1)) % previewProject.duration;
        drawFrame(stageTimeRef.current);
      }
      rafId = window.requestAnimationFrame(loop);
    };

    rafId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(rafId);
  }, [previewProject, aspectRatio, isPlaying]);

  return (
    <section
      aria-labelledby="live-stage-heading"
      data-testid="home-live-stage"
      className="space-y-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-2">
          <div className="text-xs font-semibold text-[var(--ck-accent)]">
            {L(lang, 'Live Interactive Preview', 'লাইভ ইন্টারেক্টিভ ডেমো')}
          </div>
          <h2
            id="live-stage-heading"
            className="font-display text-2xl font-semibold tracking-tight text-[var(--ck-text)] sm:text-3xl text-balance"
          >
            {L(
              lang,
              'Switch stories and watch the 2D animation adapt in real time',
              'গল্প বদলান, সাথে সাথে দেখুন ২ডি অ্যানিমেশন কীভাবে বদলে যায়'
            )}
          </h2>
          <p className="text-sm leading-relaxed text-[var(--ck-text-muted)]">
            {L(
              lang,
              'Pick any genre below — the environment, lighting, weather, character acting, and subtitles render live to match the narration.',
              'নিচের যেকোনো গল্পের ধরন বেছে নিন — প্রতিটি গল্পের কথার সাথে মিল রেখে পরিবেশ, আলো, আবহাওয়া ও সাবটাইটেল লাইভ রেন্ডার হচ্ছে।'
            )}
          </p>
        </div>

        {/* Aspect Ratio + Play/Pause Controls */}
        <div className="flex items-center gap-2 self-start sm:self-end">
          <div
            role="group"
            aria-label={L(lang, 'Live preview aspect ratio', 'লাইভ প্রিভিউ ফরম্যাট')}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] p-1"
          >
            <button
              type="button"
              data-testid="live-stage-ratio-16x9"
              onClick={() => setAspectRatio('16:9')}
              aria-pressed={aspectRatio === '16:9'}
              className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                aspectRatio === '16:9'
                  ? 'bg-[var(--ck-accent-soft)] text-[var(--ck-accent-soft-text)]'
                  : 'text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>{L(lang, '16:9', '১৬:৯')}</span>
            </button>
            <button
              type="button"
              data-testid="live-stage-ratio-9x16"
              onClick={() => setAspectRatio('9:16')}
              aria-pressed={aspectRatio === '9:16'}
              className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                aspectRatio === '9:16'
                  ? 'bg-[var(--ck-accent-soft)] text-[var(--ck-accent-soft-text)]'
                  : 'text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>{L(lang, '9:16', '৯:১৬')}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            aria-label={
              isPlaying
                ? L(lang, 'Pause live animation', 'অ্যানিমেশন পজ করুন')
                : L(lang, 'Play live animation', 'অ্যানিমেশন চালু করুন')
            }
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] text-[var(--ck-text-secondary)] transition-colors hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)]"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-0.5" />}
          </button>
        </div>
      </div>

      {/* Interactive Story Selector Strip */}
      <div
        role="tablist"
        aria-label={L(lang, 'Choose a sample story', 'গল্পের উদাহরণ বেছে নিন')}
        className="flex items-center gap-2 overflow-x-auto pb-1"
      >
        {HOME_SHOWCASE_STORIES.map((story) => {
          const active = story.id === activeStory.id;
          return (
            <button
              key={story.id}
              type="button"
              role="tab"
              aria-selected={active}
              data-testid={`live-story-tab-${story.id}`}
              onClick={() => setSelectedId(story.id)}
              className={`inline-flex h-10 items-center rounded-lg border px-3.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)] ${
                active
                  ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)] text-[var(--ck-accent-soft-text)]'
                  : 'border-[var(--ck-border)] bg-[var(--ck-surface)] text-[var(--ck-text-secondary)] hover:border-[var(--ck-border-strong)] hover:text-[var(--ck-text)]'
              }`}
            >
              {lang === 'bn' ? story.labelBn : story.labelEn}
            </button>
          );
        })}
      </div>

      {/* Stage Frame + Caption Footer */}
      <div className="overflow-hidden rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface)]">
        <div className="flex items-center justify-center bg-[#07070A] p-3 sm:p-5">
          {aspectRatio === '16:9' ? (
            <div className="aspect-video w-full max-w-[920px] overflow-hidden rounded-lg border border-white/10 bg-black">
              <canvas
                ref={canvasRef}
                data-testid="home-live-canvas"
                className="block h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="aspect-[9/16] h-[440px] sm:h-[480px] overflow-hidden rounded-lg border border-white/10 bg-black">
              <canvas
                ref={canvasRef}
                data-testid="home-live-canvas"
                className="block h-full w-full object-contain"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 border-t border-[var(--ck-border-subtle)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ck-text-muted)]">
              <span className="font-semibold text-[var(--ck-accent)]">{activeCategory}</span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-[var(--ck-text)]" data-testid="home-live-story-title">
                {activeTitle}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[var(--ck-text-secondary)] sm:text-sm">
              “{activeSpokenLine}”
            </p>
          </div>

          <button
            type="button"
            data-testid="home-live-try-studio-btn"
            onClick={() => onTryStoryInStudio(activeStory)}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--ck-accent)] px-4 text-xs font-semibold text-[var(--ck-accent-fg)] transition-colors hover:bg-[var(--ck-accent-bright)] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)]"
          >
            <span>{L(lang, 'Open This Story in Studio', 'এই গল্পটি স্টুডিওতে চালান')}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
