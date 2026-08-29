import { describe, it, expect } from 'vitest';
import { createDefaultInput, Input } from '../../ecs/components/input';

describe('ECS: Input Component', () => {
    it('should have correct ID', () => {
        expect(Input.id).toBe('input');
    });

    it('should initialize with an empty deterministic state', () => {
        const inputState = createDefaultInput();
        
        // Ensure no keys are pressed randomly
        expect(Object.keys(inputState.keys).length).toBe(0);
        expect(Object.keys(inputState.justPressed).length).toBe(0);
        
        // Ensure mouse defaults
        expect(inputState.mouse.x).toBe(0);
        expect(inputState.mouse.y).toBe(0);
        expect(inputState.mouse.buttons).toEqual([false, false, false]);
    });
});
