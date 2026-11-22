import React, { useEffect, useRef } from 'react';
import {
  AnimationProject,
  AspectRatio,
  SceneSpec,
  SETTING_LABELS,
} from '../lib/storyCompiler';
import { formatTimecode } from '../lib/storyboard';
import { DIMENSIONS_BY_RATIO, renderProjectFrame } from '../animation/renderer';
import { onSvgSceneLoaded } from '../lib/svgSanitizer';
import { AppLang, L } from '../lib/i18n';

interface ChapterThumbnailProps {
  project: AnimationProject;
  scene: SceneSpec;
  aspectRatio: AspectRatio;
  portraitZoom: number;
}

const ChapterThumbnail: React.FC<ChapterThumbnailProps> = ({
  project,
  scene,
  aspectRatio,
  portraitZoom,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isVertical = aspectRatio === '9:16';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const demoOffsets: Record<string, number> = {
      'morning-dropoff': 10.5,
      'fajr-gamchha': 18.2,
      'teastall-hurt': 12.0,
      'exam-dinner': 16.5,
      'storm-window': 15.0,
      'rain-arrival': 38.5,
      'mirror-ride': 20.5,
      'sunset-epilogue': 15.5,
    };

    const sceneDur = Math.max(1, scene.endTime - scene.startTime);
    const offset = scene.presetSceneId
      ? (demoOffsets[scene.presetSceneId] ?? sceneDur * 0.45)
      : sceneDur * 0.45;
    const sampleTime = Math.min(scene.endTime - 0.1, scene.startTime + offset);

    const paint = () => {
      const dims = DIMENSIONS_BY_RATIO[aspectRatio];
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(canvas.width / dims.width, canvas.height / dims.height);
      renderProjectFrame(ctx, {
        project,
        time: sampleTime,
        aspectRatio,
        subtitleMode: 'off',
        portraitZoom,
        showLetterbox: false,
        isThumbnail: true,
      });
      ctx.restore();
    };

    paint();
    const unsubscribe = onSvgSceneLoaded(paint);
    return unsubscribe;
  }, [project, scene, aspectRatio, portraitZoom]);

  return (
    <canvas
      ref={canvasRef}
      width={isVertical ? 180 : 320}
      height={isVertical ? 320 : 180}
      className={`${
        isVertical ? 'aspect-[9/16] max-h-56 mx-auto' : 'aspect-video w-full'
      } rounded-md bg-[#0C0C10] object-cover block`}
    />
  );
};

interface ChapterGridProps {
  lang: AppLang;
  project: AnimationProject;
  activeSceneId: string;
  thumbnailRatio: AspectRatio;
  portraitZoom?: number;
  onSelectChapter: (scene: SceneSpec) => void;
}

export const ChapterGrid: React.FC<ChapterGridProps> = ({
  lang,
  project,
  activeSceneId,
  thumbnailRatio,
  portraitZoom = 1.38,
  onSelectChapter,
}) => {
  return (
    <section id="storyboard" className="pt-2">
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--ck-text)]">
            {L(lang, 'Storyboard Chapters', 'স্টোরিবোর্ড অধ্যায়সমূহ')}
          </h2>
          <p className="mt-1 text-sm text-[var(--ck-text-muted)]">
            {L(
              lang,
              'Auto-generated 2D animated sequences synchronized to your timeline. Select any scene to preview or customize it in Scene Director.',
              'আপনার টাইমলাইনের সাথে সিঙ্ক করা অটো-জেনারেটেড ২ডি দৃশ্য। যেকোনো দৃশ্যে ক্লিক করে প্রিভিউ বা ডিরেক্টরে এডিট করুন।'
            )}
          </p>
        </div>
        <span className="font-mono text-xs tabular-nums text-[var(--ck-text-faint)]">
          {project.scenes.length} {L(lang, 'chapters', 'অধ্যায়')} · {formatTimecode(project.duration)} · {thumbnailRatio}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {project.scenes.map((scene) => {
          const isActive = scene.id === activeSceneId;
          return (
            <button
              key={`${project.id}-${scene.id}`}
              type="button"
              onClick={() => onSelectChapter(scene)}
              aria-current={isActive ? 'true' : undefined}
              className={`group flex flex-col rounded-xl border p-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)] ${
                isActive
                  ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)]'
                  : 'border-[var(--ck-border)] bg-[var(--ck-surface)] hover:border-[var(--ck-border-strong)] hover:bg-[var(--ck-surface-alt)]'
              }`}
            >
              <div className="relative mb-3 overflow-hidden rounded-md bg-[#08080B]">
                <ChapterThumbnail
                  project={project}
                  scene={scene}
                  aspectRatio={thumbnailRatio}
                  portraitZoom={portraitZoom}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--ck-text-faint)]">
                <span className={`font-mono tabular-nums ${isActive ? 'text-[var(--ck-accent)] font-semibold' : ''}`}>
                  {scene.chapterNumber}
                </span>
                <span className="font-mono tabular-nums">
                  {formatTimecode(scene.startTime)}
                </span>
              </div>

              <h3 className="mt-1.5 text-sm font-semibold leading-snug text-[var(--ck-text)] group-hover:text-[var(--ck-accent)]">
                {lang === 'en' ? scene.titleEn || scene.titleBn : scene.titleBn}
              </h3>
              <p className="mt-0.5 text-xs text-[var(--ck-text-muted)]">
                {SETTING_LABELS[scene.setting]}
              </p>
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[var(--ck-text-faint)]">
                {scene.visualMatchReason || scene.summary}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
};
