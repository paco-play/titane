import { join } from 'node:path';
import { isSerializedWorld } from '@titane/core';
import { writeProjectScene } from '../../utils/write-project-scene';

/**
 * Overwrites the host project's `scenes/main.titane`.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<unknown>(event);
  if (!isSerializedWorld(body)) {
    throw createError({ statusCode: 400, statusMessage: 'Not a Titane scene' });
  }

  await writeProjectScene(join(process.cwd(), 'scenes'), body);
  return { ok: true as const };
});
