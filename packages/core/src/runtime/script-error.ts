import type { Entity } from '../ecs/types';

/** Lifecycle hook that threw. */
export type LifecycleHookName = 'onStart' | 'onUpdate' | 'onDestroy';

/**
 * Isolated script failure. The engine keeps ticking; the editor displays this.
 */
export interface ScriptError {
    readonly componentId: string;
    readonly entity: Entity;
    readonly hook: LifecycleHookName;
    readonly message: string;
}

/**
 * Reads a thrown value into a one-line message without using `any`.
 */
export const scriptErrorMessage = (thrown: unknown): string => {
    if (thrown instanceof Error) return thrown.message;
    if (typeof thrown === 'string') return thrown;
    return 'Unknown script error';
};
