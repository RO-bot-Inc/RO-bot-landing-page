// Copied word for word from the app: app/server/services/warranty-suggestion-rules.ts
// at app commit fd4c9be65 (2026-11-12, after app PRs #2764, #2765 and #2770). The app file is
// the source of truth. To re-sync after the app changes:
//   git -C ../app show origin/main:server/services/warranty-suggestion-rules.ts
// and paste it below this header.

/**
 * Deterministic text rules behind the warranty grader's ADDITIONAL CHECKS
 * (grading-rubrics.ts warrantyPrompt, checks #2 and #3). gpt-4o-mini follows
 * those checks unreliably, so story-processor.ts decides them here and adds or
 * strips the model's suggestions to match. Pure leaf: no imports.
 *
 * Measured 2026-11-12 on 1,103 production warranty grades: the old patterns
 * missed "road tested" / "test driven" (39 of 62 missed mileage hints), read
 * "normal for mileage" as miles driven, and missed "codes cleared" /
 * "Cleared P0420" (4 of 5 "clear the codes" hints on already-cleared stories).
 */

/** A DTC as it appears in a story (P0301, B1553F1, P240700). */
export const DTC_PATTERN = /\b[PBCU][0-3][0-9A-F]{3}([0-9A-F]{2})?\b/i;

/** "No DTCs" / "no codes" statements. */
export const NO_DTC_PATTERN = /\b(no\s+dtc|no\s+code|no\s+fault|no\s+diagnostic\s+code|scan\s+revealed\s+no)/i;

/** "road test", "road tested", "road-testing", "test drive", "test drove", "test driven". */
export const TEST_DRIVE_PATTERN = /\b(test[\s-]?(drive|drives|drove|driven|driving)|road[\s-]?(test|tests|tested|testing))\b/i;

/**
 * A distance driven: "6 miles", "5 mi.", "8 km", "mileage in 41,212",
 * "mileage went from X to Y". A bare "mileage" ("normal for mileage") is NOT one.
 */
export const MILES_DRIVEN_PATTERN = new RegExp(
  [
    String.raw`\b\d[\d,]*(\.\d+)?\s?(mi|miles?|km|kms|kilometers?|kilometres?)\b`,
    String.raw`\bmileage\s+(in|out)\b`,
    String.raw`\bmileage\s+(went\s+)?from\s+\d`,
    String.raw`\bmileage\s*[:\-]?\s*\d[\d,]*`,
  ].join('|'),
  'i',
);

const CODE_WORD = String.raw`(dtcs?|codes?|faults?|[PBCU][0-3][0-9A-F]{3}(?:[0-9A-F]{2})?)`;
const CLEAR_WORD = String.raw`(clear|clears|cleared|clearing|erase|erases|erased|erasing|reset|resets|resetting)`;

/** Clearing in either order: "Cleared DTCs", "codes cleared", "Cleared P0420", "All DTCs erased". */
export const DTC_CLEARING_PATTERN = new RegExp(
  String.raw`\b${CLEAR_WORD}\b.{0,30}\b${CODE_WORD}\b|\b${CODE_WORD}\b.{0,30}\b${CLEAR_WORD}\b`,
  'i',
);

export const hasTestDrive = (text: string): boolean => TEST_DRIVE_PATTERN.test(text);
export const hasMilesDriven = (text: string): boolean => MILES_DRIVEN_PATTERN.test(text);
export const correctionClearsDtcs = (correction: string): boolean => DTC_CLEARING_PATTERN.test(correction);

/** A suggestion asking for test-drive mileage ("Test drive mentioned - consider adding number of miles driven."). */
export function isMileageSuggestion(text: string): boolean {
  const t = text.toLowerCase();
  return t.includes('mile') && /test[\s-]?dri|road[\s-]?test|driven|drove/.test(t);
}

/**
 * A suggestion that treats a test drive as ALREADY in the story ("Test drive
 * mentioned - add miles", "the road test lacks mileage", "Since a road test was
 * performed..."). On a story with no test drive that is a false statement, so it
 * is removed. A suggestion PROPOSING one ("Describe the verification, e.g. 'Test
 * drove 5 miles, no MIL'", "Consider a road test to confirm the shift") is not
 * matched and stays: Dave 2026-11-12 wants that advice where a drive fits the job.
 */
export function claimsExistingTestDrive(text: string): boolean {
  return /\b(test[\s-]?drive|road[\s-]?test)\s+(was\s+|is\s+)?(mentioned|noted|documented|performed|done|completed|stated)\b|\b(the|your)\s+(test[\s-]?drive|road[\s-]?test)\b|\bsince\s+(a|the)\s+(test[\s-]?drive|road[\s-]?test)\b|\blacks?\s+(a\s+)?mileage\b|\bmiles\s+driven\s+during\s+the\b/i.test(text);
}

// ── Component / assembly checks (2026-11-12) ─────────────────────────────
// Plurals count: the old `\b` after the list missed "brake pads", "valves"
// (15 prod stories had "component missing" with only a plural part named).
const PLURAL = String.raw`(?:e?s)?\b`;

const COMPONENT_PATTERN = new RegExp(
  String.raw`\b(spark\s*plug|ignition\s*coil|coil\s*pack|fuel\s*injector|o2\s*sensor|oxygen\s*sensor|catalytic\s*converter|mass\s*air\s*flow|maf\s*sensor|throttle\s*body|egr\s*valve|pcv\s*valve|timing\s*belt|timing\s*chain|water\s*pump|fuel\s*pump|alternator|starter|batter(?:y|ies)|brake\s*pad|brake\s*rotor|caliper|wheel\s*bearing|ball\s*joint|tie\s*rod|control\s*arm|strut|shock|cv\s*axle|drive\s*shaft|transmission|clutch|flywheel|radiator|thermostat|heater\s*core|a\/?c\s*compressor|blower\s*motor|window\s*motor|door\s*lock|sensor|module|pump|valve|relay|motor|switch|connector|plug|belt|hose|filter|gasket|seal)` + PLURAL,
  'i',
);

const ASSEMBLY_PATTERN = /\b(engine|transmission|transfer\s*case|differential|cvt)\b/i;
const ASSEMBLY_FAILURE_PATTERN = /\b(fail|replac|defect|damag|worn|crack|leak|blow|seiz|broke)/i;
const SUB_COMPONENT_PATTERN = new RegExp(
  String.raw`\b(cylinder\s*head|head\s*gasket|piston|crankshaft|camshaft|connecting\s*rod|rod\s*bearing|main\s*bearing|oil\s*pump|timing\s*chain|timing\s*belt|valve|valvetrain|block|intake\s*manifold|exhaust\s*manifold|torque\s*converter|valve\s*body|solenoid|clutch\s*pack|planetary\s*gear|servo|accumulator|governor|band|drum|sun\s*gear|ring\s*gear|pinion|axle\s*shaft|side\s*gear|carrier\s*bearing|seal|gasket)` + PLURAL,
  'i',
);

/**
 * "engine" used to NAME something else, not the engine assembly: "check engine
 * light", "engine control module", "engine oil". Prod 2026-11-12: 73 of 180
 * "identify the sub-component" hints fired on these alone (66 on a check engine
 * light). Stripped before the assembly test; "engine failed" still counts.
 */
const ENGINE_AS_ADJECTIVE = /\bcheck\s+engine(\s+(light|lamp))?\b|\bengine\s+(light|lamp|warning|control\s+module|computer|oil\s+(leak|leaks|leaking|seep|seepage|level|change|filter|cooler|pan|cap|dipstick)|coolant|mount|cover|harness|speed|rpm|temp(erature)?|bay|compartment|air\s+filter|running|idle|idles|idling)\b/gi;

export const namesComponent = (text: string): boolean => COMPONENT_PATTERN.test(text);
export const namesSubComponent = (text: string): boolean => SUB_COMPONENT_PATTERN.test(text);

/** CAUSE reports a failure of a major assembly (engine, transmission, ...). */
export function causeHasAssemblyFailure(cause: string): boolean {
  const assemblyText = cause.replace(ENGINE_AS_ADJECTIVE, ' ');
  return ASSEMBLY_PATTERN.test(assemblyText) && ASSEMBLY_FAILURE_PATTERN.test(cause);
}

/** A suggestion asking the tech to clear the codes. */
export function isClearDtcSuggestion(text: string): boolean {
  const t = text.toLowerCase();
  return /\bclear(s|ed|ing)?\b/.test(t) && /\bdtcs?\b|\bcodes?\b/.test(t);
}
