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
  { id: 'one_login', text: 'Every dealership will run on one login.' },
  { id: 'no_typing', text: 'Nobody will type a repair story ever again.' },
  { id: 'warranty_self', text: 'Warranty claims will approve themselves before the car leaves the bay.' },
  { id: 'robot_oil', text: 'Robots will do the oil changes and ask for a raise.' },
  { id: 'phone_answered', text: 'AI will finally answer the service department phone.' },
  { id: 'no_waiting_room', text: 'Customers will never sit in a waiting room again.' },
  { id: 'loaners_return', text: 'Loaner cars will drive themselves back to the store.' },
  { id: 'parts_early', text: 'Parts will arrive before the car breaks.' },
  { id: 'fire_software', text: 'Dealers will cancel half their software and nobody will notice.' },
  { id: 'vendors_merge', text: 'Every vendor at this summit will merge into one company.' },
  { id: 'mpi_instant', text: 'The inspection will be finished before the car is on the lift.' },
  { id: 'chatbot_closer', text: 'The best closer in the service drive will be a chatbot.' },
  { id: 'young_tech', text: 'The top tech in the store will be 22 and wear a headset.' },
  { id: 'car_books', text: 'Cars will book their own service appointments and show up alone.' },
];

// How many of the presets a visitor sees per page load, picked at random.
export const PRESETS_SHOWN = 4;

export const MAX_PREDICTION_CHARS = 120;
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const MAX_PHOTO_EDGE = 1536;
export const API_PATH = '/api/future-headline';
