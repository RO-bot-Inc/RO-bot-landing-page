// Shared by the pages, the client flows, and the Netlify functions.

export const API_PATH = '/api/leak-test';

// Printed on the postcards and in every generated front page. Do not rename.
export const ROUTES = {
  hub: '/ai-summit/',
  landing: '/ai-summit/leak-test/',
  resume: '/ai-summit/leak-test/resume/',
  admin: '/ai-summit/leak-test/admin/',
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

// Uploads. Limits are enforced server-side before a file gets an upload URL;
// the browser checks first so the error shows on the row instantly.
export const MAX_FILE_BYTES = 1024 * 1024 * 1024; // 1 GB
export const MAX_INTAKE_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB
export const MAX_FILES = 200;
export const MAX_LINKS = 20;
export const MAX_LINK_CHARS = 500;
export const MAX_NOTES_CHARS = 2000;
export const UPLOAD_CHUNK_BYTES = 8 * 1024 * 1024; // multiple of 256 KiB, as GCS requires

// PDFs, images, video, Office and Apple documents, text, mail. Archives,
// executables, disk images, and scripts are not on the list.
export const ALLOWED_EXTENSIONS = [
  'pdf',
  'png', 'jpg', 'jpeg', 'heic', 'heif', 'gif', 'webp', 'tif', 'tiff', 'bmp',
  'mp4', 'mov', 'm4v', 'avi', 'mkv', 'webm', '3gp', 'mts', 'wmv',
  'doc', 'docx', 'xls', 'xlsx', 'xlsm', 'ppt', 'pptx', 'numbers', 'pages', 'key',
  'csv', 'tsv', 'txt', 'rtf', 'md', 'json', 'xml',
  'eml', 'msg',
] as const;

export function fileExtension(name: string): string {
  const m = /\.([a-z0-9]{1,8})$/i.exec(name.trim());
  return m ? m[1].toLowerCase() : '';
}

// Why a file cannot be uploaded, or '' if it can. Copy is shown on the row.
export function rejectFile(name: string, size: number): string {
  const ext = fileExtension(name);
  if (['zip', 'rar', '7z', 'gz', 'tgz', 'tar'].includes(ext)) return 'ZIP files won’t work here. Add the files inside it instead.';
  if (!ext || !(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) return 'That file type isn’t accepted. PDFs, images, videos, Office files, and text work.';
  if (size > MAX_FILE_BYTES) return 'That file is over 1 GB. Split it or send a smaller export.';
  if (size <= 0) return 'That file is empty.';
  return '';
}

export function formatBytes(n: number): string {
  if (n >= 1024 * 1024 * 1024) return `${(n / (1024 * 1024 * 1024)).toFixed(n >= 10 * 1024 * 1024 * 1024 ? 0 : 1)} GB`;
  if (n >= 1024 * 1024) return `${Math.round(n / (1024 * 1024))} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}
