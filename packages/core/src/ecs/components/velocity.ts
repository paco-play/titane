import { defineComponent } from '../kernel/registry';
import { createVec3Store } from '../kernel/vec3-store';

/**
 * Data structure representing linear velocity, in units per second.
 */
export interface Velocity {
    x: number;
    y: number;
    z: number;
}

/**
 * Factory function to create a new Velocity data object.
 * @returns A clean Velocity object.
 */
export const createVelocity = (x = 0, y = 0, z = 0): Velocity => ({ x, y, z });

/**
 * Typed handle for the Velocity component.
 */
export const Velocity = defineComponent<Velocity>('velocity', createVelocity, undefined, createVec3Store);
