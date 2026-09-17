// Image adapter: restage the uploaded photo per photo_direction.
// The model never renders page text. Headlines, dates, and logos are drawn
// by the deterministic renderer in src/scripts/future-headline/render.ts.
import Anthropic from '@anthropic-ai/sdk';
import type { Config } from './config';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';

function prompt(direction: string, peopleCount: number, color: boolean, labels: string[]): string {
  const people = peopleCount === 1 ? 'the one person' : `all ${peopleCount} people`;
  const lettering = labels.length
    ? `The only lettering allowed anywhere in the image is these exact labels, in clean bold capitals, spelled exactly as written, each on the prop the scene calls for: ${labels.map((l) => `"${l}"`).join(', ')}. No other words, letters, or numbers anywhere.`
    : 'No words, letters, or numbers anywhere in the image.';
  return [
    `Restage this photo as the lead press photograph of a satirical tabloid front page. It should be funny at a glance: one big absurd sight gag, exaggerated but played completely straight. It must look like a real photograph taken by a press photographer: photorealistic people, skin, fabric, and lighting. Not an illustration, cartoon, painting, or 3D render. Scene: ${direction}`,
    `The cast is ${people} from the original photo and nobody else. Every face must stay clearly recognizable as the same individual: same facial features, hair, glasses, facial hair, and skin tone. You may change their poses, expressions, clothing, and positions so they act out the scene and react to the gag. Do not add other humans, and do not remove, merge, or duplicate anyone. Robots and machines are welcome.`,
    'Natural anatomy: two arms and two hands per person, five fingers per hand.',
    'Wide landscape composition. The people fill at least half the frame height, in the foreground, faces large, well lit, and unobstructed, with the gag clearly visible around them. Rich, specific, slightly-too-much background detail.',
    lettering,
    'Never show a blank white screen, empty sign, or empty frame. Screens and signs without a label show charts, icons, maps, or pictures. No logos, no watermarks, no captions, no newspaper layout.',
    color
      ? 'Style: vivid, glossy, cinematic editorial photo of a science-fiction near future, dramatic lighting.'
      : 'Style: punchy black-and-white tabloid photojournalism, high contrast, dramatic flash lighting.',
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
  labels: string[],
  timeoutMs: number,
): Promise<string> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'x-goog-api-key': cfg.geminiKey, 'content-type': 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      model: cfg.imageModel,
      input: [
        { type: 'text', text: prompt(direction, peopleCount, color, labels) },
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
                text: `Answer PASS or FAIL only. PASS if the image shows exactly ${peopleCount} ${peopleCount === 1 ? 'person' : 'people'} in the foreground, with no extra limbs, no merged or badly distorted faces, no misspelled or garbled lettering, and no large blank white screens, signs, or frames. Otherwise FAIL.`,
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
