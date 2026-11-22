import { Clapperboard, Home, Radio, Users } from 'lucide-react';
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
 * inline on the front page without floating popups or offset details.
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
