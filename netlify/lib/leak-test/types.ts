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

export type ReminderKind = 'reminder-contact-48h' | 'reminder-contact-7d' | 'reminder-booked-24h' | 'reminder-materials-24h';
export type EmailKind = 'enrollment' | 'email-fixed' | 'fresh-link' | ReminderKind;

export interface EmailLog {
  at: string;
  kind: EmailKind;
  subject: string;
  to: string;
  id: string | null; // Resend id, null in log mode
}

// Only the hash is stored. Several links can be valid at once (the enrollment
// email and later reminders); "fresh link" and "fix it" revoke them all.
export interface Token {
  hash: string;
  issuedAt: string;
  expiresAt: string;
  revoked: boolean;
  purpose: 'email' | 'reminder';
}

export interface IntakeFile {
  id: string;
  name: string; // as chosen by the participant, display only
  size: number;
  type: string; // declared content type
  object: string; // storage object name
  status: 'pending' | 'done';
  createdAt: string;
  doneAt: string | null;
}

export interface Intake {
  id: string;
  createdAt: string;
  updatedAt: string;
  contact: Contact;
  source: Source;
  tokens: Token[];
  materials: {
    status: 'not_started' | 'in_progress' | 'sent';
    files: number; // done files
    links: number;
    notes: string;
    sentAt: string | null;
  };
  files: IntakeFile[];
  links: string[];
  // checkedAt: last time a not-booked intake asked Calendly for a booking made
  // outside the embed (the fallback link); throttles the lookup.
  booking: { status: 'not_booked' | 'booked'; at: string | null; eventUri: string | null; inviteeUri: string | null; checkedAt?: string | null };
  // Last participant action in the workspace; reminders key off it. An
  // upload in progress keeps uploadActiveUntil ahead of now.
  lastActivityAt: string;
  uploadActiveUntil: string | null;
  reminders: Partial<Record<ReminderKind, string>>;
  notionPageId: string | null;
  emails: EmailLog[];
  // Set by the retention job when the purge starts; the purge is finished
  // only when the record is empty and the Notion page has been told.
  purgedAt: string | null;
  purgeLoggedAt: string | null;
}

export class LtError extends Error {
  constructor(
    public code:
      | 'disabled'
      | 'rate_limited'
      | 'invalid'
      | 'captcha'
      | 'not_found'
      | 'expired'
      | 'too_large'
      | 'bad_file'
      | 'uploads_off'
      | 'upstream',
    public status: number,
  ) {
    super(code);
  }
}
