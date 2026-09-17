// Image adapter: restage the uploaded photo per photo_direction.
// The model never renders page text. Headlines, dates, and logos are drawn
// by the deterministic renderer in src/scripts/future-headline/render.ts.
import Anthropic from '@anthropic-ai/sdk';
import type { Config } from './config';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';

function prompt(direction: string, peopleCount: number, color: boolean): string {
  const people = peopleCount === 1 ? 'the one person' : `all ${peopleCount} people`;
  return [
    `Edit this photo into a press photograph for a satirical newspaper front page. Scene: ${direction}`,
    `Keep ${people} from the original photo. Each face must stay clearly recognizable as the same individual, with the same hair, glasses, facial hair, skin tone, and approximate pose and position relative to each other. Do not add any other people, and do not remove, merge, or duplicate anyone.`,
    'Natural anatomy: two arms and two hands per person, five fingers per hand.',
    'Keep the people large in the frame, in the lower two thirds, in a wide landscape composition with the scene visible around and behind them.',
    'Absolutely no text, letters, numbers, words, signs, captions, logos, or watermarks anywhere in the image. Screens and signs are blank or show abstract shapes only.',
    color
      ? 'Style: glossy, slightly cool-toned editorial photo of a near-future dealership, realistic lighting.'
      : 'Style: gritty black-and-white newspaper photojournalism, high contrast, realistic lighting.',
  ].join('\n');
}

// The Interactions response nests the image in output steps. Walk the whole
// body for the first image block rather than depend on one exact path.
function findImage(node: unknown): string | null {
  if (!node || typeof node !== 'object') return null;
  const obj = node as Record<string, unknown>;
  const mime = (obj.mime_type || obj.mimeType) as string | undefined;
  if (typeof obj.data === 'string' && obj.data.length > 1000 && (obj.type === 'image' || mime?.startsWith('image/'))) {
    return obj.data;
  }
  for (const value of Object.values(obj)) {
    const found = findImage(value);
    if (found) return found;
  }
  return null;
}

export async function restagePhoto(
  cfg: Config,
  photoBase64: string,
  direction: string,
  peopleCount: number,
  color: boolean,
  timeoutMs: number,
): Promise<string> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'x-goog-api-key': cfg.geminiKey, 'content-type': 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      model: cfg.imageModel,
      input: [
        { type: 'text', text: prompt(direction, peopleCount, color) },
        { type: 'image', mime_type: 'image/jpeg', data: photoBase64 },
      ],
      response_format: { type: 'image', mime_type: 'image/jpeg', aspect_ratio: '16:9', image_size: '1K' },
    }),
  });
  if (!res.ok) {
    // Status only. Provider error bodies can echo prompt content.
    throw new Error(`image provider ${res.status}`);
  }
  const image = findImage(await res.json());
  if (!image) throw new Error('image provider returned no image');
  return image;
}

// Cheap second look: did the restaged image keep the head count and avoid
// obvious deformities or lettering? Fails open so a checker outage never
// blocks a result.
export async function imageLooksRight(
  cfg: Config,
  imageBase64: string,
  peopleCount: number,
): Promise<boolean> {
  try {
    const client = new Anthropic({ apiKey: cfg.anthropicKey });
    const response = await client.messages.create(
      {
        model: 'claude-haiku-4-5',
        max_tokens: 20,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
              {
                type: 'text',
                text: `Answer PASS or FAIL only. PASS if the image shows exactly ${peopleCount} ${peopleCount === 1 ? 'person' : 'people'} in the foreground, with no extra limbs, merged or badly distorted faces, and no large garbled lettering. Otherwise FAIL.`,
              },
            ],
          },
        ],
      },
      { timeout: 7_000, maxRetries: 0 },
    );
    const block = response.content.find((b) => b.type === 'text');
    return !(block && block.type === 'text' && /FAIL/i.test(block.text));
  } catch {
    return true;
  }
}
