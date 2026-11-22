import { useState } from 'react';
import { ChevronDown, ChevronUp, Clapperboard, Home, Radio, Users } from 'lucide-react';
import { AppLang, L } from '../lib/i18n';
import { LivePresenceState } from '../lib/useLivePresence';
import { formatPresenceCount } from '../lib/presenceTracker';

interface LivePresenceDisplayProps {
  lang: AppLang;
  presence: LivePresenceState;
}

/**
 * Front-Page Top Corner / Hero Live Active Users Card:
 * Displays real-time active users starting cleanly at 100 (= 0 genuine users, 101 = 1 user, etc.)
 * with live Studio vs Front Page breakdown.
 */
export function LiveOnlineBanner({ lang, presence }: LivePresenceDisplayProps) {
  const { snapshot, mode } = presence;
  const totalFormatted = formatPresenceCount(snapshot.displayedOnlineCount, lang);
  const realFormatted = formatPresenceCount(snapshot.realOnlineCount, lang);
  const studioFormatted = formatPresenceCount(snapshot.breakdown.studio, lang);
  const homeFormatted = formatPresenceCount(snapshot.breakdown.home, lang);
  const otherFormatted = formatPresenceCount(snapshot.breakdown.other, lang);

  return (
    <aside
      data-testid="home-live-online-counter"
      aria-live="polite"
      className="rounded-xl border border-[var(--ck-border-strong)] bg-[var(--ck-surface)] px-4 py-3 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
            <Radio className="h-4 w-4" />
            <span
              aria-hidden="true"
              className="absolute -right-1 -top-1 flex h-2.5 w-2.5"
            >
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <span
                data-testid="home-live-online-count"
                className="font-mono text-2xl font-bold tabular-nums leading-none text-[var(--ck-text)]"
              >
                {totalFormatted}
              </span>
              <span className="text-xs font-semibold text-emerald-500">
                {L(lang, 'Currently Online Now', 'জন এখন অনলাইনে আছেন')}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[var(--ck-text-muted)]">
              {L(
                lang,
                `Genuine live studio meter (100 = 0, 101 = 1 · ${realFormatted} active now)`,
                `রিয়েল-টাইম লাইভ মিটার (১০০ = ০ জন, ১০১ = ১ জন · সরাসরি ${realFormatted} জন সক্রিয়)`
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <div className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ck-border)] bg-[var(--ck-inset)] px-2.5 py-1.5 text-[var(--ck-text-secondary)]">
            <Clapperboard className="h-3.5 w-3.5 text-[var(--ck-accent)] shrink-0" />
            <span>{L(lang, 'In Studio:', 'স্টুডিওতে:')}</span>
            <span className="font-mono font-semibold tabular-nums text-[var(--ck-text)]">
              {studioFormatted}
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ck-border)] bg-[var(--ck-inset)] px-2.5 py-1.5 text-[var(--ck-text-secondary)]">
            <Home className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>{L(lang, 'Front Page:', 'ফ্রন্ট পেজে:')}</span>
            <span className="font-mono font-semibold tabular-nums text-[var(--ck-text)]">
              {homeFormatted}
            </span>
          </div>
          {snapshot.breakdown.other > 0 && (
            <div className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ck-border)] bg-[var(--ck-inset)] px-2.5 py-1.5 text-[var(--ck-text-secondary)]">
              <Users className="h-3.5 w-3.5 text-[var(--ck-text-muted)] shrink-0" />
              <span>{L(lang, 'Docs:', 'অন্যান্য:')}</span>
              <span className="font-mono font-semibold tabular-nums text-[var(--ck-text)]">
                {otherFormatted}
              </span>
            </div>
          )}
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--ck-text-faint)]">
            {mode === 'websocket'
              ? 'WS LIVE'
              : mode === 'http'
                ? 'HTTP LIVE'
                : 'TAB LIVE'}
          </span>
        </div>
      </div>
    </aside>
  );
}

/**
 * Global Bottom-Left Corner Breakdown Widget:
 * Stays cleanly tucked in the bottom-left corner (away from SupportKori on bottom-right)
 * and expands to show real-time online count & Studio breakdown.
 */
export function LivePresenceCornerWidget({ lang, presence }: LivePresenceDisplayProps) {
  const [expanded, setExpanded] = useState(false);
  const { snapshot, mode } = presence;

  const totalFormatted = formatPresenceCount(snapshot.displayedOnlineCount, lang);
  const realFormatted = formatPresenceCount(snapshot.realOnlineCount, lang);
  const studioFormatted = formatPresenceCount(snapshot.breakdown.studio, lang);
  const homeFormatted = formatPresenceCount(snapshot.breakdown.home, lang);
  const otherFormatted = formatPresenceCount(snapshot.breakdown.other, lang);

  return (
    <div
      data-testid="corner-live-presence"
      className="fixed bottom-3 left-3 z-30 flex flex-col items-start gap-2 sm:bottom-4 sm:left-4 max-w-[calc(100vw-11rem)]"
    >
      {expanded && (
        <div
          role="region"
          aria-label={L(lang, 'Live studio user breakdown', 'লাইভ স্টুডিও ইউজার ব্রেকডাউন')}
          data-testid="corner-live-presence-panel"
          className="w-64 sm:w-72 rounded-xl border border-[var(--ck-border-strong)] bg-[var(--ck-surface)]/95 p-3.5 shadow-2xl backdrop-blur-md"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[var(--ck-border-subtle)] pb-2">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-[var(--ck-text)]">
                {L(lang, 'Real-Time Online Breakdown', 'রিয়েল-টাইম অনলাইন ব্রেকডাউন')}
              </span>
            </div>
            <span className="font-mono text-[10px] font-semibold text-emerald-500">
              {mode === 'websocket' ? 'LIVE WS' : mode === 'http' ? 'LIVE' : 'SYNC'}
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between gap-2">
            <div>
              <div className="font-mono text-2xl font-bold tabular-nums leading-none text-[var(--ck-text)]">
                {totalFormatted}
              </div>
              <div className="mt-1 text-[11px] text-[var(--ck-text-muted)]">
                {L(
                  lang,
                  `100 base + ${realFormatted} real active`,
                  `১০০ বেস + ${realFormatted} জন আসল ইউজার`
                )}
              </div>
            </div>
            <div className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] font-semibold text-emerald-500">
              100 = 0 · 101 = 1
            </div>
          </div>

          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between rounded-md bg-[var(--ck-inset)] px-2.5 py-1.5">
              <span className="flex items-center gap-1.5 text-[var(--ck-text-secondary)]">
                <Clapperboard className="h-3.5 w-3.5 text-[var(--ck-accent)]" />
                {L(lang, 'In Animation Studio', 'অ্যানিমেশন স্টুডিওতে')}
              </span>
              <span className="font-mono font-semibold tabular-nums text-[var(--ck-text)]">
                {studioFormatted}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-[var(--ck-inset)] px-2.5 py-1.5">
              <span className="flex items-center gap-1.5 text-[var(--ck-text-secondary)]">
                <Home className="h-3.5 w-3.5 text-emerald-500" />
                {L(lang, 'On Front Page', 'ফ্রন্ট পেজে আছেন')}
              </span>
              <span className="font-mono font-semibold tabular-nums text-[var(--ck-text)]">
                {homeFormatted}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-[var(--ck-inset)] px-2.5 py-1.5">
              <span className="flex items-center gap-1.5 text-[var(--ck-text-secondary)]">
                <Users className="h-3.5 w-3.5 text-[var(--ck-text-muted)]" />
                {L(lang, 'Manual & Developer', 'ম্যানুয়াল ও ডেভেলপার')}
              </span>
              <span className="font-mono font-semibold tabular-nums text-[var(--ck-text)]">
                {otherFormatted}
              </span>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        data-testid="corner-live-presence-toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--ck-border-strong)] bg-[var(--ck-surface)]/95 px-3 text-xs font-medium text-[var(--ck-text)] shadow-lg backdrop-blur-md transition-colors hover:border-emerald-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)]"
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="font-mono font-bold tabular-nums" data-testid="corner-live-online-count">
          {totalFormatted}
        </span>
        <span className="truncate text-[var(--ck-text-secondary)]">
          {L(lang, 'Online', 'অনলাইন')}
        </span>
        <span className="hidden sm:inline font-mono text-[10px] text-[var(--ck-text-muted)]">
          ({L(lang, `Studio ${studioFormatted}`, `স্টুডিও ${studioFormatted}`)})
        </span>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--ck-text-muted)]" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5 shrink-0 text-[var(--ck-text-muted)]" />
        )}
      </button>
    </div>
  );
}
