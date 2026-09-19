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

function projectId(serviceAccount: string): string {
  try {
    return (JSON.parse(serviceAccount) as { project_id?: string }).project_id || '';
  } catch {
    return '';
  }
}

export function config() {
  const mock = env('LT_MODE') === 'mock';
  const resendKey = mock ? '' : env('RESEND_API_KEY');
  const notionKey = mock ? '' : env('NOTION_API_KEY');
  const turnstileSecret = mock ? '' : env('TURNSTILE_SECRET_KEY');
  const serviceAccount = mock ? '' : env('LT_FIREBASE_SERVICE_ACCOUNT');
  const store: 'firestore' | 'blobs' | 'memory' =
    serviceAccount ? 'firestore' : env('LT_STORE') === 'memory' ? 'memory' : 'blobs';
  const storageBucket = serviceAccount ? env('LT_STORAGE_BUCKET') || `${projectId(serviceAccount)}.firebasestorage.app` : '';

  return {
    // Kill switch. Set LT_ENABLED=false and redeploy to stop enrollments.
    enabled: env('LT_ENABLED') !== 'false',
    mock,
    store,
    // Without a bucket the browser simulates the transfer and only metadata is kept.
    uploads: storageBucket ? ('gcs' as const) : ('mock' as const),
    storageBucket,
    email: resendKey ? ('resend' as const) : ('log' as const),
    notion: notionKey ? ('live' as const) : ('off' as const),
    captcha: turnstileSecret ? ('turnstile' as const) : ('off' as const),
    // The page only renders the widget when the server can verify it.
    turnstileSiteKey: turnstileSecret ? env('TURNSTILE_SITE_KEY') : '',
    turnstileSecret,
    resendKey,
    notionKey,
    notionDataSourceId: env('NOTION_DATA_SOURCE_ID') || NOTION_DATA_SOURCE_ID,
    // Optional. With it, a booking's date and time are read from Calendly;
    // without it the intake only knows that a booking happened.
    calendlyToken: mock ? '' : env('CALENDLY_API_TOKEN'),
    serviceAccount,
    firestoreCollection: env('LT_FIRESTORE_COLLECTION') || 'leak_test_intakes',
    notifyTo: env('LT_NOTIFY_TO') || 'dave@tenthgear.ai',
    fromDave: 'Dave Sonders <dave@tenthgear.ai>',
    fromSystem: 'RO Leak Test <notifications@tenthgear.ai>',
    // Requests mail links on their own origin, so deploy previews mail preview
    // links. Set LT_PUBLIC_ORIGIN to override.
    publicOrigin: env('LT_PUBLIC_ORIGIN'),
    // Scheduled jobs have no request; production is tenthgear.ai, previews
    // and branch deploys get Netlify's deploy URL.
    jobOrigin: env('LT_PUBLIC_ORIGIN') || (env('CONTEXT') === 'production' ? 'https://tenthgear.ai' : env('DEPLOY_PRIME_URL') || env('URL')),
    tokenDays: num('LT_TOKEN_DAYS', 60),
    retentionDays: num('LT_RETENTION_DAYS', 60),
    // Reminders run from a scheduled function; LT_REMINDERS=false pauses them.
    reminders: env('LT_REMINDERS') !== 'false',
    signingSecret: env('LT_SIGNING_SECRET') || derivedSecret(resendKey || 'local-dev'),
  };
}

export type Config = ReturnType<typeof config>;
