import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PRESENCE_DISPLAY_BASE,
  PresenceRegistry,
  formatPresenceCount,
  toOffsetOnlineCount,
} from './presenceTracker';

describe('Real-Time Presence Tracker (Base 100 Offset)', () => {
  it('maps 0 real users to 100, 1 real user to 101, and scales unlimitedly', () => {
    assert.equal(PRESENCE_DISPLAY_BASE, 100);
    assert.equal(toOffsetOnlineCount(0), 100);
    assert.equal(toOffsetOnlineCount(1), 101);
    assert.equal(toOffsetOnlineCount(2), 102);
    assert.equal(toOffsetOnlineCount(250), 350);
    assert.equal(toOffsetOnlineCount(-5), 100);
  });

  it('tracks genuine sessions, prevents duplicate counts per sessionId, and computes page breakdown', () => {
    const registry = new PresenceRegistry(30_000);
    const t0 = 1_000_000;

    // 0 users -> 100
    let snap = registry.getSnapshot(t0);
    assert.equal(snap.realOnlineCount, 0);
    assert.equal(snap.displayedOnlineCount, 100);

    // 1st genuine user on Front Page -> 101
    snap = registry.joinOrHeartbeat('tab-1', 'home', 'browsing', t0 + 100);
    assert.equal(snap.realOnlineCount, 1);
    assert.equal(snap.displayedOnlineCount, 101);
    assert.equal(snap.breakdown.home, 1);
    assert.equal(snap.breakdown.studio, 0);

    // Refreshing / heartbeating same sessionId does NOT inflate count
    snap = registry.joinOrHeartbeat('tab-1', 'studio', 'creating', t0 + 500);
    assert.equal(snap.realOnlineCount, 1);
    assert.equal(snap.displayedOnlineCount, 101);
    assert.equal(snap.breakdown.home, 0);
    assert.equal(snap.breakdown.studio, 1);

    // 2nd and 3rd genuine users join -> 102, 103
    registry.joinOrHeartbeat('tab-2', 'home', 'browsing', t0 + 800);
    snap = registry.joinOrHeartbeat('tab-3', 'manual', 'browsing', t0 + 900);
    assert.equal(snap.realOnlineCount, 3);
    assert.equal(snap.displayedOnlineCount, 103);
    assert.equal(snap.breakdown.studio, 1);
    assert.equal(snap.breakdown.home, 1);
    assert.equal(snap.breakdown.manual, 1);
    assert.equal(snap.breakdown.other, 1);

    // User 2 disconnects -> drops cleanly back to 102
    const removed = registry.leave('tab-2', t0 + 1200);
    assert.equal(removed, true);
    snap = registry.getSnapshot(t0 + 1200);
    assert.equal(snap.realOnlineCount, 2);
    assert.equal(snap.displayedOnlineCount, 102);

    // Expired sessions are pruned automatically after TTL
    snap = registry.getSnapshot(t0 + 35_000);
    assert.equal(snap.realOnlineCount, 0);
    assert.equal(snap.displayedOnlineCount, 100);
  });

  it('formats presence numbers in both English and Bengali digits', () => {
    assert.equal(formatPresenceCount(100, 'en'), '100');
    assert.equal(formatPresenceCount(101, 'en'), '101');
    assert.equal(formatPresenceCount(100, 'bn'), '১০০');
    assert.equal(formatPresenceCount(101, 'bn'), '১০১');
    assert.equal(formatPresenceCount(125, 'bn'), '১২৫');
  });
});
