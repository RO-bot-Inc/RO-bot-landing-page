// Google Cloud Storage over REST for the dedicated Firebase project's bucket.
// The function only starts resumable sessions, checks objects, deletes them,
// and signs short-lived download URLs. Bytes never pass through Netlify.
//
// Untested until the project exists (runbook, checklist item 3).
import { createHash, createSign } from 'node:crypto';
import { accessToken, type ServiceAccount } from './firestore';
import { LtError } from './types';

const API = 'https://storage.googleapis.com';

const encodeSegment = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

export class Storage {
  constructor(
    private sa: ServiceAccount,
    private bucket: string,
  ) {}

  private async headers() {
    return { authorization: `Bearer ${await accessToken(this.sa)}` };
  }

  // Starts a resumable upload session on the participant's behalf. The Origin
  // header makes GCS answer the browser's PUTs on this session with CORS
  // headers for that origin, so the bucket needs no CORS configuration.
  async startResumable(object: string, contentType: string, size: number, origin: string): Promise<string> {
    const res = await fetch(`${API}/upload/storage/v1/b/${this.bucket}/o?uploadType=resumable&name=${encodeSegment(object)}`, {
      method: 'POST',
      headers: {
        ...(await this.headers()),
        'content-type': 'application/json',
        'x-upload-content-type': contentType,
        'x-upload-content-length': String(size),
        origin,
      },
      body: JSON.stringify({ name: object, contentType, metadata: { uploadedVia: 'leak-test' } }),
    });
    const location = res.headers.get('location');
    if (!res.ok || !location) {
      console.error('[leak-test] gcs start', res.status, (await res.text()).slice(0, 200));
      throw new LtError('upstream', 502);
    }
    return location;
  }

  async size(object: string): Promise<number | null> {
    const res = await fetch(`${API}/storage/v1/b/${this.bucket}/o/${encodeSegment(object)}`, { headers: await this.headers() });
    if (res.status === 404) return null;
    if (!res.ok) throw new LtError('upstream', 502);
    const meta = (await res.json()) as { size: string };
    return Number(meta.size);
  }

  async remove(object: string): Promise<void> {
    const res = await fetch(`${API}/storage/v1/b/${this.bucket}/o/${encodeSegment(object)}`, {
      method: 'DELETE',
      headers: await this.headers(),
    });
    if (!res.ok && res.status !== 404) throw new LtError('upstream', 502);
  }

  // V4 signed GET URL. Dave's file page mints these for ten minutes at a time.
  signedDownloadUrl(object: string, filename: string, ttlSeconds = 600): string {
    const now = new Date();
    const date = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z'); // YYYYMMDDTHHMMSSZ
    const day = date.slice(0, 8);
    const scope = `${day}/auto/storage/goog4_request`;
    const path = `/${this.bucket}/${object.split('/').map(encodeSegment).join('/')}`;
    const query = [
      ['X-Goog-Algorithm', 'GOOG4-RSA-SHA256'],
      ['X-Goog-Credential', `${this.sa.client_email}/${scope}`],
      ['X-Goog-Date', date],
      ['X-Goog-Expires', String(ttlSeconds)],
      ['X-Goog-SignedHeaders', 'host'],
      ['response-content-disposition', `attachment; filename="${filename.replace(/["\\\r\n]/g, '_')}"`],
    ]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([k, v]) => `${encodeSegment(k)}=${encodeSegment(v)}`)
      .join('&');
    const canonical = ['GET', path, query, 'host:storage.googleapis.com\n', 'host', 'UNSIGNED-PAYLOAD'].join('\n');
    const toSign = ['GOOG4-RSA-SHA256', date, scope, createHash('sha256').update(canonical).digest('hex')].join('\n');
    const signature = createSign('RSA-SHA256').update(toSign).sign(this.sa.private_key, 'hex');
    return `${API}${path}?${query}&X-Goog-Signature=${signature}`;
  }
}
