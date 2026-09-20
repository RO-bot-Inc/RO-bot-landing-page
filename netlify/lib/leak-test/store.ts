// Intake persistence behind one small interface. Firestore in production
// (dedicated project, see the runbook); Netlify Blobs on deploy previews and
// in local dev until that project exists; memory as a last resort.
//
// Workspace mutations go through update(): read, apply, write only if the
// record is unchanged since the read (Blobs etag, Firestore updateTime), and
// retry on a clash. Two uploads finishing at once can no longer overwrite
// each other.
import { createHash } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import type { Config } from './config';
import { Firestore } from './firestore';
import { LtError, type Intake } from './types';

export interface IntakeStore {
  get(id: string): Promise<Intake | null>;
  // Whole-record write for records nobody else is touching (enrollment).
  put(intake: Intake): Promise<void>;
  // Conditional read-modify-write with retry. The mutator sees a fresh copy.
  update(id: string, mutate: (intake: Intake) => void): Promise<Intake>;
  byTokenHash(hash: string): Promise<Intake | null>;
  byEmail(email: string): Promise<Intake | null>;
  list(): Promise<Intake[]>;
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
const emailKey = (email: string) => createHash('sha256').update(normalizeEmail(email)).digest('hex');
const RETRIES = 6;
const backoff = (attempt: number) => new Promise((r) => setTimeout(r, 40 * attempt + Math.random() * 60));

// Records written by the first build predate the workspace fields.
function withDefaults(raw: Record<string, unknown> | null): Intake | null {
  if (!raw) return null;
  const r = raw as unknown as Intake & { token?: Intake['tokens'][number] };
  if (!r.tokens) r.tokens = r.token ? [{ ...r.token, purpose: 'email' }] : [];
  delete r.token;
  r.files ||= [];
  r.links ||= [];
  r.booking = { status: 'not_booked', at: null, eventUri: null, inviteeUri: null, ...(r.booking as Partial<Intake['booking']> | undefined) };
  r.materials = { status: 'not_started', files: 0, links: 0, notes: '', sentAt: null, ...(r.materials as Partial<Intake['materials']> | undefined) };
  r.lastActivityAt ||= r.updatedAt || r.createdAt;
  r.uploadActiveUntil ??= null;
  r.reminders ||= {};
  r.emails ||= [];
  r.notionPageId ??= null;
  r.purgedAt ??= null;
  return r;
}

const liveHashes = (intake: Intake) => intake.tokens.filter((t) => !t.revoked).map((t) => t.hash);

class FirestoreStore implements IntakeStore {
  private db: Firestore;
  constructor(private cfg: Config) {
    this.db = new Firestore(cfg.serviceAccount);
  }
  private fields(intake: Intake) {
    return { ...intake, emailKey: emailKey(intake.contact.email), tokenHashes: liveHashes(intake) };
  }
  async get(id: string) {
    return withDefaults((await this.db.get<Record<string, unknown>>(this.cfg.firestoreCollection, id))?.data ?? null);
  }
  async put(intake: Intake) {
    await this.db.set(this.cfg.firestoreCollection, intake.id, this.fields(intake));
  }
  async update(id: string, mutate: (intake: Intake) => void) {
    for (let attempt = 1; attempt <= RETRIES; attempt++) {
      const raw = await this.db.get<Record<string, unknown>>(this.cfg.firestoreCollection, id);
      const intake = withDefaults(raw?.data ?? null);
      if (!intake || !raw) throw new LtError('not_found', 404);
      mutate(intake);
      if (await this.db.set(this.cfg.firestoreCollection, id, this.fields(intake), raw.updateTime)) return intake;
      await backoff(attempt);
    }
    throw new LtError('upstream', 503);
  }
  async byTokenHash(hash: string) {
    return withDefaults(await this.db.findOne(this.cfg.firestoreCollection, 'tokenHashes', hash, 'ARRAY_CONTAINS'));
  }
  async byEmail(email: string) {
    return withDefaults(await this.db.findOne(this.cfg.firestoreCollection, 'emailKey', emailKey(email)));
  }
  async list() {
    return (await this.db.list<Record<string, unknown>>(this.cfg.firestoreCollection)).map((r) => withDefaults(r)!);
  }
}

// Keys: intake/<id> holds the record; token/<hash> and email/<sha> point at an id.
class BlobStore implements IntakeStore {
  private store = getStore({ name: 'leak-test', consistency: 'strong' });
  private async index(intake: Intake) {
    for (const hash of liveHashes(intake)) await this.store.set(`token/${hash}`, intake.id);
    await this.store.set(`email/${emailKey(intake.contact.email)}`, intake.id);
  }
  async get(id: string) {
    return withDefaults((await this.store.get(`intake/${id}`, { type: 'json' })) as Record<string, unknown> | null);
  }
  async put(intake: Intake) {
    await this.store.setJSON(`intake/${intake.id}`, intake);
    await this.index(intake);
  }
  async update(id: string, mutate: (intake: Intake) => void) {
    for (let attempt = 1; attempt <= RETRIES; attempt++) {
      const entry = await this.store.getWithMetadata(`intake/${id}`, { type: 'json' });
      const intake = withDefaults((entry?.data as Record<string, unknown> | null) ?? null);
      if (!intake) throw new LtError('not_found', 404);
      mutate(intake);
      // The local netlify dev sandbox returns no etag; there the write is
      // unconditional. Deployed Blobs always return one.
      const { modified } = await this.store.setJSON(`intake/${id}`, intake, entry?.etag ? { onlyIfMatch: entry.etag } : {});
      if (modified) {
        await this.index(intake);
        return intake;
      }
      await backoff(attempt);
    }
    throw new LtError('upstream', 503);
  }
  private async follow(key: string) {
    const id = await this.store.get(key, { type: 'text' });
    return id ? this.get(id) : null;
  }
  // Index entries are never deleted, so a stale pointer (old token, old
  // email) can reach a record that no longer matches. Check before returning.
  async byTokenHash(hash: string) {
    const intake = await this.follow(`token/${hash}`);
    return intake && liveHashes(intake).includes(hash) ? intake : null;
  }
  async byEmail(email: string) {
    const intake = await this.follow(`email/${emailKey(email)}`);
    return intake && normalizeEmail(intake.contact.email) === normalizeEmail(email) ? intake : null;
  }
  async list() {
    const { blobs } = await this.store.list({ prefix: 'intake/' });
    const out: Intake[] = [];
    for (const b of blobs) {
      const intake = await this.get(b.key.slice('intake/'.length));
      if (intake) out.push(intake);
    }
    return out;
  }
}

const memory = new Map<string, Intake>();
class MemoryStore implements IntakeStore {
  async get(id: string) {
    return withDefaults(structuredClone(memory.get(id) || null) as Record<string, unknown> | null);
  }
  async put(intake: Intake) {
    memory.set(intake.id, structuredClone(intake));
  }
  async update(id: string, mutate: (intake: Intake) => void) {
    const intake = await this.get(id);
    if (!intake) throw new LtError('not_found', 404);
    mutate(intake);
    await this.put(intake);
    return intake;
  }
  async byTokenHash(hash: string) {
    return [...memory.values()].find((i) => liveHashes(i).includes(hash)) || null;
  }
  async byEmail(email: string) {
    const key = normalizeEmail(email);
    return [...memory.values()].find((i) => normalizeEmail(i.contact.email) === key) || null;
  }
  async list() {
    return [...memory.values()];
  }
}

export function openStore(cfg: Config): IntakeStore {
  if (cfg.store === 'firestore') return new FirestoreStore(cfg);
  if (cfg.store === 'memory') return new MemoryStore();
  return new BlobStore();
}
