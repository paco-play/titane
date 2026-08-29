import type { Vec3 } from '@titane/core';

/**
 * Vector fields of a Transform that the Inspector can edit.
 */
export type TransformField = 'position' | 'rotation' | 'scale';

/**
 * Axis of a 3D vector, derived from the engine type so the two cannot drift.
 */
export type Axis = keyof Vec3;
