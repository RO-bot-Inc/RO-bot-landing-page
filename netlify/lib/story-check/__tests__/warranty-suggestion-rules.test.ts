// The app's table, copied from app/server/services/__tests__/warranty-suggestion-rules.test.ts
// (app commit 21fa69109). Runs on node:test through a tiny jest-style shim so the
// table stays word for word. Run: npm test
import { describe, expect, test } from './jest-shim';
import {
  hasTestDrive,
  hasMilesDriven,
  correctionClearsDtcs,
  isMileageSuggestion,
  isClearDtcSuggestion,
  claimsExistingTestDrive,
} from '../warranty-suggestion-rules';

describe('warranty suggestion rules', () => {
  test.each([
    'Road tested vehicle, no clunk.',
    'Road test confirmed noise.',
    'Performed road-test.',
    'Road testing showed no slip.',
    'Test drove, tracks straight.',
    'Test driven, cruise engages.',
    'Test drive at 60 mph, no vibration.',
    'Verified pulsation during roadtest.',
  ])('test drive recognised: %s', (t) => expect(hasTestDrive(t)).toBe(true));

  test.each([
    'Found coolant leak. Water pump leaking. Replaced water pump and refilled coolant. No leaks.',
    'Replaced regulator.',
    'Ran engine to operating temperature, no leaks.',
    'Pinpoint tests per service information.',
    'Drive belt tested good.',
  ])('no test drive: %s', (t) => expect(hasTestDrive(t)).toBe(false));

  test.each([
    'Road tested 6 miles.',
    'Test drove 5 mi., no noise.',
    'Road tested 6 mi, no pulsation.',
    'Verified on 6 mile road test.',
    'Road tested 10 km.',
    'Mileage in 41,212, mileage out 41,218.',
    'mileage went from 52110 to 52118',
    'Road test, mileage: 41212-41218.',
    'Mileage 41,212 / 41,218.',
  ])('miles driven recognised: %s', (t) => expect(hasMilesDriven(t)).toBe(true));

  test.each([
    'Fluid condition was normal for mileage.',
    'Test drive at 60 mph.',
    'Ran engine 5 min.',
    'Waited 45 minutes.',
    'High mileage vehicle.',
  ])('not miles driven: %s', (t) => expect(hasMilesDriven(t)).toBe(false));

  test.each([
    'Cleared DTCs.',
    'Cleared codes and performed adaptive relearn.',
    'Codes cleared, rescanned with no codes returning.',
    'Erased DTC P0302.',
    'Cleared fault codes.',
    'DTC U0155 cleared and did not reset.',
    'Cleared B1553F1. Airbag light off.',
    'Reset codes.',
    'All DTCs erased.',
  ])('clearing recognised: %s', (t) => expect(correctionClearsDtcs(t)).toBe(true));

  test.each([
    'Replaced catalytic converter. Verified proper operation.',
    'Replaced shift solenoid B. Performed transmission adaptive relearn. Road tested, shifts normal.',
    'Replaced purge valve. Smoke test passed.',
  ])('no clearing: %s', (t) => expect(correctionClearsDtcs(t)).toBe(false));

  // Phrasings the model produced on stories with NO test drive (2026-11-12 runs).
  test.each([
    'Test drive mentioned - consider adding number of miles driven if applicable.',
    'Test drive mentioned but lacks mileage — consider adding a specific number of miles driven.',
    'Consider adding specific details from the road test regarding how the shifts were normal (mileage, conditions).',
    'Detail the road test conditions, such as mileage driven or specific scenarios to verify operation.',
    'Since a road test was performed, add the miles driven.',
    'Road test was documented; add mileage.',
  ])('claims a test drive already happened: %s', (t) => expect(claimsExistingTestDrive(t)).toBe(true));

  test.each([
    "Describe the specific verification - 'Test drove 5 miles, no MIL, engine running smooth.'",
    "Add details about the verification process, such as 'test drove for 10 miles with no coolant loss'.",
    'Consider a road test to confirm the shift concern is resolved.',
    'Add a test drive with miles driven to verify the repair.',
    'Verify the repair with a road test of at least 5 miles.',
  ])('proposes a test drive (kept): %s', (t) => expect(claimsExistingTestDrive(t)).toBe(false));

  test('suggestion classifiers', () => {
    expect(isMileageSuggestion('Test drive mentioned - consider adding number of miles driven.')).toBe(true);
    expect(isMileageSuggestion("Describe the verification - 'Test drove 5 miles, no MIL.'")).toBe(true);
    expect(isMileageSuggestion('Consider adding test drive mileage for the fob operation.')).toBe(true);
    expect(isMileageSuggestion('Add specific failure details.')).toBe(false);
    expect(isClearDtcSuggestion("Since DTCs were found, consider adding to Correction: 'Cleared DTCs and performed scan to confirm codes resolved.'")).toBe(true);
    expect(isClearDtcSuggestion('Note that the codes were cleared after repair.')).toBe(true);
    expect(isClearDtcSuggestion('Make the cause clearer.')).toBe(false);
    expect(isClearDtcSuggestion('Clearly state which codes were found.')).toBe(false);
  });
});
