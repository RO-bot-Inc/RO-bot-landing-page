// "See this story written to an A": the red pen's marks fade off the graded card,
// the A version of the same repair takes the story's place, its edits wipe in
// green one after another, and after a beat the rubber stamp drops an A.
import type { PenEls } from './pen';

export type Segs = [string, boolean][];
export interface AVersion { cause: Segs; correction: Segs; letter: string; gpa: number }

const FADE_MS = 450; // red marks out
const TEXT_MS = 300; // the A text in
const GREEN_STEP = 320; // between green edits
const GREEN_MS = 480; // one green edit wiping in
const BEAT_MS = 650; // pause before the stamp
const DROP_MS = 220, SQUASH_MS = 140, LIFT_MS = 320;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * x);
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function playAVersion(els: PenEls, a: AVersion, opts: { still: boolean; onDone: () => void }): { cancel(): void } {
  let cancelled = false;
  let raf = 0;
  const { story } = els;
  const stacked = els.root.classList.contains('is-stacked');
  const link = els.stampLink ?? null;
  const top = (e: HTMLElement) => e.getBoundingClientRect().top - story.getBoundingClientRect().top;
  const colB0 = top(els.col) + els.col.offsetHeight;
  const stampTop0 = parseFloat(els.stamp.style.top) || 0;
  const stampLeft = parseFloat(els.stamp.style.left) || 0;
  const linkTop0 = link ? parseFloat(link.style.top) || 0 : 0;
  const wasBelow = !stacked && stampTop0 > colB0 - 1;
  const size = stacked ? 66 : 96;

  const html = (segs: Segs) => segs.map(([t, good]) => (good ? `<span class="sc-good is-pending">${esc(t)}</span>` : esc(t))).join('');
  const greens = () => [...story.querySelectorAll<HTMLElement>('.sc-good.is-pending')];
  const swap = () => {
    els.ink.textContent = '';
    els.notes.textContent = '';
    els.cause.innerHTML = html(a.cause);
    els.corr.innerHTML = html(a.correction);
    story.style.setProperty('--below', wasBelow ? story.style.getPropertyValue('--below') : stacked ? '22px' : '44px');
    // A stamp that sat under the story moves down with it as the story grows.
    const dy = wasBelow ? top(els.col) + els.col.offsetHeight - colB0 : 0;
    els.stamp.style.top = (stampTop0 + dy).toFixed(0) + 'px';
    if (link) link.style.top = (linkTop0 + dy).toFixed(0) + 'px';
    els.stamp.className = 'sc-stamp sc-live-stamp is-good';
    els.stamp.innerHTML = `<span class="sc-stamp-l">${esc(a.letter)}</span><span class="sc-stamp-g">${a.gpa.toFixed(2)} / 4</span>`;
    els.stamp.style.opacity = '0';
  };

  if (opts.still) {
    swap();
    greens().forEach((g) => g.classList.remove('is-pending'));
    els.stamp.style.opacity = '1';
    els.stamp.style.transform = 'rotate(-9deg)';
    opts.onDone();
    return { cancel() {} };
  }

  // The rubber stamp, same motion as the red pen's: drops fast, squashes on impact, lifts away.
  const stampDrop = () => new Promise<void>((done) => {
    const sm = [stampLeft + size / 2, parseFloat(els.stamp.style.top) + size / 2];
    const k = stacked ? 0.72 : 1;
    const t0 = performance.now();
    const hitAt = DROP_MS, liftAt = DROP_MS + SQUASH_MS, end = liftAt + LIFT_MS;
    const frame = (now: number) => {
      if (cancelled) return;
      const t = now - t0;
      let sy = 0, sc = 1, squash = 1, op = 1;
      if (t < hitAt) { const q = clamp(t / DROP_MS); sy = -170 * (1 - q * q); sc = 1.25 - 0.25 * q * q; }
      else if (t < liftAt) squash = 1 - 0.1 * Math.sin(clamp((t - hitAt) / 120) * Math.PI);
      else { const q = smooth(clamp((t - liftAt) / LIFT_MS)); sy = -170 * q; sc = 1 + 0.15 * q; op = 1 - q; }
      els.stamper.style.opacity = op.toFixed(2);
      els.stamper.style.transform = `translate(${(sm[0] - 55).toFixed(1)}px, ${(sm[1] + 22 * k - 130 + sy).toFixed(1)}px) rotate(-9deg) scale(${(sc * k).toFixed(3)}, ${(sc * k * squash).toFixed(3)})`;
      const hit = t >= hitAt;
      const settle = hit ? 1 - clamp((t - hitAt) / 140) : 0;
      els.stamp.style.opacity = hit ? '1' : '0';
      els.stamp.style.transform = `rotate(-9deg) scale(${(1 + 0.05 * settle).toFixed(3)})`;
      const shake = hit ? 1 - clamp((t - hitAt) / 240) : 0;
      story.style.transform = shake > 0 ? `translate(${(3 * Math.sin(t / 9) * shake).toFixed(1)}px, ${(2 * shake * Math.sin((t - hitAt) / 30)).toFixed(1)}px)` : '';
      if (t < end) raf = requestAnimationFrame(frame);
      else { els.stamper.style.opacity = '0'; story.style.transform = ''; done(); }
    };
    raf = requestAnimationFrame(frame);
  });

  (async () => {
    story.classList.add('is-a-out');
    if (link) link.style.visibility = 'hidden';
    await wait(FADE_MS);
    if (cancelled) return;
    swap();
    story.classList.remove('is-a-out');
    story.classList.add('is-a-in');
    await wait(TEXT_MS);
    if (cancelled) return;
    const gs = greens();
    gs.forEach((g, i) => setTimeout(() => { if (!cancelled) g.classList.remove('is-pending'); }, i * GREEN_STEP));
    await wait(Math.max(0, gs.length - 1) * GREEN_STEP + GREEN_MS + BEAT_MS);
    if (cancelled) return;
    story.classList.remove('is-a-in');
    await stampDrop();
    if (cancelled) return;
    if (link) link.style.visibility = '';
    opts.onDone();
  })();

  return {
    cancel() {
      cancelled = true;
      cancelAnimationFrame(raf);
      story.classList.remove('is-a-out', 'is-a-in');
      story.style.transform = '';
      els.stamper.style.opacity = '0';
    },
  };
}
