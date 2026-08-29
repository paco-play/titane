import type { World } from '../kernel/world';

/**
 * A System is a simple function that operates on the World.
 * @param world The current world state.
 * @param deltaTime The time elapsed since the last frame in seconds.
 */
export type System = (world: World, deltaTime: number) => void;

/**
 * Deterministic execution phases for the engine pipeline.
 */
export enum Phase {
    INPUT = 'INPUT',               // Gather keyboard/mouse
    UPDATE = 'UPDATE',             // Gameplay logic
    PHYSICS = 'PHYSICS',           // Movement & Collision
    POST_PHYSICS = 'POST_PHYSICS', // Sync after physics step
    RENDER = 'RENDER'              // Final draw call
}

/**
 * Canonical phase order.
 * Declared as an array so execution never relies on object key ordering.
 */
export const PHASE_ORDER: readonly Phase[] = [
    Phase.INPUT,
    Phase.UPDATE,
    Phase.PHYSICS,
    Phase.POST_PHYSICS,
    Phase.RENDER
];
