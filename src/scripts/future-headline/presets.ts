// Shared by the page, the client flow, and the Netlify function.

export interface Preset {
  id: string;
  text: string;
}

export const PRESETS: Preset[] = [
  { id: 'service_lane', text: 'AI will run the service lane better than we do.' },
  { id: 'cars_negotiate', text: 'Cars will negotiate their own repair orders.' },
  { id: 'fewer_managers', text: 'The best dealerships will need fewer managers.' },
  { id: 'employee_of_month', text: 'Every store will have an AI employee of the month.' },
  { id: 'approve_first', text: 'Customers will approve repairs before an advisor calls.' },
  { id: 'software_talks', text: 'Dealership software will finally talk to other dealership software.' },
];

export const MAX_PREDICTION_CHARS = 120;
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const MAX_PHOTO_EDGE = 1536;
export const API_PATH = '/api/future-headline';
