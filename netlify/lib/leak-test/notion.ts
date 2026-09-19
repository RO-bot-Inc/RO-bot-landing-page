// One row per enrollee in the Notion database "RO Leak Test Intake". The
// automation writes only its own properties and never touches Status once
// Dave has set Delivered or Not pursuing, Delivered, or Dave's notes. The
// communications log lives in the page body. A Notion failure never blocks
// enrollment: callers catch and move on.
import type { Config } from './config';
import { easternTime, sourceLine } from './email';
import { LtError, type EmailLog, type Intake } from './types';

const VERSION = '2025-09-03';

async function call(cfg: Config, method: string, path: string, body?: unknown): Promise<Record<string, unknown>> {
  let last: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`https://api.notion.com/v1${path}`, {
        method,
        headers: {
          authorization: `Bearer ${cfg.notionKey}`,
          'notion-version': VERSION,
          'content-type': 'application/json',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (res.ok) return (await res.json()) as Record<string, unknown>;
      const text = (await res.text()).slice(0, 300);
      console.warn('[leak-test] notion', method, path, res.status, text);
      // Client errors will not improve on retry.
      if (res.status >= 400 && res.status < 500 && res.status !== 429) throw new LtError('upstream', 502);
      last = new Error(`notion ${res.status}`);
    } catch (err) {
      if (err instanceof LtError) throw err;
      last = err as Error;
    }
    await new Promise((r) => setTimeout(r, 700 * attempt));
  }
  throw last || new LtError('upstream', 502);
}

const text = (s: string | undefined) => ({ rich_text: s ? [{ text: { content: s.slice(0, 2000) } }] : [] });

function contactProperties(intake: Intake) {
  const c = intake.contact;
  return {
    Contact: { title: [{ text: { content: c.name } }] },
    Email: { email: c.email },
    Dealership: text(c.dealership),
    'Job title': text(c.title),
    Phone: { phone_number: c.phone || null },
    DMS: text(c.dms),
    'Lane software': text(c.lane),
    Source: text(sourceLine(intake.source)),
    'Intake ID': text(intake.id),
  };
}

function logBlock(entry: EmailLog) {
  const when = `${easternTime(entry.at)} ET`;
  const rich: unknown[] = [{ text: { content: `${when} · ${entry.subject} · to ${entry.to}` } }];
  if (entry.id) rich.push({ text: { content: ' · Resend', link: { url: `https://resend.com/emails/${entry.id}` } } });
  return { object: 'block', type: 'paragraph', paragraph: { rich_text: rich } };
}

// Creates the row on first contact, updates contact fields afterwards, and
// appends the latest email to the log either way. Returns the page id.
export async function upsertRow(cfg: Config, intake: Intake, latest: EmailLog): Promise<string> {
  const lastEmail = { 'Last email': { date: { start: latest.at } } };
  if (intake.notionPageId) {
    await call(cfg, 'PATCH', `/pages/${intake.notionPageId}`, {
      properties: { ...contactProperties(intake), ...lastEmail },
    });
    await call(cfg, 'PATCH', `/blocks/${intake.notionPageId}/children`, { children: [logBlock(latest)] });
    return intake.notionPageId;
  }
  const page = await call(cfg, 'POST', '/pages', {
    parent: { type: 'data_source_id', data_source_id: cfg.notionDataSourceId },
    properties: {
      ...contactProperties(intake),
      ...lastEmail,
      Enrolled: { date: { start: intake.createdAt } },
      Status: { select: { name: 'Enrolled' } },
      Materials: { select: { name: 'Not started' } },
      Files: { number: 0 },
      Links: { number: 0 },
    },
    children: [
      { object: 'block', type: 'heading_3', heading_3: { rich_text: [{ text: { content: 'Communications log' } }] } },
      logBlock(latest),
    ],
  });
  return page.id as string;
}
