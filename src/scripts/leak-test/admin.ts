// Dave's file page. The signed ticket comes from the URL fragment (moved to
// session storage by the head script). Download links are minted per view
// and last ten minutes.
import { API_PATH, formatBytes } from './presets';

const root = document.getElementById('ad') as HTMLElement;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

interface AdminIntake {
  name: string;
  email: string;
  dealership: string;
  contact: { name: string; email: string; dealership: string; title: string; phone?: string; dms?: string; lane?: string };
  source: Record<string, string | undefined>;
  createdAt: string;
  lastActivityAt: string;
  purgedAt: string | null;
  liveLinks: number;
  materials: { status: string; files: number; links: number; notes: string; sentAt: string | null };
  files: { id: string; name: string; size: number; status: string; url: string | null }[];
  links: string[];
  booking: { status: string; at: string | null };
  uploads: 'gcs' | 'mock' | 'off';
  emails: { at: string; kind: string; subject: string; to: string; id: string | null }[];
}

function show(screen: 'loading' | 'home' | 'invalid') {
  root.dataset.screen = screen;
  root.querySelectorAll<HTMLElement>('.screen').forEach((el) => {
    el.hidden = el.dataset.name !== screen;
  });
}

const when = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));

const li = (parent: HTMLElement, text: string, link?: { href: string; label: string }) => {
  const el = document.createElement('li');
  el.textContent = text;
  if (link) {
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.label;
    a.target = '_blank';
    a.rel = 'noopener';
    el.append(' ', a);
  }
  parent.appendChild(el);
};

let ticket = '';

// Never throws: a dropped connection is an { ok: false } like any other failure.
async function api<T>(body: Record<string, unknown>): Promise<{ ok: boolean; data: T }> {
  try {
    const res = await fetch(API_PATH, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...body, ticket, website: '' }),
    });
    return { ok: res.ok, data: (await res.json().catch(() => ({}))) as T };
  } catch {
    return { ok: false, data: {} as T };
  }
}

function render(i: AdminIntake) {
  $('ad-title').textContent = `${i.contact.name} · ${i.contact.dealership}`;
  const materials =
    i.materials.status === 'sent'
      ? `Materials sent ${i.materials.sentAt ? when(i.materials.sentAt) : ''}`
      : i.materials.status === 'in_progress'
        ? 'Materials in progress'
        : 'Materials not started';
  const booking = i.booking.status === 'booked' ? `Booked${i.booking.at ? ` ${when(i.booking.at)}` : ' (time unknown; check Calendly)'}` : 'Not booked';
  $('ad-status').textContent = `${materials} · ${booking} · Enrolled ${when(i.createdAt)} · Last activity ${when(i.lastActivityAt)} · ${i.liveLinks} live link${i.liveLinks === 1 ? '' : 's'}${i.purgedAt ? ` · Purged ${when(i.purgedAt)}` : ''}`;

  const c = i.contact;
  $('ad-contact').innerHTML = '';
  for (const line of [`${c.name}, ${c.title}`, c.email, c.phone, c.dms && `DMS: ${c.dms}`, c.lane && `Lane software: ${c.lane}`].filter(Boolean)) {
    const d = document.createElement('div');
    d.textContent = line as string;
    $('ad-contact').appendChild(d);
  }
  const s = i.source;
  $('ad-source').textContent = `${[s.utm_source, s.utm_medium, s.utm_campaign, s.utm_content].map((v) => v || '-').join(' / ')}${s.device ? ` · ${s.device}` : ''}`;

  const files = $('ad-files');
  files.innerHTML = '';
  $('ad-files-note').textContent =
    i.uploads === 'gcs'
      ? 'Download links last 10 minutes. Reload for fresh ones.'
      : i.uploads === 'mock'
        ? 'Uploads are simulated on this deploy (no storage bucket): these rows are metadata only.'
        : 'File upload is switched off on this deploy (no storage bucket yet): participants can only add links and a note.';
  if (!i.files.length) li(files, 'No files.');
  for (const f of i.files) {
    const el = document.createElement('li');
    const n = document.createElement('span');
    n.className = 'n';
    n.textContent = f.name;
    const sz = document.createElement('span');
    sz.className = 's';
    sz.textContent = `${formatBytes(f.size)}${f.status !== 'done' ? ' · not finished' : ''}`;
    el.append(n, sz);
    if (f.url) {
      const a = document.createElement('a');
      a.href = f.url;
      a.textContent = 'Download';
      el.appendChild(a);
    }
    files.appendChild(el);
  }

  const links = $('ad-links');
  links.innerHTML = '';
  if (!i.links.length) li(links, 'No links.');
  for (const url of i.links) li(links, url, { href: url, label: 'Open' });

  $('ad-note-box').hidden = !i.materials.notes;
  $('ad-note').textContent = i.materials.notes;

  const emails = $('ad-emails');
  emails.innerHTML = '';
  if (!i.emails.length) li(emails, 'None yet.');
  for (const e of i.emails) li(emails, `${when(e.at)} · ${e.subject} · to ${e.to}`, e.id ? { href: `https://resend.com/emails/${e.id}`, label: 'Resend' } : undefined);

  $<HTMLButtonElement>('ad-revoke').disabled = i.liveLinks === 0;
  show('home');
}

$('ad-revoke').addEventListener('click', async () => {
  const btn = $<HTMLButtonElement>('ad-revoke');
  btn.disabled = true;
  const { ok } = await api<{ ok: boolean }>({ action: 'admin-revoke' });
  $('ad-revoke-note').textContent = ok ? 'Done. Their links no longer open anything; a fresh-link request would issue a new one.' : 'That did not go through.';
  if (!ok) btn.disabled = false;
});

(async function open() {
  try {
    ticket = sessionStorage.getItem('lt_admin') || '';
  } catch {
    /* ignore */
  }
  if (!ticket) return show('invalid');
  const { ok, data } = await api<{ intake: AdminIntake }>({ action: 'admin-view' });
  if (!ok) return show('invalid');
  render(data.intake);
})();
