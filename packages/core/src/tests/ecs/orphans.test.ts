import { describe, it, expect } from 'vitest';
import { createWorld } from '../../ecs/kernel/world';
import { createEntity, cloneEntity, destroyEntity } from '../../ecs/kernel/entity';
import { cloneWorld } from '../../ecs/kernel/world-utils';
import { restoreWorldState } from '../../ecs/kernel/state-manager';
import {
    setOrphan,
    listOrphans,
    removeOrphan,
    clearOrphansForEntity
} from '../../ecs/kernel/orphans';

describe('orphan component payloads', () => {
    it('stores, lists and removes a missing-script payload', () => {
        const world = createWorld();
        const entity = createEntity(world);
        setOrphan(world, entity, 'GhostScript', { power: 3 });

        expect(listOrphans(world, entity)).toEqual([{ id: 'GhostScript', data: { power: 3 } }]);

        expect(removeOrphan(world, entity, 'GhostScript')).toBe(true);
        expect(listOrphans(world, entity)).toEqual([]);
        expect(removeOrphan(world, entity, 'GhostScript')).toBe(false);
    });

    it('drops orphans when the entity is destroyed', () => {
        const world = createWorld();
        const entity = createEntity(world);
        setOrphan(world, entity, 'GhostScript', { power: 3 });

        destroyEntity(world, entity);

        expect(listOrphans(world, entity)).toEqual([]);
        expect(world._orphans.size).toBe(0);
    });

    it('copies orphans onto a cloned entity', () => {
        const world = createWorld();
        const entity = createEntity(world);
        setOrphan(world, entity, 'GhostScript', { power: 3 });

        const cloneId = cloneEntity(world, entity);

        expect(listOrphans(world, cloneId)).toEqual([{ id: 'GhostScript', data: { power: 3 } }]);
        const original = listOrphans(world, entity)[0];
        const cloned = listOrphans(world, cloneId)[0];
        expect(cloned?.data).not.toBe(original?.data);
    });

    it('round-trips orphans through cloneWorld and restoreWorldState', () => {
        const world = createWorld();
        const entity = createEntity(world);
        setOrphan(world, entity, 'GhostScript', { power: 3 });

        const snapshot = cloneWorld(world);
        clearOrphansForEntity(world, entity);
        expect(listOrphans(world, entity)).toEqual([]);

        restoreWorldState(world, snapshot);
        expect(listOrphans(world, entity)).toEqual([{ id: 'GhostScript', data: { power: 3 } }]);
        expect(world._epoch).toBeGreaterThan(snapshot._epoch);
    });
});
