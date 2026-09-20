// Resume tokens, the links that carry them, and Dave's admin link. Shared by
// the API function and the scheduled jobs.
import { ROUTES } from '../../../src/scripts/leak-test/presets';
import type { Config } from './config';
import { hashToken, newResumeToken, readTicket, signTicket } from './guard';
import { LtError, type Intake, type Token } from './types';

const ADMIN_TICKET_TTL_MS = 400 * 86_400_000; // outlives the 60-day retention window with room

export function publicOrigin(cfg: Config, req?: Request): string {
  const origin = cfg.publicOrigin || (req ? new URL(req.url).origin : cfg.jobOrigin);
  if (!origin) throw new LtError('upstream', 500);
  return origin;
}

// A new token for the participant. "revokeOthers" is the fresh-link and
// fix-it path (a link in the wrong inbox must die); reminders add a link
// without killing the one in the enrollment email.
export function issueResumeToken(cfg: Config, intake: Intake, now: string, purpose: Token['purpose'], revokeOthers: boolean): string {
  const token = newResumeToken();
  if (revokeOthers) for (const t of intake.tokens) t.revoked = true;
  intake.tokens.push({
    hash: hashToken(token),
    issuedAt: now,
    expiresAt: new Date(Date.parse(now) + cfg.tokenDays * 86_400_000).toISOString(),
    revoked: false,
    purpose,
  });
  // Keep the record small: drop revoked tokens once they would have expired anyway.
  intake.tokens = intake.tokens.filter((t) => !t.revoked || Date.parse(t.expiresAt) > Date.now());
  return token;
}

export function liveToken(intake: Intake, hash: string): Token | null {
  const t = intake.tokens.find((x) => x.hash === hash);
  if (!t || t.revoked) return null;
  if (Date.parse(t.expiresAt) < Date.now()) throw new LtError('expired', 410);
  return t;
}

export const resumeLink = (origin: string, token: string, view?: 'book' | 'materials') =>
  `${origin}${ROUTES.resume}${view ? `?view=${view}` : ''}#${token}`;

// Every ticket names its audience, and every reader asserts one, so a ticket
// minted for one purpose can never satisfy another reader.
export const adminLink = (cfg: Config, origin: string, intake: Intake) =>
  `${origin}${ROUTES.admin}#${signTicket(cfg, { id: intake.id, aud: 'admin' }, ADMIN_TICKET_TTL_MS)}`;

export function readAdminTicket(cfg: Config, ticket: unknown): string {
  const data = readTicket<{ id: string }>(cfg, ticket, 'admin');
  if (typeof data.id !== 'string') throw new LtError('not_found', 404);
  return data.id;
}

// Whether this record still accepts participant or job writes. Decided on the
// fresh copy inside every conditional write, never on an earlier snapshot.
export const isOpen = (intake: Intake) => !intake.purgedAt && intake.tokens.some((t) => !t.revoked);
export const holdsLiveToken = (intake: Intake, hash: string) =>
  !intake.purgedAt && intake.tokens.some((t) => t.hash === hash && !t.revoked && Date.parse(t.expiresAt) >= Date.now());
