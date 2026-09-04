import type { World } from '../kernel/world';
import type { AnyComponentType } from '../kernel/component-type';
import type { Entity } from '../types';
import { defineQuery, runQuery } from '../kernel/query';
import { getComponent } from '../kernel/component';
import type { System } from '../pipeline/system';

/**
 * True when a component type declared at least one lifecycle hook.
 */
export const hasLifecycleHooks = (type: AnyComponentType): boolean =>
    type.onStart !== undefined || type.onUpdate !== undefined || type.onDestroy !== undefined;

/**
 * One batched system for a user component type.
 *
 * Ergonomic `onStart` / `onUpdate` / `onDestroy` run here, not as per-entity
 * callbacks scattered through the world. Hooks fire only while simulating
 * (Play ticks and `step()`), never during a paused editor frame.
 *
 * `World._epoch` resets the started set after an in-place restore so the next
 * Play session re-runs `onStart` without treating `step()` as a new session.
 */
export const createLifecycleSystem = (
    type: AnyComponentType,
    isSimulating: () => boolean
): System => {
    const query = defineQuery([type]);
    const started = new Set<Entity>();
    const lastData = new Map<Entity, unknown>();
    let seenEpoch = -1;

    return (world: World, dt: number): void => {
        if (world._epoch !== seenEpoch) {
            started.clear();
            lastData.clear();
            seenEpoch = world._epoch;
        }

        if (!isSimulating()) return;

        const entities = runQuery(world, query);
        const live = new Set<Entity>();

        for (const entity of entities) {
            const data = getComponent(world, entity, type);
            if (data === undefined) continue;

            live.add(entity);
            lastData.set(entity, data);

            if (!started.has(entity)) {
                started.add(entity);
                type.onStart?.({ world, entity, data });
            }

            type.onUpdate?.({ world, entity, data, dt });
        }

        for (const entity of started) {
            if (live.has(entity)) continue;
            started.delete(entity);
            const data = lastData.get(entity);
            lastData.delete(entity);
            if (data !== undefined) {
                type.onDestroy?.({ world, entity, data });
            }
        }
    };
};
