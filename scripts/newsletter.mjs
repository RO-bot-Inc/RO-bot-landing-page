#!/usr/bin/env node
// Blog subscribers: capture every signup, email them on every new post.
//
// Two commands, run from the website repo (see docs/newsletter-runbook.md):
//
//   npm run newsletter:sync
//     Pull every submission of the Netlify "newsletter" form, keep the valid
//     addresses, and add any missing ones to the Resend segment
//     "Blog subscribers" (created on first run). Additive and idempotent:
//     never deletes a contact, never edits an existing contact's fields,
//     never changes `unsubscribed`, and skips anyone already unsubscribed.
//
//   npm run newsletter:announce -- --slug {post}            # dry run (default)
//   npm run newsletter:announce -- --slug {post} --test you@x  # one rendered test email
//   npm run newsletter:announce -- --slug {post} --send      # sync, then Broadcast
//     Reads the "## Email announcement" section of docs/distribution/{post}.md,
//     renders it with Resend's real unsubscribe link, and with --send runs
//     `sync` first so everyone who signed up before the send is included,
//     then creates and sends a Resend Broadcast to the segment. Broadcasts
//     carry the one-click unsubscribe that marketing mail legally requires,
//     which is why sends never go through the plain /emails endpoint.
//
// Secrets: RESEND_API_KEY (full access, named "website-newsletter" in the
// Resend dashboard) in website/.env, loaded by node --env-file. The Netlify
// token comes from NETLIFY_AUTH_TOKEN or, failing that, the Netlify CLI's own
// saved login (~/Library/Preferences/netlify/config.json).
//
// Deliberately dependency-free: plain fetch against both REST APIs. The body
// field names below are the ones the resend SDK (6.18.x) sends; audiences were
// renamed to segments and `segment_id` is the current name.

import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SITE = 'https://tenthgear.ai';
const NETLIFY_FORM_ID = '6a7dc8974b5c970007df8a8b'; // the "newsletter" form
const SEGMENT_NAME = 'Blog subscribers';
const FROM = 'Dave from TenthGear <dave@tenthgear.ai>';
const REPLY_TO = 'dave@tenthgear.ai';
const UNSUBSCRIBE_PLACEHOLDER = 'Unsubscribe: [unsubscribe-link]';
const UNSUBSCRIBE_TOKEN = '{{{RESEND_UNSUBSCRIBE_URL}}}';

/** Dave's own test signups (2026-08-13 and 2026-08-22). Dropped on every sync
 *  (Dave, 2026-09-09) so they never get a real broadcast. */
const EXCLUDE = new Set([
  'claude-test-2026-08-22@tenthgear.ai',
  'claude-test-signup@tenthgear.ai',
  'dsonders@gmail.com',
]);

/** From shared/brand.md "Banned words & phrases". Warnings only; the draft is
 *  Dave's to edit. */
const BANNED_WORDS = [
  /\brevolutioni[sz]e/i, /\brevolutionary\b/i, /\bgame-?changer/i,
  /\bcutting-edge\b/i, /\bstate-of-the-art\b/i, /\bseamless(ly)?\b/i,
  /\bleverag(e|es|ed|ing)\b/i, /\bharness the power of\b/i,
  /\bempower(s|ed|ing)?\b/i, /\brobust\b/i, /\bsolution(s)?\b/i,
];

const ROOT = new URL('..', import.meta.url).pathname;
const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function resendKey() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    throw new Error(
      'RESEND_API_KEY is empty. Paste a full-access key into website/.env ' +
        '(Resend dashboard > API Keys > "website-newsletter").',
    );
  }
  return key;
}

function netlifyToken() {
  const fromEnv = process.env.NETLIFY_AUTH_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  const cfgPath = join(homedir(), 'Library', 'Preferences', 'netlify', 'config.json');
  if (!existsSync(cfgPath)) {
    throw new Error(`No NETLIFY_AUTH_TOKEN and no Netlify CLI login at ${cfgPath}. Run: npx -y netlify-cli login`);
  }
  const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
  const token = cfg.users?.[cfg.userId]?.auth?.token;
  if (!token) throw new Error('Netlify CLI config has no auth token. Run: npx -y netlify-cli login');
  return token;
}

/** Resend allows 2 requests/second; every write waits this long first. */
const RESEND_WRITE_GAP_MS = 600;

async function resend(method, path, body) {
  if (method !== 'GET') await sleep(RESEND_WRITE_GAP_MS);
  const res = await fetch(`https://api.resend.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${resendKey()}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) {
    throw new Error(`Resend ${method} ${path} -> ${res.status}: ${json.message ?? json.raw ?? text}`);
  }
  return json;
}

async function netlifyGet(path) {
  const res = await fetch(`https://api.netlify.com/api/v1${path}`, {
    headers: { Authorization: `Bearer ${netlifyToken()}` },
  });
  if (!res.ok) throw new Error(`Netlify GET ${path} -> ${res.status}: ${await res.text()}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// sync
// ---------------------------------------------------------------------------

/** Every verified (non-spam) submission of the newsletter form, all pages. */
async function netlifySubscribers() {
  const seen = new Map(); // email -> first submission date
  let invalid = 0;
  let excluded = 0;
  for (let page = 1; ; page++) {
    const rows = await netlifyGet(
      `/forms/${NETLIFY_FORM_ID}/submissions?per_page=100&page=${page}`,
    );
    if (!Array.isArray(rows) || rows.length === 0) break;
    for (const row of rows) {
      const raw = (row.data?.email ?? row.email ?? '').trim().toLowerCase();
      // Bots POST straight to the form endpoint and skip the browser's
      // `required`, so an empty or malformed address is expected here.
      if (!EMAIL_RE.test(raw)) { invalid++; continue; }
      if (EXCLUDE.has(raw)) { excluded++; continue; }
      if (!seen.has(raw)) seen.set(raw, row.created_at);
    }
    if (rows.length < 100) break;
  }
  return { emails: [...seen.keys()], invalid, excluded };
}

/** Resend paginates at 100; follow has_more/after or a >100-contact account
 *  silently syncs a truncated view (same rule as the app's blast script). */
async function listAllContacts(segmentId) {
  const contacts = new Map(); // email -> { id, unsubscribed }
  const base = segmentId ? `/segments/${segmentId}/contacts` : '/contacts';
  let after;
  for (;;) {
    const qs = new URLSearchParams({ limit: '100', ...(after ? { after } : {}) });
    const data = await resend('GET', `${base}?${qs}`);
    for (const c of data.data ?? []) {
      contacts.set(c.email.toLowerCase(), { id: c.id, unsubscribed: !!c.unsubscribed });
    }
    if (!data.has_more || !data.data?.length) return contacts;
    after = data.data[data.data.length - 1].id;
  }
}

async function ensureSegment() {
  let after;
  for (;;) {
    const qs = new URLSearchParams({ limit: '100', ...(after ? { after } : {}) });
    const data = await resend('GET', `/segments?${qs}`);
    const found = (data.data ?? []).find((s) => s.name === SEGMENT_NAME);
    if (found) return found.id;
    if (!data.has_more || !data.data?.length) break;
    after = data.data[data.data.length - 1].id;
  }
  const created = await resend('POST', '/segments', { name: SEGMENT_NAME });
  console.log(`Created Resend segment "${SEGMENT_NAME}" (${created.id}).`);
  return created.id;
}

async function sync() {
  console.log(`Reading Netlify form submissions...`);
  const { emails, invalid, excluded } = await netlifySubscribers();
  console.log(`  ${emails.length} valid address(es); skipped ${invalid} empty/invalid, ${excluded} excluded test address(es).\n`);

  const segmentId = await ensureSegment();
  const inSegment = await listAllContacts(segmentId);
  const allContacts = await listAllContacts();

  let present = 0;
  let addedExisting = 0;
  let created = 0;
  const optedOut = [];

  for (const email of emails) {
    if (inSegment.has(email)) { present++; continue; }
    const existing = allContacts.get(email);
    if (existing?.unsubscribed) {
      // Their opt-out stands. Never re-add an unsubscribed contact to a
      // marketing segment by a sync.
      optedOut.push(email);
      continue;
    }
    if (existing) {
      await resend('POST', `/contacts/${existing.id}/segments/${segmentId}`);
      addedExisting++;
    } else {
      await resend('POST', '/contacts', {
        email,
        unsubscribed: false,
        segments: [{ id: segmentId }],
      });
      created++;
    }
  }

  const total = present + addedExisting + created;
  console.log(`Segment "${SEGMENT_NAME}" sync complete.`);
  console.log(`  Already in segment: ${present}`);
  console.log(`  Added (existing contact): ${addedExisting}`);
  console.log(`  Added (new contact): ${created}`);
  if (optedOut.length) console.log(`  Opted out, left alone: ${optedOut.length}`);
  console.log(`  Recipients now in segment: ${inSegment.size + addedExisting + created} (${total} from the form)\n`);
  return { segmentId, recipients: inSegment.size + addedExisting + created };
}

// ---------------------------------------------------------------------------
// announce
// ---------------------------------------------------------------------------

/** Pull subject, preview text and the fenced body out of the distribution doc. */
function readEmailDraft(slug) {
  const docPath = join(ROOT, 'docs', 'distribution', `${slug}.md`);
  const postPath = join(ROOT, 'src', 'content', 'blog', `${slug}.md`);
  if (!existsSync(postPath)) throw new Error(`No blog post at src/content/blog/${slug}.md`);
  if (!existsSync(docPath)) throw new Error(`No distribution doc at docs/distribution/${slug}.md`);

  const md = readFileSync(docPath, 'utf8');
  const start = md.search(/^## Email announcement/m);
  if (start < 0) throw new Error(`docs/distribution/${slug}.md has no "## Email announcement" section`);
  const rest = md.slice(start + 1);
  const nextHeading = rest.search(/^## /m);
  const section = nextHeading < 0 ? rest : rest.slice(0, nextHeading);

  const subject = section.match(/\*\*Subject:\*\*\s*(.+)/)?.[1]?.trim();
  const previewMatch = section.match(/\*\*Preview text:\*\*\s*(.+)/);
  const previewText = previewMatch?.[1]?.trim();
  if (!subject) throw new Error('Email section is missing "**Subject:**"');
  if (!previewText) throw new Error('Email section is missing "**Preview text:**"');

  // Current template: the body is a fenced block. Older docs (before 2026-07)
  // wrote it as plain markdown after the preview line; take everything after
  // that line, minus a "**Body:**" label and a trailing "---" rule.
  let body = section.match(/```\n([\s\S]*?)\n```/)?.[1];
  if (!body) {
    body = section
      .slice(previewMatch.index + previewMatch[0].length)
      .replace(/^\s*\*\*Body:\*\*\s*/m, '')
      .replace(/\n---\s*$/, '');
  }
  body = body.trim();
  if (!body) throw new Error('Email section has no body text');
  // Older docs used a {{unsubscribe}} token for the footer.
  body = body.replace(/^\{\{unsubscribe\}\}.*$/m, UNSUBSCRIBE_PLACEHOLDER);
  return { subject, previewText, body };
}

function preflight(slug, { subject, previewText, body }) {
  const warnings = [];
  const url = `${SITE}/blog/${slug}/`;
  if (!body.includes(url) && !body.includes(url.slice(0, -1))) {
    warnings.push(`Body does not link ${url}.`);
  }
  if (!body.includes(UNSUBSCRIBE_PLACEHOLDER)) {
    warnings.push(`Body has no "${UNSUBSCRIBE_PLACEHOLDER}" footer; one will be appended.`);
  }
  if (subject.length > 50) warnings.push(`Subject is ${subject.length} chars (target under 50).`);
  if (previewText.length > 90) warnings.push(`Preview text is ${previewText.length} chars (target under 90).`);
  const leftover = body.match(/\{\{[^}]+\}\}/g)?.filter((t) => t !== UNSUBSCRIBE_TOKEN);
  if (leftover?.length) {
    warnings.push(`Template tokens with nothing to fill them (the form collects only an email): ${[...new Set(leftover)].join(', ')}`);
  }
  const all = `${subject}\n${previewText}\n${body}`;
  if (/[–—]/.test(all)) warnings.push('Contains an em or en dash (brand.md: use commas, periods, or restructure).');
  for (const re of BANNED_WORDS) {
    const m = all.match(re);
    if (m) warnings.push(`Banned word (brand.md): "${m[0]}"`);
  }
  return warnings;
}

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Plain text in, simple email HTML out. Paragraphs split on blank lines,
 *  URLs become links, the unsubscribe token is left for Resend to fill. */
function render(draft, { forTest = false, slug } = {}) {
  // The site serves directory pages at /path/; a slash-less link 301s.
  const bare = `${SITE}/blog/${slug}`;
  let text = draft.body.replace(new RegExp(`${bare.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\w/-])`, 'g'), `${bare}/`);
  if (!text.includes(UNSUBSCRIBE_PLACEHOLDER)) text += `\n\n---\n${UNSUBSCRIBE_PLACEHOLDER}`;
  const unsubscribe = forTest ? `${SITE}/#test-unsubscribe-link` : UNSUBSCRIBE_TOKEN;
  text = text.replace(UNSUBSCRIBE_PLACEHOLDER, `Unsubscribe: ${unsubscribe}`);

  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const htmlParas = paragraphs.map((p) => {
    if (p === '---') return '<hr style="border:0;border-top:1px solid #dedcdd;margin:24px 0">';
    const isFooter = p.startsWith('Unsubscribe:');
    const escaped = escapeHtml(p)
      .replace(/(https?:\/\/[^\s<]+[^\s<.,)])/g, '<a href="$1" style="color:#0f766e">$1</a>')
      .replace(UNSUBSCRIBE_TOKEN, `<a href="${UNSUBSCRIBE_TOKEN}" style="color:#9b9799">Unsubscribe</a>`)
      .replace(/\n/g, '<br>');
    const style = isFooter
      ? 'margin:0 0 8px;font-size:12px;line-height:18px;color:#9b9799'
      : 'margin:0 0 16px;font-size:16px;line-height:24px;color:#333132';
    return `<p style="${style}">${escaped}</p>`;
  });

  const html = [
    '<!doctype html><html><body style="margin:0;padding:0;background:#ffffff">',
    `<span style="display:none;max-height:0;overflow:hidden">${escapeHtml(draft.previewText)}</span>`,
    '<div style="max-width:600px;margin:0 auto;padding:32px 20px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif">',
    ...htmlParas,
    '</div></body></html>',
  ].join('\n');

  return { html, text };
}

async function existingBroadcast(name) {
  let after;
  for (;;) {
    const qs = new URLSearchParams({ limit: '100', ...(after ? { after } : {}) });
    const data = await resend('GET', `/broadcasts?${qs}`);
    const found = (data.data ?? []).find((b) => b.name === name);
    if (found) return found;
    if (!data.has_more || !data.data?.length) return null;
    after = data.data[data.data.length - 1].id;
  }
}

async function announce({ slug, test, send, force }) {
  const draft = readEmailDraft(slug);
  const warnings = preflight(slug, draft);
  const name = `blog: ${slug}`;

  console.log(`Post:     ${SITE}/blog/${slug}/`);
  console.log(`Subject:  ${draft.subject}`);
  console.log(`Preview:  ${draft.previewText}`);
  console.log(`From:     ${FROM}  (reply-to ${REPLY_TO})`);
  console.log(`Segment:  ${SEGMENT_NAME}\n`);
  if (warnings.length) {
    console.log('Pre-flight warnings:');
    for (const w of warnings) console.log(`  - ${w}`);
    console.log('');
  }

  if (test) {
    const { html, text } = render(draft, { forTest: true, slug });
    const res = await resend('POST', '/emails', {
      from: FROM,
      to: [test],
      reply_to: REPLY_TO,
      subject: `[TEST] ${draft.subject}`,
      html,
      text,
    });
    console.log(`Test email sent to ${test} (Resend id ${res.id}). The unsubscribe link in a test is a placeholder.`);
    return;
  }

  if (!send) {
    const { text } = render(draft, { slug });
    console.log('--- rendered text version ---');
    console.log(text);
    console.log('--- end ---\n');
    console.log('Dry run. Nothing sent. Add --test you@x for a test email, or --send to broadcast.');
    return;
  }

  const prior = await existingBroadcast(name);
  if (prior && !force) {
    throw new Error(
      `A broadcast named "${name}" already exists (status: ${prior.status}, id ${prior.id}). ` +
        `Check https://resend.com/broadcasts before re-sending; pass --force to create another.`,
    );
  }

  const { segmentId, recipients } = await sync();
  if (recipients === 0) throw new Error('Segment is empty; nothing to send.');

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(
    `Send "${draft.subject}" to ${recipients} subscriber(s) in "${SEGMENT_NAME}"? Type the slug (${slug}) to confirm: `,
  );
  rl.close();
  if (answer.trim() !== slug) {
    console.log('Not confirmed. Nothing sent.');
    return;
  }

  const { html, text } = render(draft, { slug });
  const created = await resend('POST', '/broadcasts', {
    name,
    segment_id: segmentId,
    from: FROM,
    reply_to: REPLY_TO,
    subject: draft.subject,
    preview_text: draft.previewText,
    html,
    text,
  });
  await resend('POST', `/broadcasts/${created.id}/send`, {});
  console.log(`\nBroadcast "${name}" sent to ${recipients} subscriber(s).`);
  console.log(`Resend: https://resend.com/broadcasts/${created.id}`);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const USAGE = `Usage:
  node --env-file=.env scripts/newsletter.mjs sync
  node --env-file=.env scripts/newsletter.mjs announce --slug {post} [--test you@x | --send] [--force]`;

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const opts = { slug: undefined, test: undefined, send: false, force: false };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '--slug') opts.slug = rest[++i];
    else if (a === '--test') opts.test = rest[++i];
    else if (a === '--send') opts.send = true;
    else if (a === '--force') opts.force = true;
    else throw new Error(`Unknown argument: ${a}\n${USAGE}`);
  }

  if (cmd === 'sync') {
    await sync();
  } else if (cmd === 'announce') {
    if (!opts.slug) throw new Error(`--slug is required.\n${USAGE}`);
    if (opts.test && opts.send) throw new Error('--test and --send are mutually exclusive.');
    if (opts.test && !EMAIL_RE.test(opts.test)) throw new Error(`--test needs an email address, got "${opts.test}"`);
    await announce(opts);
  } else {
    throw new Error(USAGE);
  }
}

main().catch((err) => {
  console.error(`\n${err.message}`);
  process.exit(1);
});
