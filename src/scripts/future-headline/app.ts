import {
  API_PATH,
  MAX_PHOTO_EDGE,
  MAX_PREDICTION_CHARS,
  MAX_UPLOAD_BYTES,
  PRESETS,
  PRESETS_SHOWN,
  REQUEST_TIMEOUT_MS,
  UPLOAD_PHOTO_EDGE,
} from './presets';
import { canvasToBlob, loadAssets, renderFrontPage, type Story } from './render';

type Screen = 'intro' | 'compose' | 'generating' | 'result';

interface StoryResponse {
  story: Story;
  ticket: string | null;
  degraded: boolean;
  remaining: number; // futures left this session; the server owns the cap
}

interface GenerateResponse extends StoryResponse {
  image: string | null;
}

const root = document.getElementById('fh') as HTMLElement;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const fileInput = $<HTMLInputElement>('fh-file');
const preview = $<HTMLImageElement>('fh-preview');
const own = $<HTMLTextAreaElement>('fh-own');
const oracle = $('fh-oracle');
const failBox = $('fh-fail');
const failTitle = $('fh-fail-title');
const failMsg = $('fh-fail-msg');
const resultImg = $<HTMLImageElement>('fh-result');
const download = $<HTMLAnchorElement>('fh-download');
const hint = $('fh-hint');
const againBtn = $<HTMLButtonElement>('fh-again');
const leftNote = $('fh-left');
const leak = $<HTMLAnchorElement>('fh-leak');
const canvas = $<HTMLCanvasElement>('fh-canvas');
const generateBtn = root.querySelector<HTMLButtonElement>('[data-action="generate"]')!;
const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('.chip'));

// A fresh random handful of predictions on every page load.
for (let i = chips.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [chips[i], chips[j]] = [chips[j], chips[i]];
}
chips.slice(0, PRESETS_SHOWN).forEach((chip) => {
  chip.hidden = false;
  chip.parentElement!.appendChild(chip); // shown in shuffled order
});

const state = {
  photo: null as HTMLCanvasElement | null, // normalized, EXIF-corrected, downscaled
  photoData: '' as string, // base64 JPEG, no data: prefix
  presetId: '' as string,
  token: '' as string,
  story: null as Story | null,
  blob: null as Blob | null,
  url: '' as string,
  remaining: 99,
};

// ---------------------------------------------------------------- analytics
// Only enumerated, non-user-content parameters are ever sent.
const GA4_ID = 'G-28WMV6CTFP';
const UTM_KEYS =['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

function readUtm(): Record<string, string> {
  try {
    const fromUrl: Record<string, string> = {};
    const q = new URLSearchParams(location.search);
    for (const k of UTM_KEYS) {
      const v = q.get(k);
      if (v) fromUrl[k] = v.slice(0, 80);
    }
    if (Object.keys(fromUrl).length) {
      sessionStorage.setItem('fh_utm', JSON.stringify(fromUrl));
      return fromUrl;
    }
    return JSON.parse(sessionStorage.getItem('fh_utm') || '{}');
  } catch {
    return {};
  }
}
const utm = readUtm();

// Presenter link: ?demo=<code> is remembered for the tab and sent with each
// request. The server decides whether it means anything.
function readDemo(): string {
  try {
    const fromUrl = new URLSearchParams(location.search).get('demo');
    if (fromUrl) sessionStorage.setItem('fh_demo', fromUrl.slice(0, 64));
    return sessionStorage.getItem('fh_demo') || '';
  } catch {
    return new URLSearchParams(location.search).get('demo') || '';
  }
}
const demo = readDemo();

function track(event: string, params: Record<string, string | number> = {}) {
  try {
    // GA4 loads through GTM, so there is no global gtag(). Pushing a gtag-style
    // `arguments` command onto the dataLayer reaches the GA4 Google tag without
    // needing a per-event trigger in the GTM container.
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

// ------------------------------------------------------------------ screens
function show(screen: Screen) {
  root.dataset.screen = screen;
  root.querySelectorAll<HTMLElement>('.screen').forEach((el) => {
    el.hidden = el.dataset.name !== screen;
  });
  root.removeAttribute('data-failed');
  failBox.hidden = true;
  window.scrollTo(0, 0);
}

function prediction(): { text: string; type: 'preset' | 'custom' } | null {
  const custom = own.value.replace(/\s+/g, ' ').trim().slice(0, MAX_PREDICTION_CHARS);
  if (custom.length >= 8) return { text: custom, type: 'custom' };
  const preset = PRESETS.find((p) => p.id === state.presetId);
  return preset ? { text: preset.text, type: 'preset' } : null;
}

function refreshGenerate() {
  generateBtn.disabled = !(state.photo && prediction());
}

// -------------------------------------------------------------------- photo
async function decode(file: File): Promise<{ src: CanvasImageSource; w: number; h: number }> {
  if ('createImageBitmap' in window) {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { src: bmp, w: bmp.width, h: bmp.height };
    } catch {
      /* fall through to <img>, which also honors EXIF orientation */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { src: img, w: img.naturalWidth, h: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function onFile(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) {
    alertInline('That photo is over 15 MB. Try a different one.');
    return;
  }
  let decoded;
  try {
    decoded = await decode(file);
  } catch {
    alertInline('We could not read that file. Try a JPEG or PNG photo.');
    return;
  }
  const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(decoded.w, decoded.h));
  const c = document.createElement('canvas');
  c.width = Math.round(decoded.w * scale);
  c.height = Math.round(decoded.h * scale);
  c.getContext('2d')!.drawImage(decoded.src, 0, 0, c.width, c.height);
  const dataUrl = c.toDataURL('image/jpeg', 0.86);
  state.photo = c;
  preview.src = dataUrl;
  // The server copy: same photo, smaller and tighter, so the upload survives
  // a slow cellular uplink. The full-size canvas still prints the fallback page.
  const up = Math.min(1, UPLOAD_PHOTO_EDGE / Math.max(c.width, c.height));
  const u = document.createElement('canvas');
  u.width = Math.round(c.width * up);
  u.height = Math.round(c.height * up);
  u.getContext('2d')!.drawImage(c, 0, 0, u.width, u.height);
  const upload = u.toDataURL('image/jpeg', 0.8);
  state.photoData = upload.slice(upload.indexOf(',') + 1);

  // A file stamped within the last minute almost certainly came from the camera.
  const method = Date.now() - file.lastModified < 60_000 ? 'camera' : 'library';
  track('future_headline_photo_added', { capture_method: method });
  show('compose');
  refreshGenerate();
  loadAssets().catch(() => {});
}

function alertInline(message: string) {
  const fine = root.querySelector<HTMLElement>('.screen:not([hidden]) .fine');
  if (fine) {
    fine.textContent = message;
    fine.style.color = '#fff';
  }
}

// --------------------------------------------------------------- generation
async function ensureToken() {
  if (state.token) return;
  try {
    const res = await fetch(API_PATH, { headers: { accept: 'application/json' } });
    const body = await res.json();
    state.token = body.token || '';
  } catch {
    /* fetched again at generate time */
  }
}

const ORACLE_LINES = [
  'Consulting the service-lane oracle...',
  'Reviewing the next five years of bad decisions...',
  'Checking whether the humans remain necessary...',
  'Preparing tomorrow’s front page...',
  'Arguing with the DMS...',
  'Waiting for the ink to dry...',
];

const TITLES: Record<string, string> = {
  slow: 'Your connection is too slow!',
};

const ERRORS: Record<string, string> = {
  slow: 'Someday AI may solve bad wifi, but that day is not today.',
  rate_limited: 'The oracle is swamped. Give it a few seconds, then try again.',
  capacity: 'The presses are at capacity for today. Try again in a bit.',
  disabled: 'The presses are paused right now. Check back shortly.',
  session_cap: 'You have printed every front page this phone gets for now. The oracle needs a rest.',
  bad_photo: 'That photo did not make it through. Try again, or pick another photo.',
  unsafe: 'The oracle will not print that one. Try a different prediction or photo.',
  offline: 'You look offline. Your photo and prediction are saved. Try again when you have signal.',
  upstream: 'Something went wrong on our end. Your photo and prediction are still here.',
};

function fail(category: string) {
  track('future_headline_generation_error', { error_category: category });
  failTitle.textContent = TITLES[category] || 'The presses jammed.';
  failMsg.textContent = ERRORS[category] || ERRORS.upstream;
  root.setAttribute('data-failed', '');
  failBox.hidden = false;
  failBox.querySelector<HTMLElement>('button')?.focus();
}

function bucket(ms: number): string {
  const s = ms / 1000;
  if (s < 15) return 'under_15s';
  if (s < 30) return '15_30s';
  if (s < 45) return '30_45s';
  if (s < 60) return '45_60s';
  return 'over_60s';
}

async function post(payload: Record<string, unknown>): Promise<Response> {
  const ctrl = new AbortController();
  const timeout = window.setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(API_PATH, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: ctrl.signal,
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Our own timer fired: the upload never finished. Named so fail() can say so.
    if (ctrl.signal.aborted) throw new Error('slow');
    throw err;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function generate() {
  const p = prediction();
  if (!state.photo || !p) return;
  show('generating');
  let line = 0;
  oracle.textContent = ORACLE_LINES[0];
  const ticker = window.setInterval(() => {
    line = (line + 1) % ORACLE_LINES.length;
    oracle.textContent = ORACLE_LINES[line];
  }, 3200);
  const started = performance.now();
  track('future_headline_generation_start');

  try {
    if (!navigator.onLine) throw new Error('offline');
    state.token = ''; // always mint a fresh one, the page may have sat open
    await ensureToken();
    const first = await post({
      token: state.token,
      photo: state.photoData,
      prediction: p.text,
      preset_id: p.type === 'preset' ? state.presetId : null,
      demo,
      website: '', // honeypot, always empty from a real client
    });
    if (!first.ok) {
      let code = 'upstream';
      try {
        code = (await first.json()).error || code;
      } catch {
        if (first.status === 429) code = 'rate_limited';
      }
      throw new Error(code);
    }
    const written = (await first.json()) as StoryResponse;

    // Step 2: the restaged photo. Up to two tries. If both fail, the story is
    // already in hand, so the page is printed with the attendee's own photo.
    let image: string | null = null;
    for (let attempt = 1; written.ticket && attempt <= 2 && !image; attempt++) {
      try {
        const res = await post({ step: 'image', token: state.token, photo: state.photoData, ticket: written.ticket, attempt });
        if (!res.ok) continue; // a timed-out first try still earns a second
        const out = (await res.json()) as { image: string | null; retry: boolean };
        image = out.image;
        if (!out.retry) break;
      } catch {
        if (!navigator.onLine) break;
      }
    }
    const body: GenerateResponse = { ...written, image, degraded: written.degraded || (!!written.ticket && !image) };
    await compose(body);
    state.remaining = typeof written.remaining === 'number' ? written.remaining : state.remaining;
    track('future_headline_generation_complete', {
      outcome: body.story.outcome,
      future_year: body.story.future_year,
      duration_bucket: bucket(performance.now() - started),
      degraded: body.degraded ? 'yes' : 'no',
    });
    showResult();
  } catch (err) {
    const code = err instanceof Error ? err.message : 'upstream';
    fail(code in ERRORS ? code : navigator.onLine ? 'upstream' : 'offline');
  } finally {
    window.clearInterval(ticker);
  }
}

async function compose(body: GenerateResponse) {
  const assets = await loadAssets();
  let src: CanvasImageSource = state.photo!;
  let w = state.photo!.width;
  let h = state.photo!.height;
  if (body.image) {
    try {
      const img = new Image();
      img.src = `data:image/jpeg;base64,${body.image}`;
      await img.decode();
      src = img;
      w = img.naturalWidth;
      h = img.naturalHeight;
    } catch {
      /* keep the original photo */
    }
  }
  renderFrontPage(canvas, body.story, src, w, h, assets);
  state.story = body.story;
  state.blob = await canvasToBlob(canvas);
  if (state.url) URL.revokeObjectURL(state.url);
  state.url = URL.createObjectURL(state.blob);
}

// ------------------------------------------------------------------- result
function shareFile(): File | null {
  if (!state.blob) return null;
  return new File([state.blob], 'tomorrows-dealer-front-page.png', { type: 'image/png' });
}

function showResult() {
  const story = state.story!;
  resultImg.src = state.url;
  resultImg.alt = story.alt_text;
  download.href = state.url;
  hint.hidden = true;

  const file = shareFile();
  const canShare = !!file && !!navigator.canShare && navigator.canShare({ files: [file] });
  root.querySelector<HTMLElement>('[data-action="share"]')!.hidden = !canShare;
  root.querySelector<HTMLElement>('.actions')!.style.gridTemplateColumns = canShare ? '1fr 1fr' : '1fr';

  // Only mention the limit when it is close, so it never reads as a meter.
  const left = state.remaining;
  againBtn.disabled = left === 0;
  leftNote.textContent =
    left === 0
      ? 'That was your last future for now. The oracle needs a rest.'
      : left <= 2
        ? `${left} more ${left === 1 ? 'future' : 'futures'} left on this phone.`
        : '';

  const q = new URLSearchParams(utm);
  leak.href = `/ai-summit/leak-test/${q.toString() ? `?${q}` : ''}`;
  show('result');
}

async function share() {
  const file = shareFile();
  if (!file) return;
  try {
    await navigator.share({
      files: [file],
      title: 'Tomorrow’s Dealer',
      text: 'My front page from the future. Make yours: tenthgear.ai/ai-summit',
    });
    track('future_headline_share', { share_method: 'web_share' });
  } catch (err) {
    if ((err as DOMException)?.name !== 'AbortError') {
      hint.textContent = 'Sharing did not open. Use Download, or press and hold the image to save it.';
      hint.hidden = false;
    }
  }
}

// ------------------------------------------------------------------- events
root.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-action], .chip');
  if (!el) return;
  if (el.classList.contains('chip')) {
    state.presetId = el.dataset.preset || '';
    own.value = '';
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c === el)));
    track('future_headline_prediction_selected', { prediction_type: 'preset' });
    refreshGenerate();
    return;
  }
  switch (el.dataset.action) {
    case 'pick-photo':
      fileInput.value = '';
      fileInput.click();
      break;
    case 'generate':
    case 'retry':
      generate();
      break;
    case 'back':
      show('compose');
      break;
    case 'again':
      show('compose');
      break;
    case 'share':
      share();
      break;
    case 'download':
      track('future_headline_download', {
        outcome: state.story?.outcome || '',
        future_year: state.story?.future_year || 0,
      });
      hint.textContent = 'If nothing downloads, press and hold the image to save it.';
      hint.hidden = false;
      break;
    case 'leak-test':
      track('future_headline_leak_test_click', {
        outcome: state.story?.outcome || '',
        future_year: state.story?.future_year || 0,
      });
      break;
  }
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (file) onFile(file);
});

let customTracked = false;
own.addEventListener('input', () => {
  if (own.value.trim()) {
    state.presetId = '';
    chips.forEach((c) => c.setAttribute('aria-pressed', 'false'));
  }
  if (!customTracked && prediction()?.type === 'custom') {
    customTracked = true;
    track('future_headline_prediction_selected', { prediction_type: 'custom' });
  }
  refreshGenerate();
});
own.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    own.blur();
  }
});

track('future_headline_view', {
  source: utm.utm_source || '',
  medium: utm.utm_medium || '',
  campaign: utm.utm_campaign || '',
  content: utm.utm_content || '',
});
