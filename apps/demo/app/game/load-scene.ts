import type { TitaneEngine, SerializedWorld } from '@titane/core';
import { deserializeWorld } from '@titane/core';

/** Public URL of the committed Drop scene. */
export const DROP_SCENE_URL = '/drop.titane';

/**
 * Replaces the live world with `public/drop.titane` when the file is valid.
 * @returns True when a scene was loaded.
 */
export const tryLoadDropScene = async (engine: TitaneEngine): Promise<boolean> => {
  try {
    const response = await fetch(DROP_SCENE_URL);
    if (!response.ok) return false;

    const data = await response.json() as SerializedWorld;
    if (typeof data.version !== 'number' || !Array.isArray(data.entities)) return false;

    engine.loadWorld(deserializeWorld(data));
    return true;
  } catch {
    return false;
  }
};
