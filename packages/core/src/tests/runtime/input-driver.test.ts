import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createWorld, World } from '../../ecs/kernel/world';
import { createEntity } from '../../ecs/kernel/entity';
import { addComponent, getComponent } from '../../ecs/kernel/component';
import { createDefaultInput, Input } from '../../ecs/components/input';
import { InputDriver } from '../../runtime/input-driver';
import { Entity } from '../../ecs/types';

describe('Runtime: Input Driver', () => {
    let world: World;
    let inputEntity: Entity;
    let driver: InputDriver;

    beforeEach(() => {
        world = createWorld();
        inputEntity = createEntity(world);
        addComponent(world, inputEntity, Input, createDefaultInput());

        driver = new InputDriver(world, inputEntity);
    });

    it('should map browser keydown events directly to the ECS component via event.code', () => {
        window.dispatchEvent({ type: 'keydown', code: 'KeyW' } as any);
        window.dispatchEvent({ type: 'keydown', code: 'Space' } as any);

        const input = getComponent(world, inputEntity, Input)!;
        expect(input.keys['KeyW']).toBe(true);
        expect(input.keys['Space']).toBe(true);
        expect(input.justPressed['KeyW']).toBe(true);
    });

    it('should map browser keyup events to false', () => {
        window.dispatchEvent({ type: 'keydown', code: 'KeyW' } as any);
        window.dispatchEvent({ type: 'keyup', code: 'KeyW' } as any);

        const input = getComponent(world, inputEntity, Input)!;
        expect(input.keys['KeyW']).toBe(false);
        // justPressed should remain true until the end-of-frame system clears it
        expect(input.justPressed['KeyW']).toBe(true); 
    });

    it('should track mouse button clicks', () => {
        window.dispatchEvent({ type: 'mousedown', button: 0 } as any); // Left click
        
        const input = getComponent(world, inputEntity, Input)!;
        expect(input.mouse.buttons[0]).toBe(true);

        window.dispatchEvent({ type: 'mouseup', button: 0 } as any);
        expect(input.mouse.buttons[0]).toBe(false);
    });

    it('should correctly strip event listeners on dispose() to avoid Memory Leaks', () => {
        const removeSpy = vi.spyOn(window, 'removeEventListener');

        driver.dispose();

        // Ensure key events are unmounted
        expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
        expect(removeSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
        
        // Ensure mouse events are unmounted
        expect(removeSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
        
        removeSpy.mockRestore();
    });
});
