// RO Leak Test contact capture: the whole phone path (storyboard frames 1 to 4).
// The form persists on the phone through failures, the human check is
// invisible unless Cloudflare needs a challenge, and the server owns every
// decision (captcha, dedupe, email, Notion).
import { API_PATH, FIELD_MAX, REQUIRED_FIELDS, ROUTES, UTM_KEYS, type ContactField } from './presets';

type Contact = Record<ContactField, string>;
interface Enrolled {
  id: string;
  ticket: string;
  name: string;
  email: string;
  contact: Contact;
}

const FORM_KEY = 'lt_form';
const ENROLLED_KEY = 'lt_enrolled';
const UTM_KEY = 'lt_utm';

const root = document.getElementById('lt') as HTMLElement;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const form = $<HTMLFormElement>('lt-form');
const submitBtn = $<HTMLButtonElement>('lt-submit');
const moreBtn = $<HTMLButtonElement>('lt-more');
const optional = $('lt-optional');
const checking = $('lt-checking');
const problem = $('lt-problem');
const problemTitle = $('lt-problem-title');
const problemText = $('lt-problem-text');
const turnstileBox = $('lt-turnstile');
const eyebrow = $('lt-eyebrow');
const step = $('lt-step');
const peek = $<HTMLAnchorElement>('lt-peek');

const fields = {} as Record<ContactField, HTMLInputElement | HTMLTextAreaElement>;
for (const key of Object.keys(FIELD_MAX) as ContactField[]) {
  fields[key] = form.elements.namedItem(key) as HTMLInputElement;
}

const ERRORS: Record<string, string> = {
  name: 'Add your first and last name so we know who to address.',
  email: 'That email looks incomplete. Your private link goes here, so it has to be right.',
  dealership: 'Add your dealership or group so we tailor the findings to your store.',
  title: 'Add your title so we tailor the findings to your role.',
};

const PROBLEMS = {
  check: ['We couldn’t verify that.', ' Tap Enroll me again. Everything you typed is still here.'],
  network: ['That didn’t go through.', ' You may be between signals. Your answers are saved on this phone. Try again.'],
  generic: ['Something went wrong on our end.', ' Your answers are saved on this phone. Try again in a moment.'],
  paused: ['Enrollment is paused right now.', " Email dave@tenthgear.ai and we'll set you up."],
} as const;

const state = {
  siteKey: '',
  captcha: '',
  widget: '' as string,
  mode: 'enroll' as 'enroll' | 'fix',
  ticket: '',
  started: false,
};

// ---------------------------------------------------------------- analytics
// Only enumerated, non-user-content parameters are ever sent.
const GA4_ID = 'G-28WMV6CTFP';

function readUtm(): Record<string, string> {
  try {
    const fromUrl: Record<string, string> = {};
    const q = new URLSearchParams(location.search);
    for (const k of UTM_KEYS) {
      const v = q.get(k);
      if (v) fromUrl[k] = v.slice(0, 80);
    }
    if (Object.keys(fromUrl).length) {
      sessionStorage.setItem(UTM_KEY, JSON.stringify(fromUrl));
      return fromUrl;
    }
    return JSON.parse(sessionStorage.getItem(UTM_KEY) || '{}');
  } catch {
    return {};
  }
}
const utm = readUtm();

function track(event: string, params: Record<string, string | number> = {}) {
  try {
    // GA4 loads through GTM, so there is no global gtag(). A gtag-style
    // `arguments` push reaches the GA4 tag without a per-event GTM trigger.
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

function titleCategory(title: string): string {
  const t = title.toLowerCase();
  if (/fixed\s*op/.test(t)) return 'fixed_ops';
  if (/service/.test(t)) return 'service';
  if (/\b(gm|general manager|dealer principal|owner|president|ceo|partner)\b/.test(t)) return 'gm_owner';
  if (/parts/.test(t)) return 'parts';
  return 'other';
}

const device = () => (matchMedia('(pointer: coarse)').matches && innerWidth < 900 ? 'phone' : 'desktop');

// ------------------------------------------------------------------ screens
function show(screen: 'offer' | 'enrolled') {
  root.dataset.screen = screen;
  const offer = screen === 'offer';
  root.querySelectorAll<HTMLElement>('.screen').forEach((el) => {
    el.hidden = offer ? el.dataset.name === 'enrolled' : el.dataset.name !== 'enrolled';
  });
  eyebrow.textContent = offer ? 'AI Summit 2026' : 'Enrolled';
}

function showEnrolled(e: Enrolled) {
  $('lt-first').textContent = e.name.trim().split(/\s+/)[0] || 'there';
  $('lt-email-out').textContent = e.email;
  const q = new URLSearchParams(utm);
  peek.href = ROUTES.futureHeadline + (q.toString() ? `?${q}` : '');
  // A repeat enrollment gets no fix ticket (the address on file is already
  // the one they typed), so the affordance disappears rather than failing.
  ($('lt-fix').closest('p') as HTMLElement).hidden = !e.ticket;
  show('enrolled');
  window.scrollTo(0, 0);
}

// --------------------------------------------------------------------- form
function readForm(): Contact {
  const c = {} as Contact;
  for (const key of Object.keys(fields) as ContactField[]) {
    c[key] = fields[key].value.replace(/\s+/g, ' ').trim().slice(0, FIELD_MAX[key]);
  }
  return c;
}

function fillForm(c: Partial<Contact>) {
  for (const key of Object.keys(fields) as ContactField[]) fields[key].value = c[key] || '';
  if (c.phone || c.dms || c.lane) openOptional();
  refreshSubmit();
}

function openOptional() {
  optional.hidden = false;
  moreBtn.setAttribute('aria-expanded', 'true');
}

function saveForm() {
  try {
    localStorage.setItem(FORM_KEY, JSON.stringify(readForm()));
  } catch {
    /* private mode; the form still works for this page load */
  }
}

function setError(key: ContactField, message: string) {
  const field = fields[key].closest('.field') as HTMLElement;
  const msg = document.getElementById(`err-${key}`);
  field.classList.toggle('bad', !!message);
  if (msg) {
    msg.textContent = message;
    msg.hidden = !message;
  }
  fields[key].setAttribute('aria-invalid', message ? 'true' : 'false');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

// Inline errors under the field, text plus a heavier border. Returns the
// first bad field so focus can move there.
function validate(): ContactField | null {
  const c = readForm();
  let first: ContactField | null = null;
  for (const key of REQUIRED_FIELDS) {
    const bad = !c[key] || (key === 'email' && !EMAIL_RE.test(c.email));
    setError(key, bad ? ERRORS[key] : '');
    if (bad && !first) first = key;
  }
  return first;
}

// Disabled until typing starts; after that, submit runs validation so a
// missing field gets its inline message instead of a dead button.
function refreshSubmit() {
  const c = readForm();
  submitBtn.disabled = REQUIRED_FIELDS.every((key) => !c[key]);
}

function showProblem(kind: keyof typeof PROBLEMS) {
  problemTitle.textContent = PROBLEMS[kind][0];
  problemText.textContent = PROBLEMS[kind][1];
  problem.hidden = false;
  problem.scrollIntoView({ block: 'nearest' });
}

function busy(on: boolean) {
  checking.hidden = !on;
  submitBtn.disabled = on;
  submitBtn.classList.toggle('busy', on);
  if (on) problem.hidden = true;
}

// ----------------------------------------------------------------- turnstile
interface Turnstile {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  reset(id?: string): void;
  getResponse(id?: string): string | undefined;
}
declare global {
  interface Window {
    turnstile?: Turnstile;
    ltTurnstileReady?: () => void;
  }
}

function loadTurnstile(siteKey: string) {
  state.siteKey = siteKey;
  window.ltTurnstileReady = () => {
    if (!window.turnstile) return;
    state.widget = window.turnstile.render(turnstileBox, {
      sitekey: siteKey,
      appearance: 'interaction-only',
      size: 'flexible',
      action: 'leak-test-enroll',
      callback: (token: string) => {
        state.captcha = token;
      },
      'expired-callback': () => {
        state.captcha = '';
      },
      'error-callback': () => {
        state.captcha = '';
      },
    });
  };
  const s = document.createElement('script');
  s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=ltTurnstileReady&render=explicit';
  s.async = true;
  document.head.appendChild(s);
}

function resetTurnstile() {
  state.captcha = '';
  try {
    window.turnstile?.reset(state.widget || undefined);
  } catch {
    /* widget may not exist */
  }
}

// Wait for Cloudflare's token. Usually already there; a challenge takes longer.
async function captchaToken(): Promise<string> {
  if (!state.siteKey) return '';
  const until = Date.now() + 12_000;
  while (!state.captcha && Date.now() < until) await new Promise((r) => setTimeout(r, 150));
  return state.captcha;
}

// ---------------------------------------------------------------------- api
// The kill switch (LT_ENABLED=false) answers here already, before any POST,
// so it must surface as "paused", not as a dropped connection.
async function fetchConfig(): Promise<{ token: string; turnstileSiteKey: string }> {
  const res = await fetch(API_PATH, { cache: 'no-store' });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error === 'disabled' ? 'disabled' : String(res.status));
  }
  return res.json();
}

async function post(body: Record<string, unknown>): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const res = await fetch(API_PATH, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...body, website: '' }),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, data };
}

// ------------------------------------------------------------------- events
// Placeholder text clears the moment a field is tapped, not only when typing starts.
form.addEventListener('focusin', (e) => {
  const el = e.target as HTMLInputElement;
  if (el.placeholder) {
    el.dataset.ph = el.placeholder;
    el.placeholder = '';
  }
  if (!state.started) {
    state.started = true;
    track('aas_form_start', { source: utm.utm_source || 'direct', content: utm.utm_content || 'none' });
  }
});
form.addEventListener('focusout', (e) => {
  const el = e.target as HTMLInputElement;
  if (el.dataset.ph && !el.value) el.placeholder = el.dataset.ph;
});
form.addEventListener('input', (e) => {
  const el = e.target as HTMLInputElement;
  const key = el.name as ContactField;
  if (key in fields && (fields[key].closest('.field') as HTMLElement).classList.contains('bad')) setError(key, '');
  refreshSubmit();
  saveForm();
});

moreBtn.addEventListener('click', () => {
  openOptional();
  fields.phone.focus();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  problem.hidden = true;
  const bad = validate();
  if (bad) {
    fields[bad].focus();
    return;
  }
  busy(true);
  try {
    const contact = readForm();
    const captcha = await captchaToken();
    if (state.siteKey && !captcha) {
      resetTurnstile();
      showProblem('check');
      return;
    }
    // A fresh page token right before the POST, so a form left open for an
    // hour at the conference still submits.
    const { token } = await fetchConfig();
    const body =
      state.mode === 'fix'
        ? { action: 'fix', token, turnstile: captcha, ticket: state.ticket, contact }
        : {
            action: 'enroll',
            token,
            turnstile: captcha,
            contact,
            source: { ...utm, landing: location.pathname, device: device() },
          };
    const { ok, data } = await post(body);
    if (!ok) {
      resetTurnstile();
      if (data.error === 'captcha') showProblem('check');
      else if (data.error === 'disabled') showProblem('paused');
      else {
        if (data.error === 'expired' || data.error === 'not_found') {
          // The fix window closed; the next submit enrolls again with what is on the form.
          state.mode = 'enroll';
          state.ticket = '';
        }
        showProblem('generic');
      }
      return;
    }
    const enrolled: Enrolled = {
      id: String(data.id),
      ticket: String(data.ticket),
      name: String(data.name),
      email: String(data.email),
      contact,
    };
    try {
      localStorage.removeItem(FORM_KEY);
      sessionStorage.setItem(ENROLLED_KEY, JSON.stringify(enrolled));
    } catch {
      /* ignore */
    }
    if (state.mode === 'enroll') {
      track('aas_contact_complete', { job_title_category: titleCategory(contact.title) });
    }
    state.mode = 'enroll';
    state.ticket = enrolled.ticket;
    resetTurnstile();
    showEnrolled(enrolled);
  } catch (e) {
    showProblem(e instanceof Error && e.message === 'disabled' ? 'paused' : 'network');
  } finally {
    busy(false);
    refreshSubmit();
  }
});

// "Fix it" reopens the form with everything filled in; submitting resends the
// link to the corrected address and revokes the old one.
$('lt-fix').addEventListener('click', () => {
  let enrolled: Enrolled | null = null;
  try {
    enrolled = JSON.parse(sessionStorage.getItem(ENROLLED_KEY) || 'null');
  } catch {
    /* ignore */
  }
  if (enrolled) {
    fillForm(enrolled.contact);
    state.mode = 'fix';
    state.ticket = enrolled.ticket;
  }
  step.textContent = 'Fix your email';
  submitBtn.textContent = 'Update and resend my link';
  show('offer');
  (document.getElementById('enroll') as HTMLElement).scrollIntoView();
  fields.email.focus();
});

// --------------------------------------------------------------------- boot
(async function boot() {
  track('aas_page_view', {
    source: utm.utm_source || 'direct',
    medium: utm.utm_medium || 'none',
    campaign: utm.utm_campaign || 'none',
    content: utm.utm_content || 'none',
  });
  if (utm.utm_medium === 'qr') track('aas_qr_visit', { route: ROUTES.landing });

  let enrolled: Enrolled | null = null;
  try {
    enrolled = JSON.parse(sessionStorage.getItem(ENROLLED_KEY) || 'null');
    const saved = JSON.parse(localStorage.getItem(FORM_KEY) || 'null');
    if (saved) fillForm(saved);
  } catch {
    /* ignore */
  }
  if (enrolled) {
    state.ticket = enrolled.ticket;
    showEnrolled(enrolled);
  }
  refreshSubmit();

  try {
    const cfg = await fetchConfig();
    if (cfg.turnstileSiteKey) loadTurnstile(cfg.turnstileSiteKey);
  } catch {
    /* the submit path fetches again and reports the problem */
  }
})();
