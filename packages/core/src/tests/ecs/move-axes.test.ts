import { describe, it, expect } from 'vitest';
import { moveAxesFromInput } from '../../ecs/systems/move-axes';
import { createDefaultInput } from '../../ecs/components/input';

describe('moveAxesFromInput', () => {
    it('is zero with no keys down', () => {
        expect(moveAxesFromInput(createDefaultInput())).toEqual({ x: 0, z: 0 });
    });

    it('maps WASD onto +X right and +Z backward', () => {
        const input = createDefaultInput();
        input.keys['KeyD'] = true;
        expect(moveAxesFromInput(input)).toEqual({ x: 1, z: 0 });

        input.keys['KeyD'] = false;
        input.keys['KeyW'] = true;
        expect(moveAxesFromInput(input)).toEqual({ x: 0, z: -1 });
    });

    it('accepts arrow keys as aliases', () => {
        const input = createDefaultInput();
        input.keys['ArrowLeft'] = true;
        input.keys['ArrowDown'] = true;
        expect(moveAxesFromInput(input)).toEqual({ x: -1, z: 1 });
    });
});
