import { describe, it, expect, beforeEach } from 'vitest';
import { createWorld, World } from '../../ecs/kernel/world';
import { createEntity, destroyEntity } from '../../ecs/kernel/entity';

describe('ECS: World & Entities', () => {
    let world: World;

    beforeEach(() => {
        world = createWorld();
    });

    it('should initialize a clean world', () => {
        expect(world.entities.nextId).toBe(0);
        expect(world.entities.active.size).toBe(0);
        expect(world.entities.recycled.length).toBe(0);
        expect(world._stores.length).toBe(0);
    });

    it('should create entities with unique ascending IDs', () => {
        const entity1 = createEntity(world);
        const entity2 = createEntity(world);

        expect(entity1).toBe(0);
        expect(entity2).toBe(1);
        expect(world.entities.active.size).toBe(2);
        expect(world.entities.active.has(entity1)).toBe(true);
        expect(world.entities.active.has(entity2)).toBe(true);
    });

    it('should correctly destroy an entity', () => {
        const entity = createEntity(world);
        expect(world.entities.active.has(entity)).toBe(true);

        destroyEntity(world, entity);

        expect(world.entities.active.has(entity)).toBe(false);
        expect(world.entities.recycled).toContain(entity);
    });

    it('should recycle IDs when spawning new entities', () => {
        const entity1 = createEntity(world); // 0
        const entity2 = createEntity(world); // 1
        expect(entity2).toBe(1); // Ensure it's read
        
        destroyEntity(world, entity1);
        
        // Entity 1's ID (0) should be recycled
        const newEntity = createEntity(world);
        expect(newEntity).toBe(entity1); 
        expect(world.entities.recycled.length).toBe(0);
        expect(world.entities.nextId).toBe(2); // Next ID stays at 2
    });

    it('should safely ignore destroying a non-active entity', () => {
        destroyEntity(world, 999);
        expect(world.entities.recycled.length).toBe(0);
        expect(world.entities.active.size).toBe(0);
    });
});
