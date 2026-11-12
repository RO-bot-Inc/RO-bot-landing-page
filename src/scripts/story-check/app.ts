// Warranty Story Checker page logic. Talks to /api/story-check; the rubric
// never reaches the browser. Copy and flow follow the v3 prototype Dave
// approved on 2026-11-11 (gtm/docs/story-checker/README.md).
import {
  ELEMENTS,
  FREE_CHECKS_PER_DAY,
  LABELS,
  MISFIRE_A,
  SAMPLES,
  type Note,
  type Result,
} from './shared';

const API = '/api/story-check';
const GA4_ID = 'G-28WMV6CTFP';
const OPEN_FIXES = 2; // the rest unlock with the emailed report (a soft gate)
const MIN_GRADING_MS = 1800;

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const el = {
  sample: $('sc-sample'),
  sampleTag: $('sc-sample-tag'),
  editTools: $('sc-edit-tools'),
  reedit: $('sc-reedit'),
  edit: $<HTMLFormElement>('sc-edit'),
  cause: $<HTMLTextAreaElement>('sc-cause'),
  correction: $<HTMLTextAreaElement>('sc-correction'),
  website: $<HTMLInputElement>('sc-website'),
  go: $<HTMLButtonElement>('sc-go'),
  err: $('sc-err'),
  left: $('sc-left'),
  marked: $('sc-marked'),
  stamp: $('sc-stamp'),
  mCause: $('sc-m-cause'),
  mCorr: $('sc-m-corr'),
  aToggle: $('sc-a-toggle'),
  a: $('sc-a'),
  preview: $('sc-preview'),
  try: $('sc-try'),
  grading: $('sc-grading'),
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
  timers: [] as number[],
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
type Screen = 'edit' | 'grading' | 'results';
function show(screen: Screen) {
  const marked = screen !== 'edit';
  el.edit.hidden = marked;
  el.editTools.hidden = marked;
  el.marked.hidden = !marked;
  el.reedit.hidden = !marked;
  el.preview.hidden = screen !== 'edit';
  el.grading.hidden = screen !== 'grading';
  el.results.hidden = screen !== 'results';
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
  el.sample.textContent = 'Another sample';
  return state.sampleIdx;
}

// ------------------------------------------------------------------ marked story
function segments(text: string, notes: Note[], field: Note['field']): string {
  const hits: Array<{ start: number; end: number; n: number }> = [];
  for (const note of notes) {
    if (note.field !== field || !note.match) continue;
    const i = text.indexOf(note.match);
    if (i < 0) continue;
    const end = i + note.match.length;
    if (hits.some((h) => i < h.end && end > h.start)) continue;
    hits.push({ start: i, end, n: note.n });
  }
  hits.sort((a, b) => a.start - b.start);
  let out = '';
  let pos = 0;
  for (const h of hits) {
    out += esc(text.slice(pos, h.start));
    const on = state.active === h.n ? ' is-on' : '';
    out += `<span class="sc-red${on}">${esc(text.slice(h.start, h.end))}</span><button type="button" class="sc-dot${on}" data-note="${h.n}" aria-label="Show note ${h.n}">${h.n}</button>`;
    pos = h.end;
  }
  return out + esc(text.slice(pos));
}

function renderMarked(pop = false) {
  const r = state.result;
  if (!r) return;
  el.mCause.innerHTML = segments(r.cause, r.notes, 'cause');
  el.mCorr.innerHTML = segments(r.correction, r.notes, 'correction');
  el.stamp.className = `sc-stamp${r.gpa >= 3.3 ? ' is-good' : ''}${pop ? ' is-pop' : ''}`;
  el.stamp.innerHTML = `<span class="sc-stamp-l">${esc(r.letter)}</span><span class="sc-stamp-g">${r.gpa.toFixed(2)} / 4</span>`;
  el.stamp.setAttribute('aria-label', `Grade ${r.letter}, ${r.gpa.toFixed(2)} out of 4`);
}

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
  renderMarked();
  renderNotes();
}

// ------------------------------------------------------------------ grading
function setStep(step: number) {
  el.grading.querySelectorAll<HTMLElement>('.sc-step').forEach((p) => {
    const i = Number(p.dataset.step);
    p.classList.toggle('is-done', i < step);
    p.classList.toggle('is-now', i === step);
  });
}

function clearTimers() {
  state.timers.forEach((t) => clearTimeout(t));
  state.timers = [];
}

async function grade(cause: string, correction: string) {
  if (state.busy) return;
  showError('');
  if (state.remaining === 0) return openModal(true);
  state.busy = true;
  el.go.disabled = true;

  // Show the typed story under the red pen right away; swap in the graded text after.
  state.result = null;
  state.active = null;
  state.reportSent = false;
  state.showA = false;
  el.mCause.textContent = cause.trim();
  el.mCorr.textContent = correction.trim();
  el.stamp.className = 'sc-stamp';
  el.stamp.style.visibility = 'hidden';
  el.aToggle.hidden = true;
  el.a.hidden = true;
  show('grading');
  setStep(0);
  clearTimers();
  state.timers.push(window.setTimeout(() => setStep(1), 600), window.setTimeout(() => setStep(2), 1200));
  const minWait = new Promise((r) => setTimeout(r, MIN_GRADING_MS));

  try {
    const [{ status, data }] = await Promise.all([call({ action: 'grade', cause, correction }), minWait]);
    clearTimers();
    if ('remaining' in data) state.remaining = data.remaining;
    renderLeftLabel();
    if (status === 200 && data.result) {
      state.result = data.result as Result;
      state.ticket = data.ticket;
      el.stamp.style.visibility = '';
      renderMarked(true);
      renderResults();
      show('results');
      track('story_check_graded', { sample: !!state.result.sampleId, letter: state.result.letter, notes: state.result.notes.length });
      return;
    }
    show('edit');
    el.stamp.style.visibility = '';
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
    clearTimers();
    show('edit');
    el.stamp.style.visibility = '';
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
  el.cause.value = s.cause;
  el.correction.value = s.correction;
  syncFilled();
  showError('');
});

el.try.addEventListener('click', () => {
  const s = SAMPLES[nextSample()];
  el.cause.value = s.cause;
  el.correction.value = s.correction;
  syncFilled();
  grade(s.cause, s.correction);
});

el.edit.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!el.cause.value.trim() || !el.correction.value.trim()) return showError('Paste both a cause and a correction first.');
  grade(el.cause.value, el.correction.value);
});

el.reedit.addEventListener('click', () => {
  clearTimers();
  state.active = null;
  show('edit');
  el.cause.focus();
});

el.another.addEventListener('click', () => {
  clearTimers();
  state.result = null;
  state.active = null;
  el.cause.value = '';
  el.correction.value = '';
  syncFilled();
  show('edit');
  el.cause.focus();
});

el.aToggle.addEventListener('click', () => renderA(el.a.hidden !== false));

// Note cards and the numbered dots in the story share one handler.
document.addEventListener('click', (e) => {
  const t = (e.target as HTMLElement).closest<HTMLElement>('[data-note]');
  if (t) pick(Number(t.dataset.note));
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

syncFilled();
renderLeftLabel();
refreshToken();
