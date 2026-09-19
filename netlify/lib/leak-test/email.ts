// Participant email is plain text from Dave; the internal notification comes
// from the system address. Copy is Dave's, approved in the storyboard
// (gtm/campaigns/automotive-ai-summit-2026/ro-leak-test-storyboard). Files are
// never attached to any email.
import type { Config } from './config';
import { LtError, type Intake } from './types';

export const SIGNATURE = ['Dave Sonders', 'CEO, TenthGear', '773-490-0063', 'dave@tenthgear.ai', 'tenthgear.ai'].join('\n');

export const firstName = (name: string) => name.trim().split(/\s+/)[0] || 'there';

export function enrollmentEmail(intake: Intake, link: string) {
  return {
    subject: 'Your private RO Leak Test link',
    text: `${firstName(intake.contact.name)},

You're enrolled in the complimentary RO Leak Test from TenthGear!

This is your private link. It works on any device, with no account and no password:
${link}

When you're back at your desk, click the link and then share 20 recent ROs. (We can help you with the DMS export if you need a bit of support.) Also helpful for the revenue leak test: a few example MPI reports, inspection videos, and customer-facing materials you can put your hands on. Send what you have. The more you share, the more detailed we can get with the leak test.

Keep this link to yourself. Anyone who has it can see your submissions.

Talk soon.

${SIGNATURE}
`,
  };
}

export function easternTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

export const sourceLine = (s: Intake['source']) =>
  [s.utm_source, s.utm_medium, s.utm_campaign, s.utm_content].map((v) => v || '-').join(' / ');

export const notionUrl = (pageId: string) => `https://www.notion.so/${pageId.replace(/-/g, '')}`;

export function internalEmail(intake: Intake, kind: 'enrolled' | 're-enrolled' | 'email-fixed' | 'fresh-link') {
  const c = intake.contact;
  const label = { enrolled: 'Enrolled', 're-enrolled': 'Re-enrolled', 'email-fixed': 'Email fixed', 'fresh-link': 'Fresh link sent' }[kind];
  const systems = [c.dms && `DMS: ${c.dms}`, c.lane && `Lane software: ${c.lane}`].filter(Boolean).join(' · ');
  const materials = { not_started: 'not started', in_progress: 'in progress', sent: 'sent' }[intake.materials.status];
  const review = intake.booking.status === 'booked' && intake.booking.at ? `booked ${easternTime(intake.booking.at)}` : 'not booked';
  return {
    subject: `[Leak Test] ${label}: ${c.name}, ${c.dealership}`,
    text: `${c.name}, ${c.title}
${c.dealership}
${[c.email, c.phone].filter(Boolean).join(' · ')}
${systems || 'DMS and lane software: not given'}

Source: ${sourceLine(intake.source)}
Enrolled ${easternTime(intake.createdAt)} from a ${intake.source.device || 'browser'}

Materials: ${materials} · Review: ${review}

${intake.notionPageId ? `Open this intake in Notion: ${notionUrl(intake.notionPageId)}` : 'Notion row: not written (see the function log). Intake id ' + intake.id}

No files are ever attached to these emails.
`,
  };
}

interface Mail {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
}

// Returns the Resend id, or null in log mode. Throws on a live failure.
export async function send(cfg: Config, mail: Mail): Promise<string | null> {
  if (cfg.email === 'log') {
    console.log(`[leak-test] email (log mode)\nFrom: ${mail.from}\nTo: ${mail.to}\nSubject: ${mail.subject}\n\n${mail.text}`);
    return null;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${cfg.resendKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: mail.from,
      to: [mail.to],
      reply_to: mail.replyTo,
      subject: mail.subject,
      text: mail.text,
    }),
  });
  if (!res.ok) {
    console.error('[leak-test] resend', res.status, (await res.text()).slice(0, 200));
    throw new LtError('upstream', 502);
  }
  return ((await res.json()) as { id: string }).id;
}
