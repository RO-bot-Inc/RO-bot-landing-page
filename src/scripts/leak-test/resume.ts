// Private resume page: validate the token from session storage (the page's
// first inline script moved it there from the URL fragment), then show the
// overview, or the recovery screen with the fresh-link form.
import { API_PATH } from './presets';

const TOKEN_KEY = 'lt_rt';
const GA4_ID = 'G-28WMV6CTFP';

const root = document.getElementById('rs') as HTMLElement;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

function show(screen: 'loading' | 'home' | 'invalid' | 'sent') {
  root.dataset.screen = screen;
  root.querySelectorAll<HTMLElement>('.screen').forEach((el) => {
    el.hidden = el.dataset.name !== screen;
  });
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

interface PublicIntake {
  name: string;
  email: string;
  dealership: string;
  materials: { status: 'not_started' | 'in_progress' | 'sent'; files: number; links: number };
  booking: { status: 'not_booked' | 'booked'; at: string | null };
}

function render(intake: PublicIntake) {
  $('rs-first').textContent = intake.name.trim().split(/\s+/)[0] || 'there';
  $('rs-who').textContent = `${intake.name}, ${intake.dealership}`;
  const m = $('rs-materials-pill');
  const b = $('rs-booking-pill');
  if (intake.materials.status === 'sent') {
    m.textContent = `${intake.materials.files} files, ${intake.materials.links} links`;
    m.className = 'pill done';
  } else if (intake.materials.status === 'in_progress') {
    m.textContent = 'In progress';
  }
  if (intake.booking.status === 'booked') {
    b.textContent = 'Booked';
    b.className = 'pill done';
  }
  const remaining = [intake.materials.status !== 'sent' && 'materials', intake.booking.status !== 'booked' && 'booking']
    .filter(Boolean)
    .join('+');
  track('aas_resume_open', { remaining_actions: remaining || 'none' });
  show('home');
}

async function open() {
  let token = '';
  try {
    token = sessionStorage.getItem(TOKEN_KEY) || '';
  } catch {
    /* ignore */
  }
  if (!token) return show('invalid');
  try {
    const res = await fetch(API_PATH, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'resume', token, website: '' }),
    });
    if (!res.ok) return show('invalid');
    const data = (await res.json()) as { intake: PublicIntake };
    render(data.intake);
  } catch {
    show('invalid');
  }
}

$('rs-notyou').addEventListener('click', () => {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
  show('invalid');
});

$<HTMLFormElement>('rs-fresh').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $<HTMLInputElement>('rs-email').value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
    $<HTMLInputElement>('rs-email').focus();
    return;
  }
  const btn = $<HTMLButtonElement>('rs-send');
  btn.disabled = true;
  try {
    const { token } = (await (await fetch(API_PATH, { cache: 'no-store' })).json()) as { token: string };
    await fetch(API_PATH, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'fresh-link', token, email, website: '' }),
    });
  } catch {
    /* the response is the same either way */
  }
  btn.disabled = false;
  show('sent');
});

open();
