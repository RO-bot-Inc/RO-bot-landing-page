// Firestore over REST with a service-account JWT. No firebase-admin: it is
// heavy, and the function only needs get, set, and one equality query.
import { createSign } from 'node:crypto';
import { LtError } from './types';

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

type Value = Record<string, unknown>;

function encode(v: unknown): Value {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encode) } };
  return { mapValue: { fields: encodeFields(v as Record<string, unknown>) } };
}

function encodeFields(obj: Record<string, unknown>): Record<string, Value> {
  const out: Record<string, Value> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = encode(v);
  return out;
}

function decode(v: Value): unknown {
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (((v.arrayValue as Value).values as Value[]) || []).map(decode);
  if ('mapValue' in v) return decodeFields(((v.mapValue as Value).fields as Record<string, Value>) || {});
  if ('timestampValue' in v) return v.timestampValue;
  return null;
}

function decodeFields(fields: Record<string, Value>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) out[k] = decode(v);
  return out;
}

let cached: { token: string; exp: number } | null = null;

async function accessToken(sa: ServiceAccount): Promise<string> {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const iat = Math.floor(Date.now() / 1000);
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const input = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat,
    exp: iat + 3600,
  })}`;
  const sig = createSign('RSA-SHA256').update(input).sign(sa.private_key, 'base64url');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${input}.${sig}`,
    }),
  });
  if (!res.ok) throw new LtError('upstream', 502);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: data.access_token, exp: Date.now() + data.expires_in * 1000 };
  return cached.token;
}

export class Firestore {
  private sa: ServiceAccount;
  private base: string;

  constructor(serviceAccountJson: string) {
    this.sa = JSON.parse(serviceAccountJson);
    this.base = `https://firestore.googleapis.com/v1/projects/${this.sa.project_id}/databases/(default)/documents`;
  }

  private async call(method: string, path: string, body?: unknown): Promise<Response> {
    const res = await fetch(`${this.base}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${await accessToken(this.sa)}`,
        'content-type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok && res.status !== 404) {
      console.error('[leak-test] firestore', method, path, res.status);
      throw new LtError('upstream', 502);
    }
    return res;
  }

  async get<T>(collection: string, id: string): Promise<T | null> {
    const res = await this.call('GET', `/${collection}/${id}`);
    if (res.status === 404) return null;
    const doc = (await res.json()) as { fields: Record<string, Value> };
    return decodeFields(doc.fields || {}) as T;
  }

  // Whole-document write (create or replace).
  async set(collection: string, id: string, data: Record<string, unknown>): Promise<void> {
    await this.call('PATCH', `/${collection}/${id}`, { fields: encodeFields(data) });
  }

  async findOne<T>(collection: string, fieldPath: string, value: string): Promise<T | null> {
    const res = await this.call('POST', ':runQuery', {
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: { fieldFilter: { field: { fieldPath }, op: 'EQUAL', value: { stringValue: value } } },
        limit: 1,
      },
    });
    const rows = (await res.json()) as { document?: { fields: Record<string, Value> } }[];
    const doc = rows.find((r) => r.document)?.document;
    return doc ? (decodeFields(doc.fields || {}) as T) : null;
  }
}
