import { useState } from 'react';
import { ChevronDown, ChevronUp, Clapperboard, Home, Radio, Users } from 'lucide-react';
import { AppLang, L } from '../lib/i18n';
import { LivePresenceState } from '../lib/useLivePresence';
import { formatPresenceCount } from '../lib/presenceTracker';

interface LivePresenceDisplayProps {
  lang: AppLang;
  presence: LivePresenceState;
}

function computeSectionPercentages(snapshot: LivePresenceState['snapshot']) {
  const { studio, home, other } = snapshot.breakdown;
  const totalReal = studio + home + other;
  if (totalReal <= 0) {
    return { studioPct: 0, homePct: 100, otherPct: 0 };
  }
  const studioPct = Math.round((studio / totalReal) * 100);
  const otherPct = Math.round((other / totalReal) * 100);
  const homePct = Math.max(0, 100 - studioPct - otherPct);
  return { studioPct, homePct, otherPct };
}

/**
 * Front-Page Live Active Users Card:
 * Shows real-time active users (100+ scale) and live section activity breakdown
 * without exposing internal baseline offset details.
 */
export function LiveOnlineBanner({ lang, presence }: LivePresenceDisplayProps) {
  const { snapshot, mode } = presence;
  const totalFormatted = formatPresenceCount(snapshot.displayedOnlineCount, lang);
  const { studioPct, homePct, otherPct } = computeSectionPercentages(snapshot);
  const studioPctStr = formatPresenceCount(studioPct, lang);
  const homePctStr = formatPresenceCount(homePct, lang);
  const otherPctStr = formatPresenceCount(otherPct, lang);

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
            <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
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
                {L(lang, 'Currently Online', 'জন এখন অনলাইনে আছেন')}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[var(--ck-text-muted)]">
              {L(
                lang,
                'Real-time active creators & visitors on Reeldaiii',
                'এই মুহূর্তে Reeldaiii স্টুডিও ও ওয়েবসাইটে সক্রিয় ইউজার'
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <div className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ck-border)] bg-[var(--ck-inset)] px-2.5 py-1.5 text-[var(--ck-text-secondary)]">
            <Clapperboard className="h-3.5 w-3.5 text-[var(--ck-accent)] shrink-0" />
            <span>{L(lang, 'In Studio:', 'স্টুডিওতে:')}</span>
            <span className="font-mono font-semibold tabular-nums text-[var(--ck-text)]">
              {studioPctStr}%
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ck-border)] bg-[var(--ck-inset)] px-2.5 py-1.5 text-[var(--ck-text-secondary)]">
            <Home className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>{L(lang, 'Front Page:', 'ফ্রন্ট পেজে:')}</span>
            <span className="font-mono font-semibold tabular-nums text-[var(--ck-text)]">
              {homePctStr}%
            </span>
          </div>
          {otherPct > 0 && (
            <div className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ck-border)] bg-[var(--ck-inset)] px-2.5 py-1.5 text-[var(--ck-text-secondary)]">
              <Users className="h-3.5 w-3.5 text-[var(--ck-text-muted)] shrink-0" />
              <span>{L(lang, 'Docs:', 'অন্যান্য:')}</span>
              <span className="font-mono font-semibold tabular-nums text-[var(--ck-text)]">
                {otherPctStr}%
              </span>
            </div>
          )}
          <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-500/80">
            {mode === 'websocket' ? 'LIVE' : mode === 'http' ? 'LIVE' : 'LIVE'}
          </span>
        </div>
      </div>
    </aside>
  );
}

/**
 * Global Bottom-Left Corner Breakdown Widget:
 * Stays cleanly tucked in the bottom-left corner (away from SupportKori on bottom-right)
 * and expands to show real-time active users & studio area breakdown.
 */
export function LivePresenceCornerWidget({ lang, presence }: LivePresenceDisplayProps) {
  const [expanded, setExpanded] = useState(false);
  const { snapshot } = presence;

  const totalFormatted = formatPresenceCount(snapshot.displayedOnlineCount, lang);
  const { studioPct, homePct, otherPct } = computeSectionPercentages(snapshot);
  const studioPctStr = formatPresenceCount(studioPct, lang);
  const homePctStr = formatPresenceCount(homePct, lang);
  const otherPctStr = formatPresenceCount(otherPct, lang);

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
                {L(lang, 'Live Activity Breakdown', 'লাইভ অনলাইন ব্রেকডাউন')}
              </span>
            </div>
            <span className="font-mono text-[10px] font-semibold text-emerald-500">LIVE</span>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between gap-2">
            <div>
              <div className="font-mono text-2xl font-bold tabular-nums leading-none text-[var(--ck-text)]">
                {totalFormatted}
              </div>
              <div className="mt-1 text-[11px] text-[var(--ck-text-muted)]">
                {L(lang, 'Users currently online now', 'জন বর্তমানে অনলাইনে আছেন')}
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between rounded-md bg-[var(--ck-inset)] px-2.5 py-1.5">
              <span className="flex items-center gap-1.5 text-[var(--ck-text-secondary)]">
                <Clapperboard className="h-3.5 w-3.5 text-[var(--ck-accent)]" />
                {L(lang, 'In Animation Studio', 'অ্যানিমেশন স্টুডিওতে')}
              </span>
              <span className="font-mono font-semibold tabular-nums text-[var(--ck-text)]">
                {studioPctStr}%
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-[var(--ck-inset)] px-2.5 py-1.5">
              <span className="flex items-center gap-1.5 text-[var(--ck-text-secondary)]">
                <Home className="h-3.5 w-3.5 text-emerald-500" />
                {L(lang, 'On Front Page', 'ফ্রন্ট পেজে আছেন')}
              </span>
              <span className="font-mono font-semibold tabular-nums text-[var(--ck-text)]">
                {homePctStr}%
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-[var(--ck-inset)] px-2.5 py-1.5">
              <span className="flex items-center gap-1.5 text-[var(--ck-text-secondary)]">
                <Users className="h-3.5 w-3.5 text-[var(--ck-text-muted)]" />
                {L(lang, 'Manual & Developer', 'ম্যানুয়াল ও ডেভেলপার')}
              </span>
              <span className="font-mono font-semibold tabular-nums text-[var(--ck-text)]">
                {otherPctStr}%
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
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--ck-text-muted)]" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5 shrink-0 text-[var(--ck-text-muted)]" />
        )}
      </button>
    </div>
  );
}
