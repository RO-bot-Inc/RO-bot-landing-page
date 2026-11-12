// Regenerates the recorded sample results in src/scripts/story-check/shared.ts
// (between the GENERATED markers) by running each sample's recorded model
// output (story-check-samples.raw.json: gpt-4o-mini, live warranty rubric,
// 2026-11-11) through the same post-model pass live checks use.
// Run after the ported app rules change:  npx tsx scripts/story-check-samples.mts
import { readFileSync, writeFileSync } from 'node:fs';
import { toResult } from '../netlify/lib/story-check/grade';
import { SAMPLES } from '../src/scripts/story-check/shared';

const dir = new URL('.', import.meta.url).pathname;
const raw = JSON.parse(readFileSync(`${dir}story-check-samples.raw.json`, 'utf8'));
const shared = `${dir}../src/scripts/story-check/shared.ts`;
const recorded = SAMPLES.map((s) => {
  const r = toResult(s.cause, s.correction, raw[s.id]);
  return { id: s.id, grades: r.grades, gpa: r.gpa, notes: r.notes.map(({ n, ...rest }) => rest) };
});
const block = `// BEGIN GENERATED SAMPLE RESULTS (scripts/story-check-samples.mts, do not edit by hand)\nexport const SAMPLE_RESULTS: Record<string, { grades: Record<ElementKey, Grade>; gpa: number; notes: Omit<Note, 'n'>[] }> = ${JSON.stringify(Object.fromEntries(recorded.map(({ id, ...r }) => [id, r])), null, 2)};\n// END GENERATED SAMPLE RESULTS`;
const src = readFileSync(shared, 'utf8');
writeFileSync(shared, src.replace(/\/\/ BEGIN GENERATED SAMPLE RESULTS[\s\S]*?\/\/ END GENERATED SAMPLE RESULTS/, block));
for (const r of recorded) console.log(r.id.padEnd(10), r.gpa, Object.values(r.grades).join(' '), '|', r.notes.map((n) => n.pen).join(' / '));
