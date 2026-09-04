import type { AnyComponentType } from '../ecs/kernel/component-type';
import type { System } from '../ecs/pipeline/system';
import { createLifecycleSystem, hasLifecycleHooks } from '../ecs/systems/user-lifecycle';

/**
 * Per-engine list of user component types exposed to Add Component,
 * plus one batched lifecycle system per type that declared hooks.
 */
export const createComponentHost = (
    addSystem: (system: System) => void,
    isSimulating: () => boolean
) => {
    const userComponents: AnyComponentType[] = [];
    const registered = new Set<string>();

    /**
     * Exposes a user component on this engine instance.
     * Duplicate ids are ignored so a plugin can be retried safely.
     */
    const registerComponent = (type: AnyComponentType): void => {
        if (registered.has(type.id)) return;
        registered.add(type.id);
        userComponents.push(type);
        if (hasLifecycleHooks(type)) {
            addSystem(createLifecycleSystem(type, isSimulating));
        }
    };

    const getUserComponents = (): readonly AnyComponentType[] => userComponents;

    return { registerComponent, getUserComponents };
};
