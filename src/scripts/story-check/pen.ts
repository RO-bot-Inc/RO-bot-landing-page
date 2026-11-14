// The red pen. Two uses, one engine:
// - First look ('loop'): the misfire sample types itself in (fast), the pen marks
//   it up, a rubber stamp slams the grade, the pen taps "Try again", it loops.
// - Grading ('grade'): the visitor's own story. createReader() reads it line by
//   line while the grader works, then the pen marks each note, the stamp slams,
//   and it stops on the finished page.
// Marks: underline, circle, cross out, or an insert caret where something is
// missing; an arrow out to the margin and the note in handwriting. The pen gets
// more aggravated the worse the line: it hesitates, then attacks.
// On narrow screens there are no margins, so marks get a number and the notes
// are written under the story.

import type { Note } from './shared';

type Kind = 'underline' | 'circle' | 'strike' | 'insert';
type Mood = 0 | 1 | 2; // calm, irritated, aggravated
type Pt = [number, number];
type Rect = { x: number; y: number; w: number; h: number };
type Win = [number, number];
type Field = Note['field'] | 'complaint'; // the complaint is context: never marked

// How the pen treats each line of the misfire sample (the first look, and grading that sample).
// also: other phrases in the same field the pen marks the same way before it writes the note.
const STYLE: Record<string, { kind: Kind; mood: Mood; rage?: boolean; also?: string[] }> = {
  'Check engine light was observed illuminated': { kind: 'underline', mood: 0 },
  P0301: { kind: 'circle', mood: 0, also: ['P0302'] },
  'spark plugs': { kind: 'circle', mood: 1 },
  worn: { kind: 'circle', mood: 2 },
  'Replaced spark plugs': { kind: 'underline', mood: 1 },
  'Verified proper operation': { kind: 'strike', mood: 2, rage: true }, // "Road test it? Miles?": underlined over and over
};

// Any other line: the worse the grade, the angrier the pen.
function styleFor(note: Note, matched: boolean): { kind: Kind; mood: Mood; rage?: boolean; also?: string[] } {
  if (matched && STYLE[note.match!]) return STYLE[note.match!];
  const g = /·\s*(\S+)\s*$/.exec(note.criterion)?.[1] ?? '';
  const mood: Mood = g === 'F' || g === 'missing' || g === '✕' ? 2 : g === 'D' ? 1 : 0;
  if (!matched) return { kind: 'insert', mood };
  const short = note.match!.length <= 14;
  return { kind: short ? 'circle' : mood === 2 ? 'strike' : 'underline', mood };
}

// Per mood: travel, hover, mark, arrow, write (for a 16-letter note), stroke width.
const PACE = [
  { trav: 340, hover: 220, mark: 640, arrow: 360, write: 620, sw: 2.4 },
  { trav: 260, hover: 120, mark: 560, arrow: 280, write: 500, sw: 2.7 },
  { trav: 200, hover: 560, mark: 380, arrow: 200, write: 400, sw: 3.1 },
];
const TYPE_SLOW = 1.25; // first look typing, 20% slower than it was
const READ_MS = 2200; // first look: the pen reads the story before it marks anything
const CTA_HOVER_MS = 5000; // first look: the pen hovers on "Try again" before it loops
const FADE_MS = 350;
const SVG = 'http://www.w3.org/2000/svg';

interface Tok { text: string; el: HTMLElement; typed: Text; rest: HTMLElement; start: number; field: number }
interface Mark {
  id: number; note: string; label: string; kind: Kind; mood: Mood; rage: boolean; el: HTMLElement;
  w: { trav: Win; hover: Win; mark: Win; arrow: Win; write: Win; slash: Win; shake: Win };
  pts: Pt[]; markPaths: SVGPathElement[]; arrowPath: SVGPathElement; headPath: SVGPathElement; slashPaths: SVGPathElement[];
  sw: number; extras: HTMLElement[];
  noteEl: HTMLElement; numEl: HTMLElement;
  // geometry, set by measure()
  P0: Pt; C1: Pt; C2: Pt; P1: Pt; num: Pt; nx: number; ny: number; nw: number; fs: number; slashPts: Pt[];
  run: Run; slashRun: Run;
}

export interface PenEls {
  root: HTMLElement; story: HTMLElement; col: HTMLElement; complaintWrap: HTMLElement;
  complaint: HTMLElement; cause: HTMLElement; corr: HTMLElement; stamper: HTMLElement;
  ink: SVGSVGElement; notes: HTMLElement; stamp: HTMLElement; pen: HTMLElement;
  stampLink?: HTMLElement | null; // sits right by the stamp (grading only)
}

export interface Story { complaint: string; cause: string; correction: string }

function seeded(seed: number) {
  return () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
}
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const prog = (t: number, w: Win) => (w[1] <= w[0] ? (t >= w[1] ? 1 : 0) : clamp((t - w[0]) / (w[1] - w[0])));
const smooth = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * x);
const attack = (x: number) => 1 - (1 - x) * (1 - x);
const overshoot = (x: number) => 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2); // lands a touch past, settles back
const tap = (q: number, n: number) => Math.sin(Math.PI * ((q * n) % 1)); // 0 lifted, 1 on the paper
const lerp = (a: Pt, b: Pt, f: number): Pt => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
const d = (pts: Pt[]) => 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
const f1 = (p: Pt) => p[0].toFixed(1) + ' ' + p[1].toFixed(1);

// A mark made of separate strokes: the pen draws each one, then lifts and moves
// to the start of the next. q runs 0..1 over the whole mark; drawn is the share
// of ink down (by length, as the SVG path's dash counts it).
// i and f: the stroke the pen is on and how much of it is down (earlier strokes are done).
type Run = (q: number) => { p: Pt; lift: number; drawn: number; i: number; f: number };
function strokes(list: Pt[][], gapShare = 0.12): Run {
  const ss = list.filter((s) => s.length > 1);
  const lens = ss.map((s) => s.slice(1).reduce((a, p, k) => a + Math.hypot(p[0] - s[k][0], p[1] - s[k][1]), 0));
  const total = lens.reduce((a, b) => a + b, 0) || 1;
  const gaps = Math.max(0, ss.length - 1);
  const g = gaps ? Math.min(0.4, gapShare * gaps) / gaps : 0;
  const drawShare = 1 - g * gaps;
  const along = (s: Pt[], L: number): Pt => {
    for (let k = 1; k < s.length; k++) {
      const seg = Math.hypot(s[k][0] - s[k - 1][0], s[k][1] - s[k - 1][1]);
      if (L <= seg) return lerp(s[k - 1], s[k], seg ? L / seg : 1);
      L -= seg;
    }
    return s[s.length - 1];
  };
  return (q) => {
    if (!ss.length) return { p: [0, 0], lift: 0, drawn: 1, i: 0, f: 1 };
    let t = clamp(q), cum = 0;
    for (let i = 0; i < ss.length; i++) {
      const share = (drawShare * lens[i]) / total;
      if (t <= share) { const f = share ? t / share : 1; return { p: along(ss[i], f * lens[i]), lift: 0, drawn: (cum + f * lens[i]) / total, i, f }; }
      t -= share;
      cum += lens[i];
      if (i < ss.length - 1) {
        if (t <= g) { const f = t / g; return { p: lerp(ss[i][ss[i].length - 1], ss[i + 1][0], smooth(f)), lift: 7 * Math.sin(Math.PI * f), drawn: cum / total, i, f: 1 }; }
        t -= g;
      }
    }
    const last = ss[ss.length - 1];
    return { p: last[last.length - 1], lift: 0, drawn: 1, i: ss.length - 1, f: 1 };
  };
}

// Coordinates inside the story card, in its own CSS pixels (the page may be zoomed on big screens).
function relTo(story: HTMLElement) {
  const sr = story.getBoundingClientRect();
  const z = (story as unknown as { currentCSSZoom?: number }).currentCSSZoom ?? (sr.width / story.offsetWidth || 1);
  return { ok: sr.width > 0, rel: (r: DOMRect): Rect => ({ x: (r.left - sr.left) / z, y: (r.top - sr.top) / z, w: r.width / z, h: r.height / z }) };
}

// The pen's pose on screen: lifted or on the paper, leaning into its motion.
function penPainter(pen: HTMLElement) {
  let lastPen: Pt | null = null;
  let lean = 0;
  return (pose: { p: Pt; lift: number; mood: Mood; rot?: number } | null, t: number) => {
    pen.classList.toggle('is-on', !!pose);
    if (!pose) { lastPen = null; return; }
    pen.classList.toggle('is-up', pose.lift > 2);
    const wob = pose.lift > 2 ? 0 : (pose.mood === 2 ? 7 : 3) * Math.sin(t / (pose.mood === 2 ? 40 : 70));
    const vx = lastPen ? pose.p[0] - lastPen[0] : 0;
    lean += (Math.max(-12, Math.min(12, vx * 1.2)) - lean) * 0.25;
    lastPen = pose.p;
    const ang = -38 + wob - (pose.mood === 2 ? 6 : 0) + lean + (pose.rot ?? 0);
    pen.style.transform = `translate(${pose.p[0].toFixed(1)}px, ${(pose.p[1] - 6.5 - pose.lift).toFixed(1)}px) rotate(${ang.toFixed(1)}deg)`;
  };
}

function fieldEls(els: PenEls): HTMLElement[] {
  return [els.complaint, els.cause, els.corr];
}

// Clears everything the pen drew, so a card can be reused.
function resetCard(els: PenEls) {
  els.ink.textContent = '';
  els.notes.textContent = '';
  els.stamp.style.opacity = '0';
  els.stamper.style.opacity = '0';
  els.story.style.transform = '';
  els.pen.classList.remove('is-on');
  fieldEls(els).forEach((f) => f.classList.remove('is-focus'));
  if (els.stampLink) els.stampLink.hidden = true;
  els.story.style.removeProperty('--above');
}

// ------------------------------------------------------------------ layout
// The story column with a margin either side for the pen's notes. The form uses
// the same layout, so the fields keep their size when grading starts.
export function fitColumns(box: HTMLElement, root: HTMLElement = box): boolean {
  const inner = box.clientWidth - 40;
  const gap = 24;
  const g = Math.min(270, Math.floor((inner - 2 * gap - 460) / 2));
  const stacked = g < 200;
  root.classList.toggle('is-stacked', stacked);
  box.style.setProperty('--g', stacked ? '0px' : g + 'px');
  box.style.setProperty('--gap', stacked ? '0px' : gap + 'px');
  // The story column's width, for things sized to match the fields ("Try again").
  root.style.setProperty('--colw', (stacked ? inner : inner - 2 * (g + gap)) + 'px');
  return stacked;
}

// ------------------------------------------------------------------ waiting
// While the grader works: the pen comes in and hovers over the story, ready.
export function createReader(els: PenEls, story: Story, onStatus: (s: string) => void) {
  resetCard(els);
  els.complaintWrap.hidden = !story.complaint.trim();
  els.complaint.textContent = story.complaint.trim();
  els.cause.textContent = story.cause.trim();
  els.corr.textContent = story.correction.trim();
  els.story.style.setProperty('--below', '26px');
  fitColumns(els.story, els.root);
  const paint = penPainter(els.pen);
  let off: Pt = [0, 0], spot: Pt = [0, 0];
  function plan() {
    const { ok, rel } = relTo(els.story);
    if (!ok) return;
    fitColumns(els.story, els.root);
    const f = rel((story.complaint.trim() ? els.complaint : els.cause).getBoundingClientRect());
    spot = [f.x + f.w * 0.35, f.y + f.h * 0.5 + 10];
    off = [els.story.offsetWidth + 80, spot[1] - 60];
  }
  const ENTER = 450;
  let raf = 0, now = 0, last = 0, pos: Pt = [0, 0];
  const tick = (ts: number) => {
    now += last ? Math.min(ts - last, 64) : 0;
    last = ts;
    if (now < ENTER) pos = lerp(off, spot, overshoot(prog(now, [0, ENTER])));
    // A slow "hmm" circle over the page while the grade comes back.
    else { const a = (now - ENTER) / 260; pos = [spot[0] + 4 * Math.cos(a), spot[1] + 3 * Math.sin(a)]; }
    paint({ p: pos, lift: 8, mood: 0 }, ts);
    raf = requestAnimationFrame(tick);
  };
  const ro = new ResizeObserver(() => plan());
  return {
    start() {
      plan();
      ro.observe(els.story);
      onStatus('Reading your story');
      raf = requestAnimationFrame(tick);
    },
    stop(): Pt {
      cancelAnimationFrame(raf);
      ro.disconnect();
      return pos;
    },
  };
}

// ------------------------------------------------------------------ marking
export function createPen(
  els: PenEls,
  story: Story,
  notes: Note[],
  stampHtml: string,
  stampGood: boolean,
  opts: { mode: 'loop' | 'grade'; from?: Pt; onDone?: () => void; link?: boolean } = { mode: 'loop' },
) {
  const loop = opts.mode === 'loop';
  const pace = loop ? 1 : 0.85;
  const rnd = seeded(11);
  resetCard(els);
  const complaint = story.complaint.trim(), cause = story.cause.trim(), correction = story.correction.trim();
  els.complaintWrap.hidden = !complaint;
  // The link by the stamp takes its place now (so the layout doesn't jump) and shows when the stamp lands.
  const link = opts.link ? els.stampLink ?? null : null;
  if (link) { link.hidden = false; link.style.visibility = 'hidden'; }

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
  // One SVG path per stroke, so each draws in on its own (a dash animation runs every subpath at once).
  const setStrokes = (list: SVGPathElement[], sw: number, lines: Pt[][]) => {
    while (list.length < Math.max(1, lines.length)) list.push(path(sw));
    while (list.length > Math.max(1, lines.length)) list.pop()!.remove();
    list.forEach((p, k) => p.setAttribute('d', lines[k] && lines[k].length > 1 ? d(lines[k]) : ''));
  };
  const drawStrokes = (list: SVGPathElement[], r: { i: number; f: number }) =>
    list.forEach((p, k) => draw(p, k < r.i ? 1 : k === r.i ? r.f : 0));
  const addMark = (note: Note, el: HTMLElement, matched: boolean, index: number) => {
    const st = styleFor(note, matched);
    const noteEl = document.createElement('div');
    noteEl.className = 'sc-live-note';
    noteEl.dataset.pen = String(note.n);
    const numEl = document.createElement('div');
    numEl.className = 'sc-live-num';
    els.notes.append(noteEl, numEl);
    marks.push({
      id: marks.length, note: note.pen, label: String(loop ? index : note.n), kind: st.kind, mood: st.mood, rage: !!st.rage, el,
      w: { trav: [0, 0], hover: [0, 0], mark: [0, 0], arrow: [0, 0], write: [0, 0], slash: [0, 0], shake: [0, 0] },
      pts: [], sw: st.kind === 'strike' && st.mood === 2 ? 2.6 : PACE[st.mood].sw, extras: [], markPaths: [], arrowPath: path(2.2), headPath: path(2.2), slashPaths: [],
      noteEl, numEl,
      P0: [0, 0], C1: [0, 0], C2: [0, 0], P1: [0, 0], num: [0, 0], nx: 0, ny: 0, nw: 0, fs: 27, slashPts: [], run: strokes([]), slashRun: strokes([]),
    });
  };
  let offset = 0;
  const pendingExtras: { el: HTMLElement; n: number }[] = [];
  const fill = (host: HTMLElement, text: string, field: Field, fieldIdx: number) => {
    host.textContent = '';
    const mine = notes.filter((n) => n.field === field);
    // A note whose phrase is in the text marks the phrase; any other gets a caret at the end of the field.
    const ms = mine
      .filter((n) => n.match && text.includes(n.match))
      .map((n) => ({ start: text.indexOf(n.match!), end: text.indexOf(n.match!) + n.match!.length, note: n }))
      .sort((a, b) => a.start - b.start)
      .filter((m, i, all) => i === 0 || m.start >= all[i - 1].end);
    const inserts = mine.filter((n) => !ms.some((m) => m.note === n));
    // Phrases a note also marks (P0302 with P0301), where they don't overlap a marked phrase.
    const extra = ms.flatMap((m) => (STYLE[m.note.match!]?.also ?? []).map((ph) => ({ start: text.indexOf(ph), end: text.indexOf(ph) + ph.length, note: m.note })))
      .filter((x) => x.start >= 0 && !ms.some((m) => x.start < m.end && x.end > m.start));
    const cuts = [...new Set([0, text.length, ...[...ms, ...extra].flatMap((m) => [m.start, m.end])])].sort((a, b) => a - b);
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
      toks.push({ text: piece, el, typed, rest, start: offset + cuts[i], field: fieldIdx });
      if (m) { el.dataset.mark = String(m.note.n); addMark(m.note, el, true, marks.length + 1); }
      const x = extra.find((e) => e.start === cuts[i]);
      if (x) pendingExtras.push({ el, n: x.note.n });
    }
    if (inserts.length) {
      const end = document.createElement('span');
      end.textContent = '​';
      host.appendChild(end);
      inserts.forEach((n) => addMark(n, end, false, marks.length + 1));
    }
    offset += text.length;
  };
  fill(els.complaint, complaint, 'complaint', 0);
  fill(els.cause, cause, 'cause', 1);
  fill(els.corr, correction, 'correction', 2);
  // Extra phrases join their mark once every mark exists, whichever comes first in the text.
  pendingExtras.forEach(({ el, n }) => {
    const owner = marks.find((k) => k.el.dataset.mark === String(n));
    if (owner) { el.dataset.mark = String(n); owner.extras.push(el); }
  });
  els.stamp.className = `sc-stamp sc-live-stamp${stampGood ? ' is-good' : ''}`;
  els.stamp.innerHTML = stampHtml;
  // Grading a story with nothing to mark: after the stamp, the pen writes a word of praise under it.
  const praise = !loop && !marks.length ? 'No notes! Great job!!' : '';
  const praiseEl = document.createElement('div');
  praiseEl.className = 'sc-live-note';
  if (praise) els.notes.appendChild(praiseEl);
  let praiseXY: Pt = [0, 0], praiseW = 0, praiseFs = 27;
  const caret = document.createElement('span');
  caret.className = 'sc-live-caret';

  // ---- timeline: typing (first look only, about 1.6 s), then the pen, mark by mark
  const all = complaint + cause + correction;
  const times: number[] = [];
  let t = loop ? 150 : 0;
  for (let i = 0; i < all.length; i++) {
    if (!loop) { times.push(-1); continue; }
    if (i === complaint.length || i === complaint.length + cause.length) t += 110 * TYPE_SLOW;
    t += (3 + rnd() * 5) * TYPE_SLOW;
    if (all[i] === '.') t += 40 * TYPE_SLOW;
    times.push(t);
  }
  const typeEnd = loop ? t + 200 : 0;
  // First look: a beat after the typing, the pen comes in and reads the story before it marks.
  const enter: Win = [typeEnd + 350, typeEnd + 800];
  const read: Win = [enter[1], enter[1] + READ_MS];
  let cur = loop ? read[1] + 120 : 150;
  marks.forEach((m, i) => {
    const p = PACE[m.mood];
    const w = m.w;
    w.trav = [cur, cur + (i || loop || opts.from ? p.trav * pace : 0)];
    w.hover = [w.trav[1], w.trav[1] + p.hover * pace];
    w.mark = [w.hover[1], w.hover[1] + p.mark * pace];
    w.arrow = [w.mark[1] + 70, w.mark[1] + 70 + p.arrow * pace];
    w.write = [w.arrow[1] + 60, w.arrow[1] + 60 + p.write * pace * Math.max(0.7, m.note.length / 16)];
    w.slash = m.mood === 2 ? [w.write[1] + 40, w.write[1] + (m.rage ? 1500 : 210)] : [w.write[1], w.write[1]];
    w.shake = m.mood === 2 ? [w.slash[1] + 40, w.slash[1] + (m.rage ? 640 : 440)] : [w.slash[1], w.slash[1]];
    cur = w.shake[1] + 60;
  });
  // Finale: the pen leaves, a rubber stamp slams the grade down and lifts off.
  // First look only: the pen comes back, taps "Try again", waits, and leaves.
  // First look: a beat before the stamp, and another after it before the pen comes back.
  const toRest: Win = [cur, cur + 380];
  const drop: Win = [toRest[1] + (loop ? 750 : 120), toRest[1] + (loop ? 1030 : 400)];
  const stampAt = drop[1];
  const lift: Win = [stampAt + (loop ? 700 : 300), stampAt + (loop ? 1040 : 640)];
  const toBtn: Win = [lift[1] + (loop ? 700 : 60), lift[1] + (loop ? 1180 : 540)];
  const taps: Win = [toBtn[1] + 80, toBtn[1] + 780];
  const exit: Win = [taps[1] + CTA_HOVER_MS, taps[1] + CTA_HOVER_MS + 450];
  const pTrav: Win = [lift[1] + 120, lift[1] + 560];
  const pWrite: Win = [pTrav[1] + 80, pTrav[1] + 1200];
  const pExit: Win = [pWrite[1] + 200, pWrite[1] + 600];
  const loopEnd = loop ? exit[1] + 250 : praise ? pExit[1] + 40 : lift[1] + 40;
  const doneAt = praise ? pWrite[1] + 300 : stampAt + 350; // grading: when the results come in

  // ---- geometry
  let stacked = false;
  let ok = false;
  let stampXY: Pt = [0, 0];
  let exitPt: Pt = [0, 0];
  let readPts: Pt[] = []; // first look: the strokes the pen reads along (start, end of each)
  let readRun: Run = strokes([]);
  let btnPt: Pt = [0, 0];
  const shape = (m: Mark, rects: Rect[]): Pt[][] => {
    const r = seeded(97 + m.id * 31);
    const lines: Pt[][] = [];
    const kind = m.kind === 'circle' && rects.length > 1 ? 'underline' : m.kind;
    (kind === 'insert' ? rects.slice(-1) : rects).forEach((g) => {
      const pts: Pt[] = [];
      lines.push(pts);
      if (kind === 'insert') {
        // A proofreader's caret under the end of the line: something's missing here.
        const x = g.x + 6, y = g.y + g.h + 2;
        pts.push([x - 7, y + 3], [x, y - 9], [x + 7, y + 3]);
        if (m.mood >= 1) lines.push([[x - 6, y + 4], [x + 1, y - 8]]);
      } else if (kind === 'circle') {
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
          // Irritated: lifts, goes back to the start, and underlines it again, a little lower.
          const again: Pt[] = [];
          for (let k = 0; k <= n; k++) { const f = k / n; again.push([x0 - 2 + f * (x1 - x0 + 4), y0 + 5 + slope * f + 1.2 * Math.sin(f * 9)]); }
          lines.push(again);
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
    stacked = fitColumns(story, els.root);
    const gap = 24;
    const g = Math.min(270, Math.floor((story.clientWidth - 40 - 2 * gap - 460) / 2));
    const rowH = 34;
    story.style.setProperty('--below', stacked ? 22 + 14 + marks.length * rowH + 'px' : '44px');
    const { ok: sized, rel } = relTo(story);
    if (!sized) return;
    const col = rel(els.col.getBoundingClientRect());
    const colL = col.x, colR = col.x + col.w, colB = col.y + col.h;
    const fs = stacked ? 24 : g >= 250 ? 27 : 24;
    const nwMax = stacked ? col.w : g + gap - 36;
    const placed: Record<'left' | 'right', number[]> = { left: [], right: [] };
    let lowest = 0;
    // The link under the stamp (top of a margin): a note that would land on it starts below it.
    const topY = rel((complaint ? els.complaint : els.cause).getBoundingClientRect()).y;
    const linkClear = link && !stacked ? topY - 14 + 96 + 10 + (link.offsetHeight || 28) + 6 : 0;
    marks.forEach((m, i) => {
      const rects = [...m.el.getClientRects()].map((r) => rel(r as DOMRect)).filter((r) => r.w > 1 || m.kind === 'insert');
      if (!rects.length) return;
      if (m.kind === 'insert') rects.splice(0, rects.length - 1, ...[]); // the caret sits at the very end
      const box = m.kind === 'insert' ? [{ ...rects[0], x: rects[0].x, w: 14 }] : rects;
      // A phrase that wraps gets one stroke per line, drawn one after the other.
      const lines = [
        ...shape(m, box),
        ...m.extras.flatMap((x) => shape(m, [...x.getClientRects()].map((r) => rel(r as DOMRect)).filter((r) => r.w > 1))),
      ];
      m.pts = lines.flat();
      m.run = strokes(lines);
      setStrokes(m.markPaths, m.sw, lines);
      m.noteEl.style.fontSize = fs + 'px';
      m.noteEl.textContent = m.note;
      m.noteEl.style.width = ''; // measure the natural width, not the last one set
      m.nw = Math.min(nwMax, m.noteEl.offsetWidth);
      m.fs = fs;
      if (stacked) {
        const lastR = box[box.length - 1];
        m.numEl.hidden = true; // no numbers (Dave, 2026-11-13)
        m.num = [lastR.x + lastR.w + 1, lastR.y - 12];
        m.numEl.style.left = m.num[0].toFixed(1) + 'px';
        m.numEl.style.top = m.num[1].toFixed(1) + 'px';
        m.nx = colL;
        // Listed under the story in number order, whatever order the pen marks them in.
        m.ny = colB + 14 + marks.filter((o) => +o.label < +m.label).length * rowH;
        m.arrowPath.setAttribute('d', '');
        m.headPath.setAttribute('d', '');
      } else {
        m.numEl.hidden = true;
        const r0 = box[0], rl = box[box.length - 1];
        const side = r0.x - colL <= colR - (rl.x + rl.w) ? 'left' : 'right';
        const gr = side === 'left' ? r0 : rl;
        // A mark that starts its line gets a straight arrow; any other runs in the gap above its line and hooks down.
        const direct = side === 'left' && gr.x - colL < 20;
        const gapY = gr.y - 11;
        let ny = Math.max(6, (direct ? gr.y + gr.h / 2 : gapY) - 18);
        const list = placed[side];
        if (list.length && ny < list[list.length - 1] + fs * 2.15) ny = list[list.length - 1] + fs * 2.15;
        if (linkClear && ny > topY + 110 && ny < linkClear && list.every((y) => y > topY + 110)) ny = linkClear;
        list.push(ny);
        lowest = Math.max(lowest, ny + fs * 1.5);
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
        } else if (m.kind === 'insert') {
          // Comes in under the line to the caret.
          P1 = [gr.x + 6 + dir * -10, gr.y + gr.h + 10];
          C1 = [side === 'left' ? colL - 4 : colR + 4, gr.y + gr.h + 16];
          C2 = [P1[0] - dir * 30, P1[1] + 8];
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
      if (m.rage) {
        // Exasperated: under it again and again, back and forth, harder each pass.
        const y = m.ny + fs * 1.08, x0 = m.nx - 2, x1 = m.nx + m.nw + 4, r = seeded(53 + m.id);
        // Each pass: the pen lifts, goes back to the left, and draws it again left to right.
        const passes: Pt[][] = [];
        for (let pass = 0; pass < 5; pass++) {
          const line: Pt[] = [];
          for (let k = 0; k <= 10; k++) {
            const f = k / 10;
            line.push([x0 - pass * 2 + f * (x1 - x0 + pass * 4), y + pass * 3.4 + (1.2 + pass * 0.5) * Math.sin(k * 1.3 + pass) + (r() - 0.5) * pass - f * 3]);
          }
          passes.push(line);
        }
        m.slashPts = passes.flat();
        m.slashRun = strokes(passes, 0.09);
        setStrokes(m.slashPaths, 2.2, passes);
      } else if (m.mood === 2) {
        const y = m.ny + fs * 1.08, x0 = m.nx - 2, x1 = m.nx + m.nw + 4;
        m.slashPts = Array.from({ length: 11 }, (_, k) => [x0 + (k / 10) * (x1 - x0), y + 1.6 * Math.sin(k * 1.3) - (k / 10) * 3] as Pt);
        m.slashRun = strokes([m.slashPts]);
        setStrokes(m.slashPaths, 2.2, [m.slashPts]);
      } else setStrokes(m.slashPaths, 2.2, []);
    });
    const textTop = rel((complaint ? els.complaint : els.cause).getBoundingClientRect()).y;
    // Wide: top corner of a margin no note uses; else under the story.
    const free = (side: 'left' | 'right') => placed[side].every((y) => y > textTop + 110);
    stampXY = stacked
      ? [colR - 64, textTop - 2]
      : free('right') ? [colR + 70, textTop - 14]
      : free('left') ? [colL - 170, textTop - 14]
      : [(colL + colR) / 2 - 48, colB + 8];
    if (link) {
      // Under the stamp in a margin; beside it when it lands under the story; on phones, above it.
      const lw = link.offsetWidth || 240, lh = link.offsetHeight || 22, size = stacked ? 66 : 96;
      const inner = els.story.clientWidth;
      // Phones: the card gets a strip above the complaint for it, right over the stamp.
      story.style.setProperty('--above', stacked ? 22 + lh + 10 + 'px' : '22px');
      const xy: Pt = stacked
        ? [colR - lw, col.y - lh - 8]
        : stampXY[1] > colB ? [stampXY[0] + size + 18, stampXY[1] + size / 2 - lh / 2]
        : [stampXY[0] + size / 2 - lw / 2, stampXY[1] + size + 10];
      xy[0] = Math.max(8, Math.min(inner - lw - 8, xy[0]));
      link.style.left = xy[0].toFixed(0) + 'px';
      link.style.top = xy[1].toFixed(0) + 'px';
    }
    if (!stacked) {
      // Room under the story for notes that ran long, and for the stamp when it lands there.
      let below = Math.max(44, lowest - colB + 16);
      if (!free('right') && !free('left')) below = Math.max(below, 130);
      story.style.setProperty('--below', Math.ceil(below) + 'px');
    }
    if (praise) {
      // Under the stamp; on phones (stamp sits on the complaint), under the story.
      praiseFs = stacked ? 24 : 27;
      praiseEl.style.fontSize = praiseFs + 'px';
      praiseEl.textContent = praise;
      praiseEl.style.width = '';
      praiseW = praiseEl.offsetWidth;
      const size = stacked ? 66 : 96, inner = story.clientWidth;
      praiseXY = stacked
        ? [colL, colB + 14]
        : [Math.max(8, Math.min(inner - praiseW - 8, stampXY[0] + size / 2 - praiseW / 2)), stampXY[1] + size + 12];
      praiseEl.style.left = praiseXY[0].toFixed(1) + 'px';
      praiseEl.style.top = praiseXY[1].toFixed(1) + 'px';
      praiseEl.style.width = praiseW.toFixed(1) + 'px';
      const need = praiseXY[1] + praiseFs * 1.5 - colB + 16;
      story.style.setProperty('--below', Math.ceil(Math.max(stacked ? 22 : 44, need)) + 'px');
    }
    exitPt = [colR + (stacked ? 0 : 120), colB + 30];
    if (loop) {
      // The reading path: one sweep over the complaint, two over the cause, one over the correction.
      readPts = [];
      const sweeps: Pt[][] = [];
      fieldEls(els).forEach((f, fi) => {
        if (!f.textContent) return;
        const range = document.createRange();
        range.selectNodeContents(f);
        const rows = new Map<number, Rect[]>();
        [...range.getClientRects()].map((r) => rel(r as DOMRect)).filter((r) => r.w > 1).forEach((r) => {
          const key = Math.round(r.y / 6);
          rows.set(key, [...(rows.get(key) ?? []), r]);
        });
        const all = [...rows.values()].sort((a, b) => a[0].y - b[0].y);
        const n = Math.min(all.length, fi === 1 ? 2 : 1);
        for (let k = 0; k < n; k++) {
          const rs = all[Math.floor((k * all.length) / n)];
          const y = Math.max(...rs.map((r) => r.y + r.h)) - 10;
          sweeps.push([[Math.min(...rs.map((r) => r.x)), y], [Math.max(...rs.map((r) => r.x + r.w)), y]]);
        }
      });
      readPts = sweeps.flat();
      readRun = strokes(sweeps, 0.16);
    }
    const btn = els.root.querySelector('.sc-live-go');
    if (btn) { const b = rel(btn.getBoundingClientRect()); btnPt = [b.x + b.w / 2 + Math.min(70, b.w * 0.12), b.y + b.h / 2 + 2]; }
    ok = marks.every((m) => m.pts.length);
  }

  // ---- drawing at time t
  let lastK = -1;
  type PenPose = { p: Pt; lift: number; mood: Mood; rot?: number };
  const paint = penPainter(els.pen);
  const stampMid = (): Pt => { const r = stacked ? 33 : 48; return [stampXY[0] + r, stampXY[1] + r]; };
  const penAt = (t: number): PenPose | null => {
    if (loop && readPts.length && t < read[1]) {
      if (t < enter[0]) return null;
      const off: Pt = [els.story.offsetWidth + 80, readPts[0][1] - 60];
      if (t < enter[1]) return { p: lerp(off, readPts[0], overshoot(prog(t, enter))), lift: 7, mood: 0 };
      const r = readRun(smooth(prog(t, read)));
      return { p: r.p, lift: 6 + r.lift, mood: 0 };
    }
    for (let i = 0; i < marks.length; i++) {
      const m = marks[i], w = m.w;
      const start = m.pts[0];
      const hoverPt: Pt = [start[0] - 3, start[1] - 9];
      const prevEnd = i ? endPt(marks[i - 1]) : loop && readPts.length ? readPts[readPts.length - 1] : opts.from ?? hoverPt;
      if (t < w.trav[0]) return opts.from && i === 0 ? { p: opts.from, lift: 6, mood: 0 } : null;
      // Travel with a little momentum: lands past the spot and settles back.
      if (t < w.trav[1]) return { p: lerp(prevEnd, hoverPt, overshoot(prog(t, w.trav))), lift: 7, mood: m.mood };
      if (t < w.hover[1]) {
        const q = prog(t, w.hover);
        // Aggravated: two impatient taps on the paper before it goes in.
        if (m.mood === 2) return { p: [hoverPt[0] + 0.8 * Math.sin(t / 19), hoverPt[1] + 6], lift: 9 * (1 - tap(q, 2)), mood: 2 };
        // Otherwise a small "hmm" circle while it reads.
        return { p: [hoverPt[0] + 3 * Math.cos(q * 6.3), hoverPt[1] + 2 * Math.sin(q * 6.3)], lift: 5, mood: m.mood };
      }
      if (t < w.mark[1]) {
        const r = m.run((m.mood === 2 ? attack : smooth)(prog(t, w.mark)));
        return { p: r.p, lift: r.lift, mood: m.mood };
      }
      if (t < w.arrow[0]) return { p: m.pts[m.pts.length - 1], lift: 5, mood: m.mood };
      if (t < w.arrow[1]) {
        const q = prog(t, w.arrow);
        if (stacked) {
          if (q < 0.35) return { p: [m.num[0] + 4, m.num[1] + 14], lift: 0, mood: m.mood };
          return { p: lerp([m.num[0] + 4, m.num[1] + 14], [m.nx, m.ny + m.fs * 0.95], smooth((q - 0.35) / 0.65)), lift: 5, mood: m.mood };
        }
        const s = clamp(q / 0.78), a = 1 - s;
        const b3 = (j: 0 | 1) => a * a * a * m.P0[j] + 3 * a * a * s * m.C1[j] + 3 * a * s * s * m.C2[j] + s * s * s * m.P1[j];
        return { p: [b3(0), b3(1)], lift: 0, mood: m.mood };
      }
      if (t < w.write[0]) return { p: stacked ? [m.nx, m.ny + m.fs * 0.95] : m.P1, lift: 5, mood: m.mood };
      if (t < w.write[1]) {
        const pw = prog(t, w.write), sp = m.mood === 2 ? 30 : 45, amp = m.mood === 2 ? 4 : 3;
        return { p: [m.nx + pw * m.nw, m.ny + m.fs * 0.95 + amp * Math.sin(t / sp)], lift: 0, mood: m.mood };
      }
      if (t < w.slash[1]) {
        const r = m.slashRun((m.rage ? smooth : attack)(prog(t, w.slash)));
        return { p: r.p, lift: r.lift, mood: m.mood };
      }
      if (t < w.shake[1]) {
        // Shakes its head.
        const q = prog(t, w.shake), e = endPt(m);
        return { p: [e[0] + 6, e[1] - 6], lift: 8, mood: 2, rot: 16 * Math.sin(q * Math.PI * 6) * (1 - q) };
      }
    }
    const lastEnd = marks.length ? endPt(marks[marks.length - 1]) : opts.from;
    if (!lastEnd) return null;
    const sm = stampMid();
    // The pen leaves the card before the stamp comes down (and, in the first look, comes back after it lifts).
    const off: Pt = [els.story.offsetWidth + 80, Math.max(0, sm[1] - 120)];
    if (t < toRest[1]) return { p: lerp(lastEnd, off, smooth(prog(t, toRest))), lift: 12, mood: 0 };
    if (praise) {
      const at: Pt = [praiseXY[0], praiseXY[1] + praiseFs * 0.95];
      if (t < pTrav[0]) return null;
      if (t < pTrav[1]) return { p: lerp(off, at, overshoot(prog(t, pTrav))), lift: 9, mood: 0 };
      if (t < pWrite[0]) return { p: at, lift: 5, mood: 0 };
      if (t < pWrite[1]) return { p: [at[0] + prog(t, pWrite) * praiseW, at[1] + 3 * Math.sin(t / 45)], lift: 0, mood: 0 };
      if (t < pExit[1]) return { p: lerp([at[0] + praiseW, at[1]], off, smooth(prog(t, pExit))), lift: 12, mood: 0 };
      return null;
    }
    if (!loop || t < toBtn[0]) return null;
    if (t < toBtn[1]) return { p: lerp(off, btnPt, overshoot(prog(t, toBtn))), lift: 9, mood: 0 };
    if (t < taps[1]) return { p: btnPt, lift: 9 * (1 - tap(prog(t, taps), 2)), mood: 0 };
    if (t < exit[0]) return { p: [btnPt[0] + 2 * Math.sin(t / 260), btnPt[1] - 2 + 2 * Math.cos(t / 330)], lift: 9, mood: 0 };
    if (t < exit[1]) return { p: lerp(btnPt, exitPt, smooth(prog(t, exit))), lift: 12, mood: 0 };
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
        else if (!caretTok && k === tok.start + tok.text.length && k === all.length) caretTok = tok;
      });
      if (caretTok && !still && loop) (caretTok as Tok).el.insertBefore(caret, (caretTok as Tok).rest);
      // The field being typed into looks focused, like a real form.
      const typing = loop && !still && caretTok ? (caretTok as Tok).field : -1;
      fieldEls(els).forEach((f, i) => f.classList.toggle('is-focus', i === typing));
    }
    caret.hidden = still || !loop || t >= typeEnd;
    if (loop && t >= typeEnd) fieldEls(els).forEach((f) => f.classList.remove('is-focus'));
    if (!ok) return;
    marks.forEach((m) => {
      const w = m.w;
      const pm = (m.mood === 2 ? attack : smooth)(prog(t, w.mark));
      drawStrokes(m.markPaths, m.run(pm));
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
      drawStrokes(m.slashPaths, m.slashRun((m.rage ? smooth : attack)(prog(t, w.slash))));
    });
    if (praise) {
      const pw = still ? 1 : prog(t, pWrite);
      praiseEl.style.clipPath = `inset(-12px calc(${((1 - pw) * 100).toFixed(1)}% - ${(12 * pw).toFixed(1)}px) -12px -12px)`;
    }
    paint(still ? null : penAt(t), t);
    // The impression appears the instant the stamp hits.
    const hit = still || t >= stampAt;
    if (link) link.style.visibility = hit ? '' : 'hidden';
    const settle = still ? 0 : 1 - clamp((t - stampAt) / 140);
    els.stamp.style.left = stampXY[0].toFixed(0) + 'px';
    els.stamp.style.top = stampXY[1].toFixed(0) + 'px';
    els.stamp.style.transform = `rotate(-9deg) scale(${(1 + 0.05 * (hit ? settle : 0)).toFixed(3)})`;
    // The rubber stamp: drops in fast, squashes on impact, lifts away.
    const sm = stampMid();
    const size = stacked ? 0.72 : 1;
    let sy = 0, sc = 1, squash = 1, sop = 0;
    if (!still && t >= drop[0] && t < lift[1]) {
      sop = 1;
      if (t < stampAt) { const q = prog(t, drop); sy = -170 * (1 - q * q); sc = 1.25 - 0.25 * q * q; }
      else if (t < lift[0]) squash = 1 - 0.1 * Math.sin(clamp((t - stampAt) / 120) * Math.PI);
      else { const q = smooth(prog(t, lift)); sy = -170 * q; sc = 1 + 0.15 * q; sop = 1 - q; }
    }
    els.stamper.style.opacity = sop.toFixed(2);
    els.stamper.style.transform = `translate(${(sm[0] - 55).toFixed(1)}px, ${(sm[1] + 22 * size - 130 + sy).toFixed(1)}px) rotate(-9deg) scale(${(sc * size).toFixed(3)}, ${(sc * size * squash).toFixed(3)})`;
    // The card jumps a little on impact.
    const shake = still || t < stampAt ? 0 : 1 - clamp((t - stampAt) / 240);
    els.story.style.transform = shake > 0 ? `translate(${(3 * Math.sin(t / 9) * shake).toFixed(1)}px, ${(2 * shake * Math.sin((t - stampAt) / 30)).toFixed(1)}px)` : '';
    const fade = still || !loop ? 1 : 1 - clamp((t - (loopEnd - FADE_MS)) / FADE_MS);
    [els.ink, els.notes, els.complaint, els.cause, els.corr].forEach((x) => ((x as HTMLElement).style.opacity = fade < 1 ? fade.toFixed(2) : ''));
    els.stamp.style.opacity = hit ? (fade < 1 ? fade.toFixed(2) : '1') : '0';
  }

  // ---- loop
  let raf = 0;
  let now = 0;
  let last = 0;
  let still = false;
  let done = false;
  const finish = () => { if (!done) { done = true; opts.onDone?.(); } };
  const ro = new ResizeObserver(() => { measure(); render(now, still); });
  const tick = (ts: number) => {
    // Capped step: a hidden tab (no frames) resumes where it left off.
    now += last ? Math.min(ts - last, 64) : 0;
    last = ts;
    if (loop && now > loopEnd) { now = 0; lastK = -1; }
    if (!loop && now >= doneAt) finish();
    if (!loop && now >= loopEnd) { now = loopEnd; render(now); return; }
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
      if (reduced) { now = loopEnd; render(now, true); finish(); return; }
      now = 0;
      last = 0;
      render(0);
      raf = requestAnimationFrame(tick);
    },
    stop() {
      cancelAnimationFrame(raf);
      ro.disconnect();
    },
    get length() { return loopEnd; },
  };
}
