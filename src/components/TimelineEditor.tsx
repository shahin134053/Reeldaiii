import React, { useEffect, useRef } from 'react';
import {
  Scissors,
  Merge,
  Music,
  SlidersHorizontal,
  RotateCcw,
  Minus,
  Plus,
} from 'lucide-react';
import { AnimationProject, SceneSpec } from '../lib/storyCompiler';
import { formatTimecode } from '../lib/storyboard';
import {
  BGM_PRESET_LABELS,
  BgmConfig,
  BgmPresetId,
  DEFAULT_BGM_CONFIG,
} from '../lib/redesignAndStudio';

import { AppLang, L } from '../lib/i18n';

interface TimelineEditorProps {
  lang: AppLang;
  project: AnimationProject;
  activeScene: SceneSpec;
  currentTime: number;
  onSeekTo: (time: number) => void;
  onAdjustSceneBoundary: (sceneId: string, edge: 'start' | 'end', deltaSec: number) => void;
  onSplitScene: (sceneId: string) => void;
  onMergeScene: (sceneId: string) => void;
  onShiftSrtOffset: (deltaSec: number) => void;
  onResetSrtOffset: () => void;
  onUpdateBgm: (patch: Partial<BgmConfig>) => void;
}

const BGM_OPTIONS: BgmPresetId[] = [
  'auto-emotion',
  'warm-piano',
  'cinematic-strings',
  'lofi-ambient',
  'epic-pulse',
  'off',
];

export const TimelineEditor: React.FC<TimelineEditorProps> = ({
  lang,
  project,
  activeScene,
  currentTime,
  onSeekTo,
  onAdjustSceneBoundary,
  onSplitScene,
  onMergeScene,
  onShiftSrtOffset,
  onResetSrtOffset,
  onUpdateBgm,
}) => {
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgm = project.bgmConfig ?? DEFAULT_BGM_CONFIG;
  const srtOffset = project.srtOffsetSeconds ?? 0;

  const activeSceneIdx = project.scenes.findIndex((s) => s.id === activeScene.id);
  const activeDur = Math.max(0.5, activeScene.endTime - activeScene.startTime);
  const canSplit = activeDur >= 4.0;
  const canMerge = activeSceneIdx >= 0 && activeSceneIdx < project.scenes.length - 1;
  const canTrimEnd = activeSceneIdx >= 0 && activeSceneIdx < project.scenes.length - 1;

  // Draw crisp Audio Waveform + Scene Segments + Playhead
  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#0B0B0F';
    ctx.fillRect(0, 0, w, h);

    const dur = Math.max(1, project.duration);

    // Scene blocks along top strip
    project.scenes.forEach((sc, idx) => {
      const x1 = (sc.startTime / dur) * w;
      const x2 = (sc.endTime / dur) * w;
      const isAct = sc.id === activeScene.id;
      ctx.fillStyle = isAct ? 'rgba(229, 169, 60, 0.24)' : idx % 2 === 0 ? '#14141B' : '#111117';
      ctx.fillRect(x1, 0, Math.max(2, x2 - x1), h);

      ctx.strokeStyle = isAct ? '#E5A93C' : '#262632';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x1, 0);
      ctx.lineTo(x1, h);
      ctx.stroke();

      if (x2 - x1 > 28) {
        ctx.fillStyle = isAct ? '#F6C65B' : '#7D7B75';
        ctx.font = '600 10px "JetBrains Mono", monospace';
        ctx.fillText(sc.chapterNumber, x1 + 6, 13);
      }
    });

    // Audio energy waveform bars
    const env = project.audioEnvelope ?? [];
    const barCount = 140;
    const barW = Math.max(2, w / barCount - 1.5);
    for (let i = 0; i < barCount; i++) {
      const tNorm = i / barCount;
      const envIdx = env.length > 0 ? Math.min(env.length - 1, Math.floor(tNorm * env.length)) : 0;
      const amp = env.length > 0 ? env[envIdx] : 0.2 + 0.15 * Math.sin(i * 0.6);
      const barH = Math.max(4, Math.min(h - 22, amp * (h - 22) * 1.15));
      const bx = i * (w / barCount);
      const by = h - 6 - barH;
      const passed = tNorm * dur <= currentTime;
      ctx.fillStyle = passed ? '#E5A93C' : 'rgba(244, 243, 239, 0.26)';
      ctx.fillRect(bx, by, barW, barH);
    }

    // Playhead cursor
    const playX = Math.max(1, Math.min(w - 2, (currentTime / dur) * w));
    ctx.fillStyle = '#FAF8F3';
    ctx.fillRect(playX - 1, 0, 2, h);
  }, [project.duration, project.scenes, project.audioEnvelope, activeScene.id, currentTime]);

  const handleWaveformClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
    onSeekTo(ratio * Math.max(1, project.duration));
  };

  return (
    <section
      id="timeline-editor"
      data-testid="timeline-editor"
      className="rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface)] p-4"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ck-text)]">
          <SlidersHorizontal className="h-4 w-4 text-[var(--ck-accent)]" />
          <span>
            {L(
              lang,
              'Waveform, Timeline Split/Merge & Emotion BGM Studio',
              'ওয়েভফর্ম, সিন স্প্লিট/মার্জ এবং ইমোশন BGM স্টুডিও'
            )}
          </span>
        </div>
        <div className="font-mono text-[11px] tabular-nums text-[var(--ck-text-muted)]">
          {L(lang, `Ch. ${activeScene.chapterNumber}`, `দৃশ্য ${activeScene.chapterNumber}`)} ·{' '}
          {formatTimecode(activeScene.startTime)} – {formatTimecode(activeScene.endTime)} ({activeDur.toFixed(1)}s)
        </div>
      </div>

      {/* Interactive Waveform Canvas (studio scope stays dark for waveform contrast) */}
      <canvas
        ref={waveCanvasRef}
        width={960}
        height={64}
        onClick={handleWaveformClick}
        aria-label={L(lang, 'Audio waveform and scene timeline scrubber', 'অডিও ওয়েভফর্ম ও সিন টাইমলাইন')}
        data-testid="waveform-canvas"
        className="h-16 w-full cursor-pointer rounded-lg border border-[var(--ck-border)] block"
      />

      {/* 3-Column Controls Row: Scene Timing | SRT Sync Offset | Emotion BGM */}
      <div className="mt-3.5 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* 1. Scene Trim, Split & Merge */}
        <div className="rounded-lg border border-[var(--ck-border-subtle)] bg-[var(--ck-surface-alt)] p-3">
          <div className="text-[11px] font-semibold text-[var(--ck-text-secondary)]">
            {L(
              lang,
              `Scene Timing · Ch. ${activeScene.chapterNumber}`,
              `দৃশ্যের সময় · দৃশ্য ${activeScene.chapterNumber}`
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={!canTrimEnd}
              onClick={() => onAdjustSceneBoundary(activeScene.id, 'end', -1.0)}
              title={L(lang, 'Shorten active scene by 1 second', 'সক্রিয় দৃশ্য ১ সেকেন্ড কমান')}
              className="inline-flex items-center gap-1 rounded-md border border-[var(--ck-border-strong)] bg-[var(--ck-surface)] px-2 py-1.5 text-[11px] text-[var(--ck-text)] hover:border-[var(--ck-accent)] disabled:opacity-40 whitespace-nowrap shrink-0"
            >
              <Minus className="h-3 w-3" />
              <span>1s</span>
            </button>
            <button
              type="button"
              disabled={!canTrimEnd}
              onClick={() => onAdjustSceneBoundary(activeScene.id, 'end', 1.0)}
              title={L(lang, 'Extend active scene by 1 second', 'সক্রিয় দৃশ্য ১ সেকেন্ড বাড়ান')}
              className="inline-flex items-center gap-1 rounded-md border border-[var(--ck-border-strong)] bg-[var(--ck-surface)] px-2 py-1.5 text-[11px] text-[var(--ck-text)] hover:border-[var(--ck-accent)] disabled:opacity-40 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3 w-3" />
              <span>1s</span>
            </button>
            <button
              type="button"
              disabled={!canSplit}
              onClick={() => onSplitScene(activeScene.id)}
              data-testid="split-scene-btn"
              className="inline-flex items-center gap-1 rounded-md border border-[var(--ck-border-strong)] bg-[var(--ck-surface)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--ck-accent)] hover:border-[var(--ck-accent)] disabled:opacity-40 whitespace-nowrap shrink-0"
            >
              <Scissors className="h-3 w-3" />
              <span>{L(lang, 'Split Scene', 'দৃশ্য ভাগ')}</span>
            </button>
            <button
              type="button"
              disabled={!canMerge}
              onClick={() => onMergeScene(activeScene.id)}
              data-testid="merge-scene-btn"
              className="inline-flex items-center gap-1 rounded-md border border-[var(--ck-border-strong)] bg-[var(--ck-surface)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--ck-text-secondary)] hover:border-[var(--ck-accent)] disabled:opacity-40 whitespace-nowrap shrink-0"
            >
              <Merge className="h-3 w-3" />
              <span>{L(lang, 'Merge Next', 'পরের সাথে জুড়ুন')}</span>
            </button>
          </div>
        </div>

        {/* 2. Waveform SRT Timing +/- Sync Nudge */}
        <div className="rounded-lg border border-[var(--ck-border-subtle)] bg-[var(--ck-surface-alt)] p-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-[var(--ck-text-secondary)]">
              {L(lang, 'SRT Subtitle Sync Offset', 'SRT সাবটাইটেল সিঙ্ক অফসেট')}
            </span>
            <span
              data-testid="srt-offset-readout"
              className="font-mono tabular-nums text-[var(--ck-accent)]"
            >
              {srtOffset >= 0 ? `+${srtOffset.toFixed(1)}s` : `${srtOffset.toFixed(1)}s`}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {[-0.5, -0.1, 0.1, 0.5].map((delta) => (
              <button
                key={delta}
                type="button"
                onClick={() => onShiftSrtOffset(delta)}
                data-testid={`srt-shift-${delta}`}
                className="rounded-md border border-[var(--ck-border-strong)] bg-[var(--ck-surface)] px-2.5 py-1.5 font-mono text-[11px] tabular-nums text-[var(--ck-text)] hover:border-[var(--ck-accent)] whitespace-nowrap shrink-0"
              >
                {delta > 0 ? `+${delta}s` : `${delta}s`}
              </button>
            ))}
            {Math.abs(srtOffset) > 0.01 && (
              <button
                type="button"
                onClick={onResetSrtOffset}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--ck-border-strong)] bg-[var(--ck-surface)] px-2 py-1.5 text-[11px] text-[var(--ck-text-muted)] hover:text-[var(--ck-text)] whitespace-nowrap shrink-0"
              >
                <RotateCcw className="h-3 w-3" />
                <span>{L(lang, 'Reset', 'রিসেট')}</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Emotion-Based BGM & Voiceover Auto-Ducking */}
        <div className="rounded-lg border border-[var(--ck-border-subtle)] bg-[var(--ck-surface-alt)] p-3">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="flex items-center gap-1.5 font-semibold text-[var(--ck-text-secondary)]">
              <Music className="h-3.5 w-3.5 text-[var(--ck-accent)]" />
              <span>{L(lang, 'Emotion BGM & Auto-Ducking', 'ইমোশন BGM ও অটো-ডাকিং')}</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={bgm.enabled}
              onClick={() =>
                onUpdateBgm({
                  enabled: !bgm.enabled,
                  preset: !bgm.enabled && bgm.preset === 'off' ? 'auto-emotion' : bgm.preset,
                })
              }
              data-testid="bgm-toggle-btn"
              className={`rounded px-2 py-0.5 text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                bgm.enabled
                  ? 'bg-[var(--ck-accent)] text-[var(--ck-accent-fg)]'
                  : 'bg-[var(--ck-surface-hover)] text-[var(--ck-text-muted)]'
              }`}
            >
              {bgm.enabled ? L(lang, 'BGM On', 'BGM চালু') : L(lang, 'BGM Off', 'BGM বন্ধ')}
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <select
              aria-label={L(lang, 'Background music preset', 'ব্যাকগ্রাউন্ড মিউজিক প্রিসেট')}
              value={bgm.preset}
              onChange={(e) => {
                const p = e.target.value as BgmPresetId;
                onUpdateBgm({ preset: p, enabled: p !== 'off' });
              }}
              className="min-w-0 flex-1 rounded-md border border-[var(--ck-border-strong)] bg-[var(--ck-surface)] px-2 py-1.5 text-[11px] text-[var(--ck-text)]"
            >
              {BGM_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {BGM_PRESET_LABELS[opt].label}
                </option>
              ))}
            </select>
            <label className="inline-flex items-center gap-1.5 text-[11px] text-[var(--ck-text-secondary)] whitespace-nowrap shrink-0">
              <input
                type="checkbox"
                checked={bgm.autoDucking}
                onChange={(e) => onUpdateBgm({ autoDucking: e.target.checked })}
                className="accent-[var(--ck-accent)]"
              />
              <span>{L(lang, 'Auto-Duck', 'অটো-ডাক')}</span>
            </label>
          </div>
        </div>
      </div>
    </section>
  );
};
