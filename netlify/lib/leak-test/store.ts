// Intake persistence behind one small interface. Firestore in production
// (dedicated project, see the runbook); Netlify Blobs on deploy previews and
// in local dev until that project exists; memory as a last resort.
import { createHash } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import type { Config } from './config';
import { Firestore } from './firestore';
import type { Intake } from './types';

export interface IntakeStore {
  get(id: string): Promise<Intake | null>;
  put(intake: Intake): Promise<void>;
  byTokenHash(hash: string): Promise<Intake | null>;
  byEmail(email: string): Promise<Intake | null>;
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
const emailKey = (email: string) => createHash('sha256').update(normalizeEmail(email)).digest('hex');

class FirestoreStore implements IntakeStore {
  private db: Firestore;
  constructor(private cfg: Config) {
    this.db = new Firestore(cfg.serviceAccount);
  }
  get(id: string) {
    return this.db.get<Intake>(this.cfg.firestoreCollection, id);
  }
  put(intake: Intake) {
    return this.db.set(this.cfg.firestoreCollection, intake.id, { ...intake, emailKey: emailKey(intake.contact.email) });
  }
  byTokenHash(hash: string) {
    return this.db.findOne<Intake>(this.cfg.firestoreCollection, 'token.hash', hash);
  }
  byEmail(email: string) {
    return this.db.findOne<Intake>(this.cfg.firestoreCollection, 'emailKey', emailKey(email));
  }
}

// Keys: intake/<id> holds the record; token/<hash> and email/<sha> point at an id.
class BlobStore implements IntakeStore {
  private store = getStore({ name: 'leak-test', consistency: 'strong' });
  async get(id: string) {
    return ((await this.store.get(`intake/${id}`, { type: 'json' })) as Intake | null) || null;
  }
  async put(intake: Intake) {
    await this.store.setJSON(`intake/${intake.id}`, intake);
    await this.store.set(`token/${intake.token.hash}`, intake.id);
    await this.store.set(`email/${emailKey(intake.contact.email)}`, intake.id);
  }
  private async follow(key: string) {
    const id = await this.store.get(key, { type: 'text' });
    return id ? this.get(id) : null;
  }
  // Index entries are never deleted, so a stale pointer (old token, old
  // email) can reach a record that no longer matches. Check before returning.
  async byTokenHash(hash: string) {
    const intake = await this.follow(`token/${hash}`);
    return intake && intake.token.hash === hash ? intake : null;
  }
  async byEmail(email: string) {
    const intake = await this.follow(`email/${emailKey(email)}`);
    return intake && normalizeEmail(intake.contact.email) === normalizeEmail(email) ? intake : null;
  }
}

const memory = new Map<string, Intake>();
class MemoryStore implements IntakeStore {
  async get(id: string) {
    return memory.get(id) || null;
  }
  async put(intake: Intake) {
    memory.set(intake.id, structuredClone(intake));
  }
  async byTokenHash(hash: string) {
    return [...memory.values()].find((i) => i.token.hash === hash) || null;
  }
  async byEmail(email: string) {
    const key = normalizeEmail(email);
    return [...memory.values()].find((i) => normalizeEmail(i.contact.email) === key) || null;
  }
}

export function openStore(cfg: Config): IntakeStore {
  if (cfg.store === 'firestore') return new FirestoreStore(cfg);
  if (cfg.store === 'memory') return new MemoryStore();
  return new BlobStore();
}
