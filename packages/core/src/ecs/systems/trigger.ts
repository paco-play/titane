import type { Entity } from '../types';
import type { System } from '../pipeline/system';
import type { World } from '../kernel/world';
import { getPhysicsSession, getIntersections } from '../../physics/session';

/**
 * Creates a system that fires `onEnter` / `onExit` callbacks when any entity
 * enters or leaves the sensor zone attached to `sensorEntity`.
 *
 * The system is stateful: it tracks the set of entities that were inside the
 * zone on the previous tick so it can detect the exact frame of entry/exit.
 *
 * @param sensorEntity - The ECS entity whose `Sensor` collider acts as the zone.
 * @param onEnter      - Called once per tick for each newly-entering entity.
 * @param onExit       - Called once per tick for each newly-leaving entity.
 */
export const createTriggerSystem = (
    sensorEntity: Entity,
    onEnter: (entity: Entity) => void,
    onExit: (entity: Entity) => void,
): System => {
    /** Entities inside the zone as of the previous tick. */
    const prev = new Set<Entity>();

    return (world: World): void => {
        const session = getPhysicsSession(world);
        if (!session) return;

        const current = getIntersections(session, sensorEntity);

        for (const entity of current) {
            if (!prev.has(entity)) onEnter(entity);
        }

        for (const entity of prev) {
            if (!current.has(entity)) onExit(entity);
        }

        prev.clear();
        for (const entity of current) prev.add(entity);
    };
};
