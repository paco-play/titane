import type { Input } from '../components/input';

/** Default WASD speed, in world units per second. */
export const PLAYER_MOVE_SPEED = 5;

/**
 * Horizontal move axes from keyboard state.
 * +X is right, +Z is backward (Three.js / engine convention).
 */
export interface MoveAxes {
    x: number;
    z: number;
}

/**
 * Reads WASD and arrow keys into a -1 / 0 / +1 pair.
 * Diagonals are not normalized: that matches the existing velocity player.
 */
export const moveAxesFromInput = (input: Input): MoveAxes => {
    const forward = input.keys['ArrowUp'] || input.keys['KeyW'] ? 1 : 0;
    const backward = input.keys['ArrowDown'] || input.keys['KeyS'] ? 1 : 0;
    const left = input.keys['ArrowLeft'] || input.keys['KeyA'] ? 1 : 0;
    const right = input.keys['ArrowRight'] || input.keys['KeyD'] ? 1 : 0;

    return {
        x: right - left,
        z: backward - forward
    };
};
