export interface Contact {
  name: string;
  email: string;
  dealership: string;
  title: string;
  phone?: string;
  dms?: string;
  lane?: string;
}

export interface Source {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  landing?: string;
  device?: 'phone' | 'desktop';
}

export interface EmailLog {
  at: string;
  kind: 'enrollment' | 'email-fixed' | 'fresh-link';
  subject: string;
  to: string;
  id: string | null; // Resend id, null in log mode
}

export interface Intake {
  id: string;
  createdAt: string;
  updatedAt: string;
  contact: Contact;
  source: Source;
  // Only a hash of the resume token is stored. The token itself exists in the
  // email and, briefly, in the participant's browser.
  token: { hash: string; issuedAt: string; expiresAt: string; revoked: boolean };
  materials: {
    status: 'not_started' | 'in_progress' | 'sent';
    files: number;
    links: number;
    notes: string;
    sentAt: string | null;
  };
  booking: { status: 'not_booked' | 'booked'; at: string | null; eventUri: string | null };
  notionPageId: string | null;
  emails: EmailLog[];
}

export class LtError extends Error {
  constructor(
    public code: 'disabled' | 'rate_limited' | 'invalid' | 'captcha' | 'not_found' | 'expired' | 'upstream',
    public status: number,
  ) {
    super(code);
  }
}
