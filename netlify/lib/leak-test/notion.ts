// One row per enrollee in the Notion database "RO Leak Test Intake". The
// automation writes only its own properties and never touches Dave's notes,
// Delivered, or Status once Dave has set Delivered or Not pursuing. The
// communications log lives in the page body. A Notion failure never blocks
// the participant: callers catch and move on.
import type { Config } from './config';
import { easternTime, sourceLine } from './email';
import { LtError, type EmailLog, type Intake } from './types';

const VERSION = '2025-09-03';
const DAVE_OWNED_STATUS = ['Delivered', 'Not pursuing'];

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

function progressProperties(intake: Intake) {
  const materials = { not_started: 'Not started', in_progress: 'In progress', sent: 'Sent' }[intake.materials.status];
  return {
    Materials: { select: { name: materials } },
    Files: { number: intake.materials.files },
    Links: { number: intake.materials.links },
    'Their notes': text(intake.materials.notes),
    'Review session': { date: intake.booking.at ? { start: intake.booking.at } : null },
  };
}

function automationStatus(intake: Intake): string {
  const sent = intake.materials.status === 'sent';
  const booked = intake.booking.status === 'booked';
  return sent && booked ? 'Both' : sent ? 'Materials sent' : booked ? 'Booked' : 'Enrolled';
}

function paragraph(content: string, link?: { text: string; url: string }) {
  const rich: unknown[] = [{ text: { content } }];
  if (link) rich.push({ text: { content: link.text, link: { url: link.url } } });
  return { object: 'block', type: 'paragraph', paragraph: { rich_text: rich } };
}

function emailLogBlock(entry: EmailLog) {
  return paragraph(
    `${easternTime(entry.at)} ET · ${entry.subject} · to ${entry.to}`,
    entry.id ? { text: ' · Resend', url: `https://resend.com/emails/${entry.id}` } : undefined,
  );
}

export async function appendLog(cfg: Config, pageId: string, line: string): Promise<void> {
  await call(cfg, 'PATCH', `/blocks/${pageId}/children`, { children: [paragraph(`${easternTime(new Date().toISOString())} ET · ${line}`)] });
}

// Creates the row on first contact, updates contact fields afterwards, and
// appends the latest email to the log either way. Returns the page id.
export async function upsertRow(cfg: Config, intake: Intake, latest: EmailLog, adminLink: string): Promise<string> {
  const lastEmail = { 'Last email': { date: { start: latest.at } } };
  if (intake.notionPageId) {
    await call(cfg, 'PATCH', `/pages/${intake.notionPageId}`, {
      properties: { ...contactProperties(intake), ...lastEmail },
    });
    await call(cfg, 'PATCH', `/blocks/${intake.notionPageId}/children`, { children: [emailLogBlock(latest)] });
    return intake.notionPageId;
  }
  const page = await call(cfg, 'POST', '/pages', {
    parent: { type: 'data_source_id', data_source_id: cfg.notionDataSourceId },
    properties: {
      ...contactProperties(intake),
      ...progressProperties(intake),
      ...lastEmail,
      Enrolled: { date: { start: intake.createdAt } },
      Status: { select: { name: 'Enrolled' } },
      'Open files': { url: adminLink },
    },
    children: [
      { object: 'block', type: 'heading_3', heading_3: { rich_text: [{ text: { content: 'Communications log' } }] } },
      emailLogBlock(latest),
    ],
  });
  return page.id as string;
}

// Materials, booking, and Status, unless Dave has taken Status over.
export async function updateProgress(cfg: Config, intake: Intake, logLine?: string): Promise<void> {
  if (!intake.notionPageId) return;
  const page = (await call(cfg, 'GET', `/pages/${intake.notionPageId}`)) as {
    properties?: { Status?: { select?: { name?: string } } };
  };
  const current = page.properties?.Status?.select?.name || '';
  const properties: Record<string, unknown> = progressProperties(intake);
  if (!DAVE_OWNED_STATUS.includes(current)) properties.Status = { select: { name: automationStatus(intake) } };
  await call(cfg, 'PATCH', `/pages/${intake.notionPageId}`, { properties });
  if (logLine) await appendLog(cfg, intake.notionPageId, logLine);
}

export async function logReminder(cfg: Config, intake: Intake, entry: EmailLog): Promise<void> {
  if (!intake.notionPageId) return;
  await call(cfg, 'PATCH', `/pages/${intake.notionPageId}`, { properties: { 'Last email': { date: { start: entry.at } } } });
  await call(cfg, 'PATCH', `/blocks/${intake.notionPageId}/children`, { children: [emailLogBlock(entry)] });
}

// Rows where Dave has set a Delivered date: the retention clock runs from it.
export async function deliveredRows(cfg: Config): Promise<{ pageId: string; intakeId: string; delivered: string }[]> {
  const out: { pageId: string; intakeId: string; delivered: string }[] = [];
  let cursor: string | undefined;
  do {
    const res = (await call(cfg, 'POST', `/data_sources/${cfg.notionDataSourceId}/query`, {
      filter: { property: 'Delivered', date: { is_not_empty: true } },
      start_cursor: cursor,
      page_size: 100,
    })) as {
      results: { id: string; properties: { Delivered?: { date?: { start?: string } }; 'Intake ID'?: { rich_text?: { plain_text: string }[] } } }[];
      has_more: boolean;
      next_cursor?: string;
    };
    for (const row of res.results) {
      const delivered = row.properties.Delivered?.date?.start;
      const intakeId = row.properties['Intake ID']?.rich_text?.[0]?.plain_text;
      if (delivered && intakeId) out.push({ pageId: row.id, intakeId, delivered });
    }
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return out;
}

// Intakes Dave has closed. Reminders leave these alone.
export async function closedIntakeIds(cfg: Config): Promise<Set<string>> {
  const ids = new Set<string>();
  let cursor: string | undefined;
  do {
    const res = (await call(cfg, 'POST', `/data_sources/${cfg.notionDataSourceId}/query`, {
      filter: { or: DAVE_OWNED_STATUS.map((name) => ({ property: 'Status', select: { equals: name } })) },
      start_cursor: cursor,
      page_size: 100,
    })) as { results: { properties: { 'Intake ID'?: { rich_text?: { plain_text: string }[] } } }[]; has_more: boolean; next_cursor?: string };
    for (const row of res.results) {
      const id = row.properties['Intake ID']?.rich_text?.[0]?.plain_text;
      if (id) ids.add(id);
    }
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return ids;
}

export async function markPurged(cfg: Config, pageId: string): Promise<void> {
  await call(cfg, 'PATCH', `/pages/${pageId}`, { properties: { 'Their notes': text(''), 'Open files': { url: null } } });
  await appendLog(cfg, pageId, 'Files, links, and notes deleted (60-day retention).');
}
