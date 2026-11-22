/**
 * Genuine Real-Time Active User Presence Tracker
 *
 * Baseline Offset Policy:
 * - Counter starts at 100 (100 represents 0 real active users).
 * - 101 represents 1 real active user, 102 represents 2, scaling unlimitedly (100 + N).
 * - Strictly tracks real active sessions with no simulated/random numbers.
 */

export const PRESENCE_DISPLAY_BASE = 100;
export const PRESENCE_TTL_MS = 45_000;

export type PresencePage = 'home' | 'studio' | 'manual' | 'developer';
export type PresenceActivity = 'browsing' | 'creating' | 'previewing';

export interface PresenceSessionRecord {
  sessionId: string;
  page: PresencePage;
  activity: PresenceActivity;
  connectedAt: number;
  lastSeenAt: number;
}

export interface PresenceBreakdown {
  studio: number;
  home: number;
  manual: number;
  developer: number;
  other: number;
}

export interface PresenceSnapshot {
  baseOffset: number;
  realOnlineCount: number;
  displayedOnlineCount: number;
  breakdown: PresenceBreakdown;
  updatedAt: number;
}

const VALID_PAGES: ReadonlySet<string> = new Set(['home', 'studio', 'manual', 'developer']);
const VALID_ACTIVITIES: ReadonlySet<string> = new Set(['browsing', 'creating', 'previewing']);

export function normalizePresencePage(raw: unknown): PresencePage {
  return typeof raw === 'string' && VALID_PAGES.has(raw) ? (raw as PresencePage) : 'home';
}

export function normalizePresenceActivity(raw: unknown): PresenceActivity {
  return typeof raw === 'string' && VALID_ACTIVITIES.has(raw)
    ? (raw as PresenceActivity)
    : 'browsing';
}

export function toOffsetOnlineCount(realActiveCount: number, baseOffset = PRESENCE_DISPLAY_BASE): number {
  const safeReal = Number.isFinite(realActiveCount) ? Math.max(0, Math.floor(realActiveCount)) : 0;
  return baseOffset + safeReal;
}

const EN_TO_BN_DIGITS: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

export function formatPresenceCount(count: number, lang: 'en' | 'bn'): string {
  const safe = Math.max(0, Math.floor(count));
  const str = String(safe);
  if (lang === 'bn') {
    return str.replace(/[0-9]/g, (d) => EN_TO_BN_DIGITS[d] ?? d);
  }
  return str;
}

export function computePresenceSnapshot(
  sessions: Iterable<PresenceSessionRecord>,
  nowMs = Date.now(),
  ttlMs = PRESENCE_TTL_MS
): PresenceSnapshot {
  let studio = 0;
  let home = 0;
  let manual = 0;
  let developer = 0;
  let realOnlineCount = 0;

  for (const session of sessions) {
    if (!session || !session.sessionId) continue;
    if (nowMs - session.lastSeenAt > ttlMs) continue;
    realOnlineCount += 1;
    switch (session.page) {
      case 'studio':
        studio += 1;
        break;
      case 'manual':
        manual += 1;
        break;
      case 'developer':
        developer += 1;
        break;
      case 'home':
      default:
        home += 1;
        break;
    }
  }

  return {
    baseOffset: PRESENCE_DISPLAY_BASE,
    realOnlineCount,
    displayedOnlineCount: toOffsetOnlineCount(realOnlineCount, PRESENCE_DISPLAY_BASE),
    breakdown: {
      studio,
      home,
      manual,
      developer,
      other: manual + developer,
    },
    updatedAt: nowMs,
  };
}

export class PresenceRegistry {
  private readonly sessions = new Map<string, PresenceSessionRecord>();
  private readonly ttlMs: number;

  constructor(ttlMs = PRESENCE_TTL_MS) {
    this.ttlMs = ttlMs;
  }

  joinOrHeartbeat(
    sessionId: string,
    page: unknown,
    activity: unknown = 'browsing',
    nowMs = Date.now()
  ): PresenceSnapshot {
    const cleanId = sessionId.trim().slice(0, 80);
    if (!cleanId) {
      return this.getSnapshot(nowMs);
    }

    const existing = this.sessions.get(cleanId);
    this.sessions.set(cleanId, {
      sessionId: cleanId,
      page: normalizePresencePage(page),
      activity: normalizePresenceActivity(activity),
      connectedAt: existing?.connectedAt ?? nowMs,
      lastSeenAt: nowMs,
    });

    this.pruneExpired(nowMs);
    return this.getSnapshot(nowMs);
  }

  leave(sessionId: string, nowMs = Date.now()): boolean {
    const cleanId = sessionId.trim().slice(0, 80);
    if (!cleanId) return false;
    const removed = this.sessions.delete(cleanId);
    this.pruneExpired(nowMs);
    return removed;
  }

  pruneExpired(nowMs = Date.now()): number {
    let removed = 0;
    for (const [id, record] of this.sessions.entries()) {
      if (nowMs - record.lastSeenAt > this.ttlMs) {
        this.sessions.delete(id);
        removed += 1;
      }
    }
    return removed;
  }

  getSnapshot(nowMs = Date.now()): PresenceSnapshot {
    return computePresenceSnapshot(this.sessions.values(), nowMs, this.ttlMs);
  }
}
