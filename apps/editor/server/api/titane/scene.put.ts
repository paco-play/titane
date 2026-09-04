import { join } from 'node:path';
import { looksLikeSerializedWorld, writeProjectScene } from '../../utils/write-project-scene';

/**
 * Reads a JSON body from Nitro's Node request. Auto-imported `readBody`
 * resolves to h3 v2 (Web Request) while this Nitro still uses h3 v1.
 */
const readJsonBody = async (req: AsyncIterable<unknown>): Promise<unknown> => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    if (typeof chunk === 'string') chunks.push(Buffer.from(chunk));
    else if (chunk instanceof Uint8Array) chunks.push(Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) return null;
  return JSON.parse(raw) as unknown;
};

/**
 * Overwrites the host project's `scenes/main.titane`.
 */
export default defineEventHandler(async (event) => {
  const req = event.node?.req;
  if (!req) {
    throw createError({ statusCode: 500, statusMessage: 'Missing request' });
  }

  let body: unknown;
  try {
    body = await readJsonBody(req);
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Not a Titane scene' });
  }

  if (!looksLikeSerializedWorld(body)) {
    throw createError({ statusCode: 400, statusMessage: 'Not a Titane scene' });
  }

  await writeProjectScene(join(process.cwd(), 'scenes'), body);
  return { ok: true as const };
});
