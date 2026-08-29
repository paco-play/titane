import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createWorld, World } from '../../ecs/kernel/world';
import { createEntity } from '../../ecs/kernel/entity';
import { addComponent, getComponent } from '../../ecs/kernel/component';
import {
    createScheduler,
    registerSystem,
    unregisterSystem,
    runScheduler
} from '../../ecs/pipeline/scheduler';
import { Phase } from '../../ecs/pipeline/system';
import { defineComponent } from '../../ecs/kernel/registry';

const Position = defineComponent<{ x: number }>('position', () => ({ x: 0 }));

describe('ECS: System Execution', () => {
    let world: World;

    beforeEach(() => {
        world = createWorld();
    });

    it('should execute registered systems in deterministic phase order', () => {
        const scheduler = createScheduler();
        const executionOrder: Phase[] = [];

        registerSystem(scheduler, Phase.PHYSICS, () => executionOrder.push(Phase.PHYSICS));
        registerSystem(scheduler, Phase.INPUT, () => executionOrder.push(Phase.INPUT));
        registerSystem(scheduler, Phase.UPDATE, () => executionOrder.push(Phase.UPDATE));
        registerSystem(scheduler, Phase.RENDER, () => executionOrder.push(Phase.RENDER));
        registerSystem(scheduler, Phase.POST_PHYSICS, () => executionOrder.push(Phase.POST_PHYSICS));

        // Let's run the scheduler
        runScheduler(scheduler, world, 0.16);

        expect(executionOrder).toEqual([
            Phase.INPUT,
            Phase.UPDATE,
            Phase.PHYSICS,
            Phase.POST_PHYSICS,
            Phase.RENDER
        ]);
    });

    it('should pass correct deltaTime and world to systems', () => {
        const scheduler = createScheduler();
        const systemA = vi.fn();

        registerSystem(scheduler, Phase.UPDATE, systemA);

        const dt = 0.016;
        runScheduler(scheduler, world, dt);

        expect(systemA).toHaveBeenCalledTimes(1);
        expect(systemA).toHaveBeenCalledWith(world, dt);
    });

    it('should allow system logic to mutate entities', () => {
        const scheduler = createScheduler();

        const entity = createEntity(world);
        addComponent(world, entity, Position, { x: 0 });

        const moveSystem = (w: World, dt: number) => {
            const pos = getComponent(w, entity, Position);
            if (pos) {
                pos.x += 10 * dt;
            }
        };

        registerSystem(scheduler, Phase.UPDATE, moveSystem);

        runScheduler(scheduler, world, 1); // 1 second elapsed

        expect(getComponent(world, entity, Position)).toEqual({ x: 10 });
    });

    it('should let games register and remove their own systems', () => {
        const scheduler = createScheduler();
        const gameSystem = vi.fn();

        registerSystem(scheduler, Phase.UPDATE, gameSystem);
        runScheduler(scheduler, world, 0.016);
        expect(gameSystem).toHaveBeenCalledTimes(1);

        expect(unregisterSystem(scheduler, Phase.UPDATE, gameSystem)).toBe(true);
        runScheduler(scheduler, world, 0.016);
        expect(gameSystem).toHaveBeenCalledTimes(1);

        // Removing it twice is a no-op, not an error
        expect(unregisterSystem(scheduler, Phase.UPDATE, gameSystem)).toBe(false);
    });
});
