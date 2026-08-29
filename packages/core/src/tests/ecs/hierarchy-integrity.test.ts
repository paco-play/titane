import { describe, it, expect } from 'vitest';
import { createWorld } from '../../ecs/kernel/world';
import { createEntity, destroyEntity } from '../../ecs/kernel/entity';
import { createPrimitive } from '../../ecs/kernel/factory';
import { setParent, getChildren } from '../../ecs/kernel/transform-utils';
import { getComponent, hasComponent } from '../../ecs/kernel/component';
import { Transform } from '../../ecs/components/transform';
import { serializeWorld, deserializeWorld } from '../../ecs/serialization';

describe('Hierarchy integrity on destroy', () => {
    it('destroys the whole subtree, not just the parent', () => {
        const world = createWorld();
        const parent = createPrimitive(world, { name: 'Parent' });
        const child = createPrimitive(world, { name: 'Child' });
        const grandChild = createPrimitive(world, { name: 'GrandChild' });

        setParent(world, child, parent);
        setParent(world, grandChild, child);

        destroyEntity(world, parent);

        expect(world.entities.active.has(parent)).toBe(false);
        expect(world.entities.active.has(child)).toBe(false);
        expect(world.entities.active.has(grandChild)).toBe(false);
        expect(hasComponent(world, child, Transform)).toBe(false);
        expect(hasComponent(world, grandChild, Transform)).toBe(false);
    });

    it('recycles the ids of every destroyed descendant', () => {
        const world = createWorld();
        const parent = createPrimitive(world, { name: 'Parent' });
        const child = createPrimitive(world, { name: 'Child' });
        setParent(world, child, parent);

        destroyEntity(world, parent);

        expect(world.entities.recycled).toContain(parent);
        expect(world.entities.recycled).toContain(child);
    });

    it('does not let a recycled id silently adopt a stale child', () => {
        const world = createWorld();
        const parent = createPrimitive(world, { name: 'Parent' });
        const child = createPrimitive(world, { name: 'Child' });
        setParent(world, child, parent);

        destroyEntity(world, parent);

        // Reusing the freed id must not resurrect the old parent's children
        const reused = createEntity(world);
        expect(getChildren(world, reused)).toEqual([]);
    });

    it('detaches children when only the child is destroyed', () => {
        const world = createWorld();
        const parent = createPrimitive(world, { name: 'Parent' });
        const child = createPrimitive(world, { name: 'Child' });
        setParent(world, child, parent);

        destroyEntity(world, child);

        expect(world.entities.active.has(parent)).toBe(true);
        expect(getChildren(world, parent)).toEqual([]);
    });

    it('survives a serialization round-trip without resurrecting entities', () => {
        const world = createWorld();
        const parent = createPrimitive(world, { name: 'Parent' });
        const child = createPrimitive(world, { name: 'Child' });
        setParent(world, child, parent);

        destroyEntity(world, parent);

        const reloaded = deserializeWorld(serializeWorld(world));

        expect(reloaded.entities.active.size).toBe(0);
        expect(reloaded.entities.recycled).toEqual(world.entities.recycled);
    });

    it('keeps every surviving transform reachable from a root', () => {
        const world = createWorld();
        const keptRoot = createPrimitive(world, { name: 'Kept' });
        const parent = createPrimitive(world, { name: 'Parent' });
        const child = createPrimitive(world, { name: 'Child' });
        setParent(world, child, parent);

        destroyEntity(world, parent);

        // No survivor may point at a dead parent, otherwise it renders in the
        // viewport while being unreachable from the hierarchy tree.
        for (const entity of world.entities.active) {
            const parentId = getComponent(world, entity, Transform)?.parent ?? null;
            if (parentId !== null) expect(world.entities.active.has(parentId)).toBe(true);
        }

        expect(Array.from(world.entities.active)).toEqual([keptRoot]);
    });
});
