// Hourly. Sends the four reminder emails from the storyboard and nothing else:
//   contact only     48 h and 7 d after enrollment
//   booked only      24 h after the last workspace activity
//   materials only   24 h after "Done sharing"
//   both complete    nothing
// An upload in flight holds a reminder. Intakes Dave has closed in Notion
// (Delivered, Not pursuing) are skipped. Every send is recorded on the intake,
// so a reminder goes out once even if the job runs again.
import type { Config as FunctionConfig } from '@netlify/functions';
import { config as loadConfig } from '../lib/leak-test/config';
import { reminderEmail, send } from '../lib/leak-test/email';
import { issueResumeToken, publicOrigin, resumeLink } from '../lib/leak-test/links';
import { closedIntakeIds, logReminder } from '../lib/leak-test/notion';
import { openStore } from '../lib/leak-test/store';
import type { EmailLog, Intake, ReminderKind } from '../lib/leak-test/types';

const H = 3_600_000;

function due(intake: Intake, now: number): ReminderKind | null {
  const sent = intake.materials.status === 'sent';
  const booked = intake.booking.status === 'booked';
  const r = intake.reminders;
  if (sent && booked) return null;
  if (intake.uploadActiveUntil && Date.parse(intake.uploadActiveUntil) > now) return null;
  if (!sent && !booked) {
    const age = now - Date.parse(intake.createdAt);
    if (age >= 7 * 24 * H && !r['reminder-contact-7d']) return 'reminder-contact-7d';
    if (age >= 48 * H && age < 7 * 24 * H && !r['reminder-contact-48h']) return 'reminder-contact-48h';
    return null;
  }
  if (booked && !sent) {
    return now - Date.parse(intake.lastActivityAt) >= 24 * H && !r['reminder-booked-24h'] ? 'reminder-booked-24h' : null;
  }
  // materials sent, not booked
  const since = intake.materials.sentAt || intake.lastActivityAt;
  return now - Date.parse(since) >= 24 * H && !r['reminder-materials-24h'] ? 'reminder-materials-24h' : null;
}

export default async () => {
  const cfg = loadConfig();
  if (!cfg.reminders || !cfg.enabled) return new Response('paused');
  const origin = publicOrigin(cfg);
  const store = openStore(cfg);
  const closed = cfg.notion === 'live' ? await closedIntakeIds(cfg).catch(() => new Set<string>()) : new Set<string>();
  const now = Date.now();
  let sent = 0;

  for (const intake of await store.list()) {
    if (intake.purgedAt || closed.has(intake.id)) continue;
    if (!intake.tokens.some((t) => !t.revoked)) continue; // Dave revoked their links
    const kind = due(intake, now);
    if (!kind) continue;
    try {
      const stamp = new Date().toISOString();
      const token = issueResumeToken(cfg, intake, stamp, 'reminder', false);
      const mail = reminderEmail(kind, intake, resumeLink(origin, token, kind === 'reminder-materials-24h' ? 'book' : undefined));
      const id = await send(cfg, { from: cfg.fromDave, to: intake.contact.email, replyTo: 'dave@tenthgear.ai', ...mail });
      const entry: EmailLog = { at: stamp, kind, subject: mail.subject, to: intake.contact.email, id };
      intake.emails.push(entry);
      intake.reminders[kind] = stamp;
      // The 7-day email supersedes a 48-hour one that never went out.
      if (kind === 'reminder-contact-7d' && !intake.reminders['reminder-contact-48h']) intake.reminders['reminder-contact-48h'] = stamp;
      intake.updatedAt = stamp;
      await store.put(intake);
      if (cfg.notion === 'live') await logReminder(cfg, intake, entry).catch(() => console.warn('[leak-test] reminder log failed'));
      sent++;
      console.log(`[leak-test] reminder ${kind} id=${intake.id}`);
    } catch (err) {
      console.error(`[leak-test] reminder failed id=${intake.id}`, (err as Error).message);
    }
  }
  console.log(`[leak-test] reminders run sent=${sent}`);
  return new Response(`sent ${sent}`);
};

export const config: FunctionConfig = { schedule: '@hourly' };
