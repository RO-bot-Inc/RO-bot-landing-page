// The ported app pass on the 8 samples' recorded model output (website-only checks).
import { describe, expect, test } from './jest-shim';
import raw from '../../../../scripts/story-check-samples.raw.json' with { type: 'json' };
import { SAMPLES } from '../../../../src/scripts/story-check/shared';
import { postModelPass, toResult } from '../grade';

// Samples rewritten later keep the text their recorded model output was graded on.
const LEGACY: Record<string, { cause: string; correction: string }> = {
  trans: {
    cause: 'Verified customer concern of harsh shift. Connected scan tool and retrieved code P0756 shift solenoid B performance. Checked transmission fluid level and condition, fluid level was correct and fluid condition was normal for mileage. Performed pinpoint tests per service information, see attached printout for test results. Based on testing determined that the shift solenoid B is faulty and is causing the harsh shift condition that the customer is experiencing.',
    correction: 'Removed valve body and replaced shift solenoid B. Reinstalled valve body and refilled fluid to proper level. Performed transmission adaptive relearn. Road tested vehicle, shifts are now normal. Verified proper operation.',
  },
};
const run = (id: string) => {
  const s = LEGACY[id] ?? SAMPLES.find((x) => x.id === id)!;
  return toResult(s.cause, s.correction, (raw as unknown as Record<string, never>)[id]);
};
const pens = (id: string) => run(id).notes.map((n) => n.pen);

describe('post-model pass on the samples', () => {
  test('coolant leak: no mileage note (no test drive in the story)', () => {
    expect(pens('waterpump').some((p) => /mile/i.test(p))).toBe(false);
    expect(run('waterpump').notes.some((n) => /mile/i.test(n.fix))).toBe(false);
  });
  test('harsh shift: clear-codes, road-test miles, stand-alone', () => {
    const p = pens('trans');
    expect(p.includes('Codes cleared?')).toBe(true);
    expect(p.includes('How many miles?')).toBe(true);
    expect(p.includes('Summarize it here')).toBe(true);
  });
  test('stand-alone note underlines the attachment reference', () => {
    const n = run('trans').notes.find((x) => x.pen === 'Summarize it here')!;
    expect(n.match).toBe('see attached printout for test results');
  });
  test('A stories stay clean', () => {
    expect(run('bearing').notes.length).toBe(0);
    expect(run('ac').notes.length).toBe(0);
  });
  // App regression case (server/services/__tests__/story-grading.test.ts, PR #2768).
  test('GPA and letter are computed AFTER the missing → C upgrades', () => {
    const r = toResult('Verified coolant on ground. Water pump leaking.', 'Replaced water pump. No leaks.', {
      elements: { complaintVerification: { grade: 'missing' }, diagnosticApproach: { grade: 'D' }, componentIdentification: { grade: 'missing' }, failureMode: { grade: 'D' }, repairAction: { grade: 'B' }, finalVerification: { grade: 'C' } },
      suggestions: [],
    }, 'Customer states coolant leaking under vehicle.');
    expect(r.grades.complaintVerification).toBe('C');
    expect(r.grades.componentIdentification).toBe('C');
    // C D C D B C = 2+1+2+1+3+2 = 11 / 6 = 1.83 → C (was 7 / 6 = 1.17 → D)
    expect(r.gpa).toBe(1.83);
    expect(r.letter).toBe('C');
  });
  test('cleared codes: no clear-codes note', () => {
    const r = toResult('Found P0420. Cat efficiency below threshold.', 'Replaced catalytic converter. Cleared P0420. Road tested 8 miles.', { elements: {}, suggestions: [] });
    expect(r.notes.some((n) => n.pen === 'Codes cleared?')).toBe(false);
    expect(r.notes.some((n) => /mile/i.test(n.pen))).toBe(false);
  });
});
