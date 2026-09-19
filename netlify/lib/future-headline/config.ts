// All tunables come from Netlify environment variables, so nothing here
// needs a code change on event day. See docs/future-headline-runbook.md.
import { scryptSync } from 'node:crypto';

const env = (name: string) => (process.env[name] || '').trim();
const num = (name: string, fallback: number) => {
  const v = Number(env(name));
  return Number.isFinite(v) && env(name) !== '' ? v : fallback;
};

// Local-dev fallback only; every deployed context sets FH_SIGNING_SECRET.
// Derived once per process with a real KDF rather than a bare hash of the
// key (CodeQL js/insufficient-password-hash).
let derived = '';
const derivedSecret = (seed: string) =>
  derived || (derived = scryptSync(seed, 'future-headline-signing', 32).toString('hex'));

export function config() {
  const anthropicKey = env('ANTHROPIC_API_KEY');
  const geminiKey = env('GEMINI_API_KEY');
  // FH_MODE: "live" | "mock". Unset means live when both keys exist.
  const requested = env('FH_MODE');
  const mode: 'live' | 'mock' =
    requested === 'mock' || !anthropicKey || !geminiKey ? 'mock' : 'live';

  return {
    mode,
    // Kill switch. Set FH_ENABLED=false and redeploy to stop all generation.
    enabled: env('FH_ENABLED') !== 'false',
    anthropicKey,
    geminiKey,
    textModel: env('FH_TEXT_MODEL') || 'claude-opus-5',
    imageModel: env('FH_IMAGE_MODEL') || 'gemini-3.1-flash-image',
    dystopiaProbability: Math.min(1, Math.max(0, num('FH_DYSTOPIA_PROBABILITY', 0.5))),
    dailyCap: num('FH_DAILY_CAP', 400),
    sessionCap: num('FH_SESSION_CAP', 25),
    // Dave's demo link: ?demo=<code> skips the per-browser cap. Daily cap still applies.
    demoCode: env('FH_DEMO_CODE'),
    textTimeoutMs: num('FH_TEXT_TIMEOUT_MS', 20_000),
    imageTimeoutMs: num('FH_IMAGE_TIMEOUT_MS', 25_000),
    signingSecret: env('FH_SIGNING_SECRET') || derivedSecret(anthropicKey || 'local-dev'),
  };
}

export type Config = ReturnType<typeof config>;
