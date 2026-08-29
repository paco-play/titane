import { describe, it, expect, beforeEach } from 'vitest';
import { createWorld, World } from '../../ecs/kernel/world';
import { createEntity } from '../../ecs/kernel/entity';
import { addComponent, getComponent } from '../../ecs/kernel/component';
import { createDefaultInput, Input } from '../../ecs/components/input';
import { clearInputSystem } from '../../ecs/systems/input-system';

describe('ECS: clearInputSystem', () => {
    let world: World;
    let inputEntity: number;

    beforeEach(() => {
        world = createWorld();
        inputEntity = createEntity(world);
        
        const initialInput = createDefaultInput();
        // Simulate a few keys pressed this frame
        initialInput.justPressed['KeyW'] = true;
        initialInput.justPressed['Space'] = true;
        initialInput.keys['KeyW'] = true; // Key held down
        
        addComponent(world, inputEntity, Input, initialInput);
    });

    it('should clear justPressed impulses completely', () => {
        let input = getComponent(world, inputEntity, Input)!;
        expect(input.justPressed['KeyW']).toBe(true);

        // Simulate frame end (Phase.POST_PHYSICS)
        clearInputSystem(world);

        input = getComponent(world, inputEntity, Input)!;
        // The impulses must vanish
        expect(Object.keys(input.justPressed).length).toBe(0);
        // But held keys must persist across frames
        expect(input.keys['KeyW']).toBe(true); 
    });
});
