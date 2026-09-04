import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { SerializedWorld } from '@titane/core';

/** Only this file is ever written. The client cannot pick a path. */
export const PROJECT_SCENE_FILENAME = 'main.titane';

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
