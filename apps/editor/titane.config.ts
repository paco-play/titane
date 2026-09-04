import type { TitaneConfig } from '@titane/core';
import { gameplayPlugin } from './app/gameplay/gameplayPlugin';

/**
 * Standalone editor boot: sample gameplay is registered through the same
 * `titane.config.ts` seam a generated project uses.
 */
export const titaneConfig: TitaneConfig = {
  plugins: [gameplayPlugin],
};
