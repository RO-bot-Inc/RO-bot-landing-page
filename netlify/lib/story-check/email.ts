// The emailed report (every fix, to forward to the tech) and a short internal
// heads-up to Dave. The story itself goes only to the visitor, never to us.
import { textToHtml } from '../leak-test/email';
import { ELEMENTS, LABELS, type Result } from '../../../src/scripts/story-check/shared';
import { type Config, ScError } from './config';

const FROM = 'Dave Sonders <dave@tenthgear.ai>';
const PAGE = 'https://tenthgear.ai/warranty-story-checker/';
const DEMO = 'https://tenthgear.ai/book-demo/';

const gradeText = (g: string) => (g === 'missing' ? 'missing' : g === 'not_applicable' ? 'n/a' : g);

export function reportEmail(r: Result) {
  const grades = ELEMENTS.map((k) => `  ${LABELS[k]}: ${gradeText(r.grades[k])}`).join('\n');
  const notes = r.notes.length
    ? r.notes.map((n) => `${n.n}. ${n.pen} (${n.criterion})\n   ${n.fixLabel} ${n.fix}`).join('\n\n')
    : 'Nothing to red-pen. Nice work.';
  return {
    subject: `Your warranty story, graded: ${r.letter} (${r.gpa.toFixed(2)} / 4)`,
    text: `Here is your warranty story, graded the way an auditor reads it.

Overall: ${r.letter} (${r.gpa.toFixed(2)} / 4)
${grades}

What to fix:

${notes}

The story you checked:
${r.complaint ? `\nComplaint: ${r.complaint}\n` : ''}
Cause: ${r.cause}

Correction: ${r.correction}

Check another story: ${PAGE}

TenthGear grades every story before it's submitted, right in the tech's workflow. See it in 15 minutes: ${DEMO}

Guidance, not a guarantee. Your automaker's rules come first.

Dave
TenthGear`,
  };
}

async function send(cfg: Config, to: string, mail: { subject: string; text: string }, replyTo?: string) {
  if (cfg.email === 'log') {
    console.log(`[story-check] email (log mode) to=${to.replace(/^(.).*@/, '$1***@')} subject=${mail.subject}`);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${cfg.resendKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], reply_to: replyTo, subject: mail.subject, text: mail.text, html: textToHtml(mail.text) }),
  });
  if (!res.ok) {
    console.error('[story-check] resend', res.status);
    throw new ScError('upstream', 502);
  }
}

export async function sendReport(cfg: Config, to: string, r: Result) {
  await send(cfg, to, reportEmail(r), 'dave@tenthgear.ai');
  // Lead heads-up for Dave. Grade only, no story text.
  try {
    await send(cfg, cfg.notifyTo, {
      subject: `[Story Checker] Report sent to ${to}`,
      text: `${to} asked for the emailed report.\n\nGrade: ${r.letter} (${r.gpa.toFixed(2)} / 4), ${r.notes.length} notes${r.sampleId ? `, on sample "${r.sampleId}"` : ', on their own story'}.\n\nThey have not asked for a demo. Not added to the contacts board.`,
    }, to);
  } catch {
    console.warn('[story-check] internal notify failed');
  }
}
