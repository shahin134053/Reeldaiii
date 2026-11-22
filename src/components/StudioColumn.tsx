import {
  BookOpen,
  Clapperboard,
  Download,
  FileText,
  Film,
  LayoutGrid,
  Palette,
  Plus,
  ShieldCheck,
  UserCog,
} from 'lucide-react';
import { StudioSection } from '../lib/appNavigation';
import { formatTimecode } from '../lib/storyboard';
import { AppLang, L } from '../lib/i18n';

interface StudioColumnProps {
  lang: AppLang;
  activeSection: StudioSection;
  hasActiveProject: boolean;
  isProcessing: boolean;
  projectTitle: string;
  sceneCount: number;
  cueCount: number;
  duration: number;
  savedDraftCount: number;
  onSelectSection: (section: StudioSection) => void;
  onOpenRedesign: () => void;
  onOpenCharacterDesigner: () => void;
  onOpenExport: () => void;
  onLoadDemo: () => void;
  onOpenManual: () => void;
}

interface StudioNavItem {
  id: StudioSection;
  label: string;
  icon: typeof Plus;
  count?: number;
}

export function StudioColumn({
  lang,
  activeSection,
  hasActiveProject,
  isProcessing,
  projectTitle,
  sceneCount,
  cueCount,
  duration,
  savedDraftCount,
  onSelectSection,
  onOpenRedesign,
  onOpenCharacterDesigner,
  onOpenExport,
  onLoadDemo,
  onOpenManual,
}: StudioColumnProps) {
  const navItems: StudioNavItem[] = [
    {
      id: 'create',
      label: L(lang, 'New Project', 'নতুন প্রোজেক্ট'),
      icon: Plus,
    },
    {
      id: 'preview',
      label: L(lang, 'Video Preview', 'ভিডিও প্রিভিউ'),
      icon: Clapperboard,
    },
    {
      id: 'storyboard',
      label: L(lang, 'Storyboard', 'স্টোরিবোর্ড'),
      icon: LayoutGrid,
      count: hasActiveProject ? sceneCount : undefined,
    },
    {
      id: 'script',
      label: L(lang, 'Script & SRT', 'স্ক্রিপ্ট ও SRT'),
      icon: FileText,
      count: hasActiveProject ? cueCount : undefined,
    },
    {
      id: 'quality',
      label: L(lang, 'Story & Quality', 'গল্প ও কোয়ালিটি'),
      icon: ShieldCheck,
    },
  ];

  return (
    <aside
      aria-label={L(lang, 'Dedicated studio menu', 'ডেডিকেটেড স্টুডিও মেনু')}
      data-testid="dedicated-studio-column"
      className="w-full lg:w-[212px] lg:shrink-0"
    >
      {/* Mobile / Tablet Compact Horizontal Bar */}
      <div className="mb-4 flex items-center gap-1.5 overflow-x-auto rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface)] p-1.5 lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)] ${
                active
                  ? 'bg-[var(--ck-accent-soft)] text-[var(--ck-accent-soft-text)]'
                  : 'text-[var(--ck-text-muted)] hover:bg-[var(--ck-surface-alt)] hover:text-[var(--ck-text)]'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{item.label}</span>
              {item.count !== undefined && (
                <span className="font-mono text-[11px] tabular-nums opacity-75">
                  ({item.count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Desktop Calm Left Studio Column */}
      <div className="hidden lg:sticky lg:top-[76px] lg:flex lg:flex-col lg:rounded-xl lg:border lg:border-[var(--ck-border)] lg:bg-[var(--ck-surface)]">
        <div className="border-b border-[var(--ck-border-subtle)] px-4 py-3">
          <div className="text-xs font-semibold text-[var(--ck-text)]">
            {L(lang, 'Studio Menu', 'স্টুডিও মেনু')}
          </div>
        </div>

        {/* Clean Single-Row Navigation Sections */}
        <nav aria-label={L(lang, 'Studio modules', 'স্টুডিও মডিউলসমূহ')} className="space-y-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                data-testid={`studio-col-${item.id}`}
                onClick={() => onSelectSection(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex h-10 w-full items-center justify-between gap-2 rounded-lg px-3 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)] ${
                  active
                    ? 'bg-[var(--ck-accent-soft)] font-semibold text-[var(--ck-accent-soft-text)]'
                    : 'text-[var(--ck-text-secondary)] hover:bg-[var(--ck-surface-alt)] hover:text-[var(--ck-text)]'
                }`}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      active ? 'text-[var(--ck-accent)]' : 'text-[var(--ck-text-faint)]'
                    }`}
                  />
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                </span>
                {item.count !== undefined && (
                  <span className="font-mono text-[11px] tabular-nums text-[var(--ck-text-muted)] shrink-0">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div className="space-y-1 border-t border-[var(--ck-border-subtle)] p-2">
          <button
            type="button"
            data-testid="open-redesign-btn"
            disabled={!hasActiveProject || isProcessing}
            onClick={onOpenRedesign}
            className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-xs font-medium text-[var(--ck-text-secondary)] transition-colors hover:bg-[var(--ck-surface-alt)] hover:text-[var(--ck-text)] disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
          >
            <Palette className="h-3.5 w-3.5 text-[var(--ck-accent)] shrink-0" />
            <span>{L(lang, 'Redesign Studio', 'রিডিজাইন স্টুডিও')}</span>
          </button>

          <button
            type="button"
            data-testid="studio-col-character-designer"
            disabled={isProcessing}
            onClick={onOpenCharacterDesigner}
            className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-xs font-medium text-[var(--ck-text-secondary)] transition-colors hover:bg-[var(--ck-surface-alt)] hover:text-[var(--ck-text)] disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
          >
            <UserCog className="h-3.5 w-3.5 text-[var(--ck-accent)] shrink-0" />
            <span>{L(lang, 'Character Designer', 'ক্যারেক্টার ডিজাইনার')}</span>
          </button>

          <button
            type="button"
            disabled={!hasActiveProject || isProcessing}
            onClick={onOpenExport}
            className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-xs font-medium text-[var(--ck-text-secondary)] transition-colors hover:bg-[var(--ck-surface-alt)] hover:text-[var(--ck-text)] disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5 text-[var(--ck-accent)] shrink-0" />
            <span>{L(lang, 'Export Video', 'ভিডিও এক্সপোর্ট')}</span>
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={onLoadDemo}
            className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-xs font-medium text-[var(--ck-text-muted)] transition-colors hover:bg-[var(--ck-surface-alt)] hover:text-[var(--ck-text)] disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
          >
            <Film className="h-3.5 w-3.5 text-[var(--ck-text-faint)] shrink-0" />
            <span>{L(lang, 'Demo Film', 'ডেমো ফিল্ম')}</span>
          </button>

          <button
            type="button"
            onClick={onOpenManual}
            className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-xs font-medium text-[var(--ck-text-muted)] transition-colors hover:bg-[var(--ck-surface-alt)] hover:text-[var(--ck-text)] whitespace-nowrap"
          >
            <BookOpen className="h-3.5 w-3.5 text-[var(--ck-text-faint)] shrink-0" />
            <span>{L(lang, 'User Manual', 'ইউজার ম্যানুয়াল')}</span>
          </button>
        </div>

        {/* Quiet Active Project Summary */}
        <div className="border-t border-[var(--ck-border-subtle)] px-3.5 py-3 text-[11px] text-[var(--ck-text-faint)]">
          {hasActiveProject ? (
            <div className="space-y-0.5">
              <div className="truncate font-medium text-[var(--ck-text-secondary)]" title={projectTitle}>
                {projectTitle}
              </div>
              <div className="font-mono tabular-nums text-[var(--ck-text-muted)]">
                {L(
                  lang,
                  `${sceneCount} scenes · ${formatTimecode(duration)}`,
                  `${sceneCount} দৃশ্য · ${formatTimecode(duration)}`
                )}
              </div>
            </div>
          ) : (
            <div>
              {savedDraftCount > 0
                ? L(
                    lang,
                    `${savedDraftCount} saved drafts ready`,
                    `${savedDraftCount}টি সংরক্ষিত ড্রাফট আছে`
                  )
                : L(lang, 'Create a new project to start', 'শুরু করতে নতুন প্রোজেক্ট তৈরি করুন')}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
