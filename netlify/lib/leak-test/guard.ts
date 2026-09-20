// Signed page token (keeps scripted POSTs out), signed short-lived tickets
// (lets the enrolled screen fix its own email), origin check, and the resume
// token helpers. Only the hash of a resume token is ever stored.
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Config } from './config';
import { LtError } from './types';

const PAGE_TOKEN_MAX_AGE_MS = 45 * 60_000;

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
  if (typeof token !== 'string') throw new LtError('rate_limited', 429);
  const [ts, nonce, sig] = token.split('.');
  const age = Date.now() - Number(ts);
  if (!verify(cfg.signingSecret, `${ts}.${nonce}`, sig) || !(age >= 0 && age <= PAGE_TOKEN_MAX_AGE_MS)) {
    throw new LtError('rate_limited', 429);
  }
}

export function signTicket<T>(cfg: Config, data: T, ttlMs: number): string {
  const payload = Buffer.from(JSON.stringify({ ...data, exp: Date.now() + ttlMs })).toString('base64url');
  return `${payload}.${sign(cfg.signingSecret, payload)}`;
}

// Every ticket carries an audience (`aud`) and every reader names the one it
// accepts, so a ticket minted for one purpose never satisfies another reader.
export function readTicket<T>(cfg: Config, ticket: unknown, aud: string): T {
  if (typeof ticket !== 'string') throw new LtError('expired', 400);
  const [payload, sig] = ticket.split('.');
  if (!verify(cfg.signingSecret, payload, sig)) throw new LtError('expired', 400);
  const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
  if (!(data.exp > Date.now())) throw new LtError('expired', 400);
  if (data.aud !== aud) throw new LtError('expired', 400);
  return data as T;
}

export function checkOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return; // same-origin GETs and some in-app browsers omit it
  const host = new URL(origin).host;
  const self = new URL(req.url).host;
  if (host !== self && host !== 'tenthgear.ai') throw new LtError('rate_limited', 403);
}

// 192 random bits, URL-safe, no padding. Rides in the URL fragment of the
// private link so it never reaches analytics or server logs.
export function newResumeToken(): string {
  return randomBytes(24).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function newIntakeId(): string {
  return randomBytes(9).toString('base64url');
}
