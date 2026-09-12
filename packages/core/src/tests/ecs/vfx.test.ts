import { describe, expect, it } from 'vitest';
import { addComponent, getComponent } from '../../ecs/kernel/component';
import { createEntity } from '../../ecs/kernel/entity';
import { createWorld } from '../../ecs/kernel/world';
import { Vfx } from '../../ecs/components/vfx';
import { deserializeWorld, serializeWorld, type SerializedWorld } from '../../ecs/serialization';

describe('Vfx', () => {
    it('defaults to a looping untextured emitter', () => {
        expect(Vfx.create()).toEqual({
            mode: 'loop',
            lifetime: 1,
            rate: 16,
            color: '#ffffff',
            size: 0.2,
            texture: ''
        });
    });

    it('round-trips authored params through .titane JSON', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Vfx, {
            mode: 'burst',
            lifetime: 0.4,
            rate: 32,
            color: '#facc15',
            size: 0.15,
            texture: '/assets/spark.png'
        });

        const restored = deserializeWorld(
            JSON.parse(JSON.stringify(serializeWorld(world))) as SerializedWorld
        );

        expect(getComponent(restored, entity, Vfx)).toEqual({
            mode: 'burst',
            lifetime: 0.4,
            rate: 32,
            color: '#facc15',
            size: 0.15,
            texture: '/assets/spark.png'
        });
    });
});
