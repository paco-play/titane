import { describe, it, expect } from 'vitest';
import { createWorld } from '../../ecs/kernel/world';
import { createEntity, cloneEntity, destroyEntity } from '../../ecs/kernel/entity';
import { addComponent, getComponent, removeComponent } from '../../ecs/kernel/component';
import { Transform, createTransform } from '../../ecs/components/transform';
import { Velocity, createVelocity } from '../../ecs/components/velocity';
import { defineQuery, runQuery } from '../../ecs/kernel/query';
import { serializeWorld, deserializeWorld } from '../../ecs/serialization';
import { captureWorldState, restoreWorldState } from '../../ecs/kernel/state-manager';

describe('SoA component stores', () => {
    it('packs Transform so mutations write through the view', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform({ x: 1, y: 2, z: 3 }));

        const transform = getComponent(world, entity, Transform);
        expect(transform?.position.x).toBe(1);
        transform!.position.x = 9;
        expect(getComponent(world, entity, Transform)?.position.x).toBe(9);
        expect(getComponent(world, entity, Transform)).toBe(transform);
    });

    it('packs Velocity so a clone does not alias the source', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform());
        addComponent(world, entity, Velocity, createVelocity(1, 0, 0));

        const clone = cloneEntity(world, entity);
        const original = getComponent(world, entity, Velocity)!;
        const copy = getComponent(world, clone, Velocity)!;

        copy.x = 99;
        expect(original.x).toBe(1);
    });

    it('detaches a recycled id so a stale view cannot write the new occupant', () => {
        const world = createWorld();
        const first = createEntity(world);
        addComponent(world, first, Transform, createTransform({ x: 4, y: 0, z: 0 }));
        const stale = getComponent(world, first, Transform)!;

        destroyEntity(world, first);
        const reused = createEntity(world);
        addComponent(world, reused, Transform, createTransform({ x: 0, y: 0, z: 0 }));

        stale.position.x = 50;
        expect(getComponent(world, reused, Transform)?.position.x).toBe(0);
        expect(reused).toBe(first);
    });

    it('round-trips a packed transform through JSON', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform({ x: 8, y: 1, z: 2 }));

        const restored = deserializeWorld(JSON.parse(JSON.stringify(serializeWorld(world))));
        expect(getComponent(restored, entity, Transform)?.position.x).toBe(8);
        expect(getComponent(restored, entity, Transform)?.worldMatrix).toBeInstanceOf(Float32Array);
    });

    it('restores a packed transform in place without replacing the store', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform({ x: 3, y: 0, z: 0 }));

        const store = world._stores[Transform.index];
        const snapshot = captureWorldState(world);
        getComponent(world, entity, Transform)!.position.x = 99;
        restoreWorldState(world, snapshot);

        expect(world._stores[Transform.index]).toBe(store);
        expect(getComponent(world, entity, Transform)?.position.x).toBe(3);
    });
});

describe('query cache', () => {
    it('reuses results until component membership changes', () => {
        const world = createWorld();
        const query = defineQuery([Transform]);
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform());

        runQuery(world, query);
        const generation = world._generation;
        getComponent(world, entity, Transform)!.position.x = 5;
        runQuery(world, query);
        expect(world._generation).toBe(generation);

        addComponent(world, entity, Velocity, createVelocity());
        expect(world._generation).toBeGreaterThan(generation);
        expect(runQuery(world, query)).toEqual([entity]);
    });

    it('invalidates when a component is removed', () => {
        const world = createWorld();
        const query = defineQuery([Transform, Velocity]);
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform());
        addComponent(world, entity, Velocity, createVelocity());

        expect(runQuery(world, query)).toEqual([entity]);
        removeComponent(world, entity, Velocity);
        expect(runQuery(world, query)).toEqual([]);
    });
});
