import React from 'react';
import {
  Sparkles,
  Ghost,
  Landmark,
  Flame,
  Music,
  Check,
  FileText,
} from 'lucide-react';
import {
  STORY_TEMPLATES,
  StoryTemplateId,
  StoryTemplatePreset,
} from '../lib/storyTemplates';
import { AppLang, L } from '../lib/i18n';

interface StoryTemplatePickerProps {
  lang: AppLang;
  selectedTemplateId: StoryTemplateId | null;
  onSelectTemplate: (template: StoryTemplatePreset) => void;
  /** Optional handler to populate starter title & script from the template */
  onLoadTemplateScript?: (template: StoryTemplatePreset) => void;
  compact?: boolean;
}

const TEMPLATE_ICONS: Record<StoryTemplateId, typeof Sparkles> = {
  rupkotha: Sparkles,
  'horror-mystery': Ghost,
  history: Landmark,
  motivational: Flame,
  'kids-rhyme': Music,
};

export const StoryTemplatePicker: React.FC<StoryTemplatePickerProps> = ({
  lang,
  selectedTemplateId,
  onSelectTemplate,
  onLoadTemplateScript,
  compact = false,
}) => {
  return (
    <div data-testid="story-template-library" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[var(--ck-text)]">
            {L(lang, 'Ready-Made Story Template Library', 'রেডিমেড বাংলা স্টোরি টেমপ্লেট লাইব্রেরি')}
          </h3>
          <p className="mt-0.5 text-xs text-[var(--ck-text-muted)]">
            {L(
              lang,
              'Pick a genre preset to auto-configure color palette, camera motion, subtitle font, and mood.',
              'যেকোনো ধরন বেছে নিন — কালার প্যালেট, ক্যামেরা মোশন, ফন্ট ও মুড স্বয়ংক্রিয়ভাবে সেট হয়ে যাবে।'
            )}
          </p>
        </div>
        {selectedTemplateId && (
          <span className="font-mono text-[11px] font-medium text-[var(--ck-accent)]">
            {L(lang, 'Template Active', 'টেমপ্লেট সক্রিয়')}
          </span>
        )}
      </div>

      <div
        className={`grid grid-cols-1 gap-2.5 ${
          compact ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-5'
        }`}
      >
        {STORY_TEMPLATES.map((tpl) => {
          const Icon = TEMPLATE_ICONS[tpl.id];
          const active = selectedTemplateId === tpl.id;
          return (
            <div
              key={tpl.id}
              data-testid={`story-template-card-${tpl.id}`}
              className={`flex flex-col justify-between rounded-xl border p-3 transition-colors ${
                active
                  ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)]'
                  : 'border-[var(--ck-border)] bg-[var(--ck-surface-alt)] hover:border-[var(--ck-border-strong)]'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectTemplate(tpl)}
                aria-pressed={active}
                data-testid={`select-template-${tpl.id}`}
                className="w-full text-left focus-visible:outline-none"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-[var(--ck-accent)] shrink-0" />
                    <span className="text-xs font-semibold text-[var(--ck-text)]">
                      {lang === 'bn' ? tpl.nameBn : tpl.nameEn}
                    </span>
                  </div>
                  {active && <Check className="h-3.5 w-3.5 text-[var(--ck-accent)] shrink-0" />}
                </div>

                {/* Color Palette Swatch Strip */}
                <div className="mt-2.5 flex items-center gap-1">
                  {tpl.swatches.map((hex, i) => (
                    <span
                      key={i}
                      className="h-2 flex-1 rounded-full border border-black/15 dark:border-white/10"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>

                <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-[var(--ck-text-muted)]">
                  {lang === 'bn' ? tpl.taglineBn : tpl.taglineEn}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-medium text-[var(--ck-text-secondary)]">
                  <span>{lang === 'bn' ? tpl.cameraMotionLabelBn : tpl.cameraMotionLabelEn}</span>
                  <span aria-hidden="true">·</span>
                  <span>{lang === 'bn' ? tpl.subtitleFontLabelBn : tpl.subtitleFontLabelEn}</span>
                </div>
              </button>

              {onLoadTemplateScript && (
                <button
                  type="button"
                  data-testid={`load-template-script-${tpl.id}`}
                  onClick={() => onLoadTemplateScript(tpl)}
                  className="mt-2.5 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] px-2 py-1.5 text-[11px] font-medium text-[var(--ck-text-secondary)] transition-colors hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)]"
                >
                  <FileText className="h-3 w-3 text-[var(--ck-accent)]" />
                  <span>{L(lang, 'Use Sample Story', 'স্যাম্পল গল্প নিন')}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
