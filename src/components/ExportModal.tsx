import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Download, Film, X } from 'lucide-react';
import {
  AnimationProject,
  AspectRatio,
  SceneSpec,
} from '../lib/storyCompiler';
import { formatTimecode } from '../lib/storyboard';
import { SubtitleMode, SubtitleStyle } from '../animation/renderer';
import { EXPORT_QUALITY_PRESETS, ExportQuality } from '../animation/motionEngine';
import { preloadStudioAssetsForScenes } from '../animation/assetCanvasRenderer';
import {
  ExportContainerFormat,
  computeExportFrameSchedule,
  exportAnimationVideo,
  preloadDecodedAudio,
} from '../lib/videoExporter';
import { AppLang, L } from '../lib/i18n';

export type ExportFormatChoice = 'both' | '16:9' | '9:16';

interface ExportModalProps {
  lang: AppLang;
  isOpen: boolean;
  onClose: () => void;
  project: AnimationProject;
  activeScene: SceneSpec;
  defaultSubtitleMode: SubtitleMode;
  subtitleStyle?: SubtitleStyle;
  portraitZoom?: number;
  initialFormat?: ExportFormatChoice;
}

type ExportScope = 'scene' | 'full';

interface ReadyDownload {
  ratio: AspectRatio;
  url: string;
  filename: string;
  sizeBytes: number;
  width: number;
  height: number;
  codecLabel: string;
  extension: ExportContainerFormat;
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  lang,
  isOpen,
  onClose,
  project,
  activeScene,
  defaultSubtitleMode,
  subtitleStyle = 'kinetic',
  portraitZoom = 1.38,
  initialFormat = 'both',
}) => {
  const [formatChoice, setFormatChoice] = useState<ExportFormatChoice>(initialFormat);
  const [containerFormat, setContainerFormat] = useState<ExportContainerFormat>('mp4');
  const [quality, setQuality] = useState<ExportQuality>('4k');
  const [scope, setScope] = useState<ExportScope>('full');
  const [subtitleMode, setSubtitleMode] = useState<SubtitleMode>(defaultSubtitleMode);
  const [status, setStatus] = useState<'idle' | 'recording' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState<string>('');
  const [frameDetail, setFrameDetail] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloads, setDownloads] = useState<ReadyDownload[]>([]);
  const [previewRatio, setPreviewRatio] = useState<AspectRatio | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const downloadsRef = useRef<ReadyDownload[]>([]);
  downloadsRef.current = downloads;

  useEffect(() => {
    if (isOpen) {
      setFormatChoice(initialFormat);
      if (project.audioUrl) {
        void preloadDecodedAudio(project.audioUrl);
      }
    }
  }, [isOpen, initialFormat, project.audioUrl]);

  useEffect(() => {
    setSubtitleMode(defaultSubtitleMode);
  }, [defaultSubtitleMode]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      downloadsRef.current.forEach((d) => URL.revokeObjectURL(d.url));
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && status !== 'recording') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, status, onClose]);

  if (!isOpen) return null;

  const startTime = scope === 'scene' ? activeScene.startTime : 0;
  const endTime = scope === 'scene' ? activeScene.endTime : project.duration;
  const ratiosToExport: AspectRatio[] =
    formatChoice === 'both' ? ['16:9', '9:16'] : [formatChoice];

  const triggerDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    window.setTimeout(() => {
      a.remove();
    }, 1000);
  };

  const handleStartExport = async () => {
    downloadsRef.current.forEach((d) => URL.revokeObjectURL(d.url));
    setDownloads([]);
    setPreviewRatio(null);
    setErrorMessage(null);
    setProgress(0);
    setFrameDetail('');
    setStatus('recording');

    const controller = new AbortController();
    abortRef.current = controller;

    const slug =
      project.title
        .toLowerCase()
        .replace(/[^a-z0-9\u0980-\u09ff]+/gi, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40) || 'reeldaiii-video';
    const rangeTag = scope === 'scene' ? `ch${activeScene.chapterNumber}` : 'full';
    const completed: ReadyDownload[] = [];

    try {
      const exportSessionStartMs = performance.now();
      const SESSION_HARD_BUDGET_MS = 52_000;
      await preloadStudioAssetsForScenes(project.scenes, project.characterProfiles);
      const preset = EXPORT_QUALITY_PRESETS[quality];
      for (let i = 0; i < ratiosToExport.length; i++) {
        const ratio = ratiosToExport[i];
        const ratioTag = ratio === '16:9' ? '16x9-youtube' : '9x16-reels';
        const dims = preset.dimensions[ratio];
        const schedule = computeExportFrameSchedule(endTime - startTime, quality);
        const elapsedSoFarMs = performance.now() - exportSessionStartMs;
        const passTargetWallMs =
          ratiosToExport.length > 1
            ? i === 0
              ? 24_000
              : Math.max(10_000, SESSION_HARD_BUDGET_MS - elapsedSoFarMs)
            : Math.max(15_000, 46_000 - elapsedSoFarMs);

        setStepLabel(
          L(
            lang,
            `Step ${i + 1} of ${ratiosToExport.length}: Encoding ${preset.shortLabel} ${containerFormat.toUpperCase()} · ${ratio} (${dims.width}×${dims.height} · ${schedule.fps}fps)`,
            `ধাপ ${i + 1}/${ratiosToExport.length}: ${preset.shortLabel} ${containerFormat.toUpperCase()} · ${ratio} (${dims.width}×${dims.height} · ${schedule.fps}fps) রেন্ডার হচ্ছে`
          )
        );

        const result = await exportAnimationVideo({
          project,
          aspectRatio: ratio,
          startTime,
          endTime,
          subtitleMode,
          subtitleStyle,
          quality,
          containerFormat,
          portraitZoom,
          fps: schedule.fps,
          targetMaxWallMs: passTargetWallMs,
          onProgress: (pct, _sec, detail) => {
            const overall = (i + pct) / ratiosToExport.length;
            setProgress(overall);
            if (detail) setFrameDetail(detail);
          },
          signal: controller.signal,
        });

        const url = URL.createObjectURL(result.blob);
        const filename = `${slug}-${rangeTag}-${result.width}x${result.height}-${ratioTag}.${result.extension}`;
        completed.push({
          ratio,
          url,
          filename,
          sizeBytes: result.blob.size,
          width: result.width,
          height: result.height,
          codecLabel: result.codecLabel,
          extension: result.extension,
        });

        triggerDownload(url, filename);
      }

      setDownloads(completed);
      setStatus('done');
      setStepLabel('');
      setFrameDetail('');
    } catch (err) {
      completed.forEach((d) => URL.revokeObjectURL(d.url));
      if (err instanceof DOMException && err.name === 'AbortError') {
        setStatus('idle');
        setProgress(0);
        setStepLabel('');
        setFrameDetail('');
        return;
      }
      setStatus('error');
      setErrorMessage(
        err instanceof Error
          ? err.message
          : L(lang, 'Unable to export video.', 'ভিডিও এক্সপোর্ট করা যায়নি।')
      );
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setStatus('idle');
    setProgress(0);
    setStepLabel('');
    setFrameDetail('');
  };

  const hasTranslations = Object.keys(project.englishTranslations).length > 0;
  const activePreviewDownload = downloads.find((d) => d.ratio === previewRatio) ?? null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[var(--ck-overlay)] p-4 backdrop-blur-xs"
    >
      <div className="my-auto w-full max-w-xl rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface)] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="export-dialog-title" className="text-xl font-semibold text-[var(--ck-text)]">
              {L(
                lang,
                'Export High-Res Video (MP4 / WebM)',
                'হাই-রেজোলিউশন ভিডিও এক্সপোর্ট (MP4 / WebM)'
              )}
            </h2>
            <p className="mt-1 text-sm text-[var(--ck-text-muted)]">
              {L(
                lang,
                'Fast offline WebCodecs rendering — choose any format, aspect ratio, and resolution up to 4K UHD.',
                'দ্রুত ব্রাউজার রেন্ডারিং — পছন্দমতো ফরম্যাট, অ্যাস্পেক্ট রেশিও ও ৪কে UHD পর্যন্ত রেজোলিউশন বেছে নিন।'
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={status === 'recording' ? handleCancel : onClose}
            aria-label={L(lang, 'Close export modal', 'এক্সপোর্ট মডাল বন্ধ করুন')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--ck-text-muted)] transition-colors hover:bg-[var(--ck-surface-hover)] hover:text-[var(--ck-text)]"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {/* Output Aspect Ratio */}
          <div>
            <span className="block text-xs font-medium text-[var(--ck-text-secondary)]">
              {L(lang, 'Output Video Aspect Ratio', 'ভিডিও ফরম্যাট / রেশিও')}
            </span>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(
                [
                  {
                    id: 'both',
                    title: L(lang, 'Both 16:9 + 9:16', '১৬:৯ + ৯:১৬ দুটিই'),
                    sub: L(lang, 'Auto 2 files', 'অটো ২টি ফাইল'),
                  },
                  {
                    id: '16:9',
                    title: L(lang, '16:9 Only', 'শুধু ১৬:৯'),
                    sub: `${EXPORT_QUALITY_PRESETS[quality].dimensions['16:9'].width}×${EXPORT_QUALITY_PRESETS[quality].dimensions['16:9'].height}`,
                  },
                  {
                    id: '9:16',
                    title: L(lang, '9:16 Only', 'শুধু ৯:১৬'),
                    sub: `${EXPORT_QUALITY_PRESETS[quality].dimensions['9:16'].width}×${EXPORT_QUALITY_PRESETS[quality].dimensions['9:16'].height}`,
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={status === 'recording'}
                  onClick={() => setFormatChoice(opt.id)}
                  className={`rounded-lg border p-2.5 text-left transition-colors ${
                    formatChoice === opt.id
                      ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)] text-[var(--ck-text)]'
                      : 'border-[var(--ck-border)] bg-[var(--ck-surface-alt)] text-[var(--ck-text-secondary)] hover:border-[var(--ck-border-strong)]'
                  }`}
                >
                  <div className="text-xs font-semibold whitespace-nowrap">{opt.title}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-[var(--ck-text-muted)]">{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* File Format (MP4 / WebM) + Resolution Quality */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <span className="block text-xs font-medium text-[var(--ck-text-secondary)]">
                {L(lang, 'Video File Format', 'ভিডিও ফাইল ফরম্যাট')}
              </span>
              <div
                className="mt-2 grid grid-cols-2 gap-2"
                role="radiogroup"
                aria-label={L(lang, 'Video file format', 'ভিডিও ফাইল ফরম্যাট')}
              >
                {(
                  [
                    { id: 'mp4', title: 'MP4', sub: 'YouTube · Reels' },
                    { id: 'webm', title: 'WebM', sub: 'VP9 · Ultra Crisp' },
                  ] as const
                ).map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    role="radio"
                    aria-checked={containerFormat === fmt.id}
                    disabled={status === 'recording'}
                    onClick={() => setContainerFormat(fmt.id)}
                    data-testid={`format-${fmt.id}`}
                    className={`rounded-lg border p-2.5 text-left transition-colors ${
                      containerFormat === fmt.id
                        ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)] text-[var(--ck-text)]'
                        : 'border-[var(--ck-border)] bg-[var(--ck-surface-alt)] text-[var(--ck-text-secondary)] hover:border-[var(--ck-border-strong)]'
                    }`}
                  >
                    <div className="text-xs font-semibold">{fmt.title}</div>
                    <div className="mt-0.5 font-mono text-[10px] text-[var(--ck-text-muted)]">{fmt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-[var(--ck-text-secondary)]">
                {L(lang, 'Resolution Quality', 'রেজোলিউশন কোয়ালিটি')}
              </span>
              <div
                className="mt-2 grid grid-cols-3 gap-1.5"
                role="radiogroup"
                aria-label={L(lang, 'Export resolution quality', 'এক্সপোর্ট রেজোলিউশন')}
              >
                {(['4k', '1080p', '720p'] as ExportQuality[]).map((q) => {
                  const p = EXPORT_QUALITY_PRESETS[q];
                  const selected = quality === q;
                  return (
                    <button
                      key={q}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={status === 'recording'}
                      onClick={() => setQuality(q)}
                      data-testid={`quality-${q}`}
                      className={`rounded-lg border p-2 text-left transition-colors ${
                        selected
                          ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)] text-[var(--ck-text)]'
                          : 'border-[var(--ck-border)] bg-[var(--ck-surface-alt)] text-[var(--ck-text-secondary)] hover:border-[var(--ck-border-strong)]'
                      }`}
                    >
                      <div className="text-xs font-semibold whitespace-nowrap">{p.shortLabel}</div>
                      <div className="mt-0.5 font-mono text-[10px] text-[var(--ck-text-muted)]">
                        {q === '4k' ? '2160p' : q === '1080p' ? '1080p' : '720p'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recording Range */}
          <div>
            <span className="block text-xs font-medium text-[var(--ck-text-secondary)]">
              {L(lang, 'Export Range', 'এক্সপোর্ট রেঞ্জ')}
            </span>
            <div className="mt-2 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={status === 'recording'}
                onClick={() => setScope('scene')}
                data-testid="scope-scene"
                className={`rounded-lg border p-2.5 text-left transition-colors ${
                  scope === 'scene'
                    ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)] text-[var(--ck-text)]'
                    : 'border-[var(--ck-border)] bg-[var(--ck-surface-alt)] text-[var(--ck-text-secondary)] hover:border-[var(--ck-border-strong)]'
                }`}
              >
                <div className="text-xs font-semibold">
                  {L(lang, 'Current Chapter', 'বর্তমান দৃশ্য')}
                </div>
                <div className="mt-0.5 font-mono text-[11px] tabular-nums text-[var(--ck-text-muted)]">
                  Ch. {activeScene.chapterNumber} · {formatTimecode(activeScene.endTime - activeScene.startTime)}
                </div>
              </button>

              <button
                type="button"
                disabled={status === 'recording'}
                onClick={() => setScope('full')}
                data-testid="scope-full"
                className={`rounded-lg border p-2.5 text-left transition-colors ${
                  scope === 'full'
                    ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)] text-[var(--ck-text)]'
                    : 'border-[var(--ck-border)] bg-[var(--ck-surface-alt)] text-[var(--ck-text-secondary)] hover:border-[var(--ck-border-strong)]'
                }`}
              >
                <div className="text-xs font-semibold">
                  {L(lang, 'Full Video', 'সম্পূর্ণ ভিডিও')}
                </div>
                <div className="mt-0.5 font-mono text-[11px] tabular-nums text-[var(--ck-text-muted)]">
                  {L(
                    lang,
                    `${project.scenes.length} chapters · ${formatTimecode(project.duration)}`,
                    `${project.scenes.length} দৃশ্য · ${formatTimecode(project.duration)}`
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Subtitle Burn-In */}
          <div>
            <span className="block text-xs font-medium text-[var(--ck-text-secondary)]">
              {L(lang, 'Burned-in Subtitles', 'ভিডিওতে সাবটাইটেল')}
            </span>
            <div className="mt-2 flex items-center gap-1 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-inset)] p-1">
              {(hasTranslations
                ? ([
                    { id: 'bilingual', label: L(lang, 'Bilingual (EN + BN)', 'দ্বিভাষিক (বাংলা + ইংরেজি)') },
                    { id: 'bn', label: L(lang, 'Primary Only', 'শুধু মূল সাবটাইটেল') },
                    { id: 'off', label: L(lang, 'No Subtitles', 'সাবটাইটেল ছাড়া') },
                  ] as const)
                : ([
                    { id: 'bn', label: L(lang, 'Subtitles On', 'সাবটাইটেল চালু') },
                    { id: 'off', label: L(lang, 'No Subtitles', 'সাবটাইটেল ছাড়া') },
                  ] as const)
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={status === 'recording'}
                  onClick={() => setSubtitleMode(opt.id)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    subtitleMode === opt.id
                      ? 'bg-[var(--ck-surface)] text-[var(--ck-text)] shadow-xs'
                      : 'text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Encoding Progress */}
          {status === 'recording' && (
            <div className="rounded-lg border border-[var(--ck-border)] bg-[var(--ck-inset)] p-4">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-[var(--ck-accent)] truncate">
                  {stepLabel || L(lang, 'Encoding video frames…', 'ভিডিও ফ্রেম রেন্ডার হচ্ছে…')}
                </span>
                <span className="font-mono tabular-nums text-[var(--ck-text)]">
                  {Math.round(progress * 100)}%
                </span>
              </div>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[var(--ck-inset-deep)]">
                <div
                  className="h-full bg-[var(--ck-accent)] transition-[width] duration-150"
                  style={{ width: `${Math.max(2, Math.round(progress * 100))}%` }}
                />
              </div>
              <p className="mt-2 font-mono text-[11px] text-[var(--ck-text-muted)]">
                {frameDetail ||
                  L(
                    lang,
                    'Rendering crisp vector frames offline with voiceover audio…',
                    'ভয়েসওভার অডিওসহ হাই-রেজোলিউশন ফ্রেম রেন্ডার হচ্ছে…'
                  )}
              </p>
            </div>
          )}

          {status === 'error' && errorMessage && (
            <div className="rounded-lg border border-[var(--ck-danger-border)] bg-[var(--ck-danger-bg)] px-4 py-3 text-xs text-[var(--ck-danger-text)]">
              {errorMessage}
            </div>
          )}

          {/* Guaranteed Direct Save Panel */}
          {status === 'done' && downloads.length > 0 && (
            <div
              data-testid="export-ready-panel"
              className="space-y-3 rounded-lg border border-[var(--ck-success-border)] bg-[var(--ck-success-bg)] p-4 text-xs text-[var(--ck-success-text)]"
            >
              <div className="flex items-center gap-2 font-semibold text-[var(--ck-success)]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  {L(
                    lang,
                    'Video Ready — Click Save below if your download did not start automatically',
                    'ভিডিও প্রস্তুত — অটো ডাউনলোড না হলে নিচের Save বাটনে ক্লিক করুন'
                  )}
                </span>
              </div>

              <div className="space-y-2">
                {downloads.map((d) => (
                  <div
                    key={d.ratio}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--ck-success-border)] bg-[var(--ck-surface)] px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-[11px] text-[var(--ck-text)]">
                        {d.filename}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-[var(--ck-text-muted)]">
                        {d.width}×{d.height} · {d.codecLabel} · {formatFileSize(d.sizeBytes)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewRatio((prev) => (prev === d.ratio ? null : d.ratio))
                        }
                        className="inline-flex items-center gap-1 rounded-md border border-[var(--ck-border-strong)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--ck-text)] transition-colors hover:bg-[var(--ck-surface-hover)]"
                      >
                        <Film className="h-3.5 w-3.5" />
                        <span>
                          {previewRatio === d.ratio
                            ? L(lang, 'Hide', 'লুকান')
                            : L(lang, 'Preview', 'প্রিভিউ')}
                        </span>
                      </button>
                      <a
                        href={d.url}
                        download={d.filename}
                        data-testid={`save-download-${d.ratio}`}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ck-accent)] px-3 py-1.5 text-[11px] font-semibold text-[var(--ck-accent-fg)] transition-colors hover:bg-[var(--ck-accent-bright)]"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>{L(lang, `Save .${d.extension.toUpperCase()}`, `ডাউনলোড .${d.extension.toUpperCase()}`)}</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {activePreviewDownload && (
                <div className="overflow-hidden rounded-lg border border-[var(--ck-border)] bg-black">
                  <video
                    key={activePreviewDownload.url}
                    src={activePreviewDownload.url}
                    controls
                    playsInline
                    className="mx-auto max-h-56 w-full object-contain"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-[var(--ck-border-subtle)] pt-4">
          {status === 'recording' ? (
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-[var(--ck-border-strong)] px-4 py-2 text-xs font-medium text-[var(--ck-text)] transition-colors hover:bg-[var(--ck-surface-hover)]"
            >
              {L(lang, 'Cancel Export', 'এক্সপোর্ট বাতিল')}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-xs font-medium text-[var(--ck-text-muted)] transition-colors hover:bg-[var(--ck-surface-hover)] hover:text-[var(--ck-text)]"
              >
                {L(lang, 'Close', 'বন্ধ করুন')}
              </button>
              <button
                type="button"
                onClick={handleStartExport}
                data-testid="start-export-btn"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--ck-accent)] px-4 py-2 text-xs font-semibold text-[var(--ck-accent-fg)] transition-colors hover:bg-[var(--ck-accent-bright)] whitespace-nowrap"
              >
                <Download className="h-3.5 w-3.5" />
                <span>
                  {formatChoice === 'both'
                    ? L(
                        lang,
                        `Export Both (${containerFormat.toUpperCase()})`,
                        `উভয় ফরম্যাট এক্সপোর্ট (${containerFormat.toUpperCase()})`
                      )
                    : L(
                        lang,
                        `Export ${formatChoice} ${containerFormat.toUpperCase()}`,
                        `${formatChoice} ${containerFormat.toUpperCase()} এক্সপোর্ট`
                      )}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
