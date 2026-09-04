import type { AnyComponentType } from '../ecs/kernel/component-type';
import type { System } from '../ecs/pipeline/system';
import { createLifecycleSystem, hasLifecycleHooks } from '../ecs/systems/user-lifecycle';
import type { ScriptError } from './script-error';

/**
 * Per-engine list of user component types exposed to Add Component,
 * plus one batched lifecycle system per type that declared hooks.
 */
export const createComponentHost = (
    addSystem: (system: System) => void,
    isSimulating: () => boolean,
    reportError: (error: ScriptError) => void
) => {
    const userComponents: AnyComponentType[] = [];
    const registered = new Set<string>();
    const lifecycleById = new Set<string>();

    /**
     * Installs the batched lifecycle system the first time hooks exist.
     */
    const ensureLifecycle = (type: AnyComponentType): void => {
        if (lifecycleById.has(type.id) || !hasLifecycleHooks(type)) return;
        lifecycleById.add(type.id);
        addSystem(createLifecycleSystem(type, isSimulating, reportError));
    };

    /**
     * Exposes a user component on this engine instance.
     * Duplicate ids are ignored so a plugin can be retried safely.
     */
    const registerComponent = (type: AnyComponentType): void => {
        if (!registered.has(type.id)) {
            registered.add(type.id);
            userComponents.push(type);
        }
        ensureLifecycle(type);
    };

    const getUserComponents = (): readonly AnyComponentType[] => userComponents;

    return { registerComponent, getUserComponents };
};
