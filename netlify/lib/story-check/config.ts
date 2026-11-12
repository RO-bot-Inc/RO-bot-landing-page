// All tunables come from Netlify environment variables (set in all three
// contexts: production, deploy-preview, branch-deploy). A change needs a redeploy.
import { scryptSync } from 'node:crypto';

const env = (name: string) => (process.env[name] || '').trim();
const num = (name: string, fallback: number) => {
  const v = Number(env(name));
  return Number.isFinite(v) && env(name) !== '' ? v : fallback;
};

let derived = '';
const derivedSecret = (seed: string) =>
  derived || (derived = scryptSync(seed, 'story-check-signing', 32).toString('hex'));

export function config() {
  const openaiKey = env('SC_OPENAI_API_KEY') || env('OPENAI_API_KEY');
  // SC_MODE: "live" | "mock". Unset means live when an OpenAI key exists.
  const mode: 'live' | 'mock' = env('SC_MODE') === 'mock' || !openaiKey ? 'mock' : 'live';
  const resendKey = env('RESEND_API_KEY');
  return {
    mode,
    // Kill switch: SC_ENABLED=false and redeploy stops all grading.
    enabled: env('SC_ENABLED') !== 'false',
    openaiKey,
    model: env('SC_MODEL') || 'gpt-4o-mini', // same model the app grades with
    timeoutMs: num('SC_TIMEOUT_MS', 22_000),
    freePerDay: num('SC_FREE_PER_DAY', 5), // per browser (signed cookie)
    ipCap: num('SC_IP_CAP', 40), // per IP per day; loose, a whole shop can share one IP
    dailyCap: num('SC_DAILY_CAP', 600), // all visitors, AI-graded checks only
    reportsPerEmail: num('SC_REPORTS_PER_EMAIL', 10), // per address per day
    email: resendKey && env('SC_EMAIL') !== 'log' ? ('live' as const) : ('log' as const),
    resendKey,
    notifyTo: env('SC_NOTIFY_TO') || 'dave@tenthgear.ai',
    signingSecret:
      env('SC_SIGNING_SECRET') || env('FH_SIGNING_SECRET') || derivedSecret(openaiKey || 'local-dev'),
  };
}

export type Config = ReturnType<typeof config>;

export class ScError extends Error {
  constructor(
    public code: 'disabled' | 'capacity' | 'limit' | 'rate_limited' | 'bad_input' | 'upstream',
    public status: number,
  ) {
    super(code);
  }
}
