import type { TitanePlugin } from '@titane/core';
import { PlayerController } from './PlayerController';

/**
 * Registers the editor's sample gameplay components on the live engine.
 */
export const gameplayPlugin: TitanePlugin = {
  name: 'editor-gameplay',
  register(engine) {
    engine.registerComponent(PlayerController);
  },
};
