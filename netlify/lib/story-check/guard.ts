// Abuse and spend controls, same shape as Future Headline:
// - signed short-lived page token (GET hands it out)
// - signed HttpOnly cookie per browser: checks used today + demo unlock (5/day)
// - per-IP daily count and a global daily count in Netlify Blobs
// Blobs hold counts only, keyed by a salted hash of the IP. No story is stored.
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import { type Config, ScError } from './config';

const TOKEN_MAX_AGE_MS = 2 * 60 * 60_000;
const COOKIE = 'sc_d';
const COOKIE_TTL_S = 36 * 60 * 60;
const TICKET_TTL_MS = 60 * 60_000;

function sign(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function verify(secret: string, payload: string, sig: string): boolean {
  const expected = Buffer.from(sign(secret, payload));
  const given = Buffer.from(sig || '');
  return expected.length === given.length && timingSafeEqual(expected, given);
}

// US Eastern date, so the 5 free checks reset overnight for US dealers.
export function today(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
}

export function issueToken(cfg: Config): string {
  const payload = `${Date.now()}.${randomBytes(6).toString('base64url')}`;
  return `${payload}.${sign(cfg.signingSecret, payload)}`;
}

export function checkToken(cfg: Config, token: unknown) {
  if (typeof token !== 'string') throw new ScError('rate_limited', 429);
  const [ts, nonce, sig] = token.split('.');
  const age = Date.now() - Number(ts);
  if (!verify(cfg.signingSecret, `${ts}.${nonce}`, sig) || !(age >= 0 && age <= TOKEN_MAX_AGE_MS)) {
    throw new ScError('rate_limited', 429);
  }
}

export interface Session {
  used: number;
  unlocked: boolean;
}

export function readSession(cfg: Config, req: Request): Session {
  const raw = (req.headers.get('cookie') || '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`));
  if (!raw) return { used: 0, unlocked: false };
  const [day, used, unlocked, sig] = raw.slice(COOKIE.length + 1).split('.');
  if (!verify(cfg.signingSecret, `${day}.${used}.${unlocked}`, sig) || day !== today()) {
    return { used: 0, unlocked: false };
  }
  return { used: Number(used) || 0, unlocked: unlocked === '1' };
}

export function sessionCookie(cfg: Config, s: Session): string {
  const payload = `${today()}.${s.used}.${s.unlocked ? 1 : 0}`;
  return `${COOKIE}=${payload}.${sign(cfg.signingSecret, payload)}; Path=/api/story-check; Max-Age=${COOKIE_TTL_S}; HttpOnly; Secure; SameSite=Strict`;
}

export function remaining(cfg: Config, s: Session): number | null {
  return s.unlocked ? null : Math.max(0, cfg.freePerDay - s.used);
}

export function checkOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return;
  const host = new URL(origin).host;
  const self = new URL(req.url).host;
  if (host !== self && host !== 'tenthgear.ai' && host !== 'www.tenthgear.ai') throw new ScError('rate_limited', 403);
}

// The report ticket carries the graded result back to us when the visitor asks
// for the email, so nothing has to be stored server-side between the two calls.
export function signTicket<T>(cfg: Config, data: T): string {
  const payload = Buffer.from(JSON.stringify({ d: data, exp: Date.now() + TICKET_TTL_MS })).toString('base64url');
  return `${payload}.${sign(cfg.signingSecret, payload)}`;
}

export function readTicket<T>(cfg: Config, ticket: unknown): T {
  if (typeof ticket !== 'string') throw new ScError('bad_input', 400);
  const [payload, sig] = ticket.split('.');
  if (!verify(cfg.signingSecret, payload, sig)) throw new ScError('bad_input', 400);
  const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
  if (!(data.exp > Date.now())) throw new ScError('bad_input', 400);
  return data.d as T;
}

const hashed = (cfg: Config, value: string) =>
  createHash('sha256').update(`${cfg.signingSecret}:${value.toLowerCase()}`).digest('hex').slice(0, 24);

// Count one use against a per-day key. Fails open if Blobs is unreachable:
// the cookie, the IP limit on the function, and the OpenAI spend limit still hold.
async function bump(key: string, cap: number): Promise<void> {
  try {
    const store = getStore({ name: 'story-check', consistency: 'strong' });
    const current = Number((await store.get(key)) || 0);
    if (current >= cap) throw new ScError('capacity', 429);
    await store.set(key, String(current + 1));
  } catch (err) {
    if (err instanceof ScError) throw err;
    console.warn('[story-check] count store unavailable');
  }
}

export const reserveIp = (cfg: Config, ip: string) => bump(`ip-${today()}-${hashed(cfg, ip || 'unknown')}`, cfg.ipCap);
export const reserveDaily = (cfg: Config) => bump(`all-${today()}`, cfg.dailyCap);
export const reserveReport = (cfg: Config, email: string) =>
  bump(`mail-${today()}-${hashed(cfg, email)}`, cfg.reportsPerEmail);
