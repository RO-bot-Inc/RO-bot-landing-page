// Participant email is plain text from Dave; the internal notification comes
// from the system address. Copy is Dave's, approved in the storyboard
// (gtm/campaigns/automotive-ai-summit-2026/ro-leak-test-storyboard). Files are
// never attached to any email.
import type { Config } from './config';
import { LtError, type Intake, type ReminderKind } from './types';

export const SIGNATURE = ['Dave Sonders', 'CEO, TenthGear', '773-490-0063', 'dave@tenthgear.ai', 'tenthgear.ai'].join('\n');
const SHORT_SIGNATURE = ['Dave', 'CEO, TenthGear', '773-490-0063', 'tenthgear.ai'].join('\n');

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

// Dave's copy, storyboard "Reminder states". Each carries a fresh private link.
export function reminderEmail(kind: ReminderKind, intake: Intake, link: string) {
  const first = firstName(intake.contact.name);
  const when = intake.booking.at ? easternDateTime(intake.booking.at) : null;
  switch (kind) {
    case 'reminder-contact-48h':
      return {
        subject: "Don't miss your complimentary RO Leak Test!",
        text: `${first},

It was great meeting you at the Automotive AI Summit. Hopefully you've had a moment to dig out. Just in case our first email got buried, here's a reminder to follow your private link below to claim your complimentary RO Leak Test.

${link}

We're ready to roll up our sleeves and dig into your service process to see where you're leaking time, money, or both.

${SHORT_SIGNATURE}
`,
      };
    case 'reminder-contact-7d':
      return {
        subject: 'Last call for your RO Leak Test!',
        text: `Hi ${first}. I know you're super busy. If now isn't the right time to dig into your RO process together, no problem. Let me know when you'd rather do this. No pressure.

${link}

${SHORT_SIGNATURE}
`,
      };
    case 'reminder-booked-24h':
      return {
        subject: when ? `Before we meet ${easternWeekday(intake.booking.at!)}` : 'Before we meet',
        text: `${first},

${when ? `You're booked for ${when}.` : "You're booked for your review session."}

To get the most out of our time, click the link below and follow the prompts. The more you share before our meeting, the deeper we can go with your revenue leak test.

${link}

${SHORT_SIGNATURE}
`,
      };
    case 'reminder-materials-24h':
      return {
        subject: 'One last step',
        text: `${first},

We're looking forward to sharing the results of your RO leak test. Click the link below to grab a time.

${link}

${SHORT_SIGNATURE}
`,
      };
  }
}

const eastern = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', ...opts }).format(new Date(iso));

export const easternTime = (iso: string) =>
  eastern(iso, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
// "Tuesday, October 6 at 10:00 AM"
export const easternDateTime = (iso: string) =>
  `${eastern(iso, { weekday: 'long', month: 'long', day: 'numeric' })} at ${eastern(iso, { hour: 'numeric', minute: '2-digit' })}`;
export const easternWeekday = (iso: string) => eastern(iso, { weekday: 'long' });

export const sourceLine = (s: Intake['source']) =>
  [s.utm_source, s.utm_medium, s.utm_campaign, s.utm_content].map((v) => v || '-').join(' / ');

export const notionUrl = (pageId: string) => `https://www.notion.so/${pageId.replace(/-/g, '')}`;

export type InternalKind = 'enrolled' | 're-enrolled' | 'email-fixed' | 'fresh-link' | 'materials-sent' | 'booked' | 'all-set';

export function internalEmail(intake: Intake, kind: InternalKind, adminLink: string) {
  const c = intake.contact;
  const label: Record<InternalKind, string> = {
    enrolled: 'Enrolled',
    're-enrolled': 'Re-enrolled',
    'email-fixed': 'Email fixed',
    'fresh-link': 'Fresh link sent',
    'materials-sent': 'Materials sent',
    booked: 'Booked',
    'all-set': 'All set',
  };
  const systems = [c.dms && `DMS: ${c.dms}`, c.lane && `Lane software: ${c.lane}`].filter(Boolean).join(' · ');
  const materials =
    intake.materials.status === 'sent'
      ? `sent (${intake.materials.files} files, ${intake.materials.links} links)`
      : intake.materials.status === 'in_progress'
        ? `in progress (${intake.materials.files} files, ${intake.materials.links} links)`
        : 'not started';
  const review =
    intake.booking.status === 'booked' ? `booked${intake.booking.at ? ` ${easternTime(intake.booking.at)}` : ''}` : 'not booked';
  return {
    subject: `[Leak Test] ${label[kind]}: ${c.name}, ${c.dealership}`,
    text: `${c.name}, ${c.title}
${c.dealership}
${[c.email, c.phone].filter(Boolean).join(' · ')}
${systems || 'DMS and lane software: not given'}

Source: ${sourceLine(intake.source)}
Enrolled ${easternTime(intake.createdAt)} from a ${intake.source.device || 'browser'}

Materials: ${materials} · Review: ${review}
${intake.materials.notes ? `\nTheir note: ${intake.materials.notes}\n` : ''}
Open files (signed page, links last 10 minutes): ${adminLink}
${intake.notionPageId ? `Notion row: ${notionUrl(intake.notionPageId)}` : 'Notion row: not written (see the function log). Intake id ' + intake.id}

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
