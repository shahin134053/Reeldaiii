import 'dotenv/config';
import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { sanitizeSvgMarkup } from './src/lib/svgSanitizer';
import { PresenceRegistry, PresenceSnapshot } from './src/lib/presenceTracker';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DIRECTOR_MODEL = 'gemini-4-hydrogen';

function getApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key || key === 'MY_GEMINI_API_KEY') return null;
  return key;
}

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const VALID_SETTINGS = [
  'school-street',
  'fajr-mosque',
  'tea-stall',
  'classroom',
  'home-night',
  'monsoon-rain',
  'river-village',
  'city-evening',
  'office-studio',
  'park-nature',
  'market-bazaar',
  'hospital-care',
  'space-cosmos',
  'ocean-voyage',
  'mountain-summit',
  'train-journey',
  'tech-ai-lab',
  'finance-growth',
  'sports-arena',
  'ancient-palace',
  'stage-spotlight',
  'quote-epilogue',
];

const VALID_TIMES = ['dawn', 'morning', 'afternoon', 'storm', 'sunset', 'night'];
const VALID_WEATHERS = ['clear', 'mist', 'rain', 'heavy-storm', 'fireflies', 'snow', 'embers', 'stars'];
const VALID_ACTIONS = [
  'rickshaw-ride',
  'walking-away',
  'conversation',
  'studying',
  'home-meal',
  'running-rain',
  'boat-glide',
  'speaking-narrator',
  'working-desk',
  'family-together',
  'praying-reflecting',
  'celebrating-proud',
  'quote-card',
];
const VALID_EMOTIONS = ['calm', 'happy', 'sad', 'determined', 'worried', 'emotional', 'inspiring', 'angry'];
const VALID_SHOTS = ['wide-establishing', 'medium-two-shot', 'close-up-portrait', 'tracking-pan'];
const VALID_MOTIONS = ['dolly-in', 'dolly-out', 'pan-left', 'pan-right', 'tilt-up', 'tracking'];
const VALID_CHARACTERS = [
  'father',
  'mother',
  'youth-boy',
  'youth-girl',
  'elder',
  'teacher',
  'professional',
  'doctor',
  'narrator',
  'friend',
];
const VALID_MOTIFS = [
  'none',
  'rocket-launch',
  'sailing-ship',
  'growth-chart',
  'clock-time',
  'glowing-heart',
  'floating-books',
  'digital-network',
  'spotlight-mic',
  'stadium-ball',
  'mountain-peak',
  'train-express',
  'royal-arch',
  'dream-orbs',
];

function pickValid<T extends string>(val: unknown, allowed: readonly string[], fallback: T): T {
  return typeof val === 'string' && allowed.includes(val) ? (val as T) : fallback;
}

const STYLE_ART_DIRECTIONS: Record<string, string> = {
  'storybook-warm':
    'Warm hand-painted Studio Ghibli / Bengali storybook aesthetic: golden-hour lighting, painterly layered silhouettes, soft radial sun glows, warm ochres, terracotta, deep indigo shadows, expressive illustrated characters.',
  'cinematic-anime':
    'Makoto Shinkai / cinematic anime aesthetic: dramatic luminous clouds, crisp atmospheric light shafts, vibrant teal & sunset orange contrast, reflective water/glass highlights, expressive anime-proportioned figures.',
  'editorial-doc':
    'Award-winning Vox / Kurzgesagt-inspired editorial motion illustration: clean stylized vector geometry, rich matte gradients, bold focal storytelling objects, refined slate-and-gold studio palette.',
  'dramatic-noir':
    'High-contrast moody cinema noir: deep midnight navy/charcoal shadows, warm amber practical lamps/torches, dramatic rim lighting, atmospheric mist, expressive chiaroscuro framing.',
};

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const presenceRegistry = new PresenceRegistry(45_000);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/presence' });
  const wsClientSessions = new Map<WebSocket, string>();

  const broadcastPresence = (snapshot: PresenceSnapshot = presenceRegistry.getSnapshot()) => {
    const payload = JSON.stringify({ type: 'presence:update', snapshot });
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  };

  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: 'presence:update', snapshot: presenceRegistry.getSnapshot() }));

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(String(raw)) as {
          type?: string;
          sessionId?: unknown;
          page?: unknown;
          activity?: unknown;
        };
        if (
          (msg.type === 'presence:hello' || msg.type === 'presence:update') &&
          typeof msg.sessionId === 'string' &&
          msg.sessionId.trim()
        ) {
          const sid = msg.sessionId.trim().slice(0, 80);
          wsClientSessions.set(ws, sid);
          const snap = presenceRegistry.joinOrHeartbeat(sid, msg.page, msg.activity);
          broadcastPresence(snap);
        }
      } catch {
        // Ignore malformed WebSocket payloads
      }
    });

    ws.on('close', () => {
      const sid = wsClientSessions.get(ws);
      wsClientSessions.delete(ws);
      if (sid) {
        // Ensure no other open socket holds the exact same sessionId before removing
        const stillOpen = Array.from(wsClientSessions.values()).includes(sid);
        if (!stillOpen && presenceRegistry.leave(sid)) {
          broadcastPresence();
        }
      }
    });
  });

  const pruneTimer = setInterval(() => {
    const removed = presenceRegistry.pruneExpired();
    if (removed > 0) {
      broadcastPresence();
    }
  }, 15_000);
  pruneTimer.unref?.();

  app.use(express.json({ limit: '18mb' }));
  app.use(express.text({ type: 'text/plain', limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    const presence = presenceRegistry.getSnapshot();
    res.json({
      ok: true,
      directorAvailable: Boolean(getApiKey()),
      model: DIRECTOR_MODEL,
      presenceOnline: presence.displayedOnlineCount,
      realOnlineCount: presence.realOnlineCount,
    });
  });

  app.get('/api/director/status', (_req, res) => {
    res.json({
      available: Boolean(getApiKey()),
      model: DIRECTOR_MODEL,
    });
  });

  app.get('/api/presence', (_req, res) => {
    presenceRegistry.pruneExpired();
    res.json(presenceRegistry.getSnapshot());
  });

  app.post('/api/presence/heartbeat', (req, res) => {
    let body: Record<string, unknown> = {};
    if (typeof req.body === 'string') {
      try {
        body = JSON.parse(req.body) as Record<string, unknown>;
      } catch {
        body = {};
      }
    } else if (req.body && typeof req.body === 'object') {
      body = req.body as Record<string, unknown>;
    }
    const sid = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
    if (!sid) {
      res.status(400).json({ error: 'Missing sessionId' });
      return;
    }
    const snap = presenceRegistry.joinOrHeartbeat(sid, body.page, body.activity);
    broadcastPresence(snap);
    res.json(snap);
  });

  app.post('/api/presence/leave', (req, res) => {
    let body: Record<string, unknown> = {};
    if (typeof req.body === 'string') {
      try {
        body = JSON.parse(req.body) as Record<string, unknown>;
      } catch {
        body = {};
      }
    } else if (req.body && typeof req.body === 'object') {
      body = req.body as Record<string, unknown>;
    }
    const sid = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
    if (sid && presenceRegistry.leave(sid)) {
      broadcastPresence();
    }
    res.json(presenceRegistry.getSnapshot());
  });

  /**
   * Transcribes voiceover audio into timed subtitle cues when the user uploads audio without an SRT file.
   */
  app.post('/api/director/transcribe', async (req, res) => {
    const ai = createGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini AI Director is not configured on this server (missing GEMINI_API_KEY).',
      });
      return;
    }

    const { audioBase64, mimeType, duration } = req.body ?? {};
    if (typeof audioBase64 !== 'string' || audioBase64.length < 32) {
      res.status(400).json({ error: 'Missing or invalid audioBase64 payload.' });
      return;
    }

    const safeMime =
      typeof mimeType === 'string' && mimeType.startsWith('audio/') ? mimeType : 'audio/mpeg';

    try {
      const response = await ai.models.generateContent({
        model: DIRECTOR_MODEL,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: safeMime,
                data: audioBase64,
              },
            },
            {
              text: `Listen carefully to this voiceover narration (approx ${Math.round(Number(duration) || 30)}s).
Transcribe every spoken sentence in its ORIGINAL language (Bengali script if Bengali, English if English) and break it into natural subtitle cues (each 3-6 seconds long) with accurate startTime and endTime in seconds.`,
            },
          ],
        },
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcript: { type: Type.STRING },
              cues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    startTime: { type: Type.NUMBER },
                    endTime: { type: Type.NUMBER },
                    text: { type: Type.STRING },
                  },
                  required: ['startTime', 'endTime', 'text'],
                },
              },
            },
            required: ['transcript', 'cues'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      const rawCues = Array.isArray(parsed.cues) ? parsed.cues : [];
      const cues = rawCues
        .filter((c: { text?: unknown }) => typeof c?.text === 'string' && c.text.trim().length > 0)
        .map((c: { startTime?: number; endTime?: number; text: string }, idx: number) => ({
          index: idx + 1,
          startTime: Math.max(0, Number(c.startTime) || idx * 3.5),
          endTime: Math.max(
            (Number(c.startTime) || idx * 3.5) + 0.8,
            Number(c.endTime) || (idx + 1) * 3.5
          ),
          text: c.text.trim(),
        }));

      res.json({
        transcript: typeof parsed.transcript === 'string' ? parsed.transcript : cues.map((c: { text: string }) => c.text).join(' '),
        cues,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Audio transcription failed.';
      res.status(502).json({ error: message });
    }
  });

  /**
   * Deeply analyzes any SRT + script into story-exact visual beats, 12-point Story Intelligence,
   * and locked CharacterProfile visual DNA aligned to exact SRT timestamps.
   */
  app.post('/api/director/plan', async (req, res) => {
    const ai = createGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini AI Director is not configured on this server (missing GEMINI_API_KEY).',
      });
      return;
    }

    const { title, cues, scriptText, duration, visualStyle } = req.body ?? {};
    const safeCues = Array.isArray(cues) ? cues.slice(0, 180) : [];
    const totalDur = Math.max(6, Number(duration) || 30);
    const styleKey = typeof visualStyle === 'string' && STYLE_ART_DIRECTIONS[visualStyle]
      ? visualStyle
      : 'storybook-warm';

    const timelineSummary =
      safeCues.length > 0
        ? safeCues
            .map(
              (c: { startTime: number; endTime: number; text: string }) =>
                `[${Number(c.startTime).toFixed(1)}s - ${Number(c.endTime).toFixed(1)}s] ${c.text}`
            )
            .join('\n')
        : String(scriptText ?? '').slice(0, 6000);

    if (!timelineSummary.trim()) {
      res.status(400).json({ error: 'Provide SRT cues or script text to plan visual scenes.' });
      return;
    }

    const targetBeatCount = Math.max(4, Math.min(14, Math.round(totalDur / 12) || 6));

    try {
      const response = await ai.models.generateContent({
        model: DIRECTOR_MODEL,
        contents: `You are an award-winning 2D Animation Film Director.
Your mission: Read EVERY SINGLE SPOKEN LINE of this timed SRT/script, deeply understand the whole story, lock consistent character appearances across every scene, and direct ${targetBeatCount} tightly synchronized visual animation scenes so that EVERY scene literally depicts what the narrator is saying during those exact seconds—NEVER generic or random unrelated visuals.

Art Style: ${STYLE_ART_DIRECTIONS[styleKey]}
User Title Hint: ${title || '(auto-create concise compelling title in the script language)'}
Total Duration: ${totalDur.toFixed(1)} seconds

Timed Spoken Dialogue / Script:
${timelineSummary}

Rules:
1. Beats must cover [0, ${totalDur.toFixed(1)}] seamlessly without gaps, cutting cleanly on SRT cue boundaries with balanced pacing (avoid tiny 2-second orphan cuts or giant 60-second single scenes).
2. Build "storyIntelligence": theme, moralOrMessage, beginningArc, middleArc, endingArc, historicalCulturalContext, emotionalArc[], locations[], importantObjects[].
3. Build "characters": consistent CharacterProfile entries (characterId, role, name, ageAppearance, hairStyle, clothing, hex colors skinTone/hairColor/outfitColor/pantsColor/accentColor, bodyStructure slim|average|broad, personality, isFemale, isElder, accessories from glasses|mustache|beard|gamchha|scarf|stethoscope|cap|watch). Keep these characterIds consistent across every beat!
4. For each beat, write literal "visualPrompt", "visualStorytelling", "characterIds", "characterActions", "facialExpression", "bodyLanguage", "environmentDetails", "importantProps", "lightingColor", and "transitionToNext" (cross-dissolve | directional-wipe | light-leak).
5. Pick the closest matching enum values for setting, timeOfDay, weather, action, emotion, cameraShot, cameraMotion, primaryCharacter, motif, and focalPointX (0.28 to 0.72 where hero sits safely for 9:16 portrait). NEVER pick space-cosmos, sports-arena, ocean-voyage, or ancient-palace unless the narration explicitly talks about them!`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              characterBible: { type: Type.STRING },
              narrativeHighlights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              storyIntelligence: {
                type: Type.OBJECT,
                properties: {
                  theme: { type: Type.STRING },
                  moralOrMessage: { type: Type.STRING },
                  beginningArc: { type: Type.STRING },
                  middleArc: { type: Type.STRING },
                  endingArc: { type: Type.STRING },
                  historicalCulturalContext: { type: Type.STRING },
                  emotionalArc: { type: Type.ARRAY, items: { type: Type.STRING } },
                  locations: { type: Type.ARRAY, items: { type: Type.STRING } },
                  importantObjects: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
              },
              characters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    characterId: { type: Type.STRING },
                    role: { type: Type.STRING },
                    name: { type: Type.STRING },
                    ageAppearance: { type: Type.STRING },
                    hairStyle: { type: Type.STRING },
                    clothing: { type: Type.STRING },
                    skinTone: { type: Type.STRING },
                    hairColor: { type: Type.STRING },
                    outfitColor: { type: Type.STRING },
                    pantsColor: { type: Type.STRING },
                    accentColor: { type: Type.STRING },
                    bodyStructure: { type: Type.STRING },
                    personality: { type: Type.STRING },
                    isFemale: { type: Type.BOOLEAN },
                    isElder: { type: Type.BOOLEAN },
                    accessories: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                },
              },
              beats: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    titleBn: { type: Type.STRING },
                    titleEn: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    spokenExcerpt: { type: Type.STRING },
                    visualMatchReason: { type: Type.STRING },
                    visualStorytelling: { type: Type.STRING },
                    characterIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                    characterActions: { type: Type.STRING },
                    facialExpression: { type: Type.STRING },
                    bodyLanguage: { type: Type.STRING },
                    environmentDetails: { type: Type.STRING },
                    importantProps: { type: Type.ARRAY, items: { type: Type.STRING } },
                    lightingColor: { type: Type.STRING },
                    transitionToNext: { type: Type.STRING },
                    startTime: { type: Type.NUMBER },
                    endTime: { type: Type.NUMBER },
                    setting: { type: Type.STRING },
                    timeOfDay: { type: Type.STRING },
                    weather: { type: Type.STRING },
                    action: { type: Type.STRING },
                    emotion: { type: Type.STRING },
                    cameraShot: { type: Type.STRING },
                    cameraMotion: { type: Type.STRING },
                    primaryCharacter: { type: Type.STRING },
                    secondaryCharacter: { type: Type.STRING },
                    motif: { type: Type.STRING },
                    accentColor: { type: Type.STRING },
                    focalPointX: { type: Type.NUMBER },
                    visualPrompt: { type: Type.STRING },
                  },
                  required: [
                    'titleBn',
                    'titleEn',
                    'summary',
                    'spokenExcerpt',
                    'visualMatchReason',
                    'startTime',
                    'endTime',
                    'setting',
                    'timeOfDay',
                    'weather',
                    'action',
                    'emotion',
                    'cameraMotion',
                    'visualPrompt',
                  ],
                },
              },
            },
            required: ['title', 'characterBible', 'narrativeHighlights', 'beats'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      const rawBeats = Array.isArray(parsed.beats) ? parsed.beats : [];
      if (rawBeats.length === 0) {
        res.status(502).json({ error: 'AI Director returned an empty storyboard.' });
        return;
      }

      const VALID_TRANSITIONS = ['cross-dissolve', 'directional-wipe', 'light-leak'];
      const VALID_ACCESSORIES = ['glasses', 'mustache', 'beard', 'gamchha', 'scarf', 'stethoscope', 'cap', 'watch'];
      const isHex = (v: unknown) => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);

      const normalizedBeats = rawBeats.map((b: Record<string, unknown>, idx: number) => {
        const startTime =
          idx === 0 ? 0 : Math.max(0, Number(b.startTime) || (idx * totalDur) / rawBeats.length);
        const endTime =
          idx === rawBeats.length - 1
            ? totalDur
            : Math.max(startTime + 1, Number(b.endTime) || ((idx + 1) * totalDur) / rawBeats.length);
        const secRaw = typeof b.secondaryCharacter === 'string' ? b.secondaryCharacter : '';

        return {
          titleBn: String(b.titleBn || `দৃশ্য ${idx + 1}`).slice(0, 60),
          titleEn: String(b.titleEn || `Scene ${idx + 1}`).slice(0, 60),
          summary: String(b.summary || b.spokenExcerpt || '').slice(0, 180),
          spokenExcerpt: String(b.spokenExcerpt || '').slice(0, 260),
          visualMatchReason: String(b.visualMatchReason || 'Directed directly from spoken dialogue').slice(0, 120),
          visualStorytelling: typeof b.visualStorytelling === 'string' ? b.visualStorytelling.slice(0, 220) : undefined,
          characterIds: Array.isArray(b.characterIds)
            ? b.characterIds.slice(0, 4).map((c) => String(c))
            : undefined,
          characterActions: typeof b.characterActions === 'string' ? b.characterActions.slice(0, 140) : undefined,
          facialExpression: typeof b.facialExpression === 'string' ? b.facialExpression.slice(0, 80) : undefined,
          bodyLanguage: typeof b.bodyLanguage === 'string' ? b.bodyLanguage.slice(0, 120) : undefined,
          environmentDetails: typeof b.environmentDetails === 'string' ? b.environmentDetails.slice(0, 180) : undefined,
          importantProps: Array.isArray(b.importantProps)
            ? b.importantProps.slice(0, 5).map((p) => String(p))
            : undefined,
          lightingColor: typeof b.lightingColor === 'string' ? b.lightingColor.slice(0, 80) : undefined,
          transitionToNext: pickValid(b.transitionToNext, VALID_TRANSITIONS, 'cross-dissolve'),
          startTime: Number(startTime.toFixed(2)),
          endTime: Number(endTime.toFixed(2)),
          setting: pickValid(b.setting, VALID_SETTINGS, 'park-nature'),
          timeOfDay: pickValid(b.timeOfDay, VALID_TIMES, 'sunset'),
          weather: pickValid(b.weather, VALID_WEATHERS, 'clear'),
          action: pickValid(b.action, VALID_ACTIONS, 'speaking-narrator'),
          emotion: pickValid(b.emotion, VALID_EMOTIONS, 'calm'),
          cameraShot: pickValid(b.cameraShot, VALID_SHOTS, 'medium-two-shot'),
          cameraMotion: pickValid(b.cameraMotion, VALID_MOTIONS, 'dolly-in'),
          primaryCharacter: pickValid(b.primaryCharacter, VALID_CHARACTERS, 'narrator'),
          secondaryCharacter: VALID_CHARACTERS.includes(secRaw) ? secRaw : null,
          motif: pickValid(b.motif, VALID_MOTIFS, 'none'),
          accentColor: isHex(b.accentColor) ? String(b.accentColor) : '#E5A93C',
          focalPointX: Math.max(0.28, Math.min(0.72, Number(b.focalPointX) || 0.5)),
          visualPrompt: String(b.visualPrompt || b.summary || '').slice(0, 450),
        };
      });

      const rawChars = Array.isArray(parsed.characters) ? parsed.characters : [];
      const normalizedChars = rawChars.slice(0, 8).map((c: Record<string, unknown>, idx: number) => ({
        characterId: String(c.characterId || `char-${idx + 1}`).slice(0, 40),
        role: pickValid(c.role, VALID_CHARACTERS, 'narrator'),
        name: String(c.name || `Character ${idx + 1}`).slice(0, 48),
        ageAppearance: String(c.ageAppearance || 'Adult').slice(0, 32),
        hairStyle: String(c.hairStyle || 'Natural hair').slice(0, 60),
        clothing: String(c.clothing || 'Storytelling attire').slice(0, 90),
        skinTone: isHex(c.skinTone) ? String(c.skinTone) : '#C8926D',
        hairColor: isHex(c.hairColor) ? String(c.hairColor) : '#1D1816',
        outfitColor: isHex(c.outfitColor) ? String(c.outfitColor) : '#4B6B8A',
        pantsColor: isHex(c.pantsColor) ? String(c.pantsColor) : '#232C3D',
        accentColor: isHex(c.accentColor) ? String(c.accentColor) : '#E5A93C',
        bodyStructure: pickValid(c.bodyStructure, ['slim', 'average', 'broad'], 'average'),
        personality: String(c.personality || 'Expressive & grounded').slice(0, 80),
        isFemale: Boolean(c.isFemale),
        isElder: Boolean(c.isElder),
        accessories: Array.isArray(c.accessories)
          ? c.accessories.filter((a): a is string => typeof a === 'string' && VALID_ACCESSORIES.includes(a))
          : [],
      }));

      res.json({
        title: String(parsed.title || title || 'Animated Story').slice(0, 64),
        characterBible: String(parsed.characterBible || '').slice(0, 500),
        narrativeHighlights: Array.isArray(parsed.narrativeHighlights)
          ? parsed.narrativeHighlights.slice(0, 4).map((h: unknown) => String(h))
          : [`${normalizedBeats.length} story-exact animated scenes directed by Gemini AI`],
        storyIntelligence: parsed.storyIntelligence && typeof parsed.storyIntelligence === 'object'
          ? parsed.storyIntelligence
          : undefined,
        characters: normalizedChars.length > 0 ? normalizedChars : undefined,
        beats: normalizedBeats,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI Director planning failed.';
      res.status(502).json({ error: message });
    }
  });

  /**
   * Generates a bespoke, multi-layered 1280x720 cinematic SVG illustration tailored literally
   * to a single scene's spoken words and visualPrompt, ready for 2.5D parallax Canvas animation.
   */
  app.post('/api/director/illustrate', async (req, res) => {
    const ai = createGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini AI Director is not configured on this server (missing GEMINI_API_KEY).',
      });
      return;
    }

    const { spokenExcerpt, visualPrompt, characterBible, visualStyle, timeOfDay, emotion, accentColor } =
      req.body ?? {};
    if (typeof visualPrompt !== 'string' || !visualPrompt.trim()) {
      res.status(400).json({ error: 'Missing visualPrompt.' });
      return;
    }

    const styleDesc =
      STYLE_ART_DIRECTIONS[String(visualStyle)] ?? STYLE_ART_DIRECTIONS['storybook-warm'];

    try {
      const response = await ai.models.generateContent({
        model: DIRECTOR_MODEL,
        contents: `Create a breathtaking, studio-quality 2D animated film background + hero illustration as a single self-contained SVG (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">).

SPOKEN LINE BEING ANIMATED: "${String(spokenExcerpt || '').slice(0, 260)}"
VISUAL DIRECTION: ${visualPrompt.slice(0, 450)}
CHARACTER CONSISTENCY: ${String(characterBible || 'Consistent expressive human proportions').slice(0, 300)}
ART STYLE: ${styleDesc}
TIME & MOOD: ${String(timeOfDay || 'sunset')} · ${String(emotion || 'emotional')} · Accent ${String(accentColor || '#E5A93C')}

STRICT TECHNICAL & ARTISTIC RULES:
1. Output ONLY raw valid <svg ...>...</svg> markup (no markdown fences, no commentary).
2. ZERO text, letters, numbers, or speech bubbles inside the SVG! Pure visual storytelling.
3. Structure the SVG into EXACTLY 4 named groups for 2.5D parallax cinema animation:
   - <defs> with rich multi-stop <linearGradient> and <radialGradient> lighting/glows
   - <g id="layer-sky"> full-bleed atmospheric sky, sun/moon/nebula/clouds, distant backdrop
   - <g id="layer-mid"> rich architectural/landscape environment (buildings, mountains, waves, trees, lab monitors, stadium, etc.) with layered depth silhouettes
   - <g id="layer-hero"> the main focal subject/characters/objects literally matching the spoken line (large, centered cleanly between x=360..920 so both 16:9 and 9:16 crops look incredible!), crafted with shaded layered shapes, highlights, shadows, and expressive posture/face
   - <g id="layer-fg"> subtle foreground framing depth (soft bokeh, silhouetted foliage/railing/table edge, ground shadows)
4. Use rich, painterly curved <path>, <ellipse>, <polygon>, and gradient fills (at least 35-65 detailed vector elements). Never draw stick figures or empty flat boxes.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const cleanSvg = sanitizeSvgMarkup(response.text ?? '');
      if (!cleanSvg) {
        res.status(502).json({ error: 'Generated artwork did not contain valid SVG markup.' });
        return;
      }

      res.json({ customSvg: cleanSvg });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Scene illustration failed.';
      res.status(502).json({ error: message });
    }
  });

  /**
   * Re-directs and re-illustrates a single flagged/selected scene while keeping character consistency locked.
   */
  app.post('/api/director/regenerate-scene', async (req, res) => {
    const ai = createGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini AI Director is not configured on this server (missing GEMINI_API_KEY).',
      });
      return;
    }

    const { scene, characterBible, visualStyle, customInstruction } = req.body ?? {};
    if (!scene || typeof scene !== 'object') {
      res.status(400).json({ error: 'Missing scene payload.' });
      return;
    }

    const styleKey = typeof visualStyle === 'string' && STYLE_ART_DIRECTIONS[visualStyle]
      ? visualStyle
      : 'storybook-warm';

    try {
      const planRes = await ai.models.generateContent({
        model: DIRECTOR_MODEL,
        contents: `You are re-directing ONE flagged animation scene so its visuals match the narration far more accurately and stay 100% safe inside 16:9 & 9:16 framing.
Spoken Dialogue: "${String(scene.spokenExcerpt || scene.summary || '').slice(0, 300)}"
Character Bible (MUST KEEP CONSISTENT): ${String(characterBible || '').slice(0, 350)}
Instruction: ${String(customInstruction || 'Improve literal visual storytelling match, camera composition, and expressive character acting.').slice(0, 260)}
Art Style: ${STYLE_ART_DIRECTIONS[styleKey]}

Return updated JSON with titleBn, titleEn, summary, visualMatchReason, visualStorytelling, setting, timeOfDay, weather, action, emotion, cameraShot, cameraMotion, primaryCharacter, secondaryCharacter, focalPointX (0.35..0.65), and hyper-specific visualPrompt.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              titleBn: { type: Type.STRING },
              titleEn: { type: Type.STRING },
              summary: { type: Type.STRING },
              visualMatchReason: { type: Type.STRING },
              visualStorytelling: { type: Type.STRING },
              setting: { type: Type.STRING },
              timeOfDay: { type: Type.STRING },
              weather: { type: Type.STRING },
              action: { type: Type.STRING },
              emotion: { type: Type.STRING },
              cameraShot: { type: Type.STRING },
              cameraMotion: { type: Type.STRING },
              primaryCharacter: { type: Type.STRING },
              secondaryCharacter: { type: Type.STRING },
              focalPointX: { type: Type.NUMBER },
              visualPrompt: { type: Type.STRING },
            },
            required: ['titleBn', 'titleEn', 'summary', 'visualMatchReason', 'setting', 'action', 'emotion', 'visualPrompt'],
          },
        },
      });

      const beat = JSON.parse((planRes.text ?? '{}').trim());
      const secRaw = typeof beat.secondaryCharacter === 'string' ? beat.secondaryCharacter : '';

      res.json({
        updatedBeat: {
          titleBn: String(beat.titleBn || scene.titleBn || 'পুনর্নির্মিত দৃশ্য').slice(0, 60),
          titleEn: String(beat.titleEn || scene.titleEn || 'Refined Scene').slice(0, 60),
          summary: String(beat.summary || scene.summary || '').slice(0, 180),
          visualMatchReason: String(beat.visualMatchReason || 'Re-directed to match voiceover literally').slice(0, 120),
          visualStorytelling: typeof beat.visualStorytelling === 'string' ? beat.visualStorytelling.slice(0, 220) : undefined,
          setting: pickValid(beat.setting, VALID_SETTINGS, scene.setting || 'park-nature'),
          timeOfDay: pickValid(beat.timeOfDay, VALID_TIMES, scene.timeOfDay || 'sunset'),
          weather: pickValid(beat.weather, VALID_WEATHERS, scene.weather || 'clear'),
          action: pickValid(beat.action, VALID_ACTIONS, scene.action || 'speaking-narrator'),
          emotion: pickValid(beat.emotion, VALID_EMOTIONS, scene.emotion || 'calm'),
          cameraShot: pickValid(beat.cameraShot, VALID_SHOTS, scene.cameraShot || 'medium-two-shot'),
          cameraMotion: pickValid(beat.cameraMotion, VALID_MOTIONS, scene.cameraMotion || 'dolly-in'),
          primaryCharacter: pickValid(beat.primaryCharacter, VALID_CHARACTERS, scene.primaryCharacter || 'narrator'),
          secondaryCharacter: VALID_CHARACTERS.includes(secRaw) ? secRaw : null,
          focalPointX: Math.max(0.35, Math.min(0.65, Number(beat.focalPointX) || 0.5)),
          visualPrompt: String(beat.visualPrompt || scene.visualPrompt || '').slice(0, 450),
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Single scene regeneration failed.';
      res.status(502).json({ error: message });
    }
  });

  // Mount Vite middleware in development or serve built static files in production
  const isProd = process.env.NODE_ENV === 'production';
  const distDir = path.resolve(__dirname, 'dist');

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (fs.existsSync(distDir)) {
    app.use(express.static(distDir, { maxAge: '1y', index: false }));
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Reeldaiii Studio server + WebSocket running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Reeldaiii Studio server:', err);
  process.exit(1);
});
