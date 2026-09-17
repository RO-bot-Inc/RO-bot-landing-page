// POST /api/future-headline  step 1: photo + prediction -> story JSON + signed image ticket
//                            step 2 (step:'image'): photo + ticket -> restaged lead photo
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
  readTicket,
  reserveDaily,
  sessionCookie,
  sessionCount,
  signTicket,
} from '../lib/future-headline/guard';
import { imageLooksRight, restagePhoto } from '../lib/future-headline/image';
import { writeStory } from '../lib/future-headline/story';
import { FhError, type Outcome, type Story, type StoryDraft } from '../lib/future-headline/types';

const EVENT_YEAR = 2026;
const HORIZONS = [1, 3, 5];
const MAX_BODY_BYTES = 5.5 * 1024 * 1024; // Netlify buffers at most 6 MB
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const STEP_BUDGET_MS = 26_000; // observed hard stop is about 30 s per request

interface ImageTicket {
  d: string; // scene brief
  l: string[]; // prop labels
  n: number; // people count, 0 if unknown
  c: boolean; // color edition
}

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

    const photo = readPhoto(body.photo);

    // Netlify ends synchronous functions at about 30 s on this site, so the
    // work is split into two short requests. Step 2 only runs with a ticket
    // that step 1 signed, which keeps the scene brief out of the client's hands.
    if (body.step === 'image') {
      const ticket = readTicket<ImageTicket>(cfg, body.ticket);
      const attempt = body.attempt === 2 ? 2 : 1;
      let image: string | null = null;
      let retry = false;
      try {
        const candidate = await restagePhoto(
          cfg, photo, ticket.d, ticket.n || 2, ticket.c, ticket.l,
          Math.min(cfg.imageTimeoutMs, STEP_BUDGET_MS - 1_000),
        );
        const left = STEP_BUDGET_MS - (Date.now() - started);
        // Only the first attempt is checked. A second failure would leave the
        // attendee with nothing better, so attempt 2 is accepted as drawn.
        if (attempt === 1 && ticket.n && left > 6_500 && !(await imageLooksRight(cfg, candidate, ticket.n, left - 1_500))) {
          retry = true;
        } else {
          image = candidate;
        }
      } catch (err) {
        console.warn('[future-headline] image attempt failed', attempt, (err as Error).message);
        retry = attempt === 1;
      }
      console.log(`[future-headline] image attempt=${attempt} ok=${!!image} retry=${retry} ms=${Date.now() - started}`);
      return json({ image, retry });
    }

    const count = sessionCount(cfg, req);
    if (count >= cfg.sessionCap) throw new FhError('session_cap', 429);
    const prediction = readPrediction(body.prediction, body.preset_id);
    await reserveDaily(cfg);

    // Luck of the draw. The attendee never configures either of these.
    const futureYear = EVENT_YEAR + HORIZONS[Math.floor(Math.random() * HORIZONS.length)];
    const outcome: Outcome = Math.random() < cfg.dystopiaProbability ? 'dystopia' : 'utopia';

    let draft: StoryDraft;
    let peopleCount = 0;
    let degraded = false;

    if (cfg.mode === 'mock') {
      draft = bankStory(prediction.presetId, outcome);
      await new Promise((r) => setTimeout(r, 1800));
    } else {
      try {
        const written = await writeStory(cfg, { photoBase64: photo, prediction: prediction.text, futureYear, outcome });
        draft = written;
        peopleCount = written.peopleCount;
      } catch (err) {
        if (err instanceof FhError) throw err;
        console.warn('[future-headline] text fallback', (err as Error).name);
        draft = bankStory(prediction.presetId, outcome);
        degraded = true;
      }
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
    // Mock mode has no image step: the renderer uses the attendee's own photo.
    const ticket =
      cfg.mode === 'live'
        ? signTicket<ImageTicket>(cfg, {
            d: draft.photo_direction,
            l: draft.prop_labels || [],
            n: peopleCount,
            c: futureYear - EVENT_YEAR >= 5,
          })
        : null;

    console.log(
      `[future-headline] story mode=${cfg.mode} outcome=${outcome} year=${futureYear} degraded=${degraded} ms=${Date.now() - started}`,
    );
    return json({ story, ticket, degraded }, 200, { 'set-cookie': sessionCookie(cfg, count + 1) });
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
