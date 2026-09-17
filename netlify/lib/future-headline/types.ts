export type Outcome = 'utopia' | 'dystopia';

// What a text source (model or bank) supplies.
export interface StoryDraft {
  headline: string;
  punchline: string;
  deck: string;
  kicker: string;
  photo_direction: string;
  // Exact words the image model may letter onto props. Everything else in the
  // photo stays wordless. Headlines, dates, and logos are never in this list.
  prop_labels?: string[];
  alt_text: string;
}

// What the browser receives. photo_direction never leaves the server.
export interface Story {
  future_year: number;
  outcome: Outcome;
  headline: string;
  punchline: string;
  deck: string;
  kicker: string;
  alt_text: string;
}

export class FhError extends Error {
  constructor(
    public code:
      | 'disabled'
      | 'capacity'
      | 'session_cap'
      | 'rate_limited'
      | 'bad_photo'
      | 'unsafe'
      | 'upstream',
    public status: number,
  ) {
    super(code);
  }
}
