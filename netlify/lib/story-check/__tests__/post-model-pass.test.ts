// The ported app pass on the 8 samples' recorded model output (website-only checks).
import { describe, expect, test } from './jest-shim';
import raw from '../../../../scripts/story-check-samples.raw.json' with { type: 'json' };
import { SAMPLES } from '../../../../src/scripts/story-check/shared';
import { postModelPass, toResult } from '../grade';

const run = (id: string) => {
  const s = SAMPLES.find((x) => x.id === id)!;
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
  test('GPA is computed before the missing-to-C upgrades, like the app', () => {
    const g = postModelPass('', 'Verified noise present.', 'Replaced left front brake pad.', {
      elements: { complaintVerification: { grade: 'missing' }, diagnosticApproach: { grade: 'C' }, componentIdentification: { grade: 'missing' }, failureMode: { grade: 'C' }, repairAction: { grade: 'C' }, finalVerification: { grade: 'C' } },
      suggestions: [],
    });
    expect(g.grades.complaintVerification).toBe('C');
    expect(g.grades.componentIdentification).toBe('C');
    expect(g.gpa).toBe(1.33);
  });
  test('cleared codes: no clear-codes note', () => {
    const r = toResult('Found P0420. Cat efficiency below threshold.', 'Replaced catalytic converter. Cleared P0420. Road tested 8 miles.', { elements: {}, suggestions: [] });
    expect(r.notes.some((n) => n.pen === 'Codes cleared?')).toBe(false);
    expect(r.notes.some((n) => /mile/i.test(n.pen))).toBe(false);
  });
});
