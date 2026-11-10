// Netlify runs this after every verified (non-spam) Netlify Forms submission.
// The name is the trigger: one submission-created function per site, so it
// branches on form_name and ignores every other form.
//
// ro-sample-worksheet: the gated download on the warranty parts markup post.
// The form itself stores the lead in Netlify Forms; this emails the visitor
// both links. The links live only here, never in page source, so the gate holds.
//
// The form has no reCAPTCHA (Netlify renders only one widget per page, and the
// footer newsletter form takes it), so this caps sends at one per address per
// day. The blob holds a timestamp under a hash of the address, never the address.
import { createHash } from 'node:crypto';
import type { Handler } from '@netlify/functions';
import { connectLambda, getStore } from '@netlify/blobs';
import { textToHtml } from '../lib/leak-test/email';

const SHEET_ID = '1XOsZ6S4_WjZi9JIHuMyYOzEscoGyC7sECqzaEVis0ew';
const COPY_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/copy`;
const XLSX_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx`;
const POST_URL = 'https://tenthgear.ai/blog/warranty-parts-markup-increase/';
const FROM = 'Dave Sonders <dave@tenthgear.ai>';

export function worksheetEmail() {
  return {
    subject: 'Your Warranty Parts Markup Worksheet',
    text: `Here is the Warranty Parts Markup Worksheet from the parts markup guide.

Open in Google Sheets (makes your own copy):
${COPY_URL}

Download for Excel:
${XLSX_URL}

Start on the "Start here" tab. The example rows show how each tab works; replace them with your own ROs.

It is a planning aid, not legal advice. Check your state's statute before you file. The post shows how the rules differ by state: ${POST_URL}

Questions, or something you wish it tracked? Just reply.

Dave
TenthGear`,
  };
}

const RESEND_WINDOW_MS = 24 * 60 * 60_000;

// True if this address already got the worksheet in the last day. Fails open:
// a Blobs outage should not stop a real visitor from getting the email.
async function sentRecently(event: Parameters<Handler>[0], email: string): Promise<boolean> {
  try {
    connectLambda(event as never);
    const store = getStore('worksheet-sends');
    const key = createHash('sha256').update(email.toLowerCase()).digest('hex');
    const last = Number(await store.get(key));
    if (last && Date.now() - last < RESEND_WINDOW_MS) return true;
    await store.set(key, String(Date.now()));
  } catch (e) {
    console.error('[worksheet] blobs', (e as Error).message);
  }
  return false;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const handler: Handler = async (event) => {
  let payload: { form_name?: string; data?: Record<string, unknown> } = {};
  try {
    payload = JSON.parse(event.body || '{}').payload || {};
  } catch {
    return { statusCode: 400, body: 'bad json' };
  }
  if (payload.form_name !== 'ro-sample-worksheet') return { statusCode: 200, body: 'ignored' };

  const to = String(payload.data?.email || '').trim();
  if (!EMAIL_RE.test(to) || to.length > 254) return { statusCode: 200, body: 'bad email' };

  if (await sentRecently(event, to)) {
    console.log('[worksheet] already sent in the last day; skipping');
    return { statusCode: 200, body: 'recent' };
  }

  const mail = worksheetEmail();
  const key = (process.env.RESEND_API_KEY || '').trim();
  if (!key) {
    console.log(`[worksheet] no RESEND_API_KEY; would send to ${to}:\n${mail.text}`);
    return { statusCode: 200, body: 'logged' };
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], reply_to: 'dave@tenthgear.ai', subject: mail.subject, text: mail.text, html: textToHtml(mail.text) }),
  });
  if (!res.ok) {
    console.error('[worksheet] resend', res.status, (await res.text()).slice(0, 200));
    return { statusCode: 502, body: 'email failed' };
  }
  return { statusCode: 200, body: 'sent' };
};
