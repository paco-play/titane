import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { SerializedWorld } from '@titane/core';

/** Only this file is ever written. The client cannot pick a path. */
export const PROJECT_SCENE_FILENAME = 'main.titane';

/**
 * True when `raw` looks like a scene payload. Kept here so Nitro never
 * loads `@titane/core` at runtime (directory ESM imports fail in Node).
 */
export const looksLikeSerializedWorld = (raw: unknown): raw is SerializedWorld => {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return false;
  const data = raw as Partial<SerializedWorld>;
  return typeof data.version === 'number'
    && typeof data.nextId === 'number'
    && Array.isArray(data.entities)
    && typeof data.components === 'object'
    && data.components !== null
    && !Array.isArray(data.components);
};

/**
 * Writes `scenes/main.titane`. Pretty JSON so the file diffs in git.
 */
export const writeProjectScene = async (
  scenesDir: string,
  scene: SerializedWorld
): Promise<string> => {
  await mkdir(scenesDir, { recursive: true });
  const target = join(scenesDir, PROJECT_SCENE_FILENAME);
  await writeFile(target, `${JSON.stringify(scene, null, 2)}\n`, 'utf8');
  return target;
};
