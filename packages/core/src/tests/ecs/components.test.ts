import { describe, it, expect, beforeEach } from 'vitest';
import { createWorld, World } from '../../ecs/kernel/world';
import { createEntity, cloneEntity } from '../../ecs/kernel/entity';
import { defineComponent } from '../../ecs/kernel/registry';
import {
    addComponent,
    getComponent,
    hasComponent,
    removeComponent,
    updateComponent
} from '../../ecs/kernel/component';

interface Gauge { current: number }
interface Point { x: number, y: number }

const Health = defineComponent<Gauge>('health', () => ({ current: 100 }));
const Mana = defineComponent<Gauge>('mana', () => ({ current: 50 }));
const Position = defineComponent<Point>('position', () => ({ x: 0, y: 0 }));
const Shield = defineComponent<Gauge>('shield', () => ({ current: 10 }));
const Ghost = defineComponent<Gauge>('ghost-stat', () => ({ current: 0 }));

describe('ECS: Component Management', () => {
    let world: World;
    let entity: number;

    beforeEach(() => {
        world = createWorld();
        entity = createEntity(world);
    });

    it('should add a component to an entity', () => {
        addComponent(world, entity, Health, { current: 100 });

        expect(hasComponent(world, entity, Health)).toBe(true);
        expect(getComponent(world, entity, Health)).toEqual({ current: 100 });
    });

    it('should correctly report missing components', () => {
        expect(hasComponent(world, entity, Position)).toBe(false);
        expect(getComponent(world, entity, Position)).toBeUndefined();
    });

    it('should overwrite component data when added again', () => {
        addComponent(world, entity, Position, { x: 0, y: 0 });
        addComponent(world, entity, Position, { x: 10, y: 5 });

        expect(getComponent(world, entity, Position)).toEqual({ x: 10, y: 5 });
    });

    it('should update component using updateComponent safely', () => {
        addComponent(world, entity, Mana, { current: 50 });

        updateComponent(world, entity, Mana, (data) => {
            data.current += 10;
        });

        expect(getComponent(world, entity, Mana)).toEqual({ current: 60 });
    });

    it('should ignore update requests for missing components', () => {
        // This should not throw an error
        updateComponent(world, entity, Ghost, (data) => {
            data.current = 999;
        });

        expect(hasComponent(world, entity, Ghost)).toBe(false);
    });

    it('should remove components from entities', () => {
        addComponent(world, entity, Shield, { current: 10 });
        expect(hasComponent(world, entity, Shield)).toBe(true);

        removeComponent(world, entity, Shield);
        expect(hasComponent(world, entity, Shield)).toBe(false);
    });

    it('should safely ignore removing a component whose store was never created', () => {
        removeComponent(world, entity, Ghost);
        expect(world._stores[Ghost.index]).toBeUndefined();
    });

    it('should seed components from the type factory', () => {
        addComponent(world, entity, Health, Health.create());
        expect(getComponent(world, entity, Health)).toEqual({ current: 100 });
    });

    it('should deep copy every component when cloning an entity', () => {
        addComponent(world, entity, Position, { x: 3, y: 7 });

        const clone = cloneEntity(world, entity);
        const original = getComponent(world, entity, Position);
        const copy = getComponent(world, clone, Position);

        expect(clone).not.toBe(entity);
        expect(copy).toEqual({ x: 3, y: 7 });

        // Mutating the clone must not leak back into the source
        copy!.x = 99;
        expect(original!.x).toBe(3);
    });
});
