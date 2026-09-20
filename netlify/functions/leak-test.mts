// GET  /api/leak-test  -> signed page token, Turnstile site key, which integrations are live
// POST /api/leak-test  { action }
//   enroll          contact capture: captcha -> store -> email -> Notion -> notify Dave
//   fix             enrolled screen corrects the contact; fresh link, old ones revoked
//   fresh-link      expired-link screen; same response whether or not the address is enrolled
//   resume          validates a resume token and returns the workspace state
//   upload-start    checks type, size, and the 5 GB total, then opens a resumable
//                   session in Cloud Storage for the browser to upload into directly
//   upload-done     confirms the object landed with the declared size
//   upload-remove   deletes a file
//   save            links and notes (autosaved)
//   materials-done  "Done sharing"
//   booked          the Calendly embed reported event_scheduled
//   admin-view      Dave's file page: intake plus ten-minute download links
//   admin-revoke    kills every live resume link for an intake
//
// File bytes never pass through here. Logs carry ids, modes, and status codes, never contact details.
import type { Config as FunctionConfig } from '@netlify/functions';
import {
  CALENDLY_URL,
  FIELD_MAX,
  MAX_FILES,
  MAX_INTAKE_BYTES,
  MAX_LINKS,
  MAX_LINK_CHARS,
  MAX_NOTES_CHARS,
  REQUIRED_FIELDS,
  UTM_KEYS,
  fileExtension,
  rejectFile,
  type ContactField,
} from '../../src/scripts/leak-test/presets';
import { config as loadConfig, type Config } from '../lib/leak-test/config';
import { enrollmentEmail, internalEmail, send, type InternalKind } from '../lib/leak-test/email';
import { Firestore } from '../lib/leak-test/firestore';
import { Storage } from '../lib/leak-test/gcs';
import { checkOrigin, checkToken, hashToken, issueToken, newIntakeId, readTicket, signTicket } from '../lib/leak-test/guard';
import { adminLink, holdsLiveToken, isOpen, issueResumeToken, liveToken, publicOrigin, readAdminTicket, resumeLink } from '../lib/leak-test/links';
import { updateProgress, upsertRow } from '../lib/leak-test/notion';
import { normalizeEmail, openStore, type IntakeStore } from '../lib/leak-test/store';
import { LtError, type Contact, type EmailLog, type Intake, type IntakeFile, type Source } from '../lib/leak-test/types';

const TICKET_TTL_MS = 10 * 60_000; // how long the enrolled screen can still fix a typo in its email
const UPLOAD_ACTIVE_MS = 15 * 60_000; // an upload in flight holds reminders this long past its last call
const MAX_BODY_BYTES = 64_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const TOKEN_RE = /^[A-Za-z0-9_-]{32}$/;

type Body = Record<string, unknown>;

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

const nowIso = () => new Date().toISOString();

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

const storage = (cfg: Config) => (cfg.uploads === 'gcs' ? new Storage(new Firestore(cfg.serviceAccount).sa, cfg.storageBucket) : null);

async function notify(cfg: Config, req: Request, intake: Intake, kind: InternalKind) {
  try {
    await send(cfg, { from: cfg.fromSystem, to: cfg.notifyTo, ...internalEmail(intake, kind, adminLink(cfg, publicOrigin(cfg, req), intake), cfg.uploads) });
  } catch {
    console.warn('[leak-test] notification failed');
  }
}

async function syncNotion(cfg: Config, intake: Intake, logLine?: string) {
  if (cfg.notion !== 'live') return;
  try {
    await updateProgress(cfg, intake, logLine);
  } catch (err) {
    console.warn('[leak-test] notion update failed', (err as Error).message);
  }
}

// Email first (the enrolled screen promises it), then Notion with retry, then
// Dave's notification regardless. Notion and the notification never block.
async function deliver(cfg: Config, req: Request, store: IntakeStore, intake: Intake, token: string, kind: EmailLog['kind'], notifyKind: InternalKind) {
  const origin = publicOrigin(cfg, req);
  const mail = enrollmentEmail(intake, resumeLink(origin, token));
  const id = await send(cfg, { from: cfg.fromDave, to: intake.contact.email, replyTo: 'dave@tenthgear.ai', ...mail });
  const entry: EmailLog = { at: nowIso(), kind, subject: mail.subject, to: intake.contact.email, id };
  intake.emails.push(entry);
  let pageId: string | null = null;
  if (cfg.notion === 'live') {
    try {
      pageId = await upsertRow(cfg, intake, entry, adminLink(cfg, origin, intake));
    } catch (err) {
      console.warn('[leak-test] notion failed', (err as Error).message);
    }
  }
  // Merge into the current record: the workspace may have moved on while the
  // email went out. The email is already in the inbox, so a book-keeping
  // failure here is logged, never surfaced as a failed enrollment. Older
  // links are retired only now, once the new one is demonstrably in an inbox;
  // a Resend outage therefore never leaves a participant with no link at all.
  let fresh = intake;
  if (pageId) intake.notionPageId = pageId;
  const keep = hashToken(token);
  try {
    fresh = await store.update(intake.id, (i) => {
      i.emails.push(entry);
      if (pageId) i.notionPageId = pageId;
      i.updatedAt = entry.at;
      // Every earlier link, reminders included: "the old link no longer works" is a promise.
      for (const t of i.tokens) if (t.hash !== keep) t.revoked = true;
    });
  } catch (err) {
    console.error(`[leak-test] email sent but not logged id=${intake.id}`, (err as Error).message);
  }
  await notify(cfg, req, fresh, notifyKind);
}

// The fix ticket is minted only for a brand-new intake, bound to the address
// it was created with; a repeat enrollment gets none (the caller has not
// proven they own that inbox), and the page hides "Fix it" accordingly.
const fixTicket = (cfg: Config, intake: Intake) => signTicket(cfg, { id: intake.id, aud: 'fix', email: intake.contact.email }, TICKET_TTL_MS);

const enrolledResponse = (intake: Intake, ticket: string) =>
  json({ id: intake.id, ticket, name: intake.contact.name, email: intake.contact.email });

// ------------------------------------------------------------ phone path
async function enroll(cfg: Config, req: Request, store: IntakeStore, body: Body) {
  checkToken(cfg, body.token);
  const contact = readContact(body.contact);
  const source = readSource(body.source);
  await verifyCaptcha(cfg, body.turnstile, req);

  const now = nowIso();
  // Same address again means a fresh link to the address already on file, not
  // a second intake: nothing the caller typed replaces what is there, and no
  // fix ticket comes back. Only a purged intake is closed for good (the same
  // address then starts a new one); a revoke by Dave is undone by this, as it
  // is by fresh-link, which is what revoke is for. First-touch attribution is
  // kept. The previous link is retired in deliver(), after the new one is sent.
  const existing = await store.byEmail(contact.email);
  let token = '';
  let ticket = '';
  let intake: Intake;
  const reuse = existing && !existing.purgedAt;
  if (reuse) {
    intake = await store.update(existing.id, (i) => {
      if (i.purgedAt) throw new LtError('not_found', 404);
      i.updatedAt = now;
      token = issueResumeToken(cfg, i, now, 'email', false);
    });
  } else {
    intake = {
      id: newIntakeId(),
      createdAt: now,
      updatedAt: now,
      contact,
      source,
      tokens: [],
      materials: { status: 'not_started', files: 0, links: 0, notes: '', sentAt: null },
      files: [],
      links: [],
      booking: { status: 'not_booked', at: null, eventUri: null, inviteeUri: null },
      lastActivityAt: now,
      uploadActiveUntil: null,
      reminders: {},
      notionPageId: null,
      emails: [],
      purgedAt: null,
      purgeLoggedAt: null,
    };
    token = issueResumeToken(cfg, intake, now, 'email', true);
    await store.put(intake); // brand new record: nobody else can be writing it
    ticket = fixTicket(cfg, intake);
  }
  await deliver(cfg, req, store, intake, token, 'enrollment', reuse ? 're-enrolled' : 'enrolled');
  console.log(`[leak-test] enrolled id=${intake.id} repeat=${!!reuse} store=${cfg.store} email=${cfg.email} notion=${cfg.notion} captcha=${cfg.captcha}`);
  return enrolledResponse(intake, ticket);
}

// Same guards as enroll (page token, captcha) plus a ticket bound to the
// intake AND the address it was created with: once the address has moved,
// the ticket is spent, and a new one comes back bound to the new address.
// A fix is a typo correction on the enrolled screen, so it is refused the
// moment the intake shows any life beyond enrollment (a link was opened and
// used, a booking exists): a ticket held by someone who pre-registered another
// person's address cannot re-address a workspace that person has started using.
const untouched = (i: Intake) =>
  i.materials.status === 'not_started' && !i.files.length && !i.links.length && !i.materials.notes && i.booking.status !== 'booked';

async function fix(cfg: Config, req: Request, store: IntakeStore, body: Body) {
  checkToken(cfg, body.token);
  const claim = readTicket<{ id: string; email: string }>(cfg, body.ticket, 'fix');
  const contact = readContact(body.contact);
  await verifyCaptcha(cfg, body.turnstile, req);
  const now = nowIso();
  let token = '';
  const intake = await store.update(claim.id, (i) => {
    if (!isOpen(i) || i.contact.email !== claim.email || !untouched(i)) throw new LtError('expired', 400);
    i.contact = contact;
    i.updatedAt = now;
    // Older links die right here, not after the send: they point at an address that was wrong.
    token = issueResumeToken(cfg, i, now, 'email', true);
  });
  await deliver(cfg, req, store, intake, token, 'email-fixed', 'email-fixed');
  console.log(`[leak-test] fixed id=${intake.id}`);
  return enrolledResponse(intake, fixTicket(cfg, intake));
}

// The response is identical whether or not the address is enrolled, so this
// cannot be used to discover who signed up.
async function freshLink(cfg: Config, req: Request, store: IntakeStore, body: Body) {
  checkToken(cfg, body.token);
  const email = normalizeEmail(clean(body.email, FIELD_MAX.email));
  if (EMAIL_RE.test(email)) {
    const found = await store.byEmail(email);
    if (found && !found.purgedAt) {
      try {
        const now = nowIso();
        let token = '';
        const intake = await store.update(found.id, (i) => {
          // Re-decided on the fresh copy: a purge since the lookup wins. A
          // revoke does not: fresh-link is how a revoked participant recovers.
          if (i.purgedAt) throw new LtError('not_found', 404);
          i.updatedAt = now;
          token = issueResumeToken(cfg, i, now, 'email', false);
        });
        await deliver(cfg, req, store, intake, token, 'fresh-link', 'fresh-link');
        console.log(`[leak-test] fresh link id=${intake.id}`);
      } catch (err) {
        if (!(err instanceof LtError && err.code === 'not_found')) console.error('[leak-test] fresh link failed', (err as Error).message);
      }
    }
  }
  return json({ ok: true });
}

// ------------------------------------------------------------- workspace
// The token check here is on a snapshot; every mutator re-asserts it on the
// fresh copy with assertLive(), so a revoke or purge that lands in between wins.
async function authed(store: IntakeStore, body: Body): Promise<{ intake: Intake; hash: string }> {
  const token = typeof body.token === 'string' ? body.token : '';
  if (!TOKEN_RE.test(token)) throw new LtError('not_found', 404);
  const hash = hashToken(token);
  const intake = await store.byTokenHash(hash);
  if (!intake || !liveToken(intake, hash) || intake.purgedAt) throw new LtError('not_found', 404);
  return { intake, hash };
}

function assertLive(intake: Intake, hash: string) {
  if (!holdsLiveToken(intake, hash)) throw new LtError('not_found', 404);
}

const usedBytes = (intake: Intake) => intake.files.reduce((n, f) => n + f.size, 0);

function workspaceState(cfg: Config, intake: Intake) {
  const { contact, materials, booking } = intake;
  return {
    id: intake.id, // not a credential; lets the page key per-participant state
    name: contact.name,
    email: contact.email,
    dealership: contact.dealership,
    materials,
    files: intake.files.map(({ id, name, size, status }) => ({ id, name, size, status })),
    links: intake.links,
    booking: {
      status: booking.status,
      at: booking.at,
      // Calendly's reschedule page for this invitee, when the embed told us who they are.
      rescheduleUrl: booking.inviteeUri ? `https://calendly.com/reschedulings/${booking.inviteeUri.split('/').pop()}` : null,
    },
    usedBytes: usedBytes(intake),
    uploads: cfg.uploads,
    calendly: CALENDLY_URL,
  };
}

function touch(intake: Intake) {
  intake.lastActivityAt = nowIso();
  intake.updatedAt = intake.lastActivityAt;
  if (intake.materials.status === 'not_started' && (intake.files.length || intake.links.length || intake.materials.notes)) {
    intake.materials.status = 'in_progress';
  }
  intake.materials.files = intake.files.filter((f) => f.status === 'done').length;
  intake.materials.links = intake.links.length;
}

async function resume(cfg: Config, store: IntakeStore, body: Body) {
  const { intake } = await authed(store, body);
  return json({ intake: workspaceState(cfg, intake) });
}

async function uploadStart(cfg: Config, req: Request, store: IntakeStore, body: Body) {
  const { intake, hash } = await authed(store, body);
  // No bucket on this deploy: say so instead of pretending a transfer happened.
  if (cfg.uploads === 'off') throw new LtError('uploads_off', 503);
  const name = clean(body.name, 200) || 'file';
  const size = Number(body.size);
  const type = clean(body.type, 120) || 'application/octet-stream';
  if (!Number.isInteger(size)) throw new LtError('invalid', 400);
  if (rejectFile(name, size)) throw new LtError('bad_file', 400);
  if (intake.files.length >= MAX_FILES) throw new LtError('too_large', 400);
  if (usedBytes(intake) + size > MAX_INTAKE_BYTES) throw new LtError('too_large', 413);

  const id = newIntakeId();
  const safeName = `${id}.${fileExtension(name)}`;
  const file: IntakeFile = {
    id,
    name,
    size,
    type,
    object: `intakes/${intake.id}/${safeName}`,
    status: 'pending',
    createdAt: nowIso(),
    doneAt: null,
  };
  const gcs = storage(cfg);
  const uploadUrl = gcs ? await gcs.startResumable(file.object, type, size, req.headers.get('origin') || publicOrigin(cfg, req)) : null;
  // Limits are checked again inside the conditional write: two tabs adding
  // files at once cannot slip past the 5 GB total between them.
  const updated = await store.update(intake.id, (i) => {
    assertLive(i, hash);
    if (i.files.length >= MAX_FILES || usedBytes(i) + size > MAX_INTAKE_BYTES) throw new LtError('too_large', 413);
    i.files.push(file);
    i.uploadActiveUntil = new Date(Date.now() + UPLOAD_ACTIVE_MS).toISOString();
    touch(i);
  });
  console.log(`[leak-test] upload start id=${intake.id} file=${id} bytes=${size} mode=${cfg.uploads}`);
  return json({ fileId: id, uploadUrl, usedBytes: usedBytes(updated) });
}

async function uploadDone(cfg: Config, store: IntakeStore, body: Body) {
  const { intake, hash } = await authed(store, body);
  const known = intake.files.find((f) => f.id === body.fileId);
  if (!known) throw new LtError('not_found', 404);
  const gcs = storage(cfg);
  if (gcs) {
    const size = await gcs.size(known.object);
    if (size !== known.size) throw new LtError('bad_file', 409);
  }
  const updated = await store.update(intake.id, (i) => {
    assertLive(i, hash);
    const file = i.files.find((f) => f.id === known.id);
    if (!file) throw new LtError('not_found', 404);
    file.status = 'done';
    file.doneAt = nowIso();
    i.uploadActiveUntil = i.files.some((f) => f.status === 'pending') ? new Date(Date.now() + UPLOAD_ACTIVE_MS).toISOString() : null;
    touch(i);
  });
  await syncNotion(cfg, updated);
  return json({ intake: workspaceState(cfg, updated) });
}

// Still uploading: keeps reminders away while a big transfer runs.
async function uploadPing(cfg: Config, store: IntakeStore, body: Body) {
  const { intake, hash } = await authed(store, body);
  await store.update(intake.id, (i) => {
    assertLive(i, hash);
    i.uploadActiveUntil = new Date(Date.now() + UPLOAD_ACTIVE_MS).toISOString();
    i.lastActivityAt = nowIso();
  });
  return json({ ok: true });
}

async function uploadRemove(cfg: Config, store: IntakeStore, body: Body) {
  const { intake, hash } = await authed(store, body);
  const known = intake.files.find((f) => f.id === body.fileId);
  if (!known) return json({ intake: workspaceState(cfg, intake) });
  // Row first, then object: a row must never outlive its object.
  const updated = await store.update(intake.id, (i) => {
    assertLive(i, hash);
    i.files = i.files.filter((f) => f.id !== known.id);
    touch(i);
  });
  const gcs = storage(cfg);
  if (gcs) await gcs.remove(known.object).catch(() => console.warn(`[leak-test] stray object kept file=${known.id}`));
  await syncNotion(cfg, updated);
  return json({ intake: workspaceState(cfg, updated) });
}

function readLinks(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const raw of value.slice(0, MAX_LINKS)) {
    const s = clean(raw, MAX_LINK_CHARS);
    if (!s) continue;
    try {
      const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
      if (u.protocol === 'http:' || u.protocol === 'https:') out.push(u.href);
    } catch {
      /* not a link; dropped */
    }
  }
  return out;
}

async function save(cfg: Config, store: IntakeStore, body: Body) {
  const { intake, hash } = await authed(store, body);
  const links = readLinks(body.links);
  const notes = typeof body.notes === 'string' ? body.notes.replace(/[^\S\n]+/g, ' ').trim().slice(0, MAX_NOTES_CHARS) : '';
  const updated = await store.update(intake.id, (i) => {
    assertLive(i, hash);
    i.links = links;
    i.materials.notes = notes;
    touch(i);
  });
  await syncNotion(cfg, updated);
  return json({ intake: workspaceState(cfg, updated) });
}

async function materialsDone(cfg: Config, req: Request, store: IntakeStore, body: Body) {
  const { intake, hash } = await authed(store, body);
  const dropped: IntakeFile[] = [];
  const updated = await store.update(intake.id, (i) => {
    assertLive(i, hash);
    // Pending files are left out, as the confirmation dialog said.
    dropped.length = 0;
    dropped.push(...i.files.filter((f) => f.status !== 'done'));
    i.files = i.files.filter((f) => f.status === 'done');
    i.materials.status = 'sent';
    i.materials.sentAt = nowIso();
    touch(i);
  });
  // Their half-uploaded objects, if any landed, are not kept either.
  const gcs = storage(cfg);
  if (gcs) for (const f of dropped) await gcs.remove(f.object).catch(() => console.warn(`[leak-test] stray object kept file=${f.id}`));
  await syncNotion(cfg, updated, `Materials sent: ${updated.materials.files} files, ${updated.materials.links} links${updated.materials.notes ? ', a note' : ''}.`);
  await notify(cfg, req, updated, updated.booking.status === 'booked' ? 'all-set' : 'materials-sent');
  console.log(`[leak-test] materials sent id=${updated.id} files=${updated.materials.files} links=${updated.materials.links}`);
  return json({ intake: workspaceState(cfg, updated) });
}

async function calendlyStart(cfg: Config, eventUri: string): Promise<string | null> {
  if (!cfg.calendlyToken) return null;
  try {
    const res = await fetch(eventUri, { headers: { authorization: `Bearer ${cfg.calendlyToken}` } });
    if (!res.ok) return null;
    const data = (await res.json()) as { resource?: { start_time?: string } };
    return data.resource?.start_time || null;
  } catch {
    return null;
  }
}

async function booked(cfg: Config, req: Request, store: IntakeStore, body: Body) {
  const { intake, hash } = await authed(store, body);
  const eventUri = clean(body.eventUri, 200);
  const inviteeUri = clean(body.inviteeUri, 200);
  if (!/^https:\/\/api\.calendly\.com\/scheduled_events\/[A-Za-z0-9-]+$/.test(eventUri)) throw new LtError('invalid', 400);
  const booking: Intake['booking'] = {
    status: 'booked',
    at: await calendlyStart(cfg, eventUri),
    eventUri,
    inviteeUri: /^https:\/\/api\.calendly\.com\//.test(inviteeUri) ? inviteeUri : null,
  };
  const updated = await store.update(intake.id, (i) => {
    assertLive(i, hash);
    i.booking = booking;
    touch(i);
  });
  await syncNotion(cfg, updated, `Booked the review session${booking.at ? ` for ${booking.at}` : ''} (Calendly).`);
  await notify(cfg, req, updated, updated.materials.status === 'sent' ? 'all-set' : 'booked');
  console.log(`[leak-test] booked id=${updated.id} time=${booking.at ? 'known' : 'unknown'}`);
  return json({ intake: workspaceState(cfg, updated) });
}

// ----------------------------------------------------------------- admin
async function adminView(cfg: Config, store: IntakeStore, body: Body) {
  const id = readAdminTicket(cfg, body.ticket);
  const intake = await store.get(id);
  if (!intake) throw new LtError('not_found', 404);
  const gcs = storage(cfg);
  return json({
    intake: {
      ...workspaceState(cfg, intake),
      contact: intake.contact,
      source: intake.source,
      createdAt: intake.createdAt,
      lastActivityAt: intake.lastActivityAt,
      purgedAt: intake.purgedAt,
      liveLinks: intake.tokens.filter((t) => !t.revoked).length,
      emails: intake.emails,
      files: intake.files.map((f) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        status: f.status,
        url: gcs && f.status === 'done' ? gcs.signedDownloadUrl(f.object, f.name) : null,
      })),
    },
  });
}

async function adminRevoke(cfg: Config, store: IntakeStore, body: Body) {
  const id = readAdminTicket(cfg, body.ticket);
  await store.update(id, (i) => {
    for (const t of i.tokens) t.revoked = true;
    i.updatedAt = nowIso();
  });
  console.log(`[leak-test] links revoked id=${id}`);
  return json({ ok: true });
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
        mode: { store: cfg.store, uploads: cfg.uploads, email: cfg.email, notion: cfg.notion, captcha: cfg.captcha },
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
      case 'upload-start':
        return await uploadStart(cfg, req, store, body);
      case 'upload-ping':
        return await uploadPing(cfg, store, body);
      case 'upload-done':
        return await uploadDone(cfg, store, body);
      case 'upload-remove':
        return await uploadRemove(cfg, store, body);
      case 'save':
        return await save(cfg, store, body);
      case 'materials-done':
        return await materialsDone(cfg, req, store, body);
      case 'booked':
        return await booked(cfg, req, store, body);
      case 'admin-view':
        return await adminView(cfg, store, body);
      case 'admin-revoke':
        return await adminRevoke(cfg, store, body);
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
  // A whole conference can share one Wi-Fi IP address; uploads ping often.
  rateLimit: { windowLimit: 120, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
