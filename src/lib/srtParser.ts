export interface SubtitleCue {
  index: number;
  startTime: number; // seconds
  endTime: number; // seconds
  text: string;
}

/**
 * Parses an SRT timestamp like "00:01:25,660" or "00:01:25.660" into seconds.
 */
export function parseSrtTimestamp(raw: string): number {
  const match = raw.trim().match(/^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})$/);
  if (!match) return 0;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const millis = Number(match[4].padEnd(3, '0'));
  return hours * 3600 + minutes * 60 + seconds + millis / 1000;
}

/**
 * Parses raw SRT subtitle text into an ordered array of SubtitleCue objects.
 */
export function parseSrt(srtContent: string): SubtitleCue[] {
  const normalized = srtContent.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n{2,}/);
  const cues: SubtitleCue[] = [];

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (lines.length < 2) continue;

    let timeLineIdx = 0;
    let cueIndex = cues.length + 1;
    if (/^\d+$/.test(lines[0])) {
      cueIndex = Number(lines[0]);
      timeLineIdx = 1;
    }

    const timeLine = lines[timeLineIdx];
    if (!timeLine || !timeLine.includes('-->')) continue;

    const [startRaw, endRaw] = timeLine.split('-->');
    const startTime = parseSrtTimestamp(startRaw);
    const endTime = parseSrtTimestamp(endRaw);
    const text = lines
      .slice(timeLineIdx + 1)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (text.length > 0 && endTime >= startTime) {
      cues.push({
        index: cueIndex,
        startTime,
        endTime,
        text,
      });
    }
  }

  return cues.sort((a, b) => a.startTime - b.startTime);
}

/**
 * Finds the active subtitle cue for a given playback time in seconds.
 */
export function getActiveCue(cues: SubtitleCue[], timeSeconds: number): SubtitleCue | null {
  if (!cues.length || timeSeconds < 0) return null;

  let lo = 0;
  let hi = cues.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const cue = cues[mid];
    if (timeSeconds < cue.startTime) {
      hi = mid - 1;
    } else if (timeSeconds > cue.endTime) {
      lo = mid + 1;
    } else {
      return cue;
    }
  }
  return null;
}
