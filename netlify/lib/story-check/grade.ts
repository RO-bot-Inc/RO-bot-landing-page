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
import {
  DTC_PATTERN,
  NO_DTC_PATTERN,
  TEST_DRIVE_PATTERN,
  claimsExistingTestDrive,
  correctionClearsDtcs,
  hasMilesDriven,
  hasTestDrive as storyHasTestDrive,
  isClearDtcSuggestion,
  isMileageSuggestion,
} from './warranty-suggestion-rules';

export interface GraderOutput {
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

// ---------------------------------------------------------------------------
// The app's post-model pass, ported from app/server/services/story-processor.ts
// analyzeCompletenessWithAI (grade normalization, then "WARRANTY-SPECIFIC
// server-side safety nets" through the C/D/F backstop), app commit 21fa69109.
// Same order, same patterns, same suggestion texts. The text rules themselves
// are the app's file, copied verbatim (./warranty-suggestion-rules.ts); the app
// is the source of truth. Re-port this block if the app's pass changes.
// ---------------------------------------------------------------------------

export interface Suggestion {
  element: string;
  text: string;
}

export interface Graded {
  grades: Record<ElementKey, Grade>;
  gpa: number; // computed BEFORE the safety nets, exactly like the app
  suggestions: Suggestion[];
}

function normGrade(g: unknown, key: ElementKey): Grade {
  const grade = String(g).toLowerCase();
  if (grade === 'not_applicable' && warrantyPrompt.naEligibleKeys.includes(key)) return 'not_applicable';
  const upper = grade.toUpperCase();
  if (['A', 'B', 'C', 'D', 'F'].includes(upper)) return upper as Grade;
  return 'missing';
}

export function postModelPass(complaint: string, cause: string, correction: string, out: GraderOutput): Graded {
  const grades = {} as Record<ElementKey, Grade>;
  for (const k of ELEMENTS) grades[k] = normGrade(out.elements?.[k]?.grade, k);
  // The app computes the GPA here, before the safety nets below can upgrade a grade.
  const gpa = gpaFor(grades);

  const validElements: string[] = [...ELEMENTS, 'general'];
  let suggestions: Suggestion[] = ((out.suggestions || []) as unknown[])
    .map((s) => {
      if (s && typeof s === 'object' && (s as Suggestion).text) {
        const el = (s as Suggestion).element;
        return { element: validElements.includes(el) ? el : 'general', text: String((s as Suggestion).text) };
      }
      if (typeof s === 'string') return { element: 'general', text: s };
      return null;
    })
    .filter((s): s is Suggestion => s !== null);

  // Remove suggestions for NA elements
  suggestions = suggestions.filter((s) => s.element === 'general' || grades[s.element as ElementKey] !== 'not_applicable');

  // SERVER-SIDE DTC DETECTION
  const causeHasDtc = DTC_PATTERN.test(cause);
  const causeHasNoDtcStatement = NO_DTC_PATTERN.test(cause);
  const correctionHasClearing = correctionClearsDtcs(correction);

  suggestions = suggestions.filter((s) => {
    const textLower = s.text.toLowerCase();
    if ((textLower.includes('adding dtc') || textLower.includes('add dtc') ||
         (textLower.includes('dtc') && textLower.includes('no dtcs present'))) &&
        (causeHasDtc || causeHasNoDtcStatement)) {
      return false;
    }
    if (isClearDtcSuggestion(s.text) && correctionHasClearing) return false;
    return true;
  });

  if (!causeHasDtc && !causeHasNoDtcStatement) {
    const hasDtcSuggestion = suggestions.some((s) => s.text.toLowerCase().includes('dtc') && s.text.toLowerCase().includes('adding'));
    if (!hasDtcSuggestion) {
      suggestions.push({ element: 'general', text: "Consider adding DTCs to Cause, or stating 'no DTCs present' if none were found." });
    }
  } else if (causeHasDtc && !correctionHasClearing) {
    const hasClearSuggestion = suggestions.some((s) => isClearDtcSuggestion(s.text));
    if (!hasClearSuggestion) {
      suggestions.push({ element: 'general', text: "Since DTCs were found, consider adding to Correction: 'Cleared DTCs and performed scan to confirm codes resolved.'" });
    }
  }

  // SERVER-SIDE TEST DRIVE MILEAGE DETECTION
  const hasTestDrive = storyHasTestDrive(`${cause} ${correction}`);
  const hasMileage = hasMilesDriven(`${complaint} ${cause} ${correction}`);
  if (hasTestDrive && hasMileage) suggestions = suggestions.filter((s) => !isMileageSuggestion(s.text));
  if (!hasTestDrive) suggestions = suggestions.filter((s) => !claimsExistingTestDrive(s.text));
  if (hasTestDrive && !hasMileage) {
    const hasMileageSuggestion = suggestions.some((s) => s.text.toLowerCase().includes('mile'));
    if (!hasMileageSuggestion) {
      suggestions.push({ element: 'general', text: 'Test drive mentioned - consider adding number of miles driven.' });
    }
  }

  // SERVER-SIDE BEFORE/AFTER READINGS DETECTION
  const measurementPattern = /\d{1,10} ?(mm|volt|ohm|psi|degree|amp|spec|threshold|minim)/i;
  const causeHasMeasurement = measurementPattern.test(cause);
  const correctionHasMeasurement = measurementPattern.test(correction);
  const correctionHasRepair = correction.trim().length > 0 &&
    grades.repairAction !== 'missing' && grades.repairAction !== 'not_applicable';
  const isReadingSuggestion = (s: Suggestion) =>
    s.text.toLowerCase().includes('after-repair') || s.text.toLowerCase().includes('post-repair');
  if (causeHasMeasurement && correctionHasMeasurement) suggestions = suggestions.filter((s) => !isReadingSuggestion(s));
  if (causeHasMeasurement && correctionHasRepair && !correctionHasMeasurement) {
    if (!suggestions.some(isReadingSuggestion)) {
      suggestions.push({ element: 'general', text: 'Pre-repair measurements found in Cause — consider adding after-repair readings to Correction to document the resolved condition.' });
    }
  }

  // SERVER-SIDE COMPONENT DETECTION (missing -> C)
  const componentPattern = /\b(spark\s*plug|ignition\s*coil|coil\s*pack|fuel\s*injector|o2\s*sensor|oxygen\s*sensor|catalytic\s*converter|mass\s*air\s*flow|maf\s*sensor|throttle\s*body|egr\s*valve|pcv\s*valve|timing\s*belt|timing\s*chain|water\s*pump|fuel\s*pump|alternator|starter|battery|brake\s*pad|brake\s*rotor|caliper|wheel\s*bearing|ball\s*joint|tie\s*rod|control\s*arm|strut|shock|cv\s*axle|drive\s*shaft|transmission|clutch|flywheel|radiator|thermostat|heater\s*core|a\/?c\s*compressor|blower\s*motor|window\s*motor|door\s*lock|sensor|module|pump|valve|relay|motor|switch|connector|plug|belt|hose|filter|gasket|seal)\b/i;
  if (grades.componentIdentification === 'missing' && componentPattern.test(`${cause} ${correction}`)) {
    grades.componentIdentification = 'C';
  }

  // SERVER-SIDE ASSEMBLY-LEVEL FAILURE DETECTION (Check 5)
  const assemblyPattern = /\b(engine|transmission|transfer\s*case|differential|cvt)\b/i;
  const subComponentPattern = /\b(cylinder\s*head|head\s*gasket|piston|crankshaft|camshaft|connecting\s*rod|rod\s*bearing|main\s*bearing|oil\s*pump|timing\s*chain|timing\s*belt|valve|valvetrain|block|intake\s*manifold|exhaust\s*manifold|torque\s*converter|valve\s*body|solenoid|clutch\s*pack|planetary\s*gear|servo|accumulator|governor|band|drum|sun\s*gear|ring\s*gear|pinion|axle\s*shaft|side\s*gear|carrier\s*bearing|seal|gasket)\b/i;
  const assemblyFailurePattern = /\b(fail|replac|defect|damag|worn|crack|leak|blow|seiz|broke)/i;
  const causeHasAssembly = assemblyPattern.test(cause) && assemblyFailurePattern.test(cause);
  const causeHasSubComponent = subComponentPattern.test(cause);
  const isAssemblySuggestion = (s: Suggestion) =>
    s.text.toLowerCase().includes('sub-component') || s.text.toLowerCase().includes('sub component');
  if (causeHasAssembly && !causeHasSubComponent) {
    if (!suggestions.some(isAssemblySuggestion)) {
      suggestions.push({ element: 'general', text: 'Assembly-level failure documented — consider identifying the specific sub-component that caused the failure (e.g., cylinder head, torque converter, valve body).' });
    }
  } else if (causeHasAssembly && causeHasSubComponent) {
    suggestions = suggestions.filter((s) => !isAssemblySuggestion(s));
  }

  // SERVER-SIDE STANDALONE DOCUMENTATION DETECTION (Check 6)
  const isStandaloneSuggestion = (s: Suggestion) =>
    s.text.toLowerCase().includes('stand alone') || s.text.toLowerCase().includes('standalone');
  if (DEFER_PATTERN.test(`${cause} ${correction}`)) {
    if (!suggestions.some(isStandaloneSuggestion)) {
      suggestions.push({ element: 'general', text: 'Documentation should stand alone — summarize the key findings or results inline rather than only referencing an attachment.' });
    }
  } else {
    suggestions = suggestions.filter((s) => !isStandaloneSuggestion(s));
  }

  // SERVER-SIDE COMPLAINT VERIFICATION DETECTION (missing -> C)
  const verificationPattern = /\b(observed|confirmed|verified|reproduced|noted|found|witnessed|present|illuminated|evident|detected)\b/i;
  if (grades.complaintVerification === 'missing' && verificationPattern.test(cause)) {
    grades.complaintVerification = 'C';
  }

  // Ensure C/D/F-grade elements have suggestions
  for (const key of ELEMENTS) {
    if (['C', 'D', 'F'].includes(grades[key]) && !suggestions.some((s) => s.element === key)) {
      suggestions.push({ element: key, text: 'For a higher grade, add more specific detail to this element.' });
    }
  }

  return { grades, gpa, suggestions };
}

// ---------------------------------------------------------------------------
// Website only: turn the app's suggestions into red-pen notes. Presentation,
// not grading: it never adds or drops a suggestion.
// ---------------------------------------------------------------------------

const DEFER_PATTERN = /\b(see\s+(printout|attached|attachment|paperwork|document|report|results|scan|reading)|refer\s+to\s+(attached|printout|paperwork|document|report)|per\s+attached\s+(results|printout|document|report))\b/i;

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

// A phrase to underline: from the first hit to the end of its clause.
function findIn(cause: string, correction: string, re: RegExp) {
  const wide = new RegExp(`(?:${re.source})[^.,;]*`, re.flags.replace('g', ''));
  const c = wide.exec(cause);
  if (c) return { field: 'cause' as const, match: c[0].trim() };
  const k = wide.exec(correction);
  if (k) return { field: 'correction' as const, match: k[0].trim() };
  return null;
}

// No em or en dashes in anything we show (brand rule); grader text sometimes has them.
function cleanFix(text: string): string {
  const t = text
    .replace(/^for a higher grade,?\s*/i, '')
    .replace(/\s+[-–—]\s+/g, ', ')
    .replace(/[–—]/g, '-')
    .replace(/\be\.g\.,?/gi, 'for example,')
    .trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function penFor(el: ElementKey, grade: Grade, text: string, match: string | null, story: string): string {
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
      // Ask for miles only where the story has a road test; a suggestion that
      // proposes one gets the proposal; anything else asks how it was checked.
      if (storyHasTestDrive(story) && /mile/i.test(text)) return 'How many miles?';
      if (/road[\s-]?test|test[\s-]?dr/i.test(text)) return 'Road test it? Miles?';
      return 'How did you check it?';
  }
}

const RANK: Record<Grade, number> = { F: 0, missing: 0, D: 1, C: 2, B: 3, A: 3.5, not_applicable: 4 };

export function toResult(cause: string, correction: string, out: GraderOutput, complaint = ''): Result {
  const { grades, gpa, suggestions } = postModelPass(complaint, cause, correction, out);
  const ranked: Array<{ rank: number; note: Omit<Note, 'n'> }> = [];
  const add = (rank: number, note: Omit<Note, 'n'>) => ranked.push({ rank, note });

  for (const s of suggestions) {
    const text = s.text.trim();
    if (!text) continue;
    if (s.element !== 'general') {
      const el = s.element as ElementKey;
      const g = grades[el];
      const at = locate(cause, correction, out.elements?.[el]?.excerpt);
      add(RANK[g], {
        field: at?.field || (el === 'repairAction' || el === 'finalVerification' ? 'correction' : 'cause'),
        match: at?.match || null,
        pen: penFor(el, g, text, at?.match || null, `${cause} ${correction}`),
        criterion: `${LABELS[el]} · ${g}`,
        fixLabel: 'Grader suggests:',
        fix: cleanFix(text),
      });
      continue;
    }
    // "general" suggestions: the rubric's additional checks.
    if (isClearDtcSuggestion(text)) {
      const code = DTC_PATTERN.exec(cause);
      add(1.5, { field: 'cause', match: code ? code[0] : null, pen: 'Codes cleared?', criterion: 'Codes found, never cleared', fixLabel: 'Add to the correction:', fix: '“Cleared DTCs and performed scan to confirm codes resolved.”' });
    } else if (/\bdtc/i.test(text)) {
      add(2.5, { field: 'cause', match: null, pen: 'Any codes?', criterion: 'No codes stated', fixLabel: 'Add to the cause:', fix: 'the DTCs found, or “no DTCs present” if there were none.' });
    } else if (isMileageSuggestion(text)) {
      const at = findIn(cause, correction, TEST_DRIVE_PATTERN);
      add(2.5, at
        ? { ...at, pen: 'How many miles?', criterion: 'Road test without miles', fixLabel: 'Add:', fix: 'the miles driven, or mileage in and out.' }
        : { field: 'correction', match: null, pen: 'Road test it?', criterion: 'No road test', fixLabel: 'Grader suggests:', fix: cleanFix(text) });
    } else if (/stand ?alone/i.test(text)) {
      const at = findIn(cause, correction, DEFER_PATTERN);
      add(2.5, { field: at?.field || 'cause', match: at?.match || null, pen: 'Summarize it here', criterion: 'Story must stand alone', fixLabel: 'Grader suggests:', fix: cleanFix(text) });
    } else if (/after-repair|post-repair/i.test(text)) {
      add(2.5, { field: 'correction', match: null, pen: 'Reading after the fix?', criterion: 'No after-repair reading', fixLabel: 'Grader suggests:', fix: cleanFix(text) });
    } else if (/sub-?\s?component/i.test(text)) {
      add(2.5, { field: 'cause', match: null, pen: 'Which internal part?', criterion: 'Assembly named, not the part', fixLabel: 'Grader suggests:', fix: cleanFix(text) });
    } else {
      add(2.5, { field: 'cause', match: null, pen: 'Worth adding', criterion: 'Auditor flag', fixLabel: 'Grader suggests:', fix: cleanFix(text) });
    }
  }

  const notes = ranked
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 8)
    .map((r, i) => ({ ...r.note, n: i + 1 }));
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
  if (all.length < 120) {
    els.diagnosticApproach = { grade: 'C', excerpt: null };
    els.repairAction = { grade: 'C', excerpt: null };
  }
  if (sug.length === 0 && all.length > 260) for (const k of ELEMENTS) els[k] = { grade: 'A', excerpt: null };
  return toResult(cause, correction, { elements: els, suggestions: sug });
}
