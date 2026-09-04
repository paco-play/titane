import type { World } from '../kernel/world';
import type { AnyComponentType } from '../kernel/component-type';
import type { Entity } from '../types';
import { defineQuery, runQuery } from '../kernel/query';
import { getComponent } from '../kernel/component';
import type { System } from '../pipeline/system';
import type { LifecycleHookName, ScriptError } from '../../runtime/script-error';
import { scriptErrorMessage } from '../../runtime/script-error';

/**
 * True when a component type declared at least one lifecycle hook.
 */
export const hasLifecycleHooks = (type: AnyComponentType): boolean =>
    type.onStart !== undefined || type.onUpdate !== undefined || type.onDestroy !== undefined;

/**
 * One batched system for a user component type.
 *
 * Hooks fire only while simulating. A throw is isolated to that entity:
 * the rest of the type, other systems, and the editor tick keep running.
 */
export const createLifecycleSystem = (
    type: AnyComponentType,
    isSimulating: () => boolean,
    reportError?: (error: ScriptError) => void
): System => {
    const query = defineQuery([type]);
    const started = new Set<Entity>();
    const lastData = new Map<Entity, unknown>();
    const failed = new Set<Entity>();
    let seenEpoch = -1;
    let seenStart = type.onStart;
    let seenUpdate = type.onUpdate;
    let seenDestroy = type.onDestroy;

    const runHook = (
        hook: LifecycleHookName,
        entity: Entity,
        body: () => void
    ): void => {
        if (failed.has(entity)) return;
        try {
            body();
        } catch (thrown) {
            failed.add(entity);
            reportError?.({
                componentId: type.id,
                entity,
                hook,
                message: scriptErrorMessage(thrown)
            });
        }
    };

    return (world: World, dt: number): void => {
        if (world._epoch !== seenEpoch) {
            started.clear();
            lastData.clear();
            failed.clear();
            seenEpoch = world._epoch;
        }

        if (
            type.onStart !== seenStart
            || type.onUpdate !== seenUpdate
            || type.onDestroy !== seenDestroy
        ) {
            failed.clear();
            seenStart = type.onStart;
            seenUpdate = type.onUpdate;
            seenDestroy = type.onDestroy;
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
                runHook('onStart', entity, () => type.onStart?.({ world, entity, data }));
            }

            runHook('onUpdate', entity, () => type.onUpdate?.({ world, entity, data, dt }));
        }

        for (const entity of started) {
            if (live.has(entity)) continue;
            started.delete(entity);
            const data = lastData.get(entity);
            lastData.delete(entity);
            if (data === undefined) continue;
            runHook('onDestroy', entity, () => type.onDestroy?.({ world, entity, data }));
        }
    };
};
