import type { TitaneEngine, SerializedWorld } from '@titane/core';
import { deserializeWorld } from '@titane/core';

/** Dev-served project scene (`scenes/` via Nitro publicAssets). */
export const PROJECT_SCENE_URL = '/scenes/main.titane';

/**
 * Replaces the live world with `scenes/main.titane` when the file is valid.
 * @param engine - The running editor engine.
 * @returns True when a scene was loaded.
 */
export const tryLoadProjectScene = async (engine: TitaneEngine): Promise<boolean> => {
  try {
    const response = await fetch(PROJECT_SCENE_URL);
    if (!response.ok) return false;

    const data = await response.json() as SerializedWorld;
    if (typeof data.version !== 'number' || !Array.isArray(data.entities)) return false;

    engine.loadWorld(deserializeWorld(data));
    return true;
  }
  catch {
    return false;
  }
};
