// First look: a story types itself in (fast), then a red pen marks it up the way a
// person would: underline, circle, cross out, an arrow out to the margin, a note.
// The pen gets more aggravated as it goes: it hesitates, then attacks.
// On narrow screens there are no margins, so marks get a number and the notes
// are written under the story.

import type { Note } from './shared';

type Kind = 'underline' | 'circle' | 'strike';
type Mood = 0 | 1 | 2; // calm, irritated, aggravated
type Pt = [number, number];
type Rect = { x: number; y: number; w: number; h: number };
type Win = [number, number];

// How the pen treats each line of the misfire sample. Unknown lines get a calm underline.
const STYLE: Record<string, { kind: Kind; mood: Mood }> = {
  'Check engine light was observed illuminated': { kind: 'underline', mood: 0 },
  P0301: { kind: 'circle', mood: 0 },
  'spark plugs': { kind: 'circle', mood: 1 },
  worn: { kind: 'circle', mood: 2 },
  'Replaced spark plugs': { kind: 'underline', mood: 1 },
  'Verified proper operation': { kind: 'strike', mood: 2 },
};

// Per mood: travel, hover, mark, arrow, write (for a 16-letter note), stroke width.
const PACE = [
  { trav: 340, hover: 220, mark: 640, arrow: 360, write: 620, sw: 2.4 },
  { trav: 260, hover: 120, mark: 560, arrow: 280, write: 500, sw: 2.7 },
  { trav: 200, hover: 560, mark: 380, arrow: 200, write: 400, sw: 3.1 },
];
const HOLD_MS = 4000;
const FADE_MS = 350;
const SVG = 'http://www.w3.org/2000/svg';

interface Tok { text: string; el: HTMLElement; typed: Text; rest: HTMLElement; start: number; mark?: number }
interface Mark {
  id: number; note: string; kind: Kind; mood: Mood; el: HTMLElement;
  w: { trav: Win; hover: Win; mark: Win; arrow: Win; write: Win; slash: Win };
  pts: Pt[]; markPath: SVGPathElement; arrowPath: SVGPathElement; headPath: SVGPathElement; slashPath: SVGPathElement;
  noteEl: HTMLElement; numEl: HTMLElement;
  // geometry, set by measure()
  P0: Pt; C1: Pt; C2: Pt; P1: Pt; num: Pt; nx: number; ny: number; nw: number; fs: number; slashPts: Pt[];
}

export interface PenEls {
  root: HTMLElement; story: HTMLElement; col: HTMLElement; cause: HTMLElement; corr: HTMLElement;
  ink: SVGSVGElement; notes: HTMLElement; stamp: HTMLElement; pen: HTMLElement;
}

function seeded(seed: number) {
  return () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
}
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const prog = (t: number, w: Win) => (w[1] <= w[0] ? (t >= w[1] ? 1 : 0) : clamp((t - w[0]) / (w[1] - w[0])));
const smooth = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * x);
const attack = (x: number) => 1 - (1 - x) * (1 - x);
const lerp = (a: Pt, b: Pt, f: number): Pt => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
const d = (pts: Pt[]) => 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
const f1 = (p: Pt) => p[0].toFixed(1) + ' ' + p[1].toFixed(1);

export function createPen(els: PenEls, cause: string, correction: string, notes: Note[], stampHtml: string, stampGood: boolean) {
  const rnd = seeded(11);
  const marksFor = (text: string, field: Note['field']) =>
    notes
      .filter((n) => n.field === field && n.match && text.includes(n.match))
      .map((n) => ({ start: text.indexOf(n.match!), end: text.indexOf(n.match!) + n.match!.length, note: n }))
      .sort((a, b) => a.start - b.start)
      .filter((m, i, all) => i === 0 || m.start >= all[i - 1].end);

  // ---- text, split into tokens so marked phrases are their own spans
  const toks: Tok[] = [];
  const marks: Mark[] = [];
  const path = (sw: number) => {
    const p = document.createElementNS(SVG, 'path');
    p.setAttribute('pathLength', '1');
    p.style.strokeWidth = String(sw);
    p.style.strokeDashoffset = '1';
    els.ink.appendChild(p);
    return p;
  };
  let offset = 0;
  const fill = (host: HTMLElement, text: string, field: Note['field']) => {
    host.textContent = '';
    const ms = marksFor(text, field);
    const cuts = [...new Set([0, text.length, ...ms.flatMap((m) => [m.start, m.end])])].sort((a, b) => a - b);
    for (let i = 0; i < cuts.length - 1; i++) {
      const piece = text.slice(cuts[i], cuts[i + 1]);
      const m = ms.find((x) => x.start === cuts[i]);
      const el = document.createElement('span');
      const typed = document.createTextNode('');
      const rest = document.createElement('span');
      rest.className = 'sc-live-rest';
      rest.textContent = piece;
      el.append(typed, rest);
      host.appendChild(el);
      const tok: Tok = { text: piece, el, typed, rest, start: offset + cuts[i] };
      if (m) {
        const st = STYLE[m.note.match!] ?? { kind: 'underline' as Kind, mood: 0 as Mood };
        const sw = PACE[st.mood].sw;
        const noteEl = document.createElement('div');
        noteEl.className = 'sc-live-note';
        noteEl.textContent = m.note.pen;
        const numEl = document.createElement('div');
        numEl.className = 'sc-live-num';
        els.notes.append(noteEl, numEl);
        tok.mark = marks.length;
        marks.push({
          id: marks.length, note: m.note.pen, kind: st.kind, mood: st.mood, el,
          w: { trav: [0, 0], hover: [0, 0], mark: [0, 0], arrow: [0, 0], write: [0, 0], slash: [0, 0] },
          pts: [], markPath: path(st.kind === 'strike' && st.mood === 2 ? 2.6 : sw), arrowPath: path(2.2), headPath: path(2.2), slashPath: path(2.2),
          noteEl, numEl,
          P0: [0, 0], C1: [0, 0], C2: [0, 0], P1: [0, 0], num: [0, 0], nx: 0, ny: 0, nw: 0, fs: 27, slashPts: [],
        });
      }
      toks.push(tok);
    }
    offset += text.length;
  };
  fill(els.cause, cause, 'cause');
  fill(els.corr, correction, 'correction');
  els.stamp.className = `sc-stamp sc-live-stamp${stampGood ? ' is-good' : ''}`;
  els.stamp.innerHTML = stampHtml;
  const caret = document.createElement('span');
  caret.className = 'sc-live-caret';

  // ---- timeline: typing is fast (under 3 s), then the pen, mark by mark
  const all = cause + correction;
  const times: number[] = [];
  let t = 200;
  for (let i = 0; i < all.length; i++) {
    if (i === cause.length) t += 160;
    t += 6 + rnd() * 8;
    if (all[i] === '.') t += 70;
    times.push(t);
  }
  const typeEnd = t + 250;
  let cur = typeEnd;
  marks.forEach((m, i) => {
    const p = PACE[m.mood];
    const w = m.w;
    w.trav = [cur, cur + (i ? p.trav : 0)];
    w.hover = [w.trav[1], w.trav[1] + p.hover];
    w.mark = [w.hover[1], w.hover[1] + p.mark];
    w.arrow = [w.mark[1] + 70, w.mark[1] + 70 + p.arrow];
    w.write = [w.arrow[1] + 60, w.arrow[1] + 60 + p.write * Math.max(0.7, m.note.length / 16)];
    w.slash = m.mood === 2 ? [w.write[1] + 40, w.write[1] + 210] : [w.write[1], w.write[1]];
    cur = w.slash[1] + 60;
  });
  const exit: Win = [cur, cur + 300];
  const stampAt = cur + 350;
  const loopEnd = stampAt + 260 + HOLD_MS;

  // ---- geometry
  let stacked = false;
  let ok = false;
  let stampXY: Pt = [0, 0];
  let exitPt: Pt = [0, 0];
  const shape = (m: Mark, rects: Rect[]): Pt[][] => {
    const r = seeded(97 + m.id * 31);
    const lines: Pt[][] = [];
    const kind = m.kind === 'circle' && rects.length > 1 ? 'underline' : m.kind;
    rects.forEach((g) => {
      const pts: Pt[] = [];
      lines.push(pts);
      if (kind === 'circle') {
        const cx = g.x + g.w / 2, cy = g.y + g.h / 2 + 1;
        const rx = g.w / 2 + 10, ry = g.h / 2 + 7;
        // Calm: one loop. Irritated: a long overlap. Aggravated: round twice, harder.
        const turn = m.mood === 2 ? Math.PI * 4 + 0.4 : Math.PI * 2 + (m.mood === 1 ? 0.95 : 0.55);
        const a0 = -2.4 + r() * 0.5, tilt = (r() - 0.5) * 0.14, ph = r() * 6, n = m.mood === 2 ? 96 : 52;
        for (let k = 0; k <= n; k++) {
          const f = k / n, a = a0 + f * turn;
          const grow = 1 + (m.mood === 2 ? 0.16 : 0.07) * f + 0.03 * Math.sin(3 * a + ph);
          const x = rx * grow * Math.cos(a), y = ry * grow * Math.sin(a);
          pts.push([cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)]);
        }
      } else if (kind === 'underline') {
        const y0 = g.y + g.h + 1, x0 = g.x - 4, x1 = g.x + g.w + 6, n = Math.max(8, Math.round((x1 - x0) / 7));
        const slope = (r() - 0.6) * 5;
        for (let k = 0; k <= n; k++) {
          const f = k / n;
          pts.push([x0 + f * (x1 - x0), y0 + slope * f + 2.4 * Math.sin(f * n * 0.95 + r() * 0.4)]);
        }
        if (m.mood >= 1) {
          // Irritated: straight back under it again.
          for (let k = 0; k <= n; k++) { const f = k / n; pts.push([x1 + 2 - f * (x1 - x0 + 4), y0 + 5 + slope * (1 - f) + 1.2 * Math.sin(f * 9)]); }
        } else pts.push([x1 + 6, y0 + slope - 7]);
      } else if (m.mood === 2) {
        // Aggravated strike: scribbled out, back and forth.
        const cy = g.y + g.h / 2 + 1, x0 = g.x - 6, x1 = g.x + g.w + 6;
        for (let pass = 0; pass < 5; pass++) {
          for (let k = 0; k <= 10; k++) {
            const f = k / 10, x = pass % 2 ? x1 - f * (x1 - x0) : x0 + f * (x1 - x0);
            pts.push([x + (r() - 0.5) * 3, cy - 5 + pass * 2.6 + 1.6 * Math.sin(f * 8 + pass) + (pass % 2 ? 2 : -2) * f]);
          }
        }
      } else {
        const cy = g.y + g.h / 2 + 2, x0 = g.x - 6, x1 = g.x + g.w + 6;
        for (let k = 0; k <= 12; k++) { const f = k / 12; pts.push([x0 + f * (x1 - x0), cy - 2 * f + 1.5 * Math.sin(f * 7)]); }
        for (let k = 0; k <= 12; k++) { const f = k / 12; pts.push([x1 - f * (x1 - x0) + 4, cy - 7 + 6 * f + 1.2 * Math.sin(f * 9)]); }
      }
    });
    return lines;
  };

  function measure() {
    const story = els.story;
    const inner = story.clientWidth - 40;
    const gap = 24;
    const g = Math.min(270, Math.floor((inner - 2 * gap - 460) / 2));
    stacked = g < 200;
    els.root.classList.toggle('is-stacked', stacked);
    story.style.setProperty('--g', stacked ? '0px' : g + 'px');
    story.style.setProperty('--gap', stacked ? '0px' : gap + 'px');
    const rowH = 34;
    story.style.setProperty('--below', stacked ? 22 + 14 + marks.length * rowH + 'px' : '44px');
    const sr = story.getBoundingClientRect();
    if (!sr.width) return;
    const z = (story as unknown as { currentCSSZoom?: number }).currentCSSZoom ?? (sr.width / story.offsetWidth || 1);
    const rel = (r: DOMRect): Rect => ({ x: (r.left - sr.left) / z, y: (r.top - sr.top) / z, w: r.width / z, h: r.height / z });
    const col = rel(els.col.getBoundingClientRect());
    const colL = col.x, colR = col.x + col.w, colB = col.y + col.h;
    const fs = stacked ? 24 : g >= 250 ? 27 : 24;
    const nwMax = stacked ? col.w : g + gap - 36;
    const placed: Record<'left' | 'right', number[]> = { left: [], right: [] };
    marks.forEach((m, i) => {
      const rects = [...m.el.getClientRects()].map((r) => rel(r as DOMRect)).filter((r) => r.w > 1);
      if (!rects.length) return;
      // A phrase that wraps gets one stroke per line, drawn one after the other.
      const lines = shape(m, rects);
      m.pts = lines.flat();
      m.markPath.setAttribute('d', lines.map(d).join(' '));
      m.noteEl.style.fontSize = fs + 'px';
      m.noteEl.textContent = stacked ? `${i + 1}. ${m.note}` : m.note;
      m.noteEl.style.width = ''; // measure the natural width, not the last one set
      m.nw = Math.min(nwMax, m.noteEl.offsetWidth);
      m.fs = fs;
      if (stacked) {
        const last = rects[rects.length - 1];
        m.numEl.textContent = String(i + 1);
        m.numEl.hidden = false;
        m.num = [last.x + last.w + 1, last.y - 12];
        m.numEl.style.left = m.num[0].toFixed(1) + 'px';
        m.numEl.style.top = m.num[1].toFixed(1) + 'px';
        m.nx = colL;
        m.ny = colB + 14 + i * rowH;
        m.arrowPath.setAttribute('d', '');
        m.headPath.setAttribute('d', '');
      } else {
        m.numEl.hidden = true;
        const r0 = rects[0], rl = rects[rects.length - 1];
        const side = r0.x - colL <= colR - (rl.x + rl.w) ? 'left' : 'right';
        const gr = side === 'left' ? r0 : rl;
        // A mark that starts its line gets a straight arrow; any other runs in the gap above its line and hooks down.
        const direct = side === 'left' && gr.x - colL < 4;
        const gapY = gr.y - 11;
        let ny = Math.max(6, (direct ? gr.y + gr.h / 2 : gapY) - 18);
        const list = placed[side];
        if (list.length && ny < list[list.length - 1] + fs * 2.15) ny = list[list.length - 1] + fs * 2.15;
        list.push(ny);
        const nwBox = nwMax;
        const boxX = side === 'left' ? colL - 52 - nwBox : colR + 52;
        m.nx = side === 'left' ? boxX + nwBox - m.nw : boxX;
        m.ny = ny;
        const dir = side === 'left' ? 1 : -1;
        // The arrow starts a little clear of the note's real edge.
        const P0: Pt = side === 'left' ? [m.nx + m.nw + 12, ny + fs * 0.66] : [m.nx - 12, ny + fs * 0.66];
        let P1: Pt, C1: Pt, C2: Pt;
        if (direct) {
          P1 = [gr.x - (m.kind === 'circle' ? 14 : 8), gr.y + gr.h / 2 + (m.kind === 'underline' ? 6 : 0)];
          C1 = [P0[0] + 12, P0[1] - 10];
          C2 = [P1[0] - 16, P1[1] - 10];
        } else {
          const tx = gr.x + gr.w / 2 + (m.kind === 'circle' ? -dir * 4 : 0);
          P1 = [tx, gr.y - (m.kind === 'circle' ? 4 : 1)];
          // Stay in the margin until the column edge, then run along the gap above the line.
          C1 = [side === 'left' ? colL - 4 : colR + 4, gapY - 3];
          C2 = [tx - dir * 22, gapY - 9];
        }
        Object.assign(m, { P0, P1, C1, C2 });
        const dx = P1[0] - C2[0], dy = P1[1] - C2[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
        const rot = (a: number): Pt => [ux * Math.cos(a) - uy * Math.sin(a), ux * Math.sin(a) + uy * Math.cos(a)];
        const h1 = rot(0.5), h2 = rot(-0.5);
        m.arrowPath.setAttribute('d', 'M' + f1(P0) + ' C' + f1(C1) + ' ' + f1(C2) + ' ' + f1(P1));
        m.headPath.setAttribute('d', 'M' + f1([P1[0] - 13 * h1[0], P1[1] - 13 * h1[1]]) + ' L' + f1(P1) + ' L' + f1([P1[0] - 13 * h2[0], P1[1] - 13 * h2[1]]));
      }
      m.noteEl.style.left = m.nx.toFixed(1) + 'px';
      m.noteEl.style.top = m.ny.toFixed(1) + 'px';
      m.noteEl.style.width = m.nw.toFixed(1) + 'px';
      // Aggravated notes get a hard line under them.
      if (m.mood === 2) {
        const y = m.ny + fs * 1.08, x0 = m.nx - 2, x1 = m.nx + m.nw + 4;
        m.slashPts = Array.from({ length: 11 }, (_, k) => [x0 + (k / 10) * (x1 - x0), y + 1.6 * Math.sin(k * 1.3) - (k / 10) * 3] as Pt);
        m.slashPath.setAttribute('d', d(m.slashPts));
      } else m.slashPath.setAttribute('d', '');
    });
    const causeTop = rel(els.cause.getBoundingClientRect()).y;
    // Wide: top corner of a margin no note uses; else under the story.
    const free = (side: 'left' | 'right') => placed[side].every((y) => y > causeTop + 110);
    stampXY = stacked
      ? [colR - 64, causeTop - 2]
      : free('right') ? [colR + 70, causeTop - 14]
      : free('left') ? [colL - 170, causeTop - 14]
      : [(colL + colR) / 2 - 48, colB + 8];
    if (!stacked && !free('right') && !free('left')) story.style.setProperty('--below', '130px');
    exitPt = [colR + (stacked ? 0 : 120), colB + 30];
    ok = marks.every((m) => m.pts.length);
  }

  // ---- drawing at time t
  let lastK = -1;
  const penAt = (t: number): { p: Pt; up: boolean; mood: Mood } | null => {
    for (let i = 0; i < marks.length; i++) {
      const m = marks[i], w = m.w;
      const start = m.pts[0];
      const hoverPt: Pt = [start[0] - 3, start[1] - 9];
      const prevEnd = i ? endPt(marks[i - 1]) : hoverPt;
      if (t < w.trav[0]) return null;
      if (t < w.trav[1]) return { p: lerp(prevEnd, hoverPt, smooth(prog(t, w.trav))), up: true, mood: m.mood };
      if (t < w.hover[1]) {
        // Aggravated: the pen hovers and trembles before it goes in.
        const a = m.mood === 2 ? 1.4 : 0.4;
        return { p: [hoverPt[0] + a * Math.sin(t / 23), hoverPt[1] + a * Math.cos(t / 17)], up: true, mood: m.mood };
      }
      if (t < w.mark[1]) {
        const e = (m.mood === 2 ? attack : smooth)(prog(t, w.mark));
        return { p: m.pts[Math.min(m.pts.length - 1, Math.floor(e * (m.pts.length - 1)))], up: false, mood: m.mood };
      }
      if (t < w.arrow[0]) return { p: m.pts[m.pts.length - 1], up: true, mood: m.mood };
      if (t < w.arrow[1]) {
        const q = prog(t, w.arrow);
        if (stacked) {
          if (q < 0.35) return { p: [m.num[0] + 4, m.num[1] + 14], up: false, mood: m.mood };
          return { p: lerp([m.num[0] + 4, m.num[1] + 14], [m.nx, m.ny + m.fs * 0.95], smooth((q - 0.35) / 0.65)), up: true, mood: m.mood };
        }
        const s = clamp(q / 0.78), a = 1 - s;
        const b3 = (j: 0 | 1) => a * a * a * m.P0[j] + 3 * a * a * s * m.C1[j] + 3 * a * s * s * m.C2[j] + s * s * s * m.P1[j];
        return { p: [b3(0), b3(1)], up: false, mood: m.mood };
      }
      if (t < w.write[0]) return { p: stacked ? [m.nx, m.ny + m.fs * 0.95] : m.P1, up: true, mood: m.mood };
      if (t < w.write[1]) {
        const pw = prog(t, w.write), sp = m.mood === 2 ? 30 : 45, amp = m.mood === 2 ? 4 : 3;
        return { p: [m.nx + pw * m.nw, m.ny + m.fs * 0.95 + amp * Math.sin(t / sp)], up: false, mood: m.mood };
      }
      if (t < w.slash[1]) {
        const s = m.slashPts, e = attack(prog(t, w.slash));
        return { p: s[Math.min(s.length - 1, Math.floor(e * (s.length - 1)))], up: false, mood: m.mood };
      }
    }
    if (t < exit[1] && marks.length) return { p: lerp(endPt(marks[marks.length - 1]), exitPt, smooth(prog(t, exit))), up: true, mood: 0 };
    return null;
  };
  const endPt = (m: Mark): Pt => (m.mood === 2 && m.slashPts.length ? m.slashPts[m.slashPts.length - 1] : [m.nx + m.nw, m.ny + m.fs * 0.95]);

  const draw = (p: SVGPathElement, f: number) => {
    p.style.strokeDashoffset = String(1 - f);
    p.style.visibility = f > 0 ? '' : 'hidden';
  };

  function render(t: number, still = false) {
    let k = 0;
    while (k < times.length && times[k] <= t) k++;
    if (still) k = times.length;
    if (k !== lastK) {
      lastK = k;
      let caretTok: Tok | null = null;
      toks.forEach((tok) => {
        const n = Math.max(0, Math.min(tok.text.length, k - tok.start));
        tok.typed.data = tok.text.slice(0, n);
        tok.rest.textContent = tok.text.slice(n);
        if (k >= tok.start && k < tok.start + tok.text.length) caretTok = tok;
        else if (!caretTok && k === tok.start + tok.text.length && (k === cause.length || k === all.length)) caretTok = tok;
      });
      if (caretTok && !still) (caretTok as Tok).el.insertBefore(caret, (caretTok as Tok).rest);
    }
    caret.hidden = still || t >= typeEnd;
    if (!ok) return;
    marks.forEach((m) => {
      const w = m.w;
      const pm = (m.mood === 2 ? attack : smooth)(prog(t, w.mark));
      draw(m.markPath, pm);
      const q = prog(t, w.arrow);
      if (stacked) {
        m.numEl.style.opacity = q >= 0.2 ? '1' : '0';
      } else {
        draw(m.arrowPath, clamp(q / 0.78));
        draw(m.headPath, clamp((q - 0.78) / 0.22));
      }
      // Reveal left to right; once written, let the handwriting overhang its box.
      const pw = prog(t, w.write);
      m.noteEl.style.clipPath = `inset(-12px calc(${((1 - pw) * 100).toFixed(1)}% - ${(12 * pw).toFixed(1)}px) -12px -12px)`;
      draw(m.slashPath, attack(prog(t, w.slash)));
    });
    const pen = still ? null : penAt(t);
    els.pen.classList.toggle('is-on', !!pen);
    if (pen) {
      els.pen.classList.toggle('is-up', pen.up);
      const wob = pen.up ? 0 : (pen.mood === 2 ? 7 : 3) * Math.sin(t / (pen.mood === 2 ? 40 : 70));
      const lift = pen.up ? 5 : 0;
      els.pen.style.transform = `translate(${pen.p[0].toFixed(1)}px, ${(pen.p[1] - 6.5 - lift).toFixed(1)}px) rotate(${(-38 + wob - (pen.mood === 2 ? 6 : 0)).toFixed(1)}deg)`;
    }
    const ps = still ? 1 : clamp((t - stampAt) / 260);
    els.stamp.style.left = stampXY[0].toFixed(0) + 'px';
    els.stamp.style.top = stampXY[1].toFixed(0) + 'px';
    els.stamp.style.opacity = ps > 0 ? '1' : '0';
    els.stamp.style.transform = `rotate(-9deg) scale(${(1.8 - 0.8 * ps).toFixed(3)})`;
    const fade = still ? 1 : 1 - clamp((t - (loopEnd - FADE_MS)) / FADE_MS);
    [els.ink, els.notes, els.stamp, els.cause, els.corr].forEach((x) => ((x as HTMLElement).style.opacity = fade < 1 ? fade.toFixed(2) : ''));
    if (ps > 0 && fade === 1) els.stamp.style.opacity = '1';
  }

  // ---- loop
  let raf = 0;
  let now = 0;
  let last = 0;
  let still = false;
  const ro = new ResizeObserver(() => { measure(); render(now, still); });
  const tick = (ts: number) => {
    // Capped step: a hidden tab (no frames) resumes where it left off.
    now += last ? Math.min(ts - last, 64) : 0;
    last = ts;
    if (now > loopEnd) { now = 0; lastK = -1; }
    render(now);
    raf = requestAnimationFrame(tick);
  };

  return {
    start(reduced: boolean) {
      still = reduced;
      measure();
      ro.observe(els.story);
      // Notes are sized to the handwriting font, so measure again once it has loaded.
      const again = () => { measure(); lastK = -1; render(now, still); };
      document.fonts?.ready.then(again);
      document.fonts?.load(`700 27px Caveat`).then(again, () => {});
      if (reduced) { now = loopEnd; render(now, true); return; }
      now = 0;
      last = 0;
      render(0);
      raf = requestAnimationFrame(tick);
    },
    stop() {
      cancelAnimationFrame(raf);
      ro.disconnect();
    },
    // for tests and screenshots
    at(t: number) { now = t; render(t); },
    get length() { return loopEnd; },
  };
}
