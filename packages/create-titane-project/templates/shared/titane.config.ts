import type { TitaneConfig } from '@titane/core';
import { gameplayPlugin } from './src/components/gameplayPlugin';

/**
 * Project plugin list. The editor (dev) and the game runtime both call
 * `applyTitaneConfig` with this object so Add Component and `.titane` agree.
 */
export const titaneConfig: TitaneConfig = {
    plugins: [gameplayPlugin]
};
