// POST /api/future-headline  photo + prediction -> story JSON + restaged lead photo
// GET  /api/future-headline  -> short-lived signed page token
//
// Nothing is persisted: the photo, prediction, and result live only for the
// duration of the request. Logs carry status codes and timings, never content.
import type { Config as FunctionConfig } from '@netlify/functions';
import { MAX_PREDICTION_CHARS, PRESETS } from '../../src/scripts/future-headline/presets';
import { bankStory } from '../lib/future-headline/bank';
import { config as loadConfig } from '../lib/future-headline/config';
import {
  checkOrigin,
  checkToken,
  issueToken,
  reserveDaily,
  sessionCookie,
  sessionCount,
} from '../lib/future-headline/guard';
import { imageLooksRight, restagePhoto } from '../lib/future-headline/image';
import { writeStory } from '../lib/future-headline/story';
import { FhError, type Outcome, type Story, type StoryDraft } from '../lib/future-headline/types';

const EVENT_YEAR = 2026;
const HORIZONS = [1, 3, 5];
const MAX_BODY_BYTES = 5.5 * 1024 * 1024; // Netlify buffers at most 6 MB
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const FUNCTION_BUDGET_MS = 54_000; // Netlify kills synchronous functions at 60 s

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers },
  });

function readPhoto(value: unknown): string {
  if (typeof value !== 'string' || value.length < 2000) throw new FhError('bad_photo', 400);
  if (value.length * 0.75 > MAX_PHOTO_BYTES) throw new FhError('bad_photo', 413);
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value)) throw new FhError('bad_photo', 400);
  // The client always re-encodes to JPEG, so anything else is not our client.
  const head = Buffer.from(value.slice(0, 8), 'base64');
  if (!(head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff)) throw new FhError('bad_photo', 400);
  return value;
}

function readPrediction(value: unknown, presetId: unknown): { text: string; presetId: string | null } {
  if (typeof presetId === 'string') {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) throw new FhError('unsafe', 400);
    return { text: preset.text, presetId: preset.id };
  }
  if (typeof value !== 'string') throw new FhError('unsafe', 400);
  // eslint-disable-next-line no-control-regex
  const text = value.replace(/[\x00-\x1f\x7f<>]/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length < 8 || text.length > MAX_PREDICTION_CHARS) throw new FhError('unsafe', 400);
  return { text, presetId: null };
}

export default async (req: Request) => {
  const cfg = loadConfig();
  const started = Date.now();

  try {
    if (!cfg.enabled) throw new FhError('disabled', 503);
    checkOrigin(req);

    if (req.method === 'GET') return json({ token: issueToken(cfg), mode: cfg.mode });
    if (req.method !== 'POST') return json({ error: 'upstream' }, 405);

    if (Number(req.headers.get('content-length') || 0) > MAX_BODY_BYTES) {
      throw new FhError('bad_photo', 413);
    }
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || body.website) throw new FhError('rate_limited', 400);
    checkToken(cfg, body.token);

    const count = sessionCount(cfg, req);
    if (count >= cfg.sessionCap) throw new FhError('session_cap', 429);

    const photo = readPhoto(body.photo);
    const prediction = readPrediction(body.prediction, body.preset_id);
    await reserveDaily(cfg);

    // Luck of the draw. The attendee never configures either of these.
    const futureYear = EVENT_YEAR + HORIZONS[Math.floor(Math.random() * HORIZONS.length)];
    const outcome: Outcome = Math.random() < cfg.dystopiaProbability ? 'dystopia' : 'utopia';
    const color = futureYear - EVENT_YEAR >= 5;

    let draft: StoryDraft;
    let peopleCount = 0;
    let image: string | null = null;
    let degraded = false;

    if (cfg.mode === 'mock') {
      draft = bankStory(prediction.presetId, outcome);
      await new Promise((r) => setTimeout(r, 1800));
    } else {
      try {
        const written = await writeStory(cfg, {
          photoBase64: photo,
          prediction: prediction.text,
          futureYear,
          outcome,
        });
        draft = written;
        peopleCount = written.peopleCount;
      } catch (err) {
        if (err instanceof FhError) throw err;
        console.warn('[future-headline] text fallback', (err as Error).name);
        draft = bankStory(prediction.presetId, outcome);
        degraded = true;
      }

      for (let attempt = 1; attempt <= 2 && !image; attempt++) {
        const remaining = FUNCTION_BUDGET_MS - (Date.now() - started);
        if (remaining < 12_000) break;
        try {
          const candidate = await restagePhoto(
            cfg,
            photo,
            draft.photo_direction,
            peopleCount || 2,
            color,
            Math.min(cfg.imageTimeoutMs, remaining - 2_000),
          );
          const canRetry = attempt === 1 && FUNCTION_BUDGET_MS - (Date.now() - started) > 30_000;
          if (!canRetry || !peopleCount || (await imageLooksRight(cfg, candidate, peopleCount))) {
            image = candidate;
          }
        } catch (err) {
          console.warn('[future-headline] image attempt failed', attempt, (err as Error).message);
        }
      }
      // If the image model is down or too slow, the attendee still gets a
      // front page: the renderer falls back to their own photo, newsprint-graded.
      if (!image) degraded = true;
    }

    const story: Story = {
      future_year: futureYear,
      outcome,
      headline: draft.headline,
      punchline: draft.punchline,
      deck: draft.deck,
      kicker: draft.kicker,
      alt_text: `Satirical newspaper front page dated September 24, ${futureYear}. Headline: ${draft.headline} ${draft.punchline} ${draft.alt_text}`,
    };

    console.log(
      `[future-headline] ok mode=${cfg.mode} outcome=${outcome} year=${futureYear} degraded=${degraded} ms=${Date.now() - started}`,
    );
    return json({ story, image, degraded }, 200, { 'set-cookie': sessionCookie(cfg, count + 1) });
  } catch (err) {
    if (err instanceof FhError) {
      console.log(`[future-headline] rejected code=${err.code}`);
      return json({ error: err.code }, err.status);
    }
    console.error('[future-headline] error', (err as Error).name);
    return json({ error: 'upstream' }, 500);
  }
};

export const config: FunctionConfig = {
  path: '/api/future-headline',
  // Generous on purpose: a whole conference can share one Wi-Fi IP address.
  rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
