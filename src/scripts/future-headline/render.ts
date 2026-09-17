// Deterministic "Tomorrow's Dealer" front-page renderer.
//
// Every word, date, rule, stamp, and logo on the page is drawn here from a
// fixed template. The image model only ever supplies the lead photo, so no
// generated lettering can reach the final artifact.

export type Outcome = 'utopia' | 'dystopia';

export interface Story {
  future_year: number;
  outcome: Outcome;
  headline: string;
  punchline: string;
  deck: string;
  kicker: string;
  alt_text: string;
}

export const PAGE_W = 1080;
export const PAGE_H = 1350;
export const EVENT_YEAR = 2026;

const INK = '#0b0b0b';
const PAPER = '#f3f0e8';
const RED = '#c8141e';
const YELLOW = '#ffd23f';

const HEAD = '"FH Anton", Impact, "Arial Narrow Bold", sans-serif';
const SERIF = '"FH Serif", Georgia, "Times New Roman", serif';
const MONO = '"FH Mono", "Courier New", monospace';

const M = 24; // page margin

export interface Assets {
  logo: HTMLImageElement;
  mark: HTMLImageElement;
}

let assetsPromise: Promise<Assets> | null = null;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`image failed: ${src}`));
    img.src = src;
  });
}

async function loadFont(family: string, url: string, weight: string) {
  const face = new FontFace(family, `url(${url}) format("woff2")`, { weight });
  await face.load();
  document.fonts.add(face);
}

// Fonts and logos load once, in the background, after the first screen paints.
export function loadAssets(): Promise<Assets> {
  if (!assetsPromise) {
    assetsPromise = (async () => {
      const base = '/fonts/future-headline';
      const [logo, mark] = await Promise.all([
        loadImage('/ai-summit/tg-vertical-white.png'),
        loadImage('/ai-summit/tg-mark-black.png'),
        loadFont('FH Anton', `${base}/anton-400.woff2`, '400'),
        loadFont('FH Serif', `${base}/source-serif-600.woff2`, '600'),
        loadFont('FH Mono', `${base}/courier-prime-700.woff2`, '700'),
      ]);
      return { logo, mark };
    })();
    assetsPromise.catch(() => {
      assetsPromise = null;
    });
  }
  return assetsPromise;
}

// Small seeded PRNG so paper grain is identical for identical input.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Typographic cleanup the template owns: straight quotes become curly, and
// dashes the brand bans are replaced, whatever the text source produced.
export function tidy(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s*[–—]\s*/g, ', ')
    .replace(/(^|[\s(])"/g, '$1“')
    .replace(/"/g, '”')
    .replace(/(^|[\s(])'/g, '$1‘')
    .replace(/'/g, '’')
    .trim();
}

function greedy(ctx: CanvasRenderingContext2D, words: string[], maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Greedy wrap, then rebalance so a tabloid headline never strands one word
// on its last line: keep the line count, shrink the measure until it breaks.
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  let best = greedy(ctx, words, maxWidth);
  if (best.length < 2) return best;
  for (let w = maxWidth * 0.95; w > maxWidth * 0.45; w -= maxWidth * 0.05) {
    const trial = greedy(ctx, words, w);
    if (trial.length !== best.length) break;
    if (Math.max(...trial.map((l) => ctx.measureText(l).width)) > maxWidth) break;
    best = trial;
  }
  return best;
}

interface Fit {
  size: number;
  lines: string[];
}

// Largest size at which the text fits within maxLines, no word overflowing.
function fit(
  ctx: CanvasRenderingContext2D,
  text: string,
  family: string,
  weight: string,
  maxWidth: number,
  maxLines: number,
  maxSize: number,
  minSize: number,
): Fit {
  for (let size = maxSize; size >= minSize; size -= 2) {
    ctx.font = `${weight} ${size}px ${family}`;
    const lines = wrap(ctx, text, maxWidth);
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (lines.length <= maxLines && widest <= maxWidth) return { size, lines };
  }
  ctx.font = `${weight} ${minSize}px ${family}`;
  return { size: minSize, lines: wrap(ctx, text, maxWidth).slice(0, maxLines) };
}

function drawLines(
  ctx: CanvasRenderingContext2D,
  f: Fit,
  family: string,
  weight: string,
  x: number,
  y: number,
  lineHeight: number,
  color: string,
): number {
  ctx.font = `${weight} ${f.size}px ${family}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'alphabetic';
  let cursor = y;
  for (const line of f.lines) {
    cursor += f.size * lineHeight;
    ctx.fillText(line, x, cursor);
  }
  return cursor;
}

function paper(ctx: CanvasRenderingContext2D, rand: () => number) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  for (let i = 0; i < 9000; i++) {
    const x = rand() * PAGE_W;
    const y = rand() * PAGE_H;
    const dark = rand() > 0.35;
    ctx.fillStyle = dark ? `rgba(20,18,14,${0.03 + rand() * 0.07})` : 'rgba(255,255,255,0.5)';
    const s = rand() * 2.2 + 0.4;
    ctx.fillRect(x, y, s, s);
  }
}

// Newsprint grade for the lead photo. One and three years out print in black
// and white, five years out in muted color, matching the three postcards.
function gradePhoto(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: boolean,
  rand: () => number,
) {
  let data: ImageData;
  try {
    data = ctx.getImageData(x, y, w, h);
  } catch {
    return;
  }
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const grain = (rand() - 0.5) * 34;
    // S-curve contrast around mid grey.
    const curve = (v: number) => {
      const n = v / 255 - 0.5;
      return (0.5 + n * 1.32 + n * Math.abs(n) * 0.55) * 255 + grain;
    };
    if (color) {
      const mix = 0.45;
      px[i] = curve(r * (1 - mix) + lum * mix);
      px[i + 1] = curve(g * (1 - mix) + lum * mix);
      px[i + 2] = curve(b * (1 - mix) + lum * mix + 6);
    } else {
      const v = curve(lum);
      px[i] = v;
      px[i + 1] = v;
      px[i + 2] = v - 3;
    }
  }
  ctx.putImageData(data, x, y);
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  iw: number,
  ih: number,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (iw - sw) / 2;
  // Faces sit in the upper part of most selfies, so tall photos crop from
  // a third of the way down rather than dead center.
  const sy = (ih - sh) * 0.25;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function stamp(ctx: CanvasRenderingContext2D, kicker: string, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((-4 * Math.PI) / 180);
  ctx.scale(0.8, 0.8);
  ctx.font = `400 50px ${HEAD}`;
  const big = kicker.toUpperCase();
  const bigW = ctx.measureText(big).width;
  ctx.font = `400 26px ${HEAD}`;
  const small = 'ORACLE OUTCOME:';
  const smallW = ctx.measureText(small).width;
  const w = Math.max(bigW, smallW) + 56;
  const h = 126;
  ctx.fillStyle = RED;
  ctx.fillRect(0, -h, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 3;
  ctx.strokeRect(8, -h + 8, w - 16, h - 16);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `400 26px ${HEAD}`;
  ctx.fillText(small, w / 2, -h + 46);
  ctx.font = `400 50px ${HEAD}`;
  ctx.fillText(big, w / 2, -24);
  ctx.restore();
}

export function renderFrontPage(
  canvas: HTMLCanvasElement,
  story: Story,
  photo: CanvasImageSource,
  photoW: number,
  photoH: number,
  assets: Assets,
) {
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const rand = mulberry32(hash(story.headline + story.punchline + story.future_year));
  const inner = PAGE_W - M * 2;

  paper(ctx, rand);

  // Masthead
  const mastH = 214;
  ctx.fillStyle = INK;
  ctx.fillRect(M, M, inner, mastH);

  const logoH = 50;
  const logoW = (assets.logo.width / assets.logo.height) * logoH;
  ctx.drawImage(assets.logo, M + 22, M + 16, logoW, logoH);

  ctx.font = `400 23px ${HEAD}`;
  const flag = 'SPECIAL AUTOMOTIVE AI SUMMIT EDITION';
  const flagW = ctx.measureText(flag).width + 32;
  ctx.fillStyle = YELLOW;
  ctx.fillRect(M + inner - 22 - flagW, M + 20, flagW, 42);
  ctx.fillStyle = INK;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(flag, M + inner - 22 - flagW + 16, M + 42);

  const title = fit(ctx, 'TOMORROW’S DEALER', HEAD, '400', inner - 44, 1, 150, 80);
  ctx.font = `400 ${title.size}px ${HEAD}`;
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'center';
  ctx.fillText(title.lines[0], PAGE_W / 2, M + mastH - 22);
  ctx.textAlign = 'left';

  // Dateline
  let y = M + mastH;
  ctx.fillStyle = INK;
  ctx.fillRect(M, y + 8, inner, 2);
  ctx.font = `700 24px ${MONO}`;
  ctx.textBaseline = 'middle';
  ctx.fillText(`BOSTON / SEPTEMBER 24, ${story.future_year}`, M + 2, y + 31);
  ctx.textAlign = 'right';
  ctx.fillText('PRICE: ONE SELFIE', M + inner - 2, y + 31);
  ctx.textAlign = 'left';
  ctx.fillRect(M, y + 50, inner, 2);
  y += 56;

  // Headline, punchline, deck. The lead photo is the star, so headline type
  // steps down until the photo keeps at least MIN_PHOTO_H of the page.
  const footH = 74;
  const footY = PAGE_H - M - footH;
  const MIN_PHOTO_H = 540;
  const headText = tidy(story.headline).toUpperCase();
  const punchText = tidy(story.punchline).toUpperCase();
  const deck = fit(ctx, tidy(story.deck), SERIF, '600', inner, 3, 36, 24);
  const deckH = deck.lines.length * deck.size * 1.24;
  let headline = fit(ctx, headText, HEAD, '400', inner, 2, 112, 50);
  let punch = fit(ctx, punchText, HEAD, '400', inner, 2, 112, 50);
  for (let cap = 112; cap >= 50; cap -= 4) {
    headline = fit(ctx, headText, HEAD, '400', inner, 2, cap, 50);
    punch = fit(ctx, punchText, HEAD, '400', inner, 2, cap, 50);
    // Both halves of the headline share one size, like the printed cards.
    const size = Math.min(headline.size, punch.size);
    headline = fit(ctx, headText, HEAD, '400', inner, 2, size, 50);
    punch = fit(ctx, punchText, HEAD, '400', inner, 2, size, 50);
    const textH = (headline.lines.length + punch.lines.length) * size * 1.1 + 14 + deckH;
    if (footY - 16 - (y + textH + 22) >= MIN_PHOTO_H) break;
  }
  y = drawLines(ctx, headline, HEAD, '400', M, y, 1.1, INK);
  y = drawLines(ctx, punch, HEAD, '400', M, y + 2, 1.1, RED);
  y = drawLines(ctx, deck, SERIF, '600', M, y + 12, 1.24, INK);

  const imgY = y + 22;
  const imgH = footY - 16 - imgY;

  ctx.fillStyle = INK;
  ctx.fillRect(M, imgY, inner, imgH);
  const pad = 3;
  drawCover(ctx, photo, photoW, photoH, M + pad, imgY + pad, inner - pad * 2, imgH - pad * 2);
  gradePhoto(
    ctx,
    M + pad,
    imgY + pad,
    inner - pad * 2,
    imgH - pad * 2,
    story.future_year - EVENT_YEAR >= 5,
    rand,
  );
  stamp(ctx, tidy(story.kicker), M + 22, imgY + imgH - 4);

  // Footer
  ctx.fillStyle = YELLOW;
  const ctaW = 470;
  ctx.fillRect(M, footY, ctaW, footH);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.strokeRect(M + 1.5, footY + 1.5, ctaW - 3, footH - 3);
  ctx.fillStyle = INK;
  ctx.textBaseline = 'alphabetic';
  ctx.font = `400 33px ${HEAD}`;
  ctx.fillText('MAKE YOUR OWN FRONT PAGE', M + 18, footY + 38);
  ctx.font = `700 21px ${MONO}`;
  ctx.fillText('tenthgear.ai/ai-summit', M + 18, footY + 63);

  const markH = 46;
  const markW = (assets.mark.width / assets.mark.height) * markH;
  ctx.drawImage(assets.mark, M + inner - markW, footY + (footH - markH) / 2, markW, markH);
  ctx.textAlign = 'right';
  ctx.font = `700 19px ${MONO}`;
  const noteX = M + inner - markW - 16;
  ctx.fillText('SATIRE FROM THE FUTURE.', noteX, footY + 24);
  ctx.fillText('NONE OF THIS HAS HAPPENED. YET.', noteX, footY + 46);
  ctx.fillText('PRINTED BY TENTHGEAR', noteX, footY + 68);
  ctx.textAlign = 'left';
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('export failed'))), 'image/png');
  });
}
