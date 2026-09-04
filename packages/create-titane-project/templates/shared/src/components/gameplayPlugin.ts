import type { TitanePlugin } from '@titane/core';
import { PlayerController } from './PlayerController';

/**
 * Registers this project's gameplay components on the live engine.
 */
export const gameplayPlugin: TitanePlugin = {
    name: 'gameplay',
    register(engine) {
        engine.registerComponent(PlayerController);
    }
};
