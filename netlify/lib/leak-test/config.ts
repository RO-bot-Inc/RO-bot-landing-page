// Every integration degrades to a local stand-in when its secret is missing,
// so the whole flow runs on a laptop and on a deploy preview without keys.
// See docs/leak-test-runbook.md.
import { scryptSync } from 'node:crypto';

const env = (name: string) => (process.env[name] || '').trim();
const num = (name: string, fallback: number) => {
  const v = Number(env(name));
  return Number.isFinite(v) && env(name) !== '' ? v : fallback;
};

// Local-dev fallback only; every deployed context sets LT_SIGNING_SECRET.
// Derived once per process with a real KDF (CodeQL js/insufficient-password-hash).
let derived = '';
const derivedSecret = (seed: string) =>
  derived || (derived = scryptSync(seed, 'leak-test-signing', 32).toString('hex'));

// The Notion database "RO Leak Test Intake" (data source id, not the page id).
const NOTION_DATA_SOURCE_ID = 'cc334923-33ba-4daa-be2a-873a65d0133b';

export function config() {
  const mock = env('LT_MODE') === 'mock';
  const resendKey = mock ? '' : env('RESEND_API_KEY');
  const notionKey = mock ? '' : env('NOTION_API_KEY');
  const turnstileSecret = mock ? '' : env('TURNSTILE_SECRET_KEY');
  const serviceAccount = mock ? '' : env('LT_FIREBASE_SERVICE_ACCOUNT');
  const store: 'firestore' | 'blobs' | 'memory' =
    serviceAccount ? 'firestore' : env('LT_STORE') === 'memory' ? 'memory' : 'blobs';

  return {
    // Kill switch. Set LT_ENABLED=false and redeploy to stop enrollments.
    enabled: env('LT_ENABLED') !== 'false',
    mock,
    store,
    email: resendKey ? ('resend' as const) : ('log' as const),
    notion: notionKey ? ('live' as const) : ('off' as const),
    captcha: turnstileSecret ? ('turnstile' as const) : ('off' as const),
    // The page only renders the widget when the server can verify it.
    turnstileSiteKey: turnstileSecret ? env('TURNSTILE_SITE_KEY') : '',
    turnstileSecret,
    resendKey,
    notionKey,
    notionDataSourceId: env('NOTION_DATA_SOURCE_ID') || NOTION_DATA_SOURCE_ID,
    serviceAccount,
    firestoreCollection: env('LT_FIRESTORE_COLLECTION') || 'leak_test_intakes',
    notifyTo: env('LT_NOTIFY_TO') || 'dave@tenthgear.ai',
    fromDave: 'Dave Sonders <dave@tenthgear.ai>',
    fromSystem: 'RO Leak Test <notifications@tenthgear.ai>',
    // Defaults to the request origin, so deploy previews mail preview links.
    publicOrigin: env('LT_PUBLIC_ORIGIN'),
    tokenDays: num('LT_TOKEN_DAYS', 60),
    signingSecret: env('LT_SIGNING_SECRET') || derivedSecret(resendKey || 'local-dev'),
  };
}

export type Config = ReturnType<typeof config>;
