import { describe, it, expect } from 'vitest';
import { createWorld } from '../../ecs/kernel/world';
import { createPrimitive } from '../../ecs/kernel/factory';
import { getComponent } from '../../ecs/kernel/component';
import { Transform } from '../../ecs/components/transform';
import { Mesh } from '../../ecs/components/mesh';
import { Name } from '../../ecs/components/name';

describe('createPrimitive', () => {
    it('defaults to a unit box at the origin', () => {
        const world = createWorld();
        const entity = createPrimitive(world);

        expect(getComponent(world, entity, Name)?.value).toBe('Box');
        expect(getComponent(world, entity, Mesh)?.primitive).toBe('box');
        expect(getComponent(world, entity, Transform)?.position).toEqual({ x: 0, y: 0, z: 0 });
        expect(getComponent(world, entity, Transform)?.rotation).toEqual({ x: 0, y: 0, z: 0 });
        expect(getComponent(world, entity, Transform)?.scale).toEqual({ x: 1, y: 1, z: 1 });
    });

    it('honours scale and rotation on spawn', () => {
        const world = createWorld();
        const entity = createPrimitive(world, {
            name: 'Slab',
            primitive: 'box',
            position: { x: 0, y: -0.25, z: 0 },
            rotation: { x: 0, y: 1.5, z: 0 },
            scale: { x: 12, y: 0.5, z: 12 }
        });

        const transform = getComponent(world, entity, Transform)!;
        expect(transform.position).toEqual({ x: 0, y: -0.25, z: 0 });
        expect(transform.rotation).toEqual({ x: 0, y: 1.5, z: 0 });
        expect(transform.scale).toEqual({ x: 12, y: 0.5, z: 12 });
        expect(getComponent(world, entity, Name)?.value).toBe('Slab');
    });
});
