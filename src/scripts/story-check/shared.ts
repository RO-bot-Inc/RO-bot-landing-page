// Shared by the page and the story-check function. Nothing here is the rubric:
// the grading prompt lives server-side only (netlify/lib/story-check/rubric.ts).

export const ELEMENTS = [
  'complaintVerification',
  'diagnosticApproach',
  'componentIdentification',
  'failureMode',
  'repairAction',
  'finalVerification',
] as const;
export type ElementKey = (typeof ELEMENTS)[number];

// Same labels the app shows (app/client/src/components/ai-writer/grading-config.ts).
export const LABELS: Record<ElementKey, string> = {
  complaintVerification: 'Complaint Verification',
  diagnosticApproach: 'Diagnostics Performed',
  componentIdentification: 'Component Involved',
  failureMode: 'Root Cause',
  repairAction: 'Repair Action',
  finalVerification: 'Final Verification',
};

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F' | 'missing' | 'not_applicable';
export const POINTS: Record<Grade, number> = { A: 4, B: 3, C: 2, D: 1, F: 0, missing: 0, not_applicable: 0 };

export const FREE_CHECKS_PER_DAY = 5;
export const MAX_FIELD_CHARS = 2000;

export interface Note {
  n: number;
  field: 'cause' | 'correction';
  match: string | null; // exact substring of that field to underline, or null
  pen: string; // the short red-pen line
  criterion: string;
  fixLabel: string;
  fix: string;
}

export interface Result {
  cause: string; // as graded (VINs removed)
  correction: string;
  grades: Record<ElementKey, Grade>;
  gpa: number;
  letter: string;
  notes: Note[];
  sampleId: string | null;
}

export function letterFor(gpa: number): string {
  if (gpa >= 3.7) return 'A';
  if (gpa >= 3.3) return 'A-';
  if (gpa >= 3.0) return 'B+';
  if (gpa >= 2.7) return 'B';
  if (gpa >= 2.3) return 'B-';
  if (gpa >= 2.0) return 'C+';
  if (gpa >= 1.7) return 'C';
  if (gpa >= 1.3) return 'C-';
  if (gpa >= 1.0) return 'D';
  return 'F';
}

// Same math as the app: total points over the applicable elements.
export function gpaFor(grades: Record<ElementKey, Grade>): number {
  let total = 0;
  let n = 0;
  for (const k of ELEMENTS) {
    if (grades[k] === 'not_applicable') continue;
    total += POINTS[grades[k]] ?? 0;
    n++;
  }
  return n ? Math.round((total / n) * 100) / 100 : 0;
}

type SampleNote = Omit<Note, 'n'>;
export interface Sample {
  id: string;
  label: string;
  cause: string;
  correction: string;
  grades: Record<ElementKey, Grade>;
  notes: SampleNote[];
}

const G = (cv: Grade, dp: Grade, ci: Grade, fm: Grade, ra: Grade, fv: Grade): Record<ElementKey, Grade> => ({
  complaintVerification: cv,
  diagnosticApproach: dp,
  componentIdentification: ci,
  failureMode: fm,
  repairAction: ra,
  finalVerification: fv,
});

// 8 samples graded 2026-11-11 by the live warranty rubric (gtm/docs/story-checker/samples/graded.json).
// Grades and fix text are the grader's own; the red-pen lines paraphrase its suggestions.
// Order mixes length and grade on purpose (Dave, 2026-11-11). Samples cost no AI call.
export const SAMPLES: Sample[] = [
  {
    id: 'misfire',
    label: 'Misfire',
    cause: 'Check engine light was observed illuminated. Scanned vehicle and found codes P0301 and P0302. Inspected spark plugs and found them worn. Spark plugs failed.',
    correction: 'Replaced spark plugs. Verified proper operation.',
    grades: G('C', 'B', 'C', 'C', 'C', 'C'),
    notes: [
      { field: 'correction', match: 'Replaced spark plugs.', pen: 'Codes cleared?', criterion: 'Codes found, never cleared', fixLabel: 'Add to the correction:', fix: '“Cleared DTCs and performed scan to confirm codes resolved.”' },
      { field: 'correction', match: 'Verified proper operation', pen: 'How? Road test? Miles?', criterion: 'Final Verification · C', fixLabel: 'Say how you checked, for example:', fix: '“Test drove 5 miles, no MIL, engine running smooth.”' },
      { field: 'cause', match: 'Check engine light was observed illuminated', pen: 'How? Under what conditions?', criterion: 'Complaint Verification · C', fixLabel: 'Add method and conditions, for example:', fix: '“Upon starting, confirmed MIL illuminated and engine running rough.”' },
      { field: 'cause', match: 'spark plugs', pen: 'Which ones? Cyl 1 and 2?', criterion: 'Component Involved · C', fixLabel: 'Say which:', fix: 'all 4, or cylinders 1 and 2, and where.' },
      { field: 'cause', match: 'worn', pen: 'Worn how? Gap? Spec?', criterion: 'Root Cause · C', fixLabel: 'Add the failure detail:', fix: 'gap measurement against spec, electrode condition.' },
    ],
  },
  {
    id: 'bearing',
    label: 'Humming at highway speed',
    cause: 'Road tested vehicle 6 miles, mileage in 41,212, mileage out 41,218. Confirmed humming noise from left front between 45 and 70 mph, louder when turning right (loading left side). Raised vehicle and used chassis ears; noise loudest at left front hub. Spun wheel by hand, felt roughness in left front hub bearing. Measured axial play 0.008 in, spec 0.002 in max. Right front bearing smooth, within spec. No DTCs. Left front hub bearing internal failure.',
    correction: 'Removed and replaced left front hub bearing assembly. Torqued axle nut and hub bolts to spec. Axial play 0.001 in after repair. Road tested 6 miles, mileage in 41,218, mileage out 41,224, no humming noise at any speed or while turning. Repair verified.',
    grades: G('A', 'A', 'A', 'A', 'A', 'A'),
    notes: [],
  },
  {
    id: 'window',
    label: 'Window inop',
    cause: 'Window inop. Regulator bad.',
    correction: 'Replaced regulator.',
    grades: G('D', 'D', 'D', 'D', 'B', 'missing'),
    notes: [
      { field: 'cause', match: 'Window inop.', pen: 'Tested how?', criterion: 'Complaint Verification · D', fixLabel: 'Grader suggests:', fix: 'Clarify verification method and condition: “Tested window operation, found inoperative.”' },
      { field: 'correction', match: 'Replaced regulator.', pen: 'Did you test it after?', criterion: 'Final Verification · missing', fixLabel: 'Grader suggests:', fix: 'Include post-repair verification method: “Tested window operation after replacement, confirmed proper functioning.”' },
      { field: 'cause', match: null, pen: 'What did you test?', criterion: 'Diagnostics Performed · D', fixLabel: 'Grader suggests:', fix: 'Add more specifics to the diagnostic process, such as testing steps or symptoms observed.' },
      { field: 'cause', match: 'bad', pen: 'Bad how? Stuck? Broken?', criterion: 'Root Cause · D', fixLabel: 'Grader suggests:', fix: 'Specify what was wrong with the regulator (for example, stuck or damaged).' },
    ],
  },
  {
    id: 'brakes',
    label: 'Brake noise',
    cause: 'Verified customer concern. Performed inspection of the brake system as per customer request. Removed wheels and inspected front and rear brakes. Found that the brakes are making noise and the pads are not in good condition and need to be replaced at this time. Rotors also looked like they had some wear on them. Brake system is not operating as designed due to the condition of the brake components. Recommend replacing parts to correct the concern.',
    correction: 'Replaced brake pads and resurfaced rotors per procedure. Reinstalled wheels and torqued to specification. Verified repair. System operating as designed at this time. Repair complete.',
    grades: G('C', 'C', 'C', 'D', 'B', 'C'),
    notes: [
      { field: 'correction', match: 'System operating as designed at this time.', pen: 'How? Road test for noise?', criterion: 'Final Verification · C', fixLabel: 'Grader suggests:', fix: 'Describe what was tested after the repair (for example, a road test for noise).' },
      { field: 'cause', match: 'brakes are making noise', pen: 'Pad thickness? Rotor spec?', criterion: 'Root Cause · D', fixLabel: 'Grader suggests:', fix: 'Detail specific wear measurements for the pads and rotors (for example, pad thickness, rotor runout).' },
      { field: 'cause', match: 'Performed inspection of the brake system as per customer request.', pen: 'Inspected what? Measured?', criterion: 'Diagnostics Performed · C', fixLabel: 'Grader suggests:', fix: 'Add details on specific inspections, measurements (for example, pad thickness, rotor condition), or tools used.' },
      { field: 'cause', match: 'the pads are not in good condition and need to be replaced', pen: 'Front? Rear? Both?', criterion: 'Component Involved · C', fixLabel: 'Grader suggests:', fix: 'Specify which pads were replaced (front, rear, or both).' },
    ],
  },
  {
    id: 'battery',
    label: 'No start',
    cause: 'Duplicated no-crank. Battery 11.9 V at rest, failed load test at 9.2 V. No DTCs. Parasitic draw 25 mA, within spec. Battery internal failure.',
    correction: 'R&R battery. Charging system 14.3 V at idle. Cranked and started 5 times, OK.',
    grades: G('B', 'A', 'A', 'A', 'A', 'B'),
    notes: [],
  },
  {
    id: 'trans',
    label: 'Harsh shifting',
    cause: 'Verified customer concern of harsh shift. Connected scan tool and retrieved code P0756 shift solenoid B performance. Checked transmission fluid level and condition, fluid level was correct and fluid condition was normal for mileage. Performed pinpoint tests per service information, see attached printout for test results. Based on testing determined that the shift solenoid B is faulty and is causing the harsh shift condition that the customer is experiencing.',
    correction: 'Removed valve body and replaced shift solenoid B. Reinstalled valve body and refilled fluid to proper level. Performed transmission adaptive relearn. Road tested vehicle, shifts are now normal. Verified proper operation.',
    grades: G('B', 'B', 'A', 'A', 'A', 'B'),
    notes: [
      { field: 'cause', match: 'see attached printout for test results', pen: 'Put the results here', criterion: 'Diagnostics Performed · B', fixLabel: 'Grader suggests:', fix: 'Include specific results from pinpoint tests instead of referencing the attachment.' },
      { field: 'correction', match: 'Road tested vehicle, shifts are now normal.', pen: 'How many miles?', criterion: 'Final Verification · B', fixLabel: 'Grader suggests:', fix: 'Add specific details of the road test, such as mileage driven during the test.' },
    ],
  },
  {
    id: 'waterpump',
    label: 'Coolant leak',
    cause: 'Found coolant leak. Water pump leaking.',
    correction: 'Replaced water pump and refilled coolant. No leaks.',
    grades: G('D', 'D', 'C', 'D', 'B', 'C'),
    notes: [
      { field: 'cause', match: 'Found coolant leak.', pen: 'Where? How did you see it?', criterion: 'Complaint Verification · D', fixLabel: 'Grader suggests:', fix: 'Provide specifics on how the leak was verified (for example, “observed leak during inspection”).' },
      { field: 'cause', match: 'leaking', pen: 'Leaking how? Seal? Housing?', criterion: 'Root Cause · D', fixLabel: 'Grader suggests:', fix: 'Specify the nature of the failure (for example, “seal failure” or “crack in housing”).' },
      { field: 'cause', match: null, pen: 'What did you check?', criterion: 'Diagnostics Performed · D', fixLabel: 'Grader suggests:', fix: 'Describe the diagnostic steps taken to identify the leak.' },
    ],
  },
  {
    id: 'ac',
    label: 'A/C blowing warm',
    cause: 'Confirmed vent temp 68F at idle, 75F ambient. Gauges: low side 55 psi, high side 140 psi. Compressor clutch not engaging. Clutch coil resistance open (spec 3-4 ohms). No DTCs. Clutch coil failed.',
    correction: 'R&R compressor clutch coil. Clutch engages. Low side 30 psi, high side 190 psi. Vent temp 41F at idle, 45 min run test, no further concern.',
    grades: G('B', 'A', 'A', 'A', 'A', 'A'),
    notes: [],
  },
];

// The misfire sample's A rewrite (the grader's own few-shot A example). Teal marks show what changed.
export const MISFIRE_A = {
  cause: [
    ['Verified engine running rough at idle ', false],
    ['when cold', true],
    ['. Scanned and retrieved DTCs P0301 P0302 (cylinder 1 and 2 misfire). Inspected ignition system, found spark plugs on ', false],
    ['cylinders 1 and 2', true],
    [' with worn electrodes and excessive gap ', false],
    ['(0.065" measured, spec 0.044")', true],
    ['. Ignition coils tested good.', false],
  ] as [string, boolean][],
  correction: [
    ['Removed and replaced spark plugs cylinders 1-4 with OEM spec plugs gapped to 0.044". ', false],
    ['Cleared DTCs.', true],
    [' ', false],
    ['Test drove 8 miles, engine runs smooth, no misfire, no MIL.', true],
  ] as [string, boolean][],
};

export function sampleResult(s: Sample): Result {
  const gpa = gpaFor(s.grades);
  return {
    cause: s.cause,
    correction: s.correction,
    grades: s.grades,
    gpa,
    letter: letterFor(gpa),
    notes: s.notes.map((n, i) => ({ ...n, n: i + 1 })),
    sampleId: s.id,
  };
}

export const findSample = (cause: string, correction: string) =>
  SAMPLES.find((s) => s.cause === cause.trim() && s.correction === correction.trim()) || null;
