// Invisible abuse controls: signed short-lived page token, signed session
// counter cookie, and a daily generation cap held in Netlify Blobs. The blob
// holds a number only. No photo, prediction, or result is ever stored.
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import type { Config } from './config';
import { FhError } from './types';

const TOKEN_MAX_AGE_MS = 45 * 60_000;
const COOKIE = 'fh_s';
const COOKIE_TTL_S = 12 * 60 * 60;

function sign(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function verify(secret: string, payload: string, sig: string): boolean {
  const expected = Buffer.from(sign(secret, payload));
  const given = Buffer.from(sig || '');
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function issueToken(cfg: Config): string {
  const payload = `${Date.now()}.${randomBytes(6).toString('base64url')}`;
  return `${payload}.${sign(cfg.signingSecret, payload)}`;
}

export function checkToken(cfg: Config, token: unknown) {
  if (typeof token !== 'string') throw new FhError('rate_limited', 429);
  const [ts, nonce, sig] = token.split('.');
  const age = Date.now() - Number(ts);
  if (
    !verify(cfg.signingSecret, `${ts}.${nonce}`, sig) ||
    !(age >= 0 && age <= TOKEN_MAX_AGE_MS)
  ) {
    throw new FhError('rate_limited', 429);
  }
}

const TICKET_TTL_MS = 5 * 60_000;

export function signTicket<T>(cfg: Config, data: T): string {
  const payload = Buffer.from(JSON.stringify({ ...data, exp: Date.now() + TICKET_TTL_MS })).toString('base64url');
  return `${payload}.${sign(cfg.signingSecret, payload)}`;
}

export function readTicket<T>(cfg: Config, ticket: unknown): T {
  if (typeof ticket !== 'string') throw new FhError('rate_limited', 400);
  const [payload, sig] = ticket.split('.');
  if (!verify(cfg.signingSecret, payload, sig)) throw new FhError('rate_limited', 400);
  const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
  if (!(data.exp > Date.now())) throw new FhError('rate_limited', 400);
  return data as T;
}

export function sessionCount(cfg: Config, req: Request): number {
  const raw = (req.headers.get('cookie') || '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`));
  if (!raw) return 0;
  const [count, exp, sig] = raw.slice(COOKIE.length + 1).split('.');
  if (!verify(cfg.signingSecret, `${count}.${exp}`, sig) || Number(exp) < Date.now()) return 0;
  return Number(count) || 0;
}

export function sessionCookie(cfg: Config, count: number): string {
  const payload = `${count}.${Date.now() + COOKIE_TTL_S * 1000}`;
  return `${COOKIE}=${payload}.${sign(cfg.signingSecret, payload)}; Path=/api/future-headline; Max-Age=${COOKIE_TTL_S}; HttpOnly; Secure; SameSite=Strict`;
}

export function checkOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return; // same-origin GETs and some in-app browsers omit it
  const host = new URL(origin).host;
  const self = new URL(req.url).host;
  if (host !== self && host !== 'tenthgear.ai') throw new FhError('rate_limited', 403);
}

function dayKey(): string {
  // Event-local (US Eastern) date, so the cap resets overnight in Boston.
  const d = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
  return `count-${d}`;
}

// Reserve one slot against the daily cap. Fails open if Blobs is unreachable:
// the per-IP rate limit and provider spend limits still bound the damage, and
// a storage hiccup should not take the experience down mid-event.
export async function reserveDaily(cfg: Config): Promise<void> {
  try {
    const store = getStore({ name: 'future-headline', consistency: 'strong' });
    const key = dayKey();
    const current = Number((await store.get(key)) || 0);
    if (current >= cfg.dailyCap) throw new FhError('capacity', 429);
    await store.set(key, String(current + 1));
  } catch (err) {
    if (err instanceof FhError) throw err;
    console.warn('[future-headline] daily cap store unavailable');
  }
}
