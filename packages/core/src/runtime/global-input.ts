import type { World } from '../ecs/kernel/world';
import type { Entity } from '../ecs/types';
import { addComponent } from '../ecs/kernel/component';
import { Input, createDefaultInput } from '../ecs/components/input';
import { Name, createName } from '../ecs/components/name';

/**
 * (Re)installs Input and Name on the global input entity, and re-reserves
 * its ID against the world's counters.
 *
 * A loaded scene brings its own `nextId` and free list, which may both
 * consider this ID available. Handing it out again would let a game object
 * overwrite the input singleton.
 */
export const seedGlobalInput = (world: World, entity: Entity): void => {
    const { entities } = world;

    entities.active.add(entity);

    if (entities.nextId <= entity) {
        entities.nextId = entity + 1;
    }

    const freeSlot = entities.recycled.indexOf(entity);
    if (freeSlot !== -1) entities.recycled.splice(freeSlot, 1);

    addComponent(world, entity, Input, createDefaultInput());
    addComponent(world, entity, Name, createName('System (Global Input)'));
};
