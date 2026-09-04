import type { World } from './world';
import type { Entity } from '../types';

/**
 * Context passed to `onStart` / `onDestroy`.
 * `data` is the live component instance for this entity.
 */
export interface ComponentLifecycleContext<T> {
    readonly world: World;
    readonly entity: Entity;
    readonly data: T;
}

/**
 * Context passed to `onUpdate`. `dt` is the simulation step in seconds.
 */
export interface ComponentUpdateContext<T> extends ComponentLifecycleContext<T> {
    readonly dt: number;
}
