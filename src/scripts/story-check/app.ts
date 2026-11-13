// Warranty Story Checker page logic. Talks to /api/story-check; the rubric
// never reaches the browser. Copy and flow follow the v3 prototype Dave
// approved on 2026-11-11 (gtm/docs/story-checker/README.md).
import {
  ELEMENTS,
  FREE_CHECKS_PER_DAY,
  LABELS,
  MISFIRE_A,
  SAMPLES,
  sampleResult,
  type Note,
  type Result,
} from './shared';
import { createPen, createReader, type PenEls } from './pen';

const API = '/api/story-check';
const GA4_ID = 'G-28WMV6CTFP';
const OPEN_FIXES = 2; // the rest unlock with the emailed report (a soft gate)
const MIN_READ_MS = 3000; // the pen reads for at least this long, so the grade feels earned
const MAX_READ_MS = 6000;

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const el = {
  sample: $('sc-sample'),
  sampleTag: $('sc-sample-tag'),
  editTools: $('sc-edit-tools'),
  reedit: $('sc-reedit'),
  edit: $<HTMLFormElement>('sc-edit'),
  complaint: $<HTMLTextAreaElement>('sc-complaint'),
  cause: $<HTMLTextAreaElement>('sc-cause'),
  correction: $<HTMLTextAreaElement>('sc-correction'),
  website: $<HTMLInputElement>('sc-website'),
  go: $<HTMLButtonElement>('sc-go'),
  err: $('sc-err'),
  left: $('sc-left'),
  review: $('sc-review'),
  rvStamp: $('sc-rv-stamp'),
  rvStatus: $('sc-rv-status'),
  rvStatusText: $('sc-rv-status-text'),
  aToggle: $('sc-a-toggle'),
  a: $('sc-a'),
  results: $('sc-results'),
  summary: $('sc-summary'),
  clean: $('sc-clean'),
  notes: $('sc-notes'),
  gate: $<HTMLFormElement>('sc-gate'),
  email: $<HTMLInputElement>('sc-email'),
  send: $<HTMLButtonElement>('sc-send'),
  gateErr: $('sc-gate-err'),
  sent: $('sc-sent'),
  another: $('sc-another'),
  mock: $('sc-mock'),
  demoLink: $('sc-demo-link'),
  modal: $('sc-modal'),
  limTitle: $('sc-lim-title'),
  demo: $<HTMLFormElement>('sc-demo'),
  dName: $<HTMLInputElement>('sc-d-name'),
  dEmail: $<HTMLInputElement>('sc-d-email'),
  dGo: $<HTMLButtonElement>('sc-d-go'),
  dErr: $('sc-d-err'),
  close: $('sc-close'),
  thanks: $('sc-thanks'),
  thanksTitle: $('sc-thanks-title'),
  keep: $('sc-keep'),
  live: $('sc-live'),
  liveGo: $('sc-live-go'),
  right: $('sc-right'),
  cols: document.querySelector<HTMLElement>('.sc-cols')!,
};

const state = {
  token: '',
  remaining: FREE_CHECKS_PER_DAY as number | null, // null = unlimited today
  sampleIdx: null as number | null,
  result: null as Result | null,
  ticket: '',
  active: null as number | null,
  reportSent: false,
  showA: false,
  busy: false,
  run: 0, // bumps on every grade or reset, so a stale reply or animation never lands
  live: false, // first look: the misfire sample red-pens itself until the visitor takes a turn
};

// ------------------------------------------------------------------ helpers
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);

function track(event: string, params: Record<string, string | number | boolean> = {}) {
  try {
    const w = window as unknown as { dataLayer: unknown[] };
    w.dataLayer = w.dataLayer || [];
    (function gtag(..._args: unknown[]) {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer.push(arguments);
    })('event', event, { ...params, send_to: GA4_ID });
  } catch {
    /* analytics must never break the flow */
  }
}

async function call(payload: Record<string, unknown>, retried = false): Promise<{ status: number; data: any }> {
  if (!state.token) await refreshToken();
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...payload, token: state.token, website: el.website.value }),
  });
  const data = await res.json().catch(() => ({}));
  // Token expired (tab left open for hours): get a fresh one and retry once.
  if (res.status === 429 && data.error === 'rate_limited' && !retried) {
    await refreshToken();
    return call(payload, true);
  }
  return { status: res.status, data };
}

async function refreshToken() {
  try {
    const res = await fetch(API, { headers: { accept: 'application/json' } });
    const data = await res.json();
    state.token = data.token || '';
    if ('remaining' in data) state.remaining = data.remaining;
    el.mock.hidden = data.mode !== 'mock';
    if (data.error === 'disabled') showError('The checker is taking a break. Try again later.');
  } catch {
    /* offline: the grade call will report it */
  }
  renderLeftLabel();
}

function renderLeftLabel() {
  el.left.textContent =
    state.remaining === null
      ? 'Unlimited checks today'
      : `${state.remaining} of ${FREE_CHECKS_PER_DAY} free checks left today`;
}

function showError(msg: string) {
  el.err.textContent = msg;
  el.err.hidden = !msg;
}

// ------------------------------------------------------------------ screens
type Screen = 'edit' | 'review' | 'results';
function show(screen: Screen) {
  const editing = screen === 'edit';
  el.edit.hidden = !editing || state.live;
  el.editTools.hidden = !editing || state.live;
  el.live.hidden = !(editing && state.live);
  el.review.hidden = editing;
  el.rvStatus.hidden = screen !== 'review';
  el.reedit.hidden = screen !== 'results';
  // The story takes the full width; the results come in under it once the pen is done.
  el.right.hidden = screen !== 'results';
  el.results.hidden = screen !== 'results';
  el.cols.classList.toggle('is-wide', true);
}

function syncFilled() {
  const filled = el.cause.value.trim() !== '' && el.correction.value.trim() !== '';
  el.go.classList.toggle('is-empty', !filled);
  const s = state.sampleIdx === null ? null : SAMPLES[state.sampleIdx];
  const isSample = !!s && el.cause.value === s.cause && el.correction.value === s.correction;
  el.sampleTag.hidden = !isSample;
  if (isSample) el.sampleTag.textContent = `Sample ${state.sampleIdx! + 1} of ${SAMPLES.length}: ${s!.label}`;
}

function nextSample(): number {
  state.sampleIdx = ((state.sampleIdx ?? -1) + 1) % SAMPLES.length;
  el.sample.textContent = 'Another Sample Story';
  return state.sampleIdx;
}

// ------------------------------------------------------------------ the red pen
const cardEls = (root: HTMLElement): PenEls => {
  const q = <T extends Element = HTMLElement>(c: string) => root.querySelector(c) as unknown as T;
  return {
    root, story: q('.sc-live-story'), col: q('.sc-live-col'), complaintWrap: q('.sc-live-cw'),
    complaint: q('.sc-live-complaint'), cause: q('.sc-live-cause'), corr: q('.sc-live-corr'),
    stamper: q('.sc-live-stamper'), ink: q<SVGSVGElement>('.sc-live-ink'), notes: q('.sc-live-notes'),
    stamp: q('.sc-live-stamp'), pen: q('.sc-live-pen'),
  };
};
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const stampHtml = (r: Result) => `<span class="sc-stamp-l">${esc(r.letter)}</span><span class="sc-stamp-g">${r.gpa.toFixed(2)} / 4</span>`;

function renderA(open: boolean) {
  state.showA = open;
  el.a.hidden = !open;
  el.aToggle.textContent = open ? 'Hide the A version' : 'See this story written to an A →';
  if (!open) return;
  const part = (segs: [string, boolean][]) => segs.map(([t, good]) => (good ? `<span class="sc-good">${esc(t)}</span>` : esc(t))).join('');
  el.a.innerHTML = `<div class="sc-a-head"><span>Same repair, written to an A</span><b>A</b></div>
    <p><strong>Cause: </strong>${part(MISFIRE_A.cause)}</p>
    <p><strong>Correction: </strong>${part(MISFIRE_A.correction)}</p>`;
}

// ------------------------------------------------------------------ first look
// The misfire sample types itself in, a red pen marks it up and writes in the
// margins (see pen.ts), the stamp lands, then it loops. Built from the sample's
// recorded grade, so it always matches what "Sample Story" returns.
let livePen: ReturnType<typeof createPen> | null = null;

function liveStart() {
  const s = SAMPLES.find((x) => x.id === 'misfire');
  if (!s) return;
  const r = sampleResult(s);
  state.live = true;
  show('edit');
  livePen = createPen(cardEls(el.live), { complaint: s.complaint, cause: r.cause, correction: r.correction }, r.notes, stampHtml(r), r.gpa >= 3.3);
  livePen.start(reduced());
}

function liveStop(focus: boolean) {
  if (!state.live) return;
  state.live = false;
  livePen?.stop();
  show('edit');
  if (focus) el.complaint.focus();
}

// ------------------------------------------------------------------ results
const chipText = (g: string) => (g === 'missing' ? '✕' : g === 'not_applicable' ? 'n/a' : g);

function renderResults() {
  const r = state.result;
  if (!r) return;
  const generic = ELEMENTS.filter((k) => ['C', 'D', 'F', 'missing'].includes(r.grades[k])).length;
  const n = r.notes.length;
  const headline =
    generic === 0 && n === 0
      ? 'Specific where it counts.'
      : generic === 0
        ? `Specific where it counts. ${n} red-pen note${n === 1 ? '' : 's'}.`
        : `${generic} of 6 criteria read as generic. ${n} red-pen note${n === 1 ? '' : 's'}.`;
  el.summary.innerHTML = `<p class="sc-headline">${esc(headline)}</p><div class="sc-grid">${ELEMENTS.map(
    (k) =>
      `<div class="sc-el"><span class="sc-chip sc-chip-${r.grades[k]}" aria-label="${r.grades[k] === 'missing' ? 'missing' : r.grades[k]}">${chipText(r.grades[k])}</span><span class="sc-el-label">${LABELS[k]}</span></div>`,
  ).join('')}</div>`;
  el.clean.hidden = n > 0;
  renderNotes();
  el.gate.hidden = state.reportSent || n <= OPEN_FIXES;
  el.sent.hidden = !state.reportSent;
  el.aToggle.hidden = r.sampleId !== 'misfire';
  renderA(state.showA && r.sampleId === 'misfire');
}

function renderNotes() {
  const r = state.result;
  if (!r) return;
  const lock = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path></svg>`;
  el.notes.innerHTML = r.notes
    .map((note, i) => {
      const open = i < OPEN_FIXES || state.reportSent;
      const on = state.active === note.n ? ' is-on' : '';
      return `<button type="button" class="sc-note${on}" data-note="${note.n}" aria-pressed="${!!on}">
        <span class="sc-note-n">${note.n}</span>
        <span class="sc-note-body">
          <span class="sc-note-top"><span class="sc-pen sc-note-pen">${esc(note.pen)}</span><span class="sc-note-crit">${esc(note.criterion)}</span></span>
          ${open ? `<span class="sc-note-fix"><b>${esc(note.fixLabel)}</b> ${esc(note.fix)}</span>` : `<span class="sc-note-lock">${lock} Fix included in the emailed report</span>`}
        </span>
      </button>`;
    })
    .join('');
}

function pick(n: number) {
  state.active = state.active === n ? null : n;
  renderNotes();
  // Light up the phrase the note is about, in the marked-up story.
  el.review.querySelectorAll<HTMLElement>('[data-mark]').forEach((m) => m.classList.toggle('is-on', Number(m.dataset.mark) === state.active));
}

// ------------------------------------------------------------------ grading
// The pen reads the story while the grader works, then marks it up note by
// note and stamps the grade; the results come in under the card after that.
let reader: ReturnType<typeof createReader> | null = null;
let gradePen: ReturnType<typeof createPen> | null = null;
const status = (s: string) => { if (el.rvStatusText.textContent !== s) el.rvStatusText.textContent = s; };

function stopPen() {
  state.run++;
  reader?.stop();
  reader = null;
  gradePen?.stop();
  gradePen = null;
}

async function grade(complaint: string, cause: string, correction: string) {
  if (state.busy) return;
  showError('');
  if (state.remaining === 0) return openModal(true);
  stopPen();
  const run = state.run;
  state.busy = true;
  el.go.disabled = true;
  state.result = null;
  state.active = null;
  state.reportSent = false;
  state.showA = false;
  el.rvStamp.removeAttribute('aria-label');
  show('review');
  const card = cardEls(el.review);
  const still = reduced();
  reader = createReader(card, { complaint, cause, correction }, status);
  if (still) status('Checking it against what auditors flag');
  else reader.start();
  const started = Date.now();

  try {
    const { status: code, data } = await call({ action: 'grade', complaint, cause, correction });
    if (run !== state.run) return;
    if ('remaining' in data) state.remaining = data.remaining;
    renderLeftLabel();
    if (code === 200 && data.result) {
      // Let the pen finish reading it once (3 to 6 seconds) before it starts marking.
      const wait = still ? 0 : Math.min(MAX_READ_MS, Math.max(MIN_READ_MS, reader?.pass ?? 0)) - (Date.now() - started);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      if (run !== state.run) return;
      const r = data.result as Result;
      state.result = r;
      state.ticket = data.ticket;
      const from = reader?.stop();
      reader = null;
      status('Red pen out');
      el.rvStamp.setAttribute('aria-label', `Grade ${r.letter}, ${r.gpa.toFixed(2)} out of 4`);
      gradePen = createPen(card, { complaint: r.complaint ?? complaint, cause: r.cause, correction: r.correction }, r.notes, stampHtml(r), r.gpa >= 3.3, {
        mode: 'grade',
        from: still ? undefined : from,
        onDone: () => {
          if (run !== state.run) return;
          renderResults();
          show('results');
          // Marked phrases work like the note cards: click or Enter/Space picks the note.
          el.review.querySelectorAll<HTMLElement>('[data-mark]').forEach((m) => {
            m.tabIndex = 0;
            m.setAttribute('role', 'button');
            m.setAttribute('aria-label', `Show note ${m.dataset.mark}`);
          });
        },
      });
      gradePen.start(still);
      track('story_check_graded', { sample: !!r.sampleId, letter: r.letter, notes: r.notes.length });
      return;
    }
    stopPen();
    show('edit');
    if (data.error === 'limit') return openModal(true);
    showError(
      data.error === 'capacity'
        ? "The checker hit today's limit. Try again tomorrow, or book a demo to see the full product."
        : data.error === 'bad_input'
          ? 'Each box takes up to 2,000 characters.'
          : data.error === 'disabled'
            ? 'The checker is taking a break. Try again later.'
            : "The grader didn't answer. Try again in a moment.",
    );
  } catch {
    if (run !== state.run) return;
    stopPen();
    show('edit');
    showError("Couldn't reach the grader. Check your connection and try again.");
  } finally {
    state.busy = false;
    el.go.disabled = false;
  }
}

// ------------------------------------------------------------------ modal
let lastFocus: HTMLElement | null = null;
function openModal(limitHit: boolean) {
  lastFocus = document.activeElement as HTMLElement | null;
  const done = state.remaining === null && !limitHit && el.demo.dataset.done === '1';
  el.limTitle.textContent = limitHit ? `That's your ${FREE_CHECKS_PER_DAY} free checks for today` : 'Book a 15-minute demo';
  el.close.textContent = limitHit ? 'Not now (checks reset tomorrow)' : 'Not now';
  el.demo.hidden = done;
  el.thanks.hidden = !done;
  el.dErr.hidden = true;
  el.modal.hidden = false;
  (done ? el.keep : el.dName).focus();
  if (limitHit) track('story_check_limit');
}

function closeModal() {
  el.modal.hidden = true;
  lastFocus?.focus();
}

async function submitDemo(e: Event) {
  e.preventDefault();
  const name = el.dName.value.trim();
  const email = el.dEmail.value.trim();
  if (!name || !isEmail(email)) {
    el.dErr.textContent = 'Add your name and a work email.';
    el.dErr.hidden = false;
    return;
  }
  el.dGo.disabled = true;
  try {
    const form = new FormData(el.demo);
    form.set('submitted_from', '/warranty-story-checker/');
    const res = await fetch('/', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(form as unknown as Record<string, string>).toString(),
    });
    if (!res.ok) throw new Error(String(res.status));
    // The lead is saved either way; only promise more checks if the unlock worked.
    const unlocked = await call({ action: 'unlock', name, email })
      .then(({ status, data }) => (status === 200 ? ((state.remaining = data.remaining ?? null), true) : false))
      .catch(() => false);
    $('sc-thanks-copy').textContent = unlocked
      ? "We'll be in touch to set up your demo. Keep checking stories as long as you like today."
      : "We'll be in touch to set up your demo. Your free checks reset tomorrow.";
    el.keep.textContent = unlocked ? 'Keep checking' : 'Close';
    renderLeftLabel();
    el.demo.dataset.done = '1';
    el.thanksTitle.textContent = `Thanks, ${name.split(/\s+/)[0]}.`;
    el.demo.hidden = true;
    el.thanks.hidden = false;
    el.keep.focus();
    if (!el.email.value) el.email.value = email;
    track('generate_lead', { form: 'story_checker_demo' });
    try {
      (window as unknown as { rdt?: (...a: unknown[]) => void }).rdt?.('track', 'Lead');
    } catch {
      /* ignore */
    }
  } catch {
    el.dErr.textContent = "That didn't go through. Try again, or use the demo page.";
    el.dErr.hidden = false;
  } finally {
    el.dGo.disabled = false;
  }
}

// ------------------------------------------------------------------ report
async function sendReport(e: Event) {
  e.preventDefault();
  const email = el.email.value.trim();
  if (!isEmail(email)) {
    el.gateErr.textContent = 'Enter a work email so we can send it.';
    el.gateErr.hidden = false;
    return;
  }
  el.send.disabled = true;
  el.gateErr.hidden = true;
  try {
    const { status, data } = await call({ action: 'report', email, ticket: state.ticket });
    if (status !== 200) {
      el.gateErr.textContent =
        data.error === 'capacity' ? "That address has had a lot of reports today. Try again tomorrow." : "That didn't send. Check the address and try again.";
      el.gateErr.hidden = false;
      return;
    }
    state.reportSent = true;
    el.sent.innerHTML = `<b>Sent to ${esc(email)}.</b> Every fix is unlocked above.`;
    renderResults();
    track('story_check_report');
  } catch {
    el.gateErr.textContent = "That didn't send. Try again.";
    el.gateErr.hidden = false;
  } finally {
    el.send.disabled = false;
  }
}

// ------------------------------------------------------------------ wiring
el.cause.addEventListener('input', () => { syncFilled(); showError(''); });
el.correction.addEventListener('input', () => { syncFilled(); showError(''); });

el.sample.addEventListener('click', () => {
  const s = SAMPLES[nextSample()];
  el.complaint.value = s.complaint;
  el.cause.value = s.cause;
  el.correction.value = s.correction;
  syncFilled();
  showError('');
});

el.edit.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!el.cause.value.trim() || !el.correction.value.trim()) return showError('Paste both a cause and a correction first.');
  grade(el.complaint.value, el.cause.value, el.correction.value);
});

el.reedit.addEventListener('click', () => {
  stopPen();
  state.active = null;
  show('edit');
  el.cause.focus();
});

el.another.addEventListener('click', () => {
  stopPen();
  state.result = null;
  state.active = null;
  el.complaint.value = '';
  el.cause.value = '';
  el.correction.value = '';
  syncFilled();
  show('edit');
  el.complaint.focus();
});

el.aToggle.addEventListener('click', () => renderA(el.a.hidden !== false));

// Note cards and the numbered dots in the story share one handler.
document.addEventListener('click', (e) => {
  const t = (e.target as HTMLElement).closest<HTMLElement>('[data-note], #sc-review [data-mark]');
  if (t) pick(Number(t.dataset.note ?? t.dataset.mark));
});

el.review.addEventListener('keydown', (e) => {
  const t = (e.target as HTMLElement).closest<HTMLElement>('[data-mark]');
  if (!t || (e.key !== 'Enter' && e.key !== ' ')) return;
  e.preventDefault();
  pick(Number(t.dataset.mark));
});

el.gate.addEventListener('submit', sendReport);
el.email.addEventListener("input", () => { el.gateErr.hidden = true; });

el.demoLink.addEventListener('click', (e) => {
  e.preventDefault();
  openModal(false);
});
el.demo.addEventListener('submit', submitDemo);
el.close.addEventListener('click', closeModal);
el.keep.addEventListener('click', closeModal);
el.modal.addEventListener('click', (e) => {
  if (e.target === el.modal) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !el.modal.hidden) closeModal();
});

el.liveGo.addEventListener('click', () => {
  track('story_check_your_turn');
  liveStop(true);
});
el.live.querySelector('.sc-live-story')?.addEventListener('click', () => {
  track('story_check_your_turn');
  liveStop(true);
});

syncFilled();
renderLeftLabel();
refreshToken();
liveStart();
