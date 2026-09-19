// Shared by the pages, the client flows, and the Netlify function.

export const API_PATH = '/api/leak-test';

// Printed on the postcards and in every generated front page. Do not rename.
export const ROUTES = {
  hub: '/ai-summit/',
  landing: '/ai-summit/leak-test/',
  resume: '/ai-summit/leak-test/resume/',
  futureHeadline: '/ai-summit/future-headline/',
} as const;

export const CALENDLY_URL = 'https://calendly.com/dave-tenthgear/30min';

// Max lengths, enforced in the browser and again on the server.
export const FIELD_MAX = {
  name: 80,
  email: 120,
  dealership: 120,
  title: 80,
  phone: 40,
  dms: 80,
  lane: 300,
} as const;
export type ContactField = keyof typeof FIELD_MAX;
export const REQUIRED_FIELDS: ContactField[] = ['name', 'email', 'dealership', 'title'];

export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

export const RESUME_TOKEN_DAYS = 60;
