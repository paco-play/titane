import { describe, it, expect } from 'vitest';
import { createWorld } from '../../ecs/kernel/world';
import { createEntity } from '../../ecs/kernel/entity';
import { addComponent, getComponent } from '../../ecs/kernel/component';
import { createPrimitive } from '../../ecs/kernel/factory';
import { setParent } from '../../ecs/kernel/transform-utils';
import { defineComponent } from '../../ecs/kernel/registry';
import { Transform } from '../../ecs/components/transform';
import { Name } from '../../ecs/components/name';
import { Mesh } from '../../ecs/components/mesh';
import { f } from '../../ecs/schema/fields';
import { setOrphan, listOrphans } from '../../ecs/kernel/orphans';
import { Input, createDefaultInput } from '../../ecs/components/input';
import { serializePrefab, instantiatePrefab, isSerializedPrefab } from '../../ecs/prefab';

const PrefabLink = defineComponent('PrefabLink', {
    schema: {
        target: f.entity()
    }
});

describe('prefabs', () => {
    it('round-trips a parent and child with remapped ids', () => {
        const world = createWorld();
        const root = createPrimitive(world, { name: 'Crate', color: '#ff8800' });
        const child = createPrimitive(world, { name: 'Lid', primitive: 'box' });
        setParent(world, child, root);

        const prefab = serializePrefab(world, root);
        expect(prefab.root).toBe(0);
        expect(prefab.entities).toEqual([0, 1]);
        expect(prefab.components.transform?.['0']).toMatchObject({ parent: null });
        expect(prefab.components.transform?.['1']).toMatchObject({ parent: 0 });

        const copy = createWorld();
        const instance = instantiatePrefab(
            copy,
            JSON.parse(JSON.stringify(prefab)) as typeof prefab
        );

        expect(getComponent(copy, instance, Name)?.value).toBe('Crate');
        expect(getComponent(copy, instance, Mesh)?.color).toBe('#ff8800');
        expect(getComponent(copy, instance, Transform)?.parent).toBeNull();

        const lid = [...copy.entities.active].find((id) =>
            getComponent(copy, id, Name)?.value === 'Lid'
        );
        expect(lid).toBeDefined();
        expect(getComponent(copy, lid!, Transform)?.parent).toBe(instance);
        expect(copy.entities.active.size).toBe(2);
        expect(world.entities.active.has(root)).toBe(true);
    });

    it('remaps f.entity() fields inside the subtree and nulls outsiders', () => {
        const world = createWorld();
        const root = createEntity(world);
        const inside = createEntity(world);
        const outside = createEntity(world);
        addComponent(world, root, Transform, Transform.create());
        addComponent(world, inside, Transform, Transform.create());
        setParent(world, inside, root);
        addComponent(world, root, PrefabLink, { target: inside });
        addComponent(world, inside, PrefabLink, { target: outside });

        const prefab = serializePrefab(world, root);
        expect(prefab.components.PrefabLink?.['0']).toEqual({ target: 1 });
        expect(prefab.components.PrefabLink?.['1']).toEqual({ target: null });

        const copy = createWorld();
        const instance = instantiatePrefab(copy, prefab);
        const child = [...copy.entities.active].find((id) => id !== instance
            && getComponent(copy, id, PrefabLink));

        expect(getComponent(copy, instance, PrefabLink)?.target).toBe(child);
        expect(getComponent(copy, child!, PrefabLink)?.target).toBeNull();
    });

    it('keeps missing-script orphans on the instance', () => {
        const world = createWorld();
        const root = createPrimitive(world, { name: 'Ghost' });
        setOrphan(world, root, 'MissingFx', { intensity: 4 });

        const copy = createWorld();
        const instance = instantiatePrefab(copy, serializePrefab(world, root));

        expect(listOrphans(copy, instance)).toEqual([{ id: 'MissingFx', data: { intensity: 4 } }]);
    });

    it('does not copy Input into the prefab', () => {
        const world = createWorld();
        const root = createPrimitive(world, { name: 'Pad' });
        addComponent(world, root, Input, createDefaultInput());

        const prefab = serializePrefab(world, root);
        expect(prefab.components.input).toBeUndefined();

        const copy = createWorld();
        const instance = instantiatePrefab(copy, prefab);
        expect(getComponent(copy, instance, Input)).toBeUndefined();
    });

    it('rejects a newer prefab format', () => {
        const world = createWorld();
        expect(() => instantiatePrefab(world, {
            version: 99,
            root: 0,
            entities: [0],
            components: {}
        })).toThrow(/newer/);
    });

    it('distinguishes a prefab from a scene payload', () => {
        expect(isSerializedPrefab({ version: 1, root: 0, entities: [0], components: {} })).toBe(true);
        expect(isSerializedPrefab({ version: 1, nextId: 2, entities: [1], components: {} })).toBe(false);
    });
});
