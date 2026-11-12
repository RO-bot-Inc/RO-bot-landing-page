// Grades a story with the app's own warranty rubric, then turns the grader's
// output into short red-pen notes anchored to the visitor's words.
import {
  ELEMENTS,
  LABELS,
  type ElementKey,
  type Grade,
  type Note,
  type Result,
  gpaFor,
  letterFor,
} from '../../../src/scripts/story-check/shared';
import { type Config, ScError } from './config';
import { warrantyPrompt } from './rubric';

interface GraderOutput {
  elements?: Record<string, { grade?: string; excerpt?: string | null }>;
  suggestions?: Array<{ element?: string; text?: string }>;
}

export async function gradeLive(cfg: Config, cause: string, correction: string): Promise<Result> {
  const messages = [
    { role: 'system', content: warrantyPrompt.systemPrompt },
    ...warrantyPrompt.fewShotExamples,
    {
      role: 'user',
      content: `Grade this warranty documentation:\n\nCOMPLAINT: (not provided)\n\nCAUSE: ${cause || '(empty)'}\n\nCORRECTION: ${correction || '(empty)'}`,
    },
  ];
  let res: Response;
  try {
    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${cfg.openaiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: cfg.model, messages, response_format: { type: 'json_object' }, max_tokens: 1200 }),
      signal: AbortSignal.timeout(cfg.timeoutMs),
    });
  } catch (err) {
    console.warn('[story-check] openai fetch failed', (err as Error).name);
    throw new ScError('upstream', 502);
  }
  if (!res.ok) {
    console.warn('[story-check] openai status', res.status);
    throw new ScError('upstream', 502);
  }
  const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  let out: GraderOutput;
  try {
    out = JSON.parse(body.choices?.[0]?.message?.content || '{}');
  } catch {
    throw new ScError('upstream', 502);
  }
  return toResult(cause, correction, out);
}

function normGrade(g: unknown): Grade {
  const s = String(g ?? '').trim();
  if (/^[ABCDF]$/i.test(s)) return s.toUpperCase() as Grade;
  if (/^not_applicable$/i.test(s)) return 'not_applicable';
  return 'missing';
}

const DTC = /\b[PBCU]\d{4,6}[A-Z0-9]{0,2}\b/;
const CLEARED = /clear|eras|reset (the )?codes|codes resolved/i;
const ROAD_TEST = /(road ?test(ed)?|test ?dr(ove|ive|iven))[^.]*/i;
const STANDALONE = /(see|refer to|per) (the )?(attached|printout|paperwork|document|report|results)[^.,;]*/i;

// Locate the grader's quote in the visitor's text. Exact first, then case-insensitive.
function locate(cause: string, correction: string, excerpt: string | null | undefined) {
  const q = (excerpt || '').trim().replace(/[.\s]+$/, '');
  if (q.length < 2) return null;
  for (const field of ['cause', 'correction'] as const) {
    const text = field === 'cause' ? cause : correction;
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i >= 0) return { field, match: text.slice(i, i + q.length) };
  }
  return null;
}

function findIn(cause: string, correction: string, re: RegExp) {
  const c = re.exec(cause);
  if (c) return { field: 'cause' as const, match: c[0].trim() };
  const k = re.exec(correction);
  if (k) return { field: 'correction' as const, match: k[0].trim() };
  return null;
}

// No em or en dashes in anything we show (brand rule); grader text sometimes has " - ".
function cleanFix(text: string): string {
  const t = text
    .replace(/^for a higher grade,?\s*/i, '')
    .replace(/\s+[-–—]\s+/g, ', ')
    .replace(/[–—]/g, '-')
    .replace(/\be\.g\.,?/gi, 'for example,')
    .trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function penFor(el: ElementKey, grade: Grade, text: string, match: string | null): string {
  switch (el) {
    case 'complaintVerification':
      return grade === 'missing' ? 'Did you verify it?' : 'Verified how?';
    case 'diagnosticApproach':
      return grade === 'missing' ? 'What did you test?' : /attach|printout|see /i.test(text) ? 'Put the results here' : 'Tested how? Readings?';
    case 'componentIdentification':
      return 'Which one? Where?';
    case 'failureMode': {
      const w = match && /^(bad|faulty|failed|broken|worn|leaking|damaged|inop)\.?$/i.exec(match.trim());
      return w ? `${w[1].charAt(0).toUpperCase()}${w[1].slice(1).toLowerCase()} how? Spec?` : 'Failed how? Spec?';
    }
    case 'repairAction':
      return grade === 'missing' ? 'What did you do?' : 'Which procedure? Spec?';
    case 'finalVerification':
      if (grade === 'missing') return 'Did you test it after?';
      return /mile/i.test(text) ? 'How many miles?' : 'How? Road test? Miles?';
  }
}

const RANK: Record<Grade, number> = { F: 0, missing: 0, D: 1, C: 2, B: 3, A: 4, not_applicable: 4 };

export function toResult(cause: string, correction: string, out: GraderOutput): Result {
  const grades = {} as Record<ElementKey, Grade>;
  for (const k of ELEMENTS) grades[k] = normGrade(out.elements?.[k]?.grade);
  const all = `${cause} ${correction}`;

  const ranked: Array<{ rank: number; note: Omit<Note, 'n'> }> = [];
  const add = (rank: number, note: Omit<Note, 'n'>) => ranked.push({ rank, note });
  const has = (criterion: string) => ranked.some((r) => r.note.criterion === criterion);

  for (const s of out.suggestions || []) {
    const text = String(s.text || '').trim();
    if (!text) continue;
    const el = s.element as ElementKey;
    if ((ELEMENTS as readonly string[]).includes(el)) {
      const g = grades[el];
      if (g === 'A' || g === 'not_applicable') continue;
      const at = locate(cause, correction, out.elements?.[el]?.excerpt);
      const field = at?.field || (el === 'repairAction' || el === 'finalVerification' ? 'correction' : 'cause');
      add(RANK[g], {
        field,
        match: at?.match || null,
        pen: penFor(el, g, text, at?.match || null),
        criterion: `${LABELS[el]} · ${g}`,
        fixLabel: 'Grader suggests:',
        fix: cleanFix(text),
      });
      continue;
    }
    // "general" flags: the rubric's additional checks.
    if (/clear/i.test(text) && DTC.test(cause)) {
      if (has('Codes found, never cleared')) continue;
      const at = findIn(cause, '', DTC);
      add(1.5, { field: 'cause', match: at?.match || null, pen: 'Codes cleared?', criterion: 'Codes found, never cleared', fixLabel: 'Add to the correction:', fix: '“Cleared DTCs and performed scan to confirm codes resolved.”' });
    } else if (/dtc|code/i.test(text)) {
      add(2.5, { field: 'cause', match: null, pen: 'Any codes?', criterion: 'No codes stated', fixLabel: 'Add to the cause:', fix: 'the DTCs found, or “no DTCs present” if there were none.' });
    } else if (/mile/i.test(text)) {
      // Known grader false positive: it asks for miles when no road test happened.
      const at = findIn(cause, correction, ROAD_TEST);
      if (!at || /\d+\s*(mi\b|miles?)/i.test(all)) continue;
      add(2.5, { ...at, pen: 'How many miles?', criterion: 'Road test without miles', fixLabel: 'Add:', fix: 'the miles driven, or mileage in and out.' });
    } else if (/attach|printout|paperwork|stand ?alone|refer/i.test(text)) {
      const at = findIn(cause, correction, STANDALONE);
      add(2.5, { field: at?.field || 'cause', match: at?.match || null, pen: 'Summarize it here', criterion: 'Story must stand alone', fixLabel: 'Grader suggests:', fix: cleanFix(text) });
    } else if (/before|after|reading|measure/i.test(text)) {
      add(2.5, { field: 'correction', match: null, pen: 'Reading after the fix?', criterion: 'No after-repair reading', fixLabel: 'Grader suggests:', fix: cleanFix(text) });
    } else if (/sub-?component|internal|assembly/i.test(text)) {
      add(2.5, { field: 'cause', match: null, pen: 'Which internal part?', criterion: 'Assembly named, not the part', fixLabel: 'Grader suggests:', fix: cleanFix(text) });
    } else {
      add(2.5, { field: 'cause', match: null, pen: 'Worth adding', criterion: 'Auditor flag', fixLabel: 'Grader suggests:', fix: cleanFix(text) });
    }
  }

  // The grader sometimes misses uncleared codes (sample "Harsh shifting", 2026-11-11). Deterministic backstop.
  if (DTC.test(cause) && !CLEARED.test(correction) && !has('Codes found, never cleared')) {
    const at = findIn(cause, '', DTC);
    add(1.5, { field: 'cause', match: at?.match || null, pen: 'Codes cleared?', criterion: 'Codes found, never cleared', fixLabel: 'Add to the correction:', fix: '“Cleared DTCs and performed scan to confirm codes resolved.”' });
  }

  const notes = ranked
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 8)
    .map((r, i) => ({ ...r.note, n: i + 1 }));
  const gpa = gpaFor(grades);
  return { cause, correction, grades, gpa, letter: letterFor(gpa), notes, sampleId: null };
}

// Mock mode (no OpenAI key, e.g. local dev): a rough keyword stand-in so the
// flow can be exercised. Never used when a key is set.
export function gradeMock(cause: string, correction: string): Result {
  const all = `${cause} ${correction}`;
  const els: GraderOutput['elements'] = {};
  const sug: NonNullable<GraderOutput['suggestions']> = [];
  for (const k of ELEMENTS) els[k] = { grade: 'B', excerpt: null };
  let m: RegExpExecArray | null;
  if ((m = /verified (the )?(customer('s)? )?(concern|complaint)/i.exec(cause))) {
    els.complaintVerification = { grade: 'C', excerpt: m[0] };
    sug.push({ element: 'complaintVerification', text: 'Add how you reproduced the concern and under what conditions.' });
  }
  if ((m = /\b(bad|faulty|failed|broken|damaged|inop|worn|leaking)\b/i.exec(cause))) {
    els.failureMode = { grade: 'C', excerpt: m[0] };
    sug.push({ element: 'failureMode', text: 'Add what you measured or saw, against spec.' });
  }
  if ((m = /(verified|confirmed) (proper|normal) operation|operating as designed|repair complete/i.exec(correction))) {
    els.finalVerification = { grade: 'C', excerpt: m[0] };
    sug.push({ element: 'finalVerification', text: 'Describe the test you ran after the repair and that the original concern is gone.' });
  }
  if (!DTC.test(cause) && !/no (dtc|code|fault)s?/i.test(cause)) sug.push({ element: 'general', text: "Consider adding DTCs to Cause, or stating 'no DTCs present'." });
  if (ROAD_TEST.test(all)) sug.push({ element: 'general', text: 'Test drive mentioned, consider adding number of miles driven.' });
  if (STANDALONE.test(all)) sug.push({ element: 'general', text: 'Summarize the key findings in the story instead of referring to the attachment.' });
  if (all.length < 120) {
    els.diagnosticApproach = { grade: 'C', excerpt: null };
    els.repairAction = { grade: 'C', excerpt: null };
  }
  if (sug.length === 0 && all.length > 260) for (const k of ELEMENTS) els[k] = { grade: 'A', excerpt: null };
  return toResult(cause, correction, { elements: els, suggestions: sug });
}
