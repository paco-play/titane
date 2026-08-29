import type { World } from '../kernel/world';
import { defineQuery, runQuery } from '../kernel/query';
import { updateComponent } from '../kernel/component';
import { Input } from '../components/input';

const inputQuery = defineQuery([Input]);

/**
 * Executes strictly at the endgame of a cycle (typically POST_PHYSICS phase).
 * Obliterates `justPressed` impulses exactly ONE frame after they appeared.
 * @param world The current world state.
 */
export const clearInputSystem = (world: World): void => {
    for (const entityId of runQuery(world, inputQuery)) {
        updateComponent(world, entityId, Input, (input) => {
            input.justPressed = {};
        });
    }
};
