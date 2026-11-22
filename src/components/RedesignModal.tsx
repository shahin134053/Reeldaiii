import React, { useEffect } from 'react';
import {
  Palette,
  Layers,
  RotateCcw,
  Sparkles,
  X,
  Check,
  History,
  Shuffle,
} from 'lucide-react';
import {
  AnimationProject,
  VISUAL_STYLE_LABELS,
  VisualStyle,
} from '../lib/storyCompiler';
import {
  COLOR_PALETTES,
  ColorPaletteId,
  DEFAULT_DESIGN_CONFIG,
  DesignConfig,
  DesignSnapshot,
  LAYOUT_MODE_META,
  LayoutMode,
} from '../lib/redesignAndStudio';
import { StoryTemplateId } from '../lib/storyTemplates';
import { StoryTemplatePicker } from './StoryTemplatePicker';
import { AppLang, L } from '../lib/i18n';

interface RedesignModalProps {
  lang: AppLang;
  isOpen: boolean;
  onClose: () => void;
  project: AnimationProject;
  history: DesignSnapshot[];
  onFullRemix: (options?: { clearCustomSvg?: boolean }) => void;
  onUpdateDesign: (patch: Partial<DesignConfig>) => void;
  onUpdateVisualStyle: (style: VisualStyle) => void;
  onApplyStoryTemplate?: (templateId: StoryTemplateId) => void;
  onUndoLast: () => void;
  onRestoreSnapshot: (snapshotId: string) => void;
}

const LAYOUT_IDS: LayoutMode[] = [
  'full-bleed',
  'editorial-frame',
  'split-focus',
  'doc-minimal',
];

const PALETTE_IDS: ColorPaletteId[] = [
  'heritage-gold',
  'midnight-neon',
  'pastel-watercolor',
  'emerald-earth',
  'crimson-drama',
  'monochrome-noir',
];

const STYLE_IDS: VisualStyle[] = [
  'storybook-warm',
  'cinematic-anime',
  'editorial-doc',
  'dramatic-noir',
];

export const RedesignModal: React.FC<RedesignModalProps> = ({
  lang,
  isOpen,
  onClose,
  project,
  history,
  onFullRemix,
  onUpdateDesign,
  onUpdateVisualStyle,
  onApplyStoryTemplate,
  onUndoLast,
  onRestoreSnapshot,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const design = project.designConfig ?? DEFAULT_DESIGN_CONFIG;
  const currentStyle = project.visualStyle ?? 'storybook-warm';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="redesign-studio-title"
      data-testid="redesign-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ck-overlay)] p-4 backdrop-blur-sm"
    >
      <div className="cinema-scroll max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--ck-border)] bg-[var(--ck-surface)] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--ck-border-subtle)] pb-4">
          <div>
            <h2
              id="redesign-studio-title"
              className="text-xl font-semibold text-[var(--ck-text)]"
            >
              {L(
                lang,
                'Redesign Studio — Layout, Palette & Animation Remix',
                'রিডিজাইন স্টুডিও — লেআউট, কালার ও অ্যানিমেশন রিমিক্স'
              )}
            </h2>
            <p className="mt-1 text-xs text-[var(--ck-text-muted)]">
              {L(
                lang,
                'Reinvent your video’s framing architecture, color palette, and scene choreography while keeping your narration and timing intact.',
                'গল্প ও অডিও টাইমিং অক্ষুণ্ণ রেখে পুরো ভিডিওর লেআউট, কালার কম্বিনেশন এবং সিন কোরিওগ্রাফি নতুন করে সাজান।'
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={L(lang, 'Close Redesign Studio', 'রিডিজাইন স্টুডিও বন্ধ করুন')}
            className="rounded-lg p-2 text-[var(--ck-text-muted)] transition-colors hover:bg-[var(--ck-surface-hover)] hover:text-[var(--ck-text)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* One-Click Full Remix + Undo Banner */}
        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-[var(--ck-border)] bg-[var(--ck-accent-soft)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ck-text)]">
              <Sparkles className="h-4 w-4 text-[var(--ck-accent)]" />
              <span>{L(lang, 'One-Click Total Redesign', 'এক-ক্লিকে সম্পূর্ণ রিডিজাইন')}</span>
            </div>
            <p className="mt-0.5 text-xs text-[var(--ck-text-secondary)]">
              {L(
                lang,
                `Generate a fresh framing layout, color palette, camera angles, and transitions instantly (Seed #${design.remixSeed}).`,
                `এক ক্লিকেই সম্পূর্ণ নতুন লেআউট, নতুন কালার প্যালেট, ক্যামেরা শট ও ট্রানজিশন তৈরি হবে (Seed #${design.remixSeed})।`
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {history.length > 0 && (
              <button
                type="button"
                onClick={onUndoLast}
                data-testid="redesign-undo-btn"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ck-border-strong)] bg-[var(--ck-surface)] px-3 py-2 text-xs font-medium text-[var(--ck-text)] transition-colors hover:border-[var(--ck-accent)] whitespace-nowrap shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{L(lang, 'Undo Last Design', 'আগের ডিজাইনে ফিরুন')}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onFullRemix({ clearCustomSvg: true })}
              data-testid="full-remix-btn"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ck-accent)] px-4 py-2 text-xs font-semibold text-[var(--ck-accent-fg)] transition-colors hover:bg-[var(--ck-accent-bright)] whitespace-nowrap shrink-0"
            >
              <Shuffle className="h-3.5 w-3.5" />
              <span>{L(lang, 'Remix Everything', 'সবকিছু রিমিক্স করুন')}</span>
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {/* 0. Ready-Made Story Genre Templates */}
          {onApplyStoryTemplate && (
            <div className="border-b border-[var(--ck-border-subtle)] pb-5">
              <StoryTemplatePicker
                lang={lang}
                selectedTemplateId={null}
                compact
                onSelectTemplate={(tpl) => onApplyStoryTemplate(tpl.id)}
              />
            </div>
          )}

          {/* 1. Layout & Framing Mode */}
          <div>
            <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold text-[var(--ck-text)]">
              <Layers className="h-4 w-4 text-[var(--ck-accent)]" />
              <span>
                {L(
                  lang,
                  '1. Video Layout & Framing Architecture',
                  '১. ভিডিও লেআউট ও ফ্রেমিং স্টাইল'
                )}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {LAYOUT_IDS.map((id) => {
                const meta = LAYOUT_MODE_META[id];
                const active = design.layoutMode === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onUpdateDesign({ layoutMode: id })}
                    data-testid={`layout-option-${id}`}
                    aria-pressed={active}
                    className={`flex items-start justify-between gap-2 rounded-xl border p-3 text-left transition-colors ${
                      active
                        ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)]'
                        : 'border-[var(--ck-border)] bg-[var(--ck-surface-alt)] hover:border-[var(--ck-border-strong)]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-[var(--ck-text)]">
                        {lang === 'bn' ? `${meta.labelBn} · ${meta.label}` : meta.label}
                      </div>
                      <div className="mt-1 text-[11px] leading-snug text-[var(--ck-text-muted)]">
                        {meta.desc}
                      </div>
                    </div>
                    {active && <Check className="h-4 w-4 shrink-0 text-[var(--ck-accent)]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Dynamic Color Palette & Mood Switcher */}
          <div>
            <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold text-[var(--ck-text)]">
              <Palette className="h-4 w-4 text-[var(--ck-accent)]" />
              <span>{L(lang, '2. Color Palette & Lighting Mood', '২. কালার প্যালেট ও আলোর মুড')}</span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {PALETTE_IDS.map((id) => {
                const pal = COLOR_PALETTES[id];
                const active = design.colorPalette === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onUpdateDesign({ colorPalette: id })}
                    data-testid={`palette-option-${id}`}
                    aria-pressed={active}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      active
                        ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)]'
                        : 'border-[var(--ck-border)] bg-[var(--ck-surface-alt)] hover:border-[var(--ck-border-strong)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {pal.swatches.map((hex, i) => (
                          <span
                            key={i}
                            className="h-3.5 w-3.5 rounded-full border border-[var(--ck-border-strong)]"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                      {active && <Check className="h-3.5 w-3.5 text-[var(--ck-accent)]" />}
                    </div>
                    <div className="mt-2 text-xs font-semibold text-[var(--ck-text)]">
                      {lang === 'bn' ? pal.labelBn : pal.label}
                    </div>
                    {lang === 'bn' && (
                      <div className="mt-0.5 text-[11px] text-[var(--ck-text-muted)]">{pal.label}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Art Direction Style + Multi-Layer Parallax Depth */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold text-[var(--ck-text)]">
                {L(lang, '3. Art Direction Style', '৩. আর্ট ডিরেকশন স্টাইল')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STYLE_IDS.map((styleId) => {
                  const active = currentStyle === styleId;
                  return (
                    <button
                      key={styleId}
                      type="button"
                      onClick={() => onUpdateVisualStyle(styleId)}
                      aria-pressed={active}
                      className={`rounded-lg border px-2.5 py-2 text-left text-xs transition-colors ${
                        active
                          ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)] text-[var(--ck-text)] font-medium'
                          : 'border-[var(--ck-border)] bg-[var(--ck-surface-alt)] text-[var(--ck-text-secondary)] hover:border-[var(--ck-border-strong)]'
                      }`}
                    >
                      {VISUAL_STYLE_LABELS[styleId].label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[var(--ck-text)]">
                <label htmlFor="parallax-depth-range">
                  {L(lang, '4. Multi-Layer Parallax Depth', '৪. মাল্টি-লেয়ার প্যারালাক্স গভীরতা')}
                </label>
                <span className="font-mono tabular-nums text-[var(--ck-accent)]">
                  {(design.parallaxDepth ?? 1).toFixed(1)}x
                </span>
              </div>
              <div className="rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface-alt)] p-3.5">
                <input
                  id="parallax-depth-range"
                  type="range"
                  min={0}
                  max={1.5}
                  step={0.1}
                  value={design.parallaxDepth ?? 1.0}
                  onChange={(e) =>
                    onUpdateDesign({ parallaxDepth: Number(e.target.value) })
                  }
                  className="h-1.5 w-full cursor-pointer accent-[var(--ck-accent)]"
                />
                <p className="mt-2 text-[11px] text-[var(--ck-text-muted)]">
                  {L(
                    lang,
                    'Sky, midground, and foreground move at independent speeds for 2.5D cinematic depth.',
                    'আকাশ, ব্যাকগ্রাউন্ড ও ফোরগ্রাউন্ড আলাদা স্পিডে নড়ে ২.৫ডি গভীরতা তৈরি করে।'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* 4. Design Version History */}
          {history.length > 0 && (
            <div className="border-t border-[var(--ck-border-subtle)] pt-4">
              <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold text-[var(--ck-text)]">
                <History className="h-4 w-4 text-[var(--ck-accent)]" />
                <span>
                  {L(
                    lang,
                    `Design Version History (${history.length})`,
                    `ডিজাইন ভার্সন হিস্ট্রি (${history.length})`
                  )}
                </span>
              </div>
              <div className="space-y-2" data-testid="design-history-list">
                {history.map((snap) => (
                  <div
                    key={snap.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface-alt)] px-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium text-[var(--ck-text)]">
                        {snap.label}
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] tabular-nums text-[var(--ck-text-muted)]">
                        {LAYOUT_MODE_META[snap.designConfig.layoutMode].label} ·{' '}
                        {COLOR_PALETTES[snap.designConfig.colorPalette].label}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRestoreSnapshot(snap.id)}
                      className="rounded-md border border-[var(--ck-border-strong)] bg-[var(--ck-surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--ck-accent)] transition-colors hover:border-[var(--ck-accent)] whitespace-nowrap shrink-0"
                    >
                      {L(lang, 'Restore', 'ফিরিয়ে আনুন')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end border-t border-[var(--ck-border-subtle)] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[var(--ck-surface-hover)] px-4 py-2 text-xs font-semibold text-[var(--ck-text)] transition-colors hover:bg-[var(--ck-border)]"
          >
            {L(lang, 'Done & Preview', 'সম্পন্ন ও প্রিভিউ দেখুন')}
          </button>
        </div>
      </div>
    </div>
  );
};
