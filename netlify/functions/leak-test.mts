// GET  /api/leak-test  -> signed page token, Turnstile site key, which integrations are live
// POST /api/leak-test  { action: 'enroll' }      contact capture: captcha -> store -> email -> Notion -> notify Dave
//                      { action: 'fix' }         enrolled screen corrects the contact; fresh link, old one revoked
//                      { action: 'fresh-link' }  expired-link screen; same response whether or not the address is enrolled
//                      { action: 'resume' }      validates a resume token and returns the intake's public state
//
// Files never pass through here. Logs carry ids, modes, and status codes, never contact details.
import type { Config as FunctionConfig } from '@netlify/functions';
import { FIELD_MAX, REQUIRED_FIELDS, ROUTES, UTM_KEYS, type ContactField } from '../../src/scripts/leak-test/presets';
import { config as loadConfig, type Config } from '../lib/leak-test/config';
import { enrollmentEmail, internalEmail, send } from '../lib/leak-test/email';
import {
  checkOrigin,
  checkToken,
  hashToken,
  issueToken,
  newIntakeId,
  newResumeToken,
  readTicket,
  signTicket,
} from '../lib/leak-test/guard';
import { upsertRow } from '../lib/leak-test/notion';
import { normalizeEmail, openStore, type IntakeStore } from '../lib/leak-test/store';
import { LtError, type Contact, type EmailLog, type Intake, type Source } from '../lib/leak-test/types';

const TICKET_TTL_MS = 30 * 60_000; // how long the enrolled screen can still fix its email
const MAX_BODY_BYTES = 64_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const TOKEN_RE = /^[A-Za-z0-9_-]{32}$/;

type Body = Record<string, unknown>;
type NotifyKind = Parameters<typeof internalEmail>[1];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

const clean = (value: unknown, max: number) =>
  typeof value === 'string'
    ? // eslint-disable-next-line no-control-regex
      value.replace(/[\x00-\x1f\x7f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
    : '';

function readContact(value: unknown): Contact {
  const raw = (value && typeof value === 'object' ? value : {}) as Body;
  const c = {} as Record<ContactField, string>;
  for (const key of Object.keys(FIELD_MAX) as ContactField[]) c[key] = clean(raw[key], FIELD_MAX[key]);
  c.email = normalizeEmail(c.email);
  for (const key of REQUIRED_FIELDS) if (!c[key]) throw new LtError('invalid', 400);
  if (!EMAIL_RE.test(c.email)) throw new LtError('invalid', 400);
  const contact: Contact = { name: c.name, email: c.email, dealership: c.dealership, title: c.title };
  if (c.phone) contact.phone = c.phone;
  if (c.dms) contact.dms = c.dms;
  if (c.lane) contact.lane = c.lane;
  return contact;
}

function readSource(value: unknown): Source {
  const raw = (value && typeof value === 'object' ? value : {}) as Body;
  const source: Source = {};
  for (const key of UTM_KEYS) {
    const v = clean(raw[key], 80);
    if (v) source[key] = v;
  }
  const landing = clean(raw.landing, 200);
  if (landing.startsWith('/')) source.landing = landing;
  source.device = raw.device === 'desktop' ? 'desktop' : 'phone';
  return source;
}

async function verifyCaptcha(cfg: Config, token: unknown, req: Request) {
  if (cfg.captcha === 'off') return;
  if (typeof token !== 'string' || !token || token.length > 2048) throw new LtError('captcha', 400);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      secret: cfg.turnstileSecret,
      response: token,
      remoteip: req.headers.get('x-nf-client-connection-ip') || undefined,
    }),
  });
  const data = (await res.json().catch(() => ({ success: false }))) as { success?: boolean };
  if (!data.success) throw new LtError('captcha', 400);
}

// A new token replaces the old one, so a link in the wrong inbox stops working.
function issueResumeToken(cfg: Config, intake: Intake, now: string): string {
  const token = newResumeToken();
  intake.token = {
    hash: hashToken(token),
    issuedAt: now,
    expiresAt: new Date(Date.parse(now) + cfg.tokenDays * 86_400_000).toISOString(),
    revoked: false,
  };
  return token;
}

// Email first (the enrolled screen promises it), then Notion with retry, then
// Dave's notification regardless. Notion and the notification never block.
async function deliver(
  cfg: Config,
  req: Request,
  store: IntakeStore,
  intake: Intake,
  token: string,
  kind: EmailLog['kind'],
  notify: NotifyKind,
) {
  const origin = cfg.publicOrigin || new URL(req.url).origin;
  const mail = enrollmentEmail(intake, `${origin}${ROUTES.resume}#${token}`);
  const id = await send(cfg, { from: cfg.fromDave, to: intake.contact.email, replyTo: 'dave@tenthgear.ai', ...mail });
  const entry: EmailLog = { at: new Date().toISOString(), kind, subject: mail.subject, to: intake.contact.email, id };
  intake.emails.push(entry);
  if (cfg.notion === 'live') {
    try {
      intake.notionPageId = await upsertRow(cfg, intake, entry);
    } catch (err) {
      console.warn('[leak-test] notion failed', (err as Error).message);
    }
  }
  intake.updatedAt = entry.at;
  await store.put(intake);
  try {
    await send(cfg, { from: cfg.fromSystem, to: cfg.notifyTo, ...internalEmail(intake, notify) });
  } catch {
    console.warn('[leak-test] notification failed');
  }
}

const enrolledResponse = (cfg: Config, intake: Intake) =>
  json({
    id: intake.id,
    ticket: signTicket(cfg, { id: intake.id }, TICKET_TTL_MS),
    name: intake.contact.name,
    email: intake.contact.email,
  });

async function enroll(cfg: Config, req: Request, store: IntakeStore, body: Body) {
  checkToken(cfg, body.token);
  const contact = readContact(body.contact);
  const source = readSource(body.source);
  await verifyCaptcha(cfg, body.turnstile, req);

  const now = new Date().toISOString();
  // Same address again means a fresh link, not a second intake. First-touch
  // attribution is kept.
  const existing = await store.byEmail(contact.email);
  const intake: Intake = existing
    ? { ...existing, contact, updatedAt: now }
    : {
        id: newIntakeId(),
        createdAt: now,
        updatedAt: now,
        contact,
        source,
        token: { hash: '', issuedAt: now, expiresAt: now, revoked: true },
        materials: { status: 'not_started', files: 0, links: 0, notes: '', sentAt: null },
        booking: { status: 'not_booked', at: null, eventUri: null },
        notionPageId: null,
        emails: [],
      };
  const token = issueResumeToken(cfg, intake, now);
  await store.put(intake);
  await deliver(cfg, req, store, intake, token, 'enrollment', existing ? 're-enrolled' : 'enrolled');
  console.log(`[leak-test] enrolled id=${intake.id} repeat=${!!existing} store=${cfg.store} email=${cfg.email} notion=${cfg.notion} captcha=${cfg.captcha}`);
  return enrolledResponse(cfg, intake);
}

async function fix(cfg: Config, req: Request, store: IntakeStore, body: Body) {
  const { id } = readTicket<{ id: string }>(cfg, body.ticket);
  const intake = await store.get(id);
  if (!intake) throw new LtError('not_found', 404);
  intake.contact = readContact(body.contact);
  const now = new Date().toISOString();
  intake.updatedAt = now;
  const token = issueResumeToken(cfg, intake, now);
  await store.put(intake);
  await deliver(cfg, req, store, intake, token, 'email-fixed', 'email-fixed');
  console.log(`[leak-test] fixed id=${intake.id}`);
  return enrolledResponse(cfg, intake);
}

// The response is identical whether or not the address is enrolled, so this
// cannot be used to discover who signed up.
async function freshLink(cfg: Config, req: Request, store: IntakeStore, body: Body) {
  checkToken(cfg, body.token);
  const email = normalizeEmail(clean(body.email, FIELD_MAX.email));
  if (EMAIL_RE.test(email)) {
    const intake = await store.byEmail(email);
    if (intake) {
      try {
        const now = new Date().toISOString();
        intake.updatedAt = now;
        const token = issueResumeToken(cfg, intake, now);
        await store.put(intake);
        await deliver(cfg, req, store, intake, token, 'fresh-link', 'fresh-link');
        console.log(`[leak-test] fresh link id=${intake.id}`);
      } catch (err) {
        console.error('[leak-test] fresh link failed', (err as Error).message);
      }
    }
  }
  return json({ ok: true });
}

async function resume(cfg: Config, store: IntakeStore, body: Body) {
  const token = typeof body.token === 'string' ? body.token : '';
  if (!TOKEN_RE.test(token)) throw new LtError('not_found', 404);
  const intake = await store.byTokenHash(hashToken(token));
  if (!intake || intake.token.revoked) throw new LtError('not_found', 404);
  if (Date.parse(intake.token.expiresAt) < Date.now()) throw new LtError('expired', 410);
  const { contact, materials, booking } = intake;
  return json({
    intake: {
      name: contact.name,
      email: contact.email,
      dealership: contact.dealership,
      materials: { status: materials.status, files: materials.files, links: materials.links },
      booking: { status: booking.status, at: booking.at },
    },
  });
}

export default async (req: Request) => {
  const cfg = loadConfig();
  try {
    if (!cfg.enabled) throw new LtError('disabled', 503);
    checkOrigin(req);

    if (req.method === 'GET') {
      return json({
        token: issueToken(cfg),
        turnstileSiteKey: cfg.turnstileSiteKey,
        mode: { store: cfg.store, email: cfg.email, notion: cfg.notion, captcha: cfg.captcha },
      });
    }
    if (req.method !== 'POST') return json({ error: 'upstream' }, 405);
    if (Number(req.headers.get('content-length') || 0) > MAX_BODY_BYTES) throw new LtError('invalid', 413);

    const body = (await req.json().catch(() => null)) as Body | null;
    if (!body || body.website) throw new LtError('rate_limited', 400); // honeypot
    const store = openStore(cfg);

    switch (body.action) {
      case 'enroll':
        return await enroll(cfg, req, store, body);
      case 'fix':
        return await fix(cfg, req, store, body);
      case 'fresh-link':
        return await freshLink(cfg, req, store, body);
      case 'resume':
        return await resume(cfg, store, body);
      default:
        throw new LtError('invalid', 400);
    }
  } catch (err) {
    if (err instanceof LtError) {
      console.log(`[leak-test] rejected code=${err.code}`);
      return json({ error: err.code }, err.status);
    }
    console.error('[leak-test] error', (err as Error).name, (err as Error).message);
    return json({ error: 'upstream' }, 500);
  }
};

export const config: FunctionConfig = {
  path: '/api/leak-test',
  // A whole conference can share one Wi-Fi IP address.
  rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
