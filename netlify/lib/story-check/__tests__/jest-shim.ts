// Minimal jest-style API on node:test, enough for tables copied from the app.
import assert from 'node:assert/strict';
import { describe as nodeDescribe, test as nodeTest } from 'node:test';

export const describe = (name: string, fn: () => void) => nodeDescribe(name, fn);

type Each = <T>(rows: T[]) => (name: string, fn: (row: T) => void) => void;
const each: Each = (rows) => (name, fn) => {
  for (const row of rows) nodeTest(name.replace('%s', String(row)), () => fn(row));
};
export const test = Object.assign((name: string, fn: () => void) => nodeTest(name, fn), { each });

export const expect = (actual: unknown) => ({
  toBe: (expected: unknown) => assert.equal(actual, expected),
  toEqual: (expected: unknown) => assert.deepEqual(actual, expected),
});
