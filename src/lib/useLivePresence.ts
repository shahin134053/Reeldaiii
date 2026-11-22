import { useEffect, useRef, useState } from 'react';
import {
  PRESENCE_DISPLAY_BASE,
  PRESENCE_TTL_MS,
  PresenceActivity,
  PresencePage,
  PresenceSessionRecord,
  PresenceSnapshot,
  computePresenceSnapshot,
} from './presenceTracker';

export type PresenceConnectionMode = 'websocket' | 'http' | 'local-tabs';

export interface LivePresenceState {
  snapshot: PresenceSnapshot;
  mode: PresenceConnectionMode;
  connected: boolean;
}

const SESSION_ID_STORAGE_KEY = 'reeldaiii_tab_session_id_v1';
const LOCAL_PRESENCE_MAP_KEY = 'reeldaiii_local_presence_tabs_v1';
const LOCAL_CHANNEL_NAME = 'reeldaiii_live_presence_channel_v1';

function getOrCreateTabSessionId(): string {
  if (typeof window === 'undefined') return 'ssr-session';
  try {
    const existing = window.sessionStorage.getItem(SESSION_ID_STORAGE_KEY);
    if (existing && existing.trim().length > 4) return existing;
    const generated = `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    window.sessionStorage.setItem(SESSION_ID_STORAGE_KEY, generated);
    return generated;
  } catch {
    return `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

function readLocalTabMap(): Record<string, PresenceSessionRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_PRESENCE_MAP_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, PresenceSessionRecord>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalTabMap(map: Record<string, PresenceSessionRecord>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_PRESENCE_MAP_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota / private mode errors
  }
}

function buildInitialSnapshot(page: PresencePage, activity: PresenceActivity): PresenceSnapshot {
  const now = Date.now();
  return computePresenceSnapshot(
    [
      {
        sessionId: 'self-initial',
        page,
        activity,
        connectedAt: now,
        lastSeenAt: now,
      },
    ],
    now
  );
}

export function useLivePresence(
  page: PresencePage,
  activity: PresenceActivity = 'browsing'
): LivePresenceState {
  const sessionIdRef = useRef<string>(getOrCreateTabSessionId());
  const latestPageRef = useRef<PresencePage>(page);
  const latestActivityRef = useRef<PresenceActivity>(activity);
  latestPageRef.current = page;
  latestActivityRef.current = activity;

  const [state, setState] = useState<LivePresenceState>(() => ({
    snapshot: buildInitialSnapshot(page, activity),
    mode: 'local-tabs',
    connected: false,
  }));

  const wsRef = useRef<WebSocket | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sid = sessionIdRef.current;

    const customPresenceBase = (
      (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_PRESENCE_SERVER_URL || ''
    ).trim();
    const isStaticGithubPages =
      window.location.hostname.endsWith('.github.io') && !customPresenceBase;

    const apiBase = customPresenceBase.replace(/\/+$/, '');
    const httpHeartbeatUrl = `${apiBase}/api/presence/heartbeat`;
    const httpLeaveUrl = `${apiBase}/api/presence/leave`;

    const wsUrl = (() => {
      if (customPresenceBase) {
        const parsed = new URL(customPresenceBase);
        const proto = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${proto}//${parsed.host}/ws/presence`;
      }
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${proto}//${window.location.host}/ws/presence`;
    })();

    let disposed = false;
    let usingServerBackend = !isStaticGithubPages;
    let reconnectTimer: number | null = null;
    let heartbeatTimer: number | null = null;

    const syncLocalTabs = (action: 'heartbeat' | 'leave') => {
      const now = Date.now();
      const map = readLocalTabMap();
      if (action === 'leave') {
        delete map[sid];
      } else {
        map[sid] = {
          sessionId: sid,
          page: latestPageRef.current,
          activity: latestActivityRef.current,
          connectedAt: map[sid]?.connectedAt ?? now,
          lastSeenAt: now,
        };
      }
      for (const [key, rec] of Object.entries(map)) {
        if (!rec || now - rec.lastSeenAt > PRESENCE_TTL_MS) {
          delete map[key];
        }
      }
      writeLocalTabMap(map);
      if (!usingServerBackend && !disposed) {
        setState({
          snapshot: computePresenceSnapshot(Object.values(map), now),
          mode: 'local-tabs',
          connected: true,
        });
      }
      try {
        bcRef.current?.postMessage({ type: 'local-sync', updatedAt: now });
      } catch {
        // Ignore closed channel
      }
    };

    const sendHttpHeartbeat = async () => {
      if (!usingServerBackend || disposed) return;
      try {
        const res = await fetch(httpHeartbeatUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sid,
            page: latestPageRef.current,
            activity: latestActivityRef.current,
          }),
        });
        if (!res.ok) {
          if (res.status === 404) {
            usingServerBackend = false;
            syncLocalTabs('heartbeat');
          }
          return;
        }
        const snap = (await res.json()) as PresenceSnapshot;
        if (!disposed && typeof snap?.displayedOnlineCount === 'number') {
          setState((prev) => ({
            snapshot: snap,
            mode: prev.mode === 'websocket' ? 'websocket' : 'http',
            connected: true,
          }));
        }
      } catch {
        usingServerBackend = false;
        syncLocalTabs('heartbeat');
      }
    };

    const sendWsUpdate = (msgType: 'presence:hello' | 'presence:update') => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: msgType,
            sessionId: sid,
            page: latestPageRef.current,
            activity: latestActivityRef.current,
          })
        );
        return true;
      }
      return false;
    };

    // Setup cross-tab coordination (always active for static fallback)
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(LOCAL_CHANNEL_NAME);
      bcRef.current = bc;
      bc.onmessage = () => {
        if (!usingServerBackend && !disposed) {
          const map = readLocalTabMap();
          setState({
            snapshot: computePresenceSnapshot(Object.values(map), Date.now()),
            mode: 'local-tabs',
            connected: true,
          });
        }
      };
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_PRESENCE_MAP_KEY && !usingServerBackend && !disposed) {
        const map = readLocalTabMap();
        setState({
          snapshot: computePresenceSnapshot(Object.values(map), Date.now()),
          mode: 'local-tabs',
          connected: true,
        });
      }
    };
    window.addEventListener('storage', onStorage);

    const connectWebSocket = () => {
      if (disposed || !usingServerBackend) return;
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (disposed) {
            ws.close();
            return;
          }
          sendWsUpdate('presence:hello');
        };

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(String(event.data)) as {
              type?: string;
              snapshot?: PresenceSnapshot;
            };
            if (
              payload.type === 'presence:update' &&
              payload.snapshot &&
              typeof payload.snapshot.displayedOnlineCount === 'number' &&
              !disposed
            ) {
              setState({
                snapshot: payload.snapshot,
                mode: 'websocket',
                connected: true,
              });
            }
          } catch {
            // Ignore non-JSON frames
          }
        };

        ws.onerror = () => {
          // Will close and trigger HTTP heartbeat check or reconnect
        };

        ws.onclose = () => {
          if (wsRef.current === ws) {
            wsRef.current = null;
          }
          if (!disposed && usingServerBackend) {
            void sendHttpHeartbeat();
            reconnectTimer = window.setTimeout(connectWebSocket, 5000);
          }
        };
      } catch {
        usingServerBackend = false;
        syncLocalTabs('heartbeat');
      }
    };

    if (usingServerBackend) {
      connectWebSocket();
      void sendHttpHeartbeat();
    } else {
      syncLocalTabs('heartbeat');
    }

    heartbeatTimer = window.setInterval(() => {
      if (usingServerBackend) {
        if (!sendWsUpdate('presence:update')) {
          void sendHttpHeartbeat();
        }
      } else {
        syncLocalTabs('heartbeat');
      }
    }, 15_000);

    const handlePageHide = () => {
      syncLocalTabs('leave');
      if (usingServerBackend) {
        try {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.close(1000, 'tab closed');
          }
          if (typeof navigator.sendBeacon === 'function') {
            navigator.sendBeacon(
              httpLeaveUrl,
              new Blob([JSON.stringify({ sessionId: sid })], { type: 'application/json' })
            );
          }
        } catch {
          // Ignore unload errors
        }
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    return () => {
      disposed = true;
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      if (heartbeatTimer !== null) window.clearInterval(heartbeatTimer);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
      syncLocalTabs('leave');
      try {
        bcRef.current?.close();
      } catch {
        // Ignore
      }
      bcRef.current = null;
      try {
        wsRef.current?.close(1000, 'cleanup');
      } catch {
        // Ignore
      }
      wsRef.current = null;
    };
  }, []);

  // Push immediate presence update when user navigates between Home / Studio / Manual / Developer
  useEffect(() => {
    const sid = sessionIdRef.current;
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'presence:update',
          sessionId: sid,
          page,
          activity,
        })
      );
      return;
    }

    if (typeof window !== 'undefined') {
      const customBase = (
        (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_PRESENCE_SERVER_URL || ''
      ).trim();
      const isStaticGh = window.location.hostname.endsWith('.github.io') && !customBase;
      if (!isStaticGh) {
        const apiBase = customBase.replace(/\/+$/, '');
        fetch(`${apiBase}/api/presence/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sid, page, activity }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((snap: PresenceSnapshot | null) => {
            if (snap && typeof snap.displayedOnlineCount === 'number') {
              setState((prev) => ({ ...prev, snapshot: snap, connected: true }));
            }
          })
          .catch(() => {});
      } else {
        const now = Date.now();
        const map = readLocalTabMap();
        map[sid] = {
          sessionId: sid,
          page,
          activity,
          connectedAt: map[sid]?.connectedAt ?? now,
          lastSeenAt: now,
        };
        writeLocalTabMap(map);
        setState({
          snapshot: computePresenceSnapshot(Object.values(map), now),
          mode: 'local-tabs',
          connected: true,
        });
        try {
          bcRef.current?.postMessage({ type: 'local-sync', updatedAt: now });
        } catch {
          // Ignore
        }
      }
    }
  }, [page, activity]);

  return state;
}

export { PRESENCE_DISPLAY_BASE };
