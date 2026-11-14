// Warranty Story Checker page logic. Talks to /api/story-check; the rubric
// never reaches the browser. Copy and flow follow the v3 prototype Dave
// approved on 2026-11-11 (gtm/docs/story-checker/README.md).
import {
  ELEMENTS,
  FREE_CHECKS_PER_DAY,
  LABELS,
  A_VERSIONS,
  SAMPLES,
  sampleResult,
  type Note,
  type Result,
} from './shared';
import { createPen, createReader, fitColumns, type PenEls } from './pen';
import { playAVersion } from './aview';

const API = '/api/story-check';
const GA4_ID = 'G-28WMV6CTFP';
const MIN_WAIT_MS = 1200; // the pen comes in and hovers about 3/4 s before it marks

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
  aToggle: $('sc-a-toggle') as HTMLButtonElement,
  results: $('sc-results'),
  notes: $('sc-notes'),
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
  if (isSample) el.sampleTag.textContent = `Sample: ${s!.label}`;
}

function nextSample(): number {
  // Story Roulette: a random sample, never the same one twice in a row.
  const prev = state.sampleIdx;
  let i = Math.floor(Math.random() * (prev === null ? SAMPLES.length : SAMPLES.length - 1));
  if (prev !== null && i >= prev) i++;
  state.sampleIdx = i;
  return state.sampleIdx;
}

// ------------------------------------------------------------------ the red pen
const cardEls = (root: HTMLElement): PenEls => {
  const q = <T extends Element = HTMLElement>(c: string) => root.querySelector(c) as unknown as T;
  return {
    root, story: q('.sc-live-story'), col: q('.sc-live-col'), complaintWrap: q('.sc-live-cw'),
    complaint: q('.sc-live-complaint'), cause: q('.sc-live-cause'), corr: q('.sc-live-corr'),
    stamper: q('.sc-live-stamper'), ink: q<SVGSVGElement>('.sc-live-ink'), notes: q('.sc-live-notes'),
    stamp: q('.sc-live-stamp'), pen: q('.sc-live-pen'), stampLink: root.querySelector<HTMLElement>('.sc-a-toggle'),
  };
};
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const stampHtml = (r: Result) => `<span class="sc-stamp-l">${esc(r.letter)}</span><span class="sc-stamp-g">${r.gpa.toFixed(2)} / 4</span>`;

// The pill by the stamp swaps the red-penned story for its A version, in the card.
let aView: ReturnType<typeof playAVersion> | null = null;
const A_LABEL = 'See this story written to an A →';
function showA(open: boolean) {
  const r = state.result;
  const av = (r?.sampleId && A_VERSIONS[r.sampleId]) || null;
  if (!r || !av || open === state.showA) return;
  aView?.cancel();
  aView = null;
  state.showA = open;
  const card = cardEls(el.review);
  const still = reduced();
  if (open) {
    state.active = null;
    renderNotes();
    gradePen?.stop();
    gradePen = null;
    el.aToggle.disabled = true;
    $('sc-rv-said').textContent = '';
    aView = playAVersion(card, av, {
      still,
      onDone: () => {
        el.aToggle.disabled = false;
        el.aToggle.textContent = 'Back to the red pen';
        el.rvStamp.setAttribute('aria-label', `Grade ${av.letter}, ${av.gpa.toFixed(2)} out of 4`);
        $('sc-rv-said').textContent = `Same repair, written to an ${av.letter}: ${av.gpa.toFixed(2)} out of 4. New detail is highlighted green.`;
      },
    });
    return;
  }
  // Back to the red pen, drawn in full at once.
  el.aToggle.textContent = A_LABEL;
  el.aToggle.disabled = false;
  el.rvStamp.setAttribute('aria-label', `Grade ${r.letter}, ${r.gpa.toFixed(2)} out of 4`);
  gradePen = createPen(card, { complaint: r.complaint ?? '', cause: r.cause, correction: r.correction }, r.notes, stampHtml(r), r.gpa >= 3.3, {
    mode: 'grade',
    link: true,
    onDone: () => { markPhrases(); $('sc-rv-said').textContent = `Back to the red pen: ${r.letter}, ${r.notes.length} note${r.notes.length === 1 ? '' : 's'}.`; },
  });
  gradePen.start(true);
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
  if (!state.result) return;
  renderNotes();
}

// One table: the grade chip and criterion on the left, the grader's note on the
// right, worst grade first. Criteria with no note get a thin row at the end.
const RANK: Record<string, number> = { missing: 0, F: 1, flag: 2, D: 3, C: 4, B: 5, A: 6, not_applicable: 7 };
function renderNotes() {
  const r = state.result;
  if (!r) return;
  const chip = (g: string) =>
    g === 'flag'
      ? `<span class="sc-chip sc-chip-F" aria-label="flagged">!</span>`
      : `<span class="sc-chip sc-chip-${g}" aria-label="${g === 'missing' ? 'missing' : g === 'not_applicable' ? 'not applicable' : 'grade ' + g}">${chipText(g)}</span>`;
  const rows = r.notes.map((note) => {
    // "Root Cause · D" is a graded criterion; anything else is a flag of its own.
    const m = /^(.*?)\s*·\s*(\S+)\s*$/.exec(note.criterion);
    const graded = !!m && ['A', 'B', 'C', 'D', 'F', 'missing', 'not_applicable'].includes(m[2]);
    return { note, name: graded ? m![1] : note.criterion, g: graded ? m![2] : 'flag' };
  });
  rows.sort((a, b) => (RANK[a.g] ?? 2) - (RANK[b.g] ?? 2) || a.note.n - b.note.n);
  const noted = new Set(rows.map((x) => x.name));
  const quiet = ELEMENTS.filter((k) => !noted.has(LABELS[k])).sort((a, b) => (RANK[r.grades[a]] ?? 9) - (RANK[r.grades[b]] ?? 9));
  el.notes.innerHTML =
    rows
      .map(({ note, name, g }) => {
        const on = state.active === note.n ? ' is-on' : '';
        return `<button type="button" class="sc-row sc-note${on}" data-note="${note.n}" aria-pressed="${!!on}">
        <span class="sc-cell-k">${chip(g)}<span class="sc-cell-name">${esc(name)}</span></span>
        <span class="sc-cell-v"><span class="sc-pen sc-note-pen">${esc(note.pen)}</span><span class="sc-note-fix"><b>${esc(note.fixLabel)}</b> ${esc(note.fix)}</span></span>
      </button>`;
      })
      .join('') +
    quiet
      .map((k) => `<div class="sc-row is-quiet"><span class="sc-cell-k">${chip(r.grades[k])}<span class="sc-cell-name">${LABELS[k]}</span></span><span class="sc-cell-v sc-no-note">No note</span></div>`)
      .join('');
}

function pick(n: number) {
  if (state.showA) showA(false);
  state.active = state.active === n ? null : n;
  renderNotes();
  // Light up the phrase the note is about and the pen's note in the margin.
  el.review.querySelectorAll<HTMLElement>('.sc-live-note[data-pen]').forEach((x) => x.classList.toggle('is-on', Number(x.dataset.pen) === state.active));
  el.review.querySelectorAll<HTMLElement>('[data-mark]').forEach((m) => m.classList.toggle('is-on', Number(m.dataset.mark) === state.active));
}

// Marked phrases work like the note cards: click or Enter/Space picks the note.
function markPhrases() {
  el.review.querySelectorAll<HTMLElement>('[data-mark]').forEach((m) => {
    m.tabIndex = 0;
    m.setAttribute('role', 'button');
    m.setAttribute('aria-label', `${m.textContent}: show note ${m.dataset.mark}`);
  });
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
  aView?.cancel();
  aView = null;
  state.showA = false;
  el.aToggle.textContent = A_LABEL;
  el.aToggle.disabled = false;
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
  state.showA = false;
  el.aToggle.hidden = true;
  el.rvStamp.removeAttribute('aria-label');
  $('sc-rv-said').textContent = '';
  show('review');
  const card = cardEls(el.review);
  const still = reduced();
  reader = createReader(card, { complaint, cause, correction }, status);
  if (still) status('Reading your story');
  else reader.start();
  const started = Date.now();

  try {
    const { status: code, data } = await call({ action: 'grade', complaint, cause, correction });
    if (run !== state.run) return;
    if ('remaining' in data) state.remaining = data.remaining;
    renderLeftLabel();
    if (code === 200 && data.result) {
      // The pen hovers a moment before it marks, even when the grade comes back instantly.
      const wait = still ? 0 : MIN_WAIT_MS - (Date.now() - started);
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
        link: !!(r.sampleId && A_VERSIONS[r.sampleId]),
        from: still ? undefined : from,
        onDone: () => {
          if (run !== state.run) return;
          renderResults();
          show('results');
          $('sc-rv-said').textContent = `Graded ${r.letter}, ${r.gpa.toFixed(2)} out of 4. ${r.notes.length} red-pen note${r.notes.length === 1 ? '' : 's'}.`;
          markPhrases();
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

// ------------------------------------------------------------------ wiring
// The form uses the graded card's column and type, and each box grows to fit its
// text, so nothing changes size when grading starts.
const boxes = [el.complaint, el.cause, el.correction];
function grow() {
  boxes.forEach((t) => {
    // Empty: the starting size. Filled: exactly its text, like the graded card.
    t.dataset.rows ??= String(t.rows);
    t.rows = t.value ? 1 : Number(t.dataset.rows);
    t.style.height = '';
    if (t.value) t.style.height = t.scrollHeight + 2 + 'px';
  });
}
function fitForm() {
  if (el.edit.hidden) return;
  fitColumns(el.edit);
  grow();
}
new ResizeObserver(fitForm).observe(el.edit);
boxes.forEach((t) => t.addEventListener('input', grow));

el.cause.addEventListener('input', () => { syncFilled(); showError(''); });
el.correction.addEventListener('input', () => { syncFilled(); showError(''); });

el.sample.addEventListener('click', () => {
  const s = SAMPLES[nextSample()];
  el.complaint.value = s.complaint;
  el.cause.value = s.cause;
  el.correction.value = s.correction;
  grow();
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
  grow();
  syncFilled();
  show('edit');
  el.complaint.focus();
});

el.aToggle.addEventListener('click', () => showA(!state.showA));

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
