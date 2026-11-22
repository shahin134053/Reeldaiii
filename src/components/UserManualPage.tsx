import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronDown,
  Clapperboard,
  Keyboard,
  Play,
  Search,
  X,
} from 'lucide-react';
import {
  KEYBOARD_SHORTCUTS,
  ManualChapter,
  filterManualFaqs,
  filterManualSections,
  getManualChapters,
  getManualFaqs,
} from '../lib/manualContent';
import { AppLang, L } from '../lib/i18n';

interface UserManualPageProps {
  lang: AppLang;
  onEnterStudio: () => void;
  onLaunchDemo: () => void;
  onGoHome: () => void;
}

export function UserManualPage({
  lang,
  onEnterStudio,
  onLaunchDemo,
  onGoHome,
}: UserManualPageProps) {
  const chapters = useMemo(() => getManualChapters(lang), [lang]);
  const faqs = useMemo(() => getManualFaqs(lang), [lang]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<ManualChapter['category'] | 'all'>('all');
  const [openFaqId, setOpenFaqId] = useState<string | null>(faqs[0]?.id ?? null);

  const categoryTabs: Array<{ id: ManualChapter['category'] | 'all'; label: string }> = [
    { id: 'all', label: L(lang, 'All Chapters', 'সব অধ্যায়') },
    { id: 'overview', label: L(lang, 'Overview', 'পরিচিতি') },
    { id: 'workflow', label: L(lang, 'Files & Steps', 'ফাইল ও ধাপ') },
    { id: 'worlds', label: L(lang, '32+ Worlds', '৩২+ পরিবেশ') },
    { id: 'editing', label: L(lang, 'Editing & Redesign', 'এডিটিং ও রিডিজাইন') },
    { id: 'export', label: L(lang, 'Export', 'এক্সপোর্ট') },
    { id: 'shortcuts', label: L(lang, 'Shortcuts', 'শর্টকাট') },
  ];

  const visibleChapters = useMemo(
    () => filterManualSections(chapters, searchQuery, activeCategory),
    [chapters, searchQuery, activeCategory]
  );

  const visibleFaqs = useMemo(
    () => filterManualFaqs(faqs, searchQuery),
    [faqs, searchQuery]
  );

  return (
    <div className="space-y-12 pb-6" data-testid="user-manual-page">
      {/* Header & Search Controls */}
      <section className="space-y-6 border-b border-[var(--ck-border-subtle)] pb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onGoHome}
            className="inline-flex h-9 items-center gap-1.5 text-xs font-medium text-[var(--ck-text-muted)] transition-colors hover:text-[var(--ck-text)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{L(lang, 'Back to Home', 'হোম পেজে ফিরুন')}</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-[var(--ck-text-muted)]">
            <BookOpen className="h-3.5 w-3.5 text-[var(--ck-accent)]" />
            <span>
              {L(
                lang,
                'Complete User Guide · 7 Chapters',
                'সম্পূর্ণ বাংলা ব্যবহার নির্দেশিকা · ৭টি অধ্যায়'
              )}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
          <div className="space-y-3 lg:col-span-7">
            <h1
              className="font-display font-semibold leading-[1.2] tracking-tight text-[var(--ck-text)] text-balance"
              style={{ fontSize: 'clamp(1.95rem, 3.2vw, 2.85rem)' }}
            >
              {L(lang, 'Reeldaiii User Manual', 'Reeldaiii ইউজার ম্যানুয়াল')}
            </h1>
            <p className="max-w-[64ch] text-sm leading-relaxed text-[var(--ck-text-secondary)] sm:text-[15px]">
              {L(
                lang,
                'Everything you need to know about what you can create, how to prepare voiceover & SRT files, customize 32+ 2D animation worlds, and export crisp 4K videos.',
                'এই ওয়েবসাইট দিয়ে আপনি কী কী তৈরি করতে পারবেন, কীভাবে ভয়েসওভার ও SRT আপলোড করবেন, কীভাবে ৩২+ পরিবেশের অ্যানিমেশন কাস্টমাইজ ও ৪কে এক্সপোর্ট করবেন—তার সহজ, ধাপে ধাপে বিস্তারিত গাইড।'
              )}
            </p>
          </div>

          {/* Search Input */}
          <div className="lg:col-span-5">
            <label htmlFor="manual-search-input" className="sr-only">
              {L(lang, 'Search the User Manual', 'ইউজার ম্যানুয়ালে খুঁজুন')}
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ck-text-faint)]" />
              <input
                id="manual-search-input"
                data-testid="manual-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={L(
                  lang,
                  'Search: export, SRT, lip-sync, redesign, 4K...',
                  'খুঁজুন: এক্সপোর্ট, SRT, লিপ-সিঙ্ক, রিডিজাইন, ৪কে...'
                )}
                className="h-11 w-full rounded-lg border border-[var(--ck-border-strong)] bg-[var(--ck-surface)] pl-10 pr-10 text-sm text-[var(--ck-text)] placeholder:text-[var(--ck-text-faint)] focus:border-[var(--ck-accent)] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label={L(lang, 'Clear search', 'অনুসন্ধান মুছুন')}
                  className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-[var(--ck-text-muted)] hover:bg-[var(--ck-surface-hover)] hover:text-[var(--ck-text)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Filter Bar */}
        <div
          role="tablist"
          aria-label={L(lang, 'Filter manual categories', 'ম্যানুয়াল বিভাগ নির্বাচন')}
          className="flex items-center gap-2 overflow-x-auto pt-1"
        >
          {categoryTabs.map((tab) => {
            const active = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveCategory(tab.id)}
                className={`inline-flex h-9 items-center rounded-lg border px-3 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'border-[var(--ck-accent)] bg-[var(--ck-accent-soft)] text-[var(--ck-accent-soft-text)]'
                    : 'border-[var(--ck-border)] bg-[var(--ck-surface)] text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Main 2-Column Editorial Layout: Sticky TOC + Readable Chapters */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
        {/* Desktop Sticky Table of Contents */}
        <aside
          aria-label={L(lang, 'Table of contents', 'সূচিপত্র')}
          className="hidden lg:sticky lg:top-[82px] lg:col-span-3 lg:block"
        >
          <div className="space-y-4">
            <div className="text-xs font-semibold text-[var(--ck-accent)]">
              {L(lang, 'Table of Contents', 'অধ্যায় সূচিপত্র')}
            </div>
            <nav className="space-y-1 border-t border-[var(--ck-border-subtle)] pt-3">
              {chapters.map((chapter) => (
                <a
                  key={chapter.id}
                  href={`#manual-${chapter.id}`}
                  onClick={() => {
                    if (activeCategory !== 'all' && activeCategory !== chapter.category) {
                      setActiveCategory('all');
                    }
                  }}
                  className="flex items-baseline gap-2.5 rounded-lg px-2.5 py-2 text-xs text-[var(--ck-text-secondary)] transition-colors hover:bg-[var(--ck-surface)] hover:text-[var(--ck-text)]"
                >
                  <span className="font-mono text-[11px] tabular-nums text-[var(--ck-accent)]">
                    {chapter.number}
                  </span>
                  <span className="leading-snug">{chapter.title}</span>
                </a>
              ))}
              <a
                href="#manual-faq"
                className="flex items-baseline gap-2.5 rounded-lg px-2.5 py-2 text-xs text-[var(--ck-text-secondary)] transition-colors hover:bg-[var(--ck-surface)] hover:text-[var(--ck-text)]"
              >
                <span className="font-mono text-[11px] tabular-nums text-[var(--ck-accent)]">
                  {L(lang, '08', '০৮')}
                </span>
                <span className="leading-snug">
                  {L(lang, 'Frequently Asked Questions (FAQ)', 'সাধারণ প্রশ্ন ও উত্তর (FAQ)')}
                </span>
              </a>
            </nav>

            <div className="border-t border-[var(--ck-border-subtle)] pt-4 space-y-2.5">
              <button
                type="button"
                onClick={onEnterStudio}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--ck-accent)] px-4 text-xs font-semibold text-[var(--ck-accent-fg)] transition-colors hover:bg-[var(--ck-accent-bright)] whitespace-nowrap"
              >
                <Clapperboard className="h-3.5 w-3.5" />
                <span>{L(lang, 'Open Studio', 'স্টুডিওতে শুরু করুন')}</span>
              </button>
              <button
                type="button"
                onClick={onLaunchDemo}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[var(--ck-border-strong)] bg-[var(--ck-surface)] px-4 text-xs font-medium text-[var(--ck-text-secondary)] transition-colors hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)] whitespace-nowrap"
              >
                <Play className="h-3.5 w-3.5 text-[var(--ck-accent)]" />
                <span>{L(lang, 'Watch Demo Film', 'ডেমো ফিল্ম দেখুন')}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Right Content Column */}
        <div className="space-y-12 lg:col-span-9">
          {visibleChapters.length === 0 ? (
            <div className="rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface)] px-6 py-10 text-center">
              <p className="text-sm font-medium text-[var(--ck-text)]">
                {L(
                  lang,
                  `No manual chapters matched “${searchQuery}”.`,
                  `“${searchQuery}” এর সাথে মিলে এমন কোনো অধ্যায় পাওয়া যায়নি।`
                )}
              </p>
              <p className="mt-1 text-xs text-[var(--ck-text-muted)]">
                {L(
                  lang,
                  'Try a different keyword or reset the filters to view all chapters.',
                  'ভিন্ন শব্দ লিখে চেষ্টা করুন অথবা সব অধ্যায় দেখতে ফিল্টার রিসেট করুন।'
                )}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="mt-4 inline-flex h-9 items-center rounded-lg border border-[var(--ck-border-strong)] bg-[var(--ck-surface-alt)] px-4 text-xs font-medium text-[var(--ck-text)] hover:border-[var(--ck-accent)]"
              >
                {L(lang, 'Show All Chapters', 'সব অধ্যায় দেখান')}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[var(--ck-border-subtle)]" data-testid="manual-chapter-list">
              {visibleChapters.map((chapter) => (
                <article
                  key={chapter.id}
                  id={`manual-${chapter.id}`}
                  className="scroll-mt-24 py-8 first:pt-0 space-y-5"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[var(--ck-text-muted)]">
                      <span className="font-mono font-semibold tabular-nums text-[var(--ck-accent)]">
                        {L(lang, `Chapter ${chapter.number}`, `অধ্যায় ${chapter.number}`)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{chapter.categoryLabel}</span>
                    </div>
                    <h2 className="font-display text-xl font-semibold text-[var(--ck-text)] sm:text-2xl">
                      {chapter.title}
                    </h2>
                    <p className="max-w-[72ch] text-sm leading-relaxed text-[var(--ck-text-secondary)] sm:text-[15px]">
                      {chapter.summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {chapter.bullets.map((item) => (
                      <div
                        key={item.title}
                        className="rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface)] p-4 space-y-1.5"
                      >
                        <h3 className="text-sm font-semibold text-[var(--ck-text)]">
                          {item.title}
                        </h3>
                        <p className="text-xs leading-relaxed text-[var(--ck-text-muted)] sm:text-[13px]">
                          {item.detail}
                        </p>
                      </div>
                    ))}
                  </div>

                  {chapter.tip && (
                    <div className="rounded-lg border border-[var(--ck-border)] bg-[var(--ck-inset)] px-4 py-3 text-xs leading-relaxed text-[var(--ck-text-secondary)]">
                      <span className="font-semibold text-[var(--ck-accent)]">
                        {L(lang, 'Tip: ', 'টিপস: ')}
                      </span>
                      {chapter.tip}
                    </div>
                  )}

                  {chapter.id === 'shortcuts-and-tips' && (
                    <div className="overflow-hidden rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface)]">
                      <div className="flex items-center gap-2 border-b border-[var(--ck-border-subtle)] px-4 py-3 text-xs font-semibold text-[var(--ck-text)]">
                        <Keyboard className="h-4 w-4 text-[var(--ck-accent)]" />
                        <span>
                          {L(lang, 'Studio Keyboard Shortcuts', 'স্টুডিও কিবোর্ড শর্টকাট তালিকা')}
                        </span>
                      </div>
                      <div className="divide-y divide-[var(--ck-border-subtle)]">
                        {KEYBOARD_SHORTCUTS.map((row) => (
                          <div
                            key={row.keys}
                            className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <kbd className="min-w-[64px] rounded border border-[var(--ck-border-strong)] bg-[var(--ck-inset)] px-2 py-1 text-center font-mono text-[11px] font-semibold text-[var(--ck-text)]">
                                {row.keys}
                              </kbd>
                              <span className="text-[var(--ck-text-secondary)]">
                                {lang === 'bn' ? row.actionBn : row.actionEn}
                              </span>
                            </div>
                            <span className="text-[11px] text-[var(--ck-text-faint)]">
                              {lang === 'bn' ? row.whereBn : row.whereEn}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          {/* Interactive FAQ Section */}
          <section
            id="manual-faq"
            aria-labelledby="manual-faq-heading"
            className="scroll-mt-24 space-y-5 border-t border-[var(--ck-border-subtle)] pt-8"
          >
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-[var(--ck-accent)]">
                {L(lang, 'FAQ', 'প্রশ্নোত্তর (FAQ)')}
              </div>
              <h2
                id="manual-faq-heading"
                className="font-display text-xl font-semibold text-[var(--ck-text)] sm:text-2xl"
              >
                {L(lang, 'Frequently Asked Questions', 'সাধারণ কিছু প্রশ্ন ও সহজ উত্তর')}
              </h2>
            </div>

            <div className="divide-y divide-[var(--ck-border-subtle)] rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface)]">
              {visibleFaqs.map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div key={faq.id}>
                    <button
                      type="button"
                      data-testid={`manual-faq-${faq.id}`}
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-[var(--ck-text)] transition-colors hover:bg-[var(--ck-surface-alt)]"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[var(--ck-text-muted)] transition-transform duration-150 ${
                          isOpen ? 'rotate-180 text-[var(--ck-accent)]' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 text-xs leading-relaxed text-[var(--ck-text-secondary)] sm:text-sm">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Bottom Action CTA */}
          <section className="rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface)] p-6 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1.5">
                <h2 className="font-display text-xl font-semibold text-[var(--ck-text)]">
                  {L(
                    lang,
                    'Ready to create your first animated story?',
                    'সবকিছু বোঝা হয়ে গেছে? এখনই প্রথম ভিডিও তৈরি করুন'
                  )}
                </h2>
                <p className="text-xs leading-relaxed text-[var(--ck-text-muted)] sm:text-sm">
                  {L(
                    lang,
                    'Upload your voiceover or paste a script to preview your synchronized 2D film in under two minutes.',
                    'আপনার ভয়েসওভার বা বাংলা গল্প দিয়ে ২ মিনিটেই প্রথম ২ডি অ্যানিমেশন দেখুন।'
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={onEnterStudio}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--ck-accent)] px-5 text-sm font-semibold text-[var(--ck-accent-fg)] transition-colors hover:bg-[var(--ck-accent-bright)] whitespace-nowrap"
              >
                <span>{L(lang, 'Open Studio', 'স্টুডিও খুলুন')}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
