import { describe, it, expect, beforeEach } from 'vitest';
import { createWorld, World } from '../../ecs/kernel/world';
import { createEntity } from '../../ecs/kernel/entity';
import { addComponent } from '../../ecs/kernel/component';
import { Transform, createTransform } from '../../ecs/components/transform';
import { setParent } from '../../ecs/kernel/transform-utils';
import { transformSystem } from '../../ecs/systems/transform';

describe('Transform System (Hierarchy)', () => {
    let world: World;

    beforeEach(() => {
        world = createWorld();
    });

    it('should compute the world matrix for a root entity', () => {
        const root = createEntity(world);
        const transform = createTransform(
            { x: 10, y: 5, z: -2 },
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 1, z: 1 }
        );
        addComponent(world, root, Transform, transform);

        // Run the system
        transformSystem(world);

        // Assert world matrix was generated correctly (translation part)
        // Indices 12, 13, 14 in a Float32Array column-major matrix hold X, Y, Z translation
        expect(transform.worldMatrix[12]).toBe(10);
        expect(transform.worldMatrix[13]).toBe(5);
        expect(transform.worldMatrix[14]).toBe(-2);

        // Assert it is no longer dirty
        expect(transform.isDirty).toBe(false);
    });

    it('should propagate transforms from parent to child correctly', () => {
        const parent = createEntity(world);
        const child = createEntity(world);

        // Parent at x = 10
        const parentTransform = createTransform({ x: 10, y: 0, z: 0 });
        addComponent(world, parent, Transform, parentTransform);

        // Child at x = 5 (local)
        const childTransform = createTransform({ x: 5, y: 0, z: 0 });
        addComponent(world, child, Transform, childTransform);

        // Set the relationship
        setParent(world, child, parent);

        transformSystem(world);

        // Child's world position should be 10 + 5 = 15
        expect(childTransform.worldMatrix[12]).toBe(15);
    });

    it('should only recalculate if an entity or its parent is marked dirty', () => {
        const parent = createEntity(world);
        const child = createEntity(world);

        const parentTransform = createTransform({ x: 0, y: 0, z: 0 });
        const childTransform = createTransform({ x: 2, y: 0, z: 0 });

        addComponent(world, parent, Transform, parentTransform);
        addComponent(world, child, Transform, childTransform);
        setParent(world, child, parent);

        // 1. Initial calculation
        transformSystem(world);
        expect(childTransform.worldMatrix[12]).toBe(2);
        expect(parentTransform.isDirty).toBe(false);
        expect(childTransform.isDirty).toBe(false);

        // 2. Change child local position, but NOT parent
        childTransform.position.x = 4;
        childTransform.isDirty = true;

        transformSystem(world);
        expect(childTransform.worldMatrix[12]).toBe(4);
        expect(parentTransform.isDirty).toBe(false); // Parent should not have been marked dirty

        // 3. Change parent position, child should automatically follow even if child is NOT dirty
        parentTransform.position.x = 10;
        parentTransform.isDirty = true;
        // Notice: childTransform.isDirty is still false here because the child itself wasn't touched

        transformSystem(world);
        expect(parentTransform.worldMatrix[12]).toBe(10);
        expect(childTransform.worldMatrix[12]).toBe(14); // 10 + 4
        expect(childTransform.isDirty).toBe(false);
    });
});
