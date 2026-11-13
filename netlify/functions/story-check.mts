// Warranty Story Checker (tenthgear.ai/warranty-story-checker/)
//
// GET  /api/story-check                      -> { token, mode, remaining }
// POST /api/story-check {action:'grade'}     -> graded result + signed report ticket
// POST /api/story-check {action:'report'}    -> emails every fix to the visitor
// POST /api/story-check {action:'unlock'}    -> after the demo form: unlimited checks today
//
// Nothing is stored: the story lives only for the request (and inside the
// signed ticket the visitor's browser holds for an hour). Blobs hold counts.
// Logs carry codes and timings, never story text or addresses.
import type { Config as FunctionConfig, Context } from '@netlify/functions';
import { MAX_FIELD_CHARS, type Result, findSample, sampleResult } from '../../src/scripts/story-check/shared';
import { ScError, config as loadConfig } from '../lib/story-check/config';
import { sendReport } from '../lib/story-check/email';
import { gradeLive, gradeMock } from '../lib/story-check/grade';
import {
  checkOrigin,
  checkToken,
  issueToken,
  readSession,
  readTicket,
  remaining,
  reserveDaily,
  reserveIp,
  reserveReport,
  sessionCookie,
  signTicket,
} from '../lib/story-check/guard';

const MAX_BODY_BYTES = 64 * 1024;
const EMAIL = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]{2,}$/;

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers },
  });

// 17-character VINs are removed before anything else sees the text.
function stripVins(text: string): string {
  return text.replace(/\b[A-HJ-NPR-Z0-9]{17}\b/gi, (m) => (/\d/.test(m) && /[a-z]/i.test(m) ? '[VIN]' : m));
}

function readField(value: unknown): string {
  if (typeof value !== 'string') throw new ScError('bad_input', 400);
  // eslint-disable-next-line no-control-regex
  const text = stripVins(value.replace(/\r\n?/g, '\n').replace(/[\x00-\x09\x0b-\x1f\x7f<>]/g, ' ').replace(/[ \t]+/g, ' ').trim());
  if (text.length < 2 || text.length > MAX_FIELD_CHARS) throw new ScError('bad_input', 400);
  return text;
}

export default async (req: Request, context: Context) => {
  const cfg = loadConfig();
  const started = Date.now();
  try {
    if (!cfg.enabled) throw new ScError('disabled', 503);
    checkOrigin(req);
    const session = readSession(cfg, req);

    if (req.method === 'GET') {
      return json({ token: issueToken(cfg), mode: cfg.mode, remaining: remaining(cfg, session) });
    }
    if (req.method !== 'POST') return json({ error: 'bad_input' }, 405);
    if (Number(req.headers.get('content-length') || 0) > MAX_BODY_BYTES) throw new ScError('bad_input', 413);
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || body.website) throw new ScError('bad_input', 400);
    checkToken(cfg, body.token);

    if (body.action === 'grade') {
      const cause = readField(body.cause);
      const correction = readField(body.correction);
      if (!session.unlocked && session.used >= cfg.freePerDay) {
        return json({ error: 'limit', remaining: 0 }, 429);
      }
      const sample = findSample(cause, correction);
      let result: Result;
      if (sample) {
        result = sampleResult(sample);
      } else {
        await reserveIp(cfg, context.ip);
        await reserveDaily(cfg);
        result = cfg.mode === 'live' ? await gradeLive(cfg, cause, correction) : gradeMock(cause, correction);
      }
      // Samples are pre-graded and cost nothing, so they don't use up a free check.
      const next = { used: session.used + (sample ? 0 : 1), unlocked: session.unlocked };
      console.log(`[story-check] graded mode=${sample ? 'sample' : cfg.mode} gpa=${result.gpa} notes=${result.notes.length} ms=${Date.now() - started}`);
      return json(
        { result, ticket: signTicket(cfg, result), remaining: remaining(cfg, next), mode: cfg.mode },
        200,
        { 'set-cookie': sessionCookie(cfg, next) },
      );
    }

    if (body.action === 'report') {
      const email = typeof body.email === 'string' ? body.email.trim() : '';
      if (!EMAIL.test(email) || email.length > 200) throw new ScError('bad_input', 400);
      const result = readTicket<Result>(cfg, body.ticket);
      await reserveReport(cfg, email);
      await sendReport(cfg, email, result);
      console.log(`[story-check] report sent ms=${Date.now() - started}`);
      return json({ ok: true });
    }

    if (body.action === 'unlock') {
      // Called right after the demo-request form posts. The lead itself is in Netlify Forms.
      const email = typeof body.email === 'string' ? body.email.trim() : '';
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (!EMAIL.test(email) || !name) throw new ScError('bad_input', 400);
      const next = { used: session.used, unlocked: true };
      console.log('[story-check] unlocked after demo form');
      return json({ ok: true, remaining: null }, 200, { 'set-cookie': sessionCookie(cfg, next) });
    }

    throw new ScError('bad_input', 400);
  } catch (err) {
    if (err instanceof ScError) {
      console.log(`[story-check] rejected code=${err.code}`);
      return json({ error: err.code }, err.status);
    }
    console.error('[story-check] error', (err as Error).name);
    return json({ error: 'upstream' }, 500);
  }
};

export const config: FunctionConfig = {
  path: '/api/story-check',
  rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
