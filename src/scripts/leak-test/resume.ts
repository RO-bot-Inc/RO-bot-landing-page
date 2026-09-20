// Private workspace: validate the token from session storage (the page's
// first inline script moved it there from the URL fragment), then run the
// overview, the materials workspace, and booking. Uploads go straight from
// the browser to Cloud Storage over a resumable session the server opened.
import { API_PATH, MAX_INTAKE_BYTES, MAX_LINKS, UPLOAD_CHUNK_BYTES, formatBytes, rejectFile } from './presets';

const TOKEN_KEY = 'lt_rt';
const GA4_ID = 'G-28WMV6CTFP';
const SESSION_KEY = (fileId: string) => `lt_up_${fileId}`;

type Screen = 'loading' | 'home' | 'materials' | 'book' | 'invalid' | 'sent';

interface FileRow {
  id: string;
  name: string;
  size: number;
  status: 'pending' | 'done';
}
interface Workspace {
  id: string;
  name: string;
  email: string;
  dealership: string;
  materials: { status: 'not_started' | 'in_progress' | 'sent'; files: number; links: number; notes: string; sentAt: string | null };
  files: FileRow[];
  links: string[];
  booking: { status: 'not_booked' | 'booked'; at: string | null; rescheduleUrl: string | null };
  usedBytes: number;
  uploads: 'gcs' | 'mock' | 'off';
  calendly: string;
}

// Per-file transfer state that lives only in this tab.
interface Transfer {
  file: File | null;
  sessionUrl: string | null;
  sent: number;
  state: 'uploading' | 'paused' | 'failed' | 'done' | 'rejected';
  error: string;
  controller: AbortController | null;
}

const root = document.getElementById('rs') as HTMLElement;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

let token = '';
let ws: Workspace | null = null;
const transfers = new Map<string, Transfer>();
let materialsStarted = false;

// Server truth replaces the workspace, with two exceptions: responses are
// applied in the order their requests were sent (an earlier request's answer
// arriving late cannot roll back a later one), and rows this tab still owns
// stay: transfers not yet confirmed (a file added while another's completion
// was in flight) and the rows the browser itself refused (a ZIP, an oversize
// file), which exist only here and keep their message.
let reqSeq = 0;
let adoptedSeq = 0;
function adopt(intake: Workspace, seq = ++reqSeq): Workspace {
  if (ws && seq < adoptedSeq) return ws;
  adoptedSeq = seq;
  const serverIds = new Set(intake.files.map((f) => f.id));
  const kept = (ws?.files || []).filter(
    (f) => !serverIds.has(f.id) && (f.id.startsWith('local-') || (transfers.has(f.id) && transfers.get(f.id)!.state !== 'done')),
  );
  ws = { ...intake, files: [...intake.files, ...kept] };
  return ws;
}

// ------------------------------------------------------------- utilities
function show(screen: Screen) {
  root.dataset.screen = screen;
  root.querySelectorAll<HTMLElement>('.screen').forEach((el) => {
    el.hidden = el.dataset.name !== screen;
  });
  window.scrollTo(0, 0);
}

function track(event: string, params: Record<string, string | number> = {}) {
  try {
    const w = window as unknown as { dataLayer: unknown[] };
    w.dataLayer = w.dataLayer || [];
    (function gtag(..._args: unknown[]) {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer.push(arguments);
    })('event', event, { ...params, send_to: GA4_ID });
  } catch {
    /* never break the page */
  }
}

// Never throws: a dropped connection is { ok: false, status: 0 } like any other
// failure. `seq` is the send order, for adopt().
async function api<T = Record<string, unknown>>(body: Record<string, unknown>): Promise<{ ok: boolean; status: number; data: T; seq: number }> {
  const seq = ++reqSeq;
  try {
    const res = await fetch(API_PATH, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...body, token, website: '' }),
    });
    const data = (await res.json().catch(() => ({}))) as T;
    return { ok: res.ok, status: res.status, data, seq };
  } catch {
    return { ok: false, status: 0, data: {} as T, seq };
  }
}

const first = (name: string) => name.trim().split(/\s+/)[0] || 'there';
const eastern = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', ...opts }).format(new Date(iso));
// Matches the email copy: "Tue, Oct 6 at 10:00 AM ET".
const whenShort = (iso: string) => `${eastern(iso, { weekday: 'short', month: 'short', day: 'numeric' })} at ${eastern(iso, { hour: 'numeric', minute: '2-digit' })} ET`;
const whenPill = (iso: string) => `${eastern(iso, { month: 'short', day: 'numeric' })}, ${eastern(iso, { hour: 'numeric', minute: '2-digit' })} ET`;
const countLine = (files: number, links: number) => `${files} file${files === 1 ? '' : 's'}, ${links} link${links === 1 ? '' : 's'}`;

// -------------------------------------------------------------- overview
function renderHome() {
  if (!ws) return;
  const sent = ws.materials.status === 'sent';
  const booked = ws.booking.status === 'booked';
  const at = ws.booking.at;
  $('rs-first').textContent = first(ws.name);
  $('rs-who').textContent = `${ws.name}, ${ws.dealership}`;

  const banner = $('rs-banner');
  banner.className = 'banner';
  // Simulated uploads (preview builds) never claim Dave has the files.
  const simulated = ws.uploads === 'mock' ? ' (Uploads are simulated on this preview.)' : '';
  if (sent && booked) {
    banner.textContent = `You're all set, ${first(ws.name)}. Dave reviews your ROs ${at ? `before ${whenShort(at)}` : 'before your session'} and brings a scorecard, the evidence, estimated impact where the ROs support one, and what to fix first.${simulated}`;
    banner.classList.add('y');
  } else if (booked) {
    banner.textContent = at
      ? `You're booked for ${whenShort(at)}. Share your ROs any time before then and Dave will have findings ready.`
      : "You're booked. Share your ROs any time before we meet and Dave will have findings ready.";
  } else if (sent) {
    banner.textContent = `Got it. Dave has your files. Pick a time and he'll walk you through what he finds.${simulated}`;
  }
  banner.hidden = !(sent || booked);
  $('rs-lede').hidden = sent || booked;

  // Materials card
  const mp = $('rs-materials-pill');
  $('rs-materials-title').textContent = sent ? 'Service materials shared' : 'Upload service materials';
  $('rs-materials-intro').hidden = sent;
  if (sent) {
    mp.textContent = countLine(ws.materials.files, ws.materials.links);
    mp.className = 'pill done';
  } else {
    mp.textContent = ws.materials.status === 'in_progress' ? 'In progress' : 'Not started';
    mp.className = 'pill go';
  }
  $('rs-materials-btn').textContent = sent || ws.materials.status === 'in_progress' ? 'Add more' : 'Add materials';

  // Booking card
  const bp = $('rs-booking-pill');
  $('rs-booking-title').textContent = booked ? 'Review session is booked' : 'Book your review session';
  $('rs-booking-intro').hidden = booked;
  if (booked) {
    bp.textContent = at ? whenPill(at) : 'Booked';
    bp.className = 'pill done';
  } else {
    bp.textContent = 'Not booked';
    bp.className = 'pill go';
  }
  $('rs-booking-btn').textContent = booked ? 'Reschedule' : 'Pick a time';
  $('rs-booking-btn').className = booked ? 'btn sm ghost' : 'btn sm dark';
}

// ------------------------------------------------------------- materials
function renderFiles() {
  if (!ws) return;
  const list = $('rs-files');
  list.innerHTML = '';
  for (const f of ws.files) {
    const t = transfers.get(f.id);
    const li = document.createElement('li');
    const n = document.createElement('span');
    n.className = 'n';
    n.textContent = f.name;
    const s = document.createElement('span');
    s.className = 's';
    const act = document.createElement('span');
    act.className = 'act';
    const button = (label: string, fn: () => void, strong = false) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'linklike';
      b.textContent = label;
      if (strong) b.style.fontWeight = '700';
      b.addEventListener('click', fn);
      act.appendChild(b);
    };
    let bar: HTMLElement | null = null;

    if (f.status === 'done') {
      s.innerHTML =
        ws.uploads === 'mock'
          ? `${formatBytes(f.size)} · simulated <span class="check" title="Simulated: no bytes stored">✓</span>`
          : `${formatBytes(f.size)} <span class="check" title="Saved">✓</span>`;
      button('Remove', () => removeFile(f.id));
    } else if (t?.state === 'rejected') {
      s.textContent = t.error;
      s.className = 's bad';
      button('Dismiss', () => {
        transfers.delete(f.id);
        removeFile(f.id);
      });
    } else if (t?.state === 'uploading') {
      s.textContent = `${formatBytes(t.sent)} of ${formatBytes(f.size)}`;
      bar = progressBar(t.sent / f.size, false);
      button('Pause', () => pauseUpload(f.id));
    } else if (t?.state === 'paused') {
      s.textContent = `Paused at ${formatBytes(t.sent)} of ${formatBytes(f.size)}`;
      bar = progressBar(t.sent / f.size, false);
      button('Resume', () => resumeUpload(f.id), true);
      button('Remove', () => removeFile(f.id));
    } else {
      // failed, or pending from an earlier visit with no File object in this tab
      s.textContent = 'Upload interrupted';
      s.className = 's bad';
      bar = progressBar(t ? t.sent / f.size : 0, true);
      button('Retry', () => (t?.file ? resumeUpload(f.id) : repickFile(f)), true);
      button('Remove', () => removeFile(f.id));
    }
    li.append(n, s);
    if (bar) li.appendChild(bar);
    li.appendChild(act);
    list.appendChild(li);
  }
  const pending = ws.files.filter((f) => f.status !== 'done' && transfers.get(f.id)?.state !== 'rejected').length;
  $('rs-usage').hidden = ws.uploads === 'off';
  $('rs-usage').textContent = `${formatBytes(ws.usedBytes)} of ${formatBytes(MAX_INTAKE_BYTES)} used${pending ? ` · ${pending} still uploading` : ''} · Uploads keep going if you switch tabs. If your connection drops, Retry picks up where it left off.`;
}

function progressBar(fraction: number, bad: boolean): HTMLElement {
  const bar = document.createElement('span');
  bar.className = `bar${bad ? ' bad' : ''}`;
  const i = document.createElement('i');
  i.style.width = `${Math.round(Math.min(1, Math.max(0, fraction)) * 100)}%`;
  bar.appendChild(i);
  return bar;
}

function renderLinks() {
  if (!ws) return;
  const box = $('rs-links');
  box.innerHTML = '';
  const values = ws.links.length ? [...ws.links] : [''];
  values.forEach((v, i) => addLinkRow(v, i === values.length - 1 && !v));
  $('rs-add-link').hidden = box.children.length >= MAX_LINKS;
}

function addLinkRow(value = '', placeholder = true) {
  const box = $('rs-links');
  const row = document.createElement('div');
  row.className = 'link-row';
  const input = document.createElement('input');
  input.type = 'url';
  input.inputMode = 'url';
  input.autocomplete = 'off';
  input.value = value;
  input.placeholder = placeholder ? 'Paste a link a customer would receive' : '';
  input.maxLength = 500;
  input.setAttribute('aria-label', 'Customer-facing link');
  input.addEventListener('input', scheduleSave);
  const rm = document.createElement('button');
  rm.type = 'button';
  rm.className = 'linklike';
  rm.textContent = 'Remove';
  rm.addEventListener('click', () => {
    row.remove();
    if (!box.children.length) addLinkRow();
    scheduleSave();
  });
  row.append(input, rm);
  box.appendChild(row);
  $('rs-add-link').hidden = box.children.length >= MAX_LINKS;
  return input;
}

function readLinks(): string[] {
  return Array.from($('rs-links').querySelectorAll<HTMLInputElement>('input'))
    .map((i) => i.value.trim())
    .filter(Boolean);
}

let saveTimer = 0;
// Edits since the last accepted save. While dirty, the inputs are the truth
// and are never repopulated from the server; a save that lands after newer
// typing does not clear the flag.
let editSeq = 0;
let savedSeq = 0;
const dirty = () => editSeq !== savedSeq;

function scheduleSave() {
  window.clearTimeout(saveTimer);
  editSeq++;
  $('rs-saved').textContent = 'Saving...';
  saveTimer = window.setTimeout(saveNow, 1200);
}

// Resolves true only when the server accepted the links and notes. Saves run
// one at a time, so an older request can never land after a newer one; a
// call made while one is in flight waits for it and then sends the latest text.
let saveChain: Promise<unknown> = Promise.resolve();
function saveNow(): Promise<boolean> {
  const run = saveChain.then(performSave);
  saveChain = run.catch(() => undefined);
  return run;
}

async function performSave(): Promise<boolean> {
  window.clearTimeout(saveTimer);
  const seq = editSeq;
  const links = readLinks();
  const notes = $<HTMLTextAreaElement>('rs-notes').value;
  if (!materialsStarted && links.length) startedMaterials('url');
  const { ok, data, seq: rseq } = await api<{ intake: Workspace }>({ action: 'save', links, notes });
  if (ok && data) {
    // A response superseded by newer typing is not adopted: the inputs are
    // ahead of it, and the save they triggered lands next.
    if (seq === editSeq) {
      adopt(data.intake, rseq);
      savedSeq = seq;
      $('rs-saved').textContent = 'Saved. You can leave and come back.';
      renderHome();
    }
    return seq === editSeq;
  }
  $('rs-saved').textContent = "That didn't save. Check your connection; your text is still here.";
  return false;
}

function startedMaterials(kind: 'file' | 'url') {
  materialsStarted = true;
  track('aas_materials_start', { file_or_url: kind });
}

// --------------------------------------------------------------- uploads
async function addFiles(files: FileList | File[]) {
  if (!ws) return;
  for (const file of Array.from(files)) {
    const reason = rejectFile(file.name, file.size);
    const localId = `local-${Math.random().toString(36).slice(2)}`;
    if (reason) {
      ws.files.push({ id: localId, name: file.name, size: file.size, status: 'pending' });
      transfers.set(localId, { file: null, sessionUrl: null, sent: 0, state: 'rejected', error: reason, controller: null });
      renderFiles();
      continue;
    }
    if (ws.usedBytes + file.size > MAX_INTAKE_BYTES) {
      ws.files.push({ id: localId, name: file.name, size: file.size, status: 'pending' });
      transfers.set(localId, { file: null, sessionUrl: null, sent: 0, state: 'rejected', error: 'That would go past the 5 GB total for this leak test.', controller: null });
      renderFiles();
      continue;
    }
    if (!materialsStarted) startedMaterials('file');
    const { ok, data } = await api<{ fileId: string; uploadUrl: string | null; usedBytes: number; error?: string }>({
      action: 'upload-start',
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
    });
    if (!ok) {
      const error =
        data.error === 'bad_file'
          ? rejectFile(file.name, file.size) || 'That file type is not accepted.'
          : data.error === 'too_large'
            ? 'That would go past the 5 GB total for this leak test.'
            : data.error === 'uploads_off'
              ? "File upload isn't open yet. Add links and a note, or reply to Dave's email."
              : "That didn't go through. Try again.";
      ws.files.push({ id: localId, name: file.name, size: file.size, status: 'pending' });
      transfers.set(localId, { file: null, sessionUrl: null, sent: 0, state: 'rejected', error, controller: null });
      renderFiles();
      continue;
    }
    ws.files.push({ id: data.fileId, name: file.name, size: file.size, status: 'pending' });
    ws.usedBytes = data.usedBytes;
    if (ws.materials.status === 'not_started') ws.materials.status = 'in_progress';
    transfers.set(data.fileId, { file, sessionUrl: data.uploadUrl, sent: 0, state: 'uploading', error: '', controller: null });
    try {
      if (data.uploadUrl) localStorage.setItem(SESSION_KEY(data.fileId), JSON.stringify({ url: data.uploadUrl, name: file.name, size: file.size }));
    } catch {
      /* fine */
    }
    renderFiles();
    renderHome();
    enqueueUpload(data.fileId);
  }
}

// One transfer at a time: kinder to conference and hotel connections, and
// each completion reaches the server on its own.
let uploadChain: Promise<void> = Promise.resolve();
function enqueueUpload(fileId: string) {
  uploadChain = uploadChain.then(() => runUpload(fileId)).catch(() => undefined);
}

// Ask GCS where a session stands. The Range header is only readable when
// exposed by CORS; when it is not, start over from zero rather than guess.
async function sessionOffset(url: string, size: number): Promise<number> {
  const res = await fetch(url, { method: 'PUT', headers: { 'Content-Range': `bytes */${size}` } });
  if (res.status === 308) {
    const range = res.headers.get('Range');
    return range ? Number(range.split('-')[1]) + 1 : 0;
  }
  if (res.ok) return size;
  throw new Error(`status ${res.status}`);
}

let lastPing = 0;
async function runUpload(fileId: string) {
  const t = transfers.get(fileId);
  const row = ws?.files.find((f) => f.id === fileId);
  // Paused or removed while queued: leave it alone.
  if (!t || !t.file || !row || t.state !== 'uploading') return;
  t.controller = new AbortController();
  const { file } = t;
  try {
    if (!t.sessionUrl) {
      // Mock uploads: no bucket yet. Walk the bar so the flow can be reviewed.
      for (let i = 1; i <= 6; i++) {
        if (t.controller.signal.aborted) return;
        await new Promise((r) => setTimeout(r, 200));
        t.sent = Math.round((file.size * i) / 6);
        renderFiles();
      }
    } else {
      if (t.sent > 0) t.sent = await sessionOffset(t.sessionUrl, file.size);
      while (t.sent < file.size) {
        const end = Math.min(t.sent + UPLOAD_CHUNK_BYTES, file.size);
        const res = await fetch(t.sessionUrl, {
          method: 'PUT',
          headers: { 'Content-Range': `bytes ${t.sent}-${end - 1}/${file.size}` },
          body: file.slice(t.sent, end),
          signal: t.controller.signal,
        });
        if (res.status === 308) {
          const range = res.headers.get('Range');
          t.sent = range ? Number(range.split('-')[1]) + 1 : end;
        } else if (res.ok) {
          t.sent = file.size;
        } else {
          throw new Error(`status ${res.status}`);
        }
        renderFiles();
        if (Date.now() - lastPing > 4 * 60_000) {
          lastPing = Date.now();
          void api({ action: 'upload-ping' });
        }
      }
    }
    const { ok, data, seq } = await api<{ intake: Workspace }>({ action: 'upload-done', fileId });
    if (!ok) throw new Error('confirm failed');
    t.state = 'done';
    try {
      localStorage.removeItem(SESSION_KEY(fileId));
    } catch {
      /* fine */
    }
    adopt(data.intake, seq);
  } catch (err) {
    if ((err as Error).name === 'AbortError') return; // paused
    t.state = 'failed';
  }
  renderFiles();
  renderHome();
}

function pauseUpload(fileId: string) {
  const t = transfers.get(fileId);
  if (!t) return;
  t.controller?.abort();
  t.state = 'paused';
  renderFiles();
}

function resumeUpload(fileId: string) {
  const t = transfers.get(fileId);
  if (!t) return;
  t.state = 'uploading';
  renderFiles();
  enqueueUpload(fileId);
}

// A pending file from an earlier visit: the bytes have to be picked again.
// If it is the same file and the session is still open, it resumes.
function repickFile(row: FileRow) {
  const input = document.createElement('input');
  input.type = 'file';
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;
    let session: { url: string; name: string; size: number } | null = null;
    try {
      session = JSON.parse(localStorage.getItem(SESSION_KEY(row.id)) || 'null');
    } catch {
      /* fine */
    }
    if (session && file.name === session.name && file.size === session.size) {
      transfers.set(row.id, { file, sessionUrl: session.url, sent: 1, state: 'uploading', error: '', controller: null });
      enqueueUpload(row.id);
    } else {
      // Different file: drop the stale row, add the new one normally.
      void removeFile(row.id).then(() => addFiles([file]));
    }
  });
  input.click();
}

async function removeFile(fileId: string) {
  if (!ws) return;
  const forget = () => {
    transfers.get(fileId)?.controller?.abort();
    transfers.delete(fileId);
    try {
      localStorage.removeItem(SESSION_KEY(fileId));
    } catch {
      /* fine */
    }
  };
  if (fileId.startsWith('local-')) {
    forget();
    ws.files = ws.files.filter((f) => f.id !== fileId);
    renderFiles();
    return;
  }
  // Server first; the local recovery state goes only once the row is really gone.
  const { ok, data, seq } = await api<{ intake: Workspace }>({ action: 'upload-remove', fileId });
  if (ok) {
    forget();
    adopt(data.intake, seq);
  } else {
    $('rs-saved').textContent = "That file wasn't removed. Check your connection and try again.";
  }
  renderFiles();
  renderHome();
}

// Frame 11
function confirmDone() {
  if (!ws) return;
  const done = ws.files.filter((f) => f.status === 'done').length;
  // Rows the browser refused (ZIPs, oversize) were never uploads; only real transfers count as interrupted.
  const interrupted = ws.files.filter((f) => f.status !== 'done' && transfers.get(f.id)?.state !== 'rejected').length;
  const links = readLinks().length;
  const note = $<HTMLTextAreaElement>('rs-notes').value.trim() ? ', and a note' : '';
  let text = `You've added ${done} file${done === 1 ? '' : 's'}, ${links} link${links === 1 ? '' : 's'}${note}.`;
  if (interrupted) text += ` ${interrupted === 1 ? 'One file was' : `${interrupted} files were`} interrupted and won't be included unless you go back and hit "retry."`;
  $('rs-confirm-text').textContent = text;
  $('rs-confirm').hidden = false;
  $('rs-confirm-yes').focus();
}

async function sendMaterials() {
  $('rs-confirm').hidden = true;
  // Links and notes must be on the server before they count as sent.
  if (!(await saveNow())) {
    $('rs-saved').textContent = "Your links and note didn't save, so nothing was sent. Check your connection and try Done sharing again.";
    return;
  }
  const { ok, data, seq } = await api<{ intake: Workspace }>({ action: 'materials-done' });
  if (!ok || !data) {
    $('rs-saved').textContent = "That didn't go through. Check your connection and try Done sharing again.";
    return;
  }
  // Unfinished transfers were left out server-side; stop their bytes too,
  // before adopting, so their rows are not kept as "still ours".
  for (const [id, t] of transfers) {
    if (t.state === 'done') continue;
    t.controller?.abort();
    transfers.delete(id);
    try {
      localStorage.removeItem(SESSION_KEY(id));
    } catch {
      /* fine */
    }
  }
  const sent = adopt(data.intake, seq);
  track('aas_materials_complete', { file_count: sent.materials.files, url_count: sent.materials.links });
  renderHome();
  show('home');
}

function openMaterials() {
  if (!ws) return;
  // No bucket on this deploy: the drop zone gives way to an honest note.
  $('rs-drop').hidden = ws.uploads === 'off';
  $('rs-uploads-off').hidden = ws.uploads !== 'off';
  $('rs-uploads-mock').hidden = ws.uploads !== 'mock';
  renderFiles();
  // Unsaved typing (a pending or failed autosave) stays; only clean inputs
  // are repopulated from the server.
  if (!dirty()) {
    renderLinks();
    $<HTMLTextAreaElement>('rs-notes').value = ws.materials.notes;
    $('rs-saved').textContent = 'Everything saves as you go. You can leave and come back.';
  }
  show('materials');
}

// --------------------------------------------------------------- booking
declare global {
  interface Window {
    Calendly?: { initInlineWidget(opts: Record<string, unknown>): void };
  }
}
let calendlyLoaded = false;
let calendlyReady = false; // the embed itself reported event_type_viewed

function openBooking() {
  if (!ws) return;
  const url = new URL(ws.calendly);
  const link = $<HTMLAnchorElement>('rs-cal-link');
  const q = new URLSearchParams({ name: ws.name, email: ws.email, utm_source: 'leak_test', utm_campaign: 'aas_2026' });
  link.href = `${url.href}?${q}`;
  show('book');
  const fallback = $('rs-cal-fallback');
  fallback.hidden = true;
  calendlyReady = false;
  // The fallback stays available until the calendar itself says it rendered,
  // not merely until Calendly's script downloaded.
  window.setTimeout(() => {
    if (!calendlyReady) fallback.hidden = false;
  }, 6000);
  const mount = () => {
    if (!window.Calendly) return;
    window.Calendly.initInlineWidget({
      url: `${url.href}?hide_gdpr_banner=1`,
      parentElement: $('rs-cal'),
      prefill: { name: ws!.name, email: ws!.email },
      utm: { utmSource: 'leak_test', utmCampaign: 'aas_2026' },
    });
  };
  if (calendlyLoaded) {
    $('rs-cal').innerHTML = '';
    mount();
    return;
  }
  const s = document.createElement('script');
  s.src = 'https://assets.calendly.com/assets/external/widget.js';
  s.async = true;
  s.onload = () => {
    calendlyLoaded = true;
    mount();
  };
  s.onerror = () => {
    fallback.hidden = false;
  };
  document.head.appendChild(s);
}

// The embed announces a booking to its parent window. That message is the
// only booking signal (no paid webhooks); the server verifies the URI shape
// and, with an API token, reads the appointment time.
window.addEventListener('message', async (e: MessageEvent) => {
  if (e.origin !== 'https://calendly.com') return;
  const data = e.data as { event?: string; payload?: { event?: { uri?: string }; invitee?: { uri?: string } } };
  if (data?.event === 'calendly.event_type_viewed') {
    calendlyReady = true;
    $('rs-cal-fallback').hidden = true;
    return;
  }
  if (data?.event !== 'calendly.event_scheduled') return;
  await recordBooking({ eventUri: data.payload?.event?.uri || '', inviteeUri: data.payload?.invitee?.uri || '' });
});

// Calendly fires event_scheduled exactly once, after the meeting already exists
// on Dave's calendar, so this write must land: retry, then keep it for the
// next visit if it still cannot. The server side is idempotent.
// The persisted replay is keyed to the intake it belongs to, so a shared
// device (a booth laptop) never stamps one participant's booking on another.
const BOOKED_KEY = 'lt_booked';
const forgetBooking = () => {
  try {
    localStorage.removeItem(BOOKED_KEY);
  } catch {
    /* fine */
  }
};
// Only outages are worth retrying; a 4xx is final (bad payload, dead link).
const transient = (status: number) => status === 0 || status === 429 || status >= 500;

async function recordBooking(payload: { eventUri: string; inviteeUri: string }): Promise<boolean> {
  if (!ws) return false;
  let r = await api<{ intake: Workspace }>({ action: 'booked', ...payload });
  for (let attempt = 1; !r.ok && transient(r.status) && attempt <= 2; attempt++) {
    await new Promise((s) => setTimeout(s, 800 * attempt));
    r = await api<{ intake: Workspace }>({ action: 'booked', ...payload });
  }
  if (!r.ok) {
    if (transient(r.status)) {
      try {
        localStorage.setItem(BOOKED_KEY, JSON.stringify({ id: ws.id, payload }));
      } catch {
        /* the message still tells them */
      }
      $('rs-book-err').hidden = false;
      $('rs-home-note').hidden = false;
    } else {
      forgetBooking();
      track('aas_booking_record_failed', { status: r.status });
    }
    return false;
  }
  forgetBooking();
  $('rs-home-note').hidden = true;
  adopt(r.data.intake, r.seq);
  const days = ws!.booking.at ? Math.max(0, Math.round((Date.parse(ws!.booking.at) - Date.now()) / 86_400_000)) : -1;
  track('aas_booking_complete', { appointment_window: days < 0 ? 'unknown' : days <= 7 ? 'within_week' : days <= 14 ? 'two_weeks' : 'later' });
  renderHome();
  if (root.dataset.screen === 'book') window.setTimeout(() => show('home'), 1800);
  return true;
}

// A booking that could not be recorded last time is replayed on the next
// open, for the same intake only.
async function replayBooking() {
  let pending: { id: string; payload: { eventUri: string; inviteeUri: string } } | null = null;
  try {
    pending = JSON.parse(localStorage.getItem(BOOKED_KEY) || 'null');
  } catch {
    /* fine */
  }
  if (!pending || !ws) return;
  if (pending.id !== ws.id) return; // someone else's; left for their next visit
  if (ws.booking.status === 'booked') {
    forgetBooking();
    return;
  }
  await recordBooking(pending.payload);
}

// -------------------------------------------------------------- recovery
$<HTMLFormElement>('rs-fresh').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $<HTMLInputElement>('rs-email').value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
    $<HTMLInputElement>('rs-email').focus();
    return;
  }
  const btn = $<HTMLButtonElement>('rs-send');
  const err = $('rs-fresh-err');
  btn.disabled = true;
  err.hidden = true;
  let accepted = false;
  try {
    const cfg = await fetch(API_PATH, { cache: 'no-store' });
    if (cfg.ok) {
      const { token: pageToken } = (await cfg.json()) as { token: string };
      const res = await fetch(API_PATH, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'fresh-link', token: pageToken, email, website: '' }),
      });
      accepted = res.ok;
    }
  } catch {
    accepted = false;
  }
  btn.disabled = false;
  if (accepted) show('sent');
  else err.hidden = false;
});

// ------------------------------------------------------------------ wiring
root.querySelectorAll<HTMLElement>('[data-go]').forEach((el) => {
  el.addEventListener('click', () => {
    const to = el.dataset.go;
    if (to === 'materials') openMaterials();
    else if (to === 'book') {
      // Booked already: Calendly's own reschedule page, which keeps the original slot until they pick a new one.
      if (ws?.booking.status === 'booked' && ws.booking.rescheduleUrl) window.open(ws.booking.rescheduleUrl, '_blank', 'noopener');
      else openBooking();
    } else {
      // Leaving the workspace flushes pending typing; the inputs keep it either way.
      if (dirty()) void saveNow();
      renderHome();
      show('home');
    }
  });
});

const drop = $('rs-drop');
const fileInput = $<HTMLInputElement>('rs-file');
drop.addEventListener('click', () => fileInput.click());
drop.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});
fileInput.addEventListener('change', () => {
  if (fileInput.files?.length) void addFiles(fileInput.files);
  fileInput.value = '';
});
for (const ev of ['dragenter', 'dragover']) {
  drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.add('over');
  });
}
for (const ev of ['dragleave', 'drop']) {
  drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.remove('over');
  });
}
drop.addEventListener('drop', (e) => {
  const files = (e as DragEvent).dataTransfer?.files;
  if (files?.length) void addFiles(files);
});
$('rs-add-link').addEventListener('click', () => addLinkRow('', true).focus());
$<HTMLTextAreaElement>('rs-notes').addEventListener('input', scheduleSave);
$('rs-done').addEventListener('click', () => {
  window.clearTimeout(saveTimer);
  confirmDone();
});
$('rs-confirm-yes').addEventListener('click', () => void sendMaterials());
$('rs-confirm-no').addEventListener('click', () => {
  $('rs-confirm').hidden = true;
  // "Done sharing" had cancelled the pending autosave; re-arm it.
  if (dirty()) scheduleSave();
});
// Everything that belonged to the previous participant in this tab: in-flight
// transfers, unsaved typing, timers, the booking replay.
function resetSession() {
  for (const t of transfers.values()) t.controller?.abort();
  transfers.clear();
  window.clearTimeout(saveTimer);
  editSeq = savedSeq = 0;
  adoptedSeq = 0;
  $('rs-links').innerHTML = '';
  $<HTMLTextAreaElement>('rs-notes').value = '';
  $('rs-files').innerHTML = '';
  $('rs-home-note').hidden = true;
  forgetBooking();
  token = '';
  ws = null;
}

$('rs-notyou').addEventListener('click', () => {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
  resetSession();
  show('invalid');
});
window.addEventListener('beforeunload', (e) => {
  if (dirty() || [...transfers.values()].some((t) => t.state === 'uploading')) e.preventDefault();
});

// ------------------------------------------------------------------ open
async function open() {
  try {
    token = sessionStorage.getItem(TOKEN_KEY) || '';
  } catch {
    /* ignore */
  }
  if (!token) return show('invalid');
  let opened: Workspace;
  try {
    const { ok, data, seq } = await api<{ intake: Workspace }>({ action: 'resume' });
    if (!ok) return show('invalid');
    ws = null; // a fresh open never inherits another participant's local rows
    opened = adopt(data.intake, seq);
  } catch {
    return show('invalid');
  }
  materialsStarted = opened.materials.status !== 'not_started';
  const remaining = [opened.materials.status !== 'sent' && 'materials', opened.booking.status !== 'booked' && 'booking'].filter(Boolean).join('+');
  track('aas_resume_open', { remaining_actions: remaining || 'none' });
  await replayBooking();
  renderHome();
  const view = new URLSearchParams(location.search).get('view');
  if (view === 'book' && opened.booking.status !== 'booked') openBooking();
  else if (view === 'materials') openMaterials();
  else show('home');
}

// A second link opened in the same tab is only a hash change, so the head
// script does not run again. Stash and strip here, then start over.
window.addEventListener('hashchange', () => {
  const h = location.hash.slice(1);
  if (!h) return;
  try {
    sessionStorage.setItem(TOKEN_KEY, h);
  } catch {
    /* ignore */
  }
  history.replaceState(null, '', location.pathname + location.search);
  resetSession();
  show('loading');
  void open();
});

void open();
