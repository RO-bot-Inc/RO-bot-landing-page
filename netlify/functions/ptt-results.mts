// POST /api/ptt-results — the throwaway /ptt handheld test page sends its checklist,
// environment, log and the last few clips here; we email them to Dave via Resend.
// Temporary: delete together with public/ptt/ after the Windows bay-laptop test.
import type { Config as FunctionConfig } from '@netlify/functions';

const TO = 'dave@tenthgear.ai';
const FROM = 'PTT handheld test <notifications@tenthgear.ai>';
const MAX_BODY_BYTES = 5.5 * 1024 * 1024; // Netlify buffers at most 6 MB
const MAX_CLIPS = 6;

interface Clip {
  name: string; mime: string; bytes: number; durMs: number; latencyMs: number;
  label: string; hidden: boolean; idleMs: number; afterReconnect?: boolean; b64: string;
}
interface Payload {
  env: Record<string, unknown>;
  checks: Record<string, { ok: boolean; detail?: string; at: string } | null>;
  log: string;
  clips: Clip[];
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const CHECK_LABELS: Record<string, string> = {
  connect: 'Handheld button connected',
  mic: 'Handheld microphone detected',
  front: 'Recording, tab in front',
  back: 'Recording, tab in background',
  idle: 'Recording after 10 min idle',
  recon: 'Reconnect after handheld power cycle',
};

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  const origin = req.headers.get('origin') || '';
  if (!/^https:\/\/([a-z0-9-]+\.)?(tenthgear\.ai|netlify\.app)$/i.test(origin)) return json({ error: 'bad origin' }, 403);
  const len = Number(req.headers.get('content-length') || 0);
  if (len > MAX_BODY_BYTES) return json({ error: 'too large' }, 413);

  let p: Payload;
  try { p = (await req.json()) as Payload; } catch { return json({ error: 'bad json' }, 400); }
  const clips = (Array.isArray(p.clips) ? p.clips : []).slice(-MAX_CLIPS).filter((c) => c && typeof c.b64 === 'string');
  const checks = p.checks || {};
  const passed = Object.values(checks).filter((c) => c?.ok).length;
  const total = Object.keys(CHECK_LABELS).length;

  const checkLines = Object.entries(CHECK_LABELS).map(([k, label]) => {
    const c = checks[k];
    return `${c ? (c.ok ? 'PASS' : 'FAIL') : '----'}  ${label}${c?.detail ? ' — ' + c.detail : ''}`;
  });
  const env = p.env || {};
  const clipLines = clips.map((c) =>
    `${c.name}: ${(c.durMs / 1000).toFixed(1)} s, ${c.bytes} bytes, ${c.latencyMs} ms press-to-record, from "${c.label}"` +
    (c.hidden ? ', tab hidden' : '') + (c.afterReconnect ? ', after reconnect' : '') + (c.idleMs ? `, ${Math.round(c.idleMs / 1000)} s idle before` : ''));

  const text = `PTT handheld test results — ${passed}/${total} checks passed

CHECKS
${checkLines.join('\n')}

ENVIRONMENT
${Object.entries(env).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' | ') : String(v)}`).join('\n')}

CLIPS (${clips.length} attached)
${clipLines.join('\n') || '(none)'}

LOG
${String(p.log || '').slice(-30000)}
`;

  const key = (process.env.RESEND_API_KEY || '').trim();
  if (!key) { console.log('[ptt-results] no RESEND_API_KEY; would send:\n' + text.slice(0, 2000)); return json({ ok: true, mode: 'log' }); }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      subject: `PTT handheld test: ${passed}/${total} passed — ${String(env.platform || '?')} / ${String(env.browser || '?').split(',')[0]}`,
      text,
      attachments: clips.map((c) => ({ filename: c.name, content: c.b64 })),
    }),
  });
  if (!res.ok) {
    console.error('[ptt-results] resend', res.status, (await res.text()).slice(0, 300));
    return json({ error: 'email failed' }, 502);
  }
  return json({ ok: true });
};

export const config: FunctionConfig = { path: '/api/ptt-results' };
