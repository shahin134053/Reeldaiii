import React from 'react';
import {
  Check,
  Loader2,
  Circle,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';
import { AnimationProject, SETTING_LABELS } from '../lib/storyCompiler';
import {
  AudioSrtSyncReport,
  PipelineStepState,
  SceneStatusEntry,
} from '../lib/storyIntelligence';

import { AppLang, L } from '../lib/i18n';

interface ProcessingOverlayProps {
  lang: AppLang;
  percent: number;
  elapsedSeconds: number;
  draftTitle: string;
  stageMessage?: string;
  analyzedProject: AnimationProject | null;
  pipelineSteps: PipelineStepState[];
  sceneStatuses: SceneStatusEntry[];
  syncReport?: AudioSrtSyncReport | null;
  onRetryScene?: (sceneId: string) => void;
  onCancel?: () => void;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({
  lang,
  percent,
  elapsedSeconds,
  draftTitle,
  stageMessage,
  analyzedProject,
  pipelineSteps,
  sceneStatuses,
  syncReport,
  onRetryScene,
  onCancel,
}) => {
  const clamped = Math.max(1, Math.min(100, Math.round(percent)));
  const activeStep =
    pipelineSteps.find((s) => s.status === 'processing') ??
    pipelineSteps.find((s) => s.status === 'failed');

  const activeStageLabel =
    stageMessage ||
    (activeStep
      ? `${activeStep.stepNumber}/15 · ${lang === 'bn' ? activeStep.labelBn : activeStep.label} — ${activeStep.detail}`
      : clamped >= 100
        ? L(
            lang,
            'Animation Complete — Opening Dual-Format Cinema Studio',
            'অ্যানিমেশন সম্পূর্ণ — ১৬:৯ ও ৯:১৬ সিনেমা স্টুডিও খোলা হচ্ছে'
          )
        : L(lang, 'Initializing Storytelling Pipeline…', 'স্টোরিটেলিং পাইপলাইন শুরু হচ্ছে…'));

  const completedCount = pipelineSteps.filter((s) => s.status === 'completed').length;
  const mm = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
  const ss = String(Math.floor(elapsedSeconds % 60)).padStart(2, '0');

  return (
    <section
      data-testid="processing-screen"
      aria-live="polite"
      className="mx-auto max-w-[980px] py-4 sm:py-6"
    >
      {/* Guided 3-Step Indicator (Step 2 Active) */}
      <div className="mb-5 flex items-center justify-center gap-3 text-xs sm:gap-5">
        <div className="flex items-center gap-2 text-[var(--ck-text-muted)]">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--ck-success-bg)] text-[var(--ck-success)]">
            <Check className="h-3.5 w-3.5" />
          </span>
          <span className="hidden sm:inline">{L(lang, 'Upload Audio & SRT', 'অডিও ও SRT আপলোড')}</span>
        </div>
        <div className="h-px w-8 bg-[var(--ck-border-strong)] sm:w-14" />
        <div className="flex items-center gap-2 font-medium text-[var(--ck-text)]">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--ck-accent)] font-mono text-[11px] font-bold text-[var(--ck-accent-fg)]">
            2
          </span>
          <span>
            {L(lang, `15-Stage Directing & Sync (${clamped}%)`, `১৫-ধাপের ডিরেক্টিং ও সিঙ্ক (${clamped}%)`)}
          </span>
        </div>
        <div className="h-px w-8 bg-[var(--ck-border-strong)] sm:w-14" />
        <div className="flex items-center gap-2 text-[var(--ck-text-faint)]">
          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-[var(--ck-border)] bg-[var(--ck-surface)] font-mono text-[11px]">
            3
          </span>
          <span className="hidden sm:inline">{L(lang, '16:9 & 9:16 Studio', '১৬:৯ ও ৯:১৬ স্টুডিও')}</span>
        </div>
      </div>

      {/* Main Processing Card */}
      <div className="overflow-hidden rounded-2xl border border-[var(--ck-border)] bg-[var(--ck-surface)] shadow-xl">
        {/* Top Progress Header */}
        <div className="border-b border-[var(--ck-border-subtle)] bg-[var(--ck-surface-alt)] px-5 py-5 sm:px-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ck-accent)]">
                  {L(
                    lang,
                    `Context-Aware Storytelling Engine · ${completedCount}/15 Stages`,
                    `কনটেক্সট-অ্যাওয়্যার স্টোরিটেলিং ইঞ্জিন · ${completedCount}/১৫ ধাপ`
                  )}
                </p>
                {onCancel && clamped < 100 && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="inline-flex items-center gap-1 rounded-md border border-[var(--ck-border-strong)] px-2 py-0.5 text-[11px] text-[var(--ck-text-muted)] hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)]"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <span>{L(lang, 'Edit Inputs', 'ইনপুট বদলান')}</span>
                  </button>
                )}
              </div>
              <h1 className="mt-1 truncate text-xl font-semibold text-[var(--ck-text)] sm:text-2xl">
                {analyzedProject?.title ||
                  draftTitle ||
                  L(lang, 'Analyzing Uploaded Story…', 'আপলোড করা গল্প বিশ্লেষণ হচ্ছে…')}
              </h1>
              <p className="mt-1 text-xs text-[var(--ck-text-muted)]">{activeStageLabel}</p>
            </div>

            <div className="shrink-0 text-right">
              <div
                data-testid="processing-percentage"
                className="font-mono text-4xl font-bold tracking-tight tabular-nums text-[var(--ck-accent)] sm:text-5xl"
              >
                {clamped}%
              </div>
              <div className="mt-1 font-mono text-[11px] tabular-nums text-[var(--ck-text-faint)]">
                {L(lang, `Elapsed ${mm}:${ss} · Target < 1 min`, `সময় ${mm}:${ss} · টার্গেট < ১ মি.`)}
              </div>
            </div>
          </div>

          {/* Smooth 1% -> 100% Progress Track */}
          <div
            role="progressbar"
            aria-label={L(lang, 'Animation processing progress', 'অ্যানিমেশন প্রসেসিং অগ্রগতি')}
            aria-valuenow={clamped}
            aria-valuemin={1}
            aria-valuemax={100}
            className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[var(--ck-inset-deep)]"
          >
            <div
              className="h-full rounded-full bg-[var(--ck-accent)] transition-[width] duration-150 ease-out"
              style={{ width: `${clamped}%` }}
            />
          </div>

          {syncReport && (
            <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] px-3 py-2 text-[11px] text-[var(--ck-text-secondary)]">
              <span>{syncReport.message}</span>
              {syncReport.audioDurationSeconds && (
                <span className="shrink-0 font-mono text-[var(--ck-accent)]">
                  Audio {syncReport.audioDurationSeconds.toFixed(1)}s
                </span>
              )}
            </div>
          )}
        </div>

        {/* 15-Step Real Pipeline Grid */}
        <div
          data-testid="pipeline-15-steps"
          className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3 sm:p-6"
        >
          {pipelineSteps.map((step) => {
            const isDone = step.status === 'completed';
            const isActive = step.status === 'processing';
            const isFailed = step.status === 'failed';

            return (
              <div
                key={step.id}
                data-step-status={step.status}
                className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 transition-colors duration-75 ${
                  isDone
                    ? 'border-[var(--ck-success-border)] bg-[var(--ck-success-bg)]'
                    : isActive
                      ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)]'
                      : isFailed
                        ? 'border-[var(--ck-danger-border)] bg-[var(--ck-danger-bg)]'
                        : 'border-[var(--ck-border-subtle)] bg-[var(--ck-inset)] opacity-65'
                }`}
              >
                <div
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                    isDone
                      ? 'border-[var(--ck-success-border)] bg-[var(--ck-surface)] text-[var(--ck-success)]'
                      : isActive
                        ? 'border-[var(--ck-accent)] bg-[var(--ck-surface)] text-[var(--ck-accent)]'
                        : isFailed
                          ? 'border-[var(--ck-danger-border)] bg-[var(--ck-surface)] text-[var(--ck-danger)]'
                          : 'border-[var(--ck-border)] bg-[var(--ck-surface)] text-[var(--ck-text-faint)]'
                  }`}
                >
                  {isDone ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : isActive ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isFailed ? (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="truncate text-xs font-semibold text-[var(--ck-text)]">
                      {String(step.stepNumber).padStart(2, '0')}. {lang === 'bn' ? step.labelBn : step.label}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] uppercase text-[var(--ck-text-muted)]">
                      {isDone
                        ? L(lang, 'Done', 'সম্পন্ন')
                        : isActive
                          ? L(lang, 'Active', 'চলছে')
                          : isFailed
                            ? L(lang, 'Alert', 'সতর্কতা')
                            : L(lang, 'Wait', 'অপেক্ষা')}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-[var(--ck-text-muted)]">
                    {step.status === 'pending'
                      ? L(lang, 'Queued in pipeline', step.labelBn)
                      : step.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Per-Scene Build Statuses */}
        {sceneStatuses.length > 0 && (
          <div className="border-t border-[var(--ck-border-subtle)] bg-[var(--ck-inset)] px-5 py-4 sm:px-7">
            <div className="mb-2.5 flex items-center justify-between text-[11px] font-medium text-[var(--ck-text-muted)]">
              <span>
                {L(
                  lang,
                  'Per-Scene Direction & Visual Build Status',
                  'প্রতিটি দৃশ্যের ডিরেকশন ও ভিজ্যুয়াল তৈরির অবস্থা'
                )}
              </span>
              <span className="font-mono tabular-nums text-[var(--ck-accent)]">
                {sceneStatuses.filter((s) => s.status === 'ready').length}/{sceneStatuses.length}{' '}
                {L(lang, 'ready', 'প্রস্তুত')}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sceneStatuses.map((entry) => {
                const matchingScene = analyzedProject?.scenes.find(
                  (sc) => sc.id === entry.sceneId
                );
                const sceneTitle =
                  lang === 'en'
                    ? matchingScene?.titleEn || entry.titleBn
                    : entry.titleBn;
                return (
                  <div
                    key={entry.sceneId}
                    className="flex items-center justify-between gap-2 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] px-3 py-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--ck-accent)]">
                        <span>
                          {L(lang, `Scene ${entry.chapterNumber}`, `দৃশ্য ${entry.chapterNumber}`)}
                        </span>
                        {matchingScene && (
                          <span className="truncate text-[var(--ck-text-muted)]">
                            · {SETTING_LABELS[matchingScene.setting]}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-[var(--ck-text)]">
                        {sceneTitle}
                      </div>
                      {entry.message && (
                        <div className="mt-0.5 truncate text-[10px] text-[var(--ck-text-muted)]">
                          {entry.message}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      <span
                        className={`font-mono text-[10px] ${
                          entry.status === 'ready'
                            ? 'text-[var(--ck-success)]'
                            : entry.status === 'generating'
                              ? 'text-[var(--ck-accent)]'
                              : entry.status === 'flagged' || entry.status === 'failed'
                                ? 'text-[var(--ck-danger)]'
                                : 'text-[var(--ck-text-faint)]'
                        }`}
                      >
                        {entry.status === 'ready'
                          ? L(lang, 'Ready', 'প্রস্তুত')
                          : entry.status === 'generating'
                            ? L(lang, 'Building', 'তৈরি হচ্ছে')
                            : entry.status === 'flagged'
                              ? L(lang, 'QC Alert', 'QC সতর্কতা')
                              : entry.status === 'failed'
                                ? L(lang, 'Failed', 'ব্যর্থ')
                                : L(lang, 'Queued', 'অপেক্ষায়')}
                      </span>
                      {(entry.status === 'flagged' || entry.status === 'failed') &&
                        onRetryScene && (
                          <button
                            type="button"
                            onClick={() => onRetryScene(entry.sceneId)}
                            aria-label={L(
                              lang,
                              `Retry scene ${entry.chapterNumber}`,
                              `দৃশ্য ${entry.chapterNumber} পুনরায় চেষ্টা করুন`
                            )}
                            className="inline-flex h-6 items-center gap-1 rounded border border-[var(--ck-accent)] bg-[var(--ck-accent-soft)] px-1.5 text-[10px] text-[var(--ck-accent-soft-text)] hover:bg-[var(--ck-accent-soft-hover)]"
                          >
                            <RotateCcw className="h-2.5 w-2.5" />
                            <span>{L(lang, 'Retry', 'আবার চেষ্টা')}</span>
                          </button>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
