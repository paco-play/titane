import type { ComponentId } from '../types';
import type { Schema } from '../schema/field';
import type { InferSchema } from '../schema/infer';
import { createFromSchema, reviveFromSchema } from '../schema/values';
import type { AnyComponentType, ComponentType } from './component-type';
import type { ComponentStore } from './store';
import type { ComponentLifecycleContext, ComponentUpdateContext } from './lifecycle';
import { patchUserComponent } from './patch-component';

/**
 * Dense list of every registered component type, indexed by `ComponentType.index`.
 * The index is what lets a World resolve a store by array offset.
 */
const typesByIndex: AnyComponentType[] = [];

/** Reverse lookup used when rebuilding a World from serialized data. */
const typesById = new Map<ComponentId, AnyComponentType>();

/**
 * User component declaration. The schema is the single source of truth:
 * TypeScript infers `T` from it, the Inspector renders widgets from it,
 * and deserialize validates against it.
 */
export interface UserComponentConfig<S extends Schema> {
    readonly schema: S;
    onStart?(ctx: ComponentLifecycleContext<InferSchema<S>>): void;
    onUpdate?(ctx: ComponentUpdateContext<InferSchema<S>>): void;
    onDestroy?(ctx: ComponentLifecycleContext<InferSchema<S>>): void;
}

/**
 * Interns a handle into the global registry.
 * @throws If `id` has already been registered.
 */
const intern = <T>(type: ComponentType<T>): ComponentType<T> => {
    if (typesById.has(type.id)) {
        throw new Error(`[Titane] Component "${type.id}" is already registered.`);
    }

    typesByIndex.push(type);
    typesById.set(type.id, type);
    return type;
};

/**
 * Registers a schema-driven user component.
 * Data type, Inspector widgets, defaults and revive all come from `schema`.
 * A second call with the same id patches the interned handle in place (HMR).
 */
export function defineComponent<S extends Schema>(
    id: ComponentId,
    config: UserComponentConfig<S>
): ComponentType<InferSchema<S>>;

/**
 * Registers a built-in component with an explicit factory.
 * Use this form for packed stores or revive hooks that are not schema-driven.
 */
export function defineComponent<T>(
    id: ComponentId,
    create: () => T,
    revive?: (raw: unknown) => T,
    createStore?: () => ComponentStore<T>
): ComponentType<T>;

export function defineComponent(
    id: ComponentId,
    createOrConfig: (() => unknown) | UserComponentConfig<Schema>,
    revive?: (raw: unknown) => unknown,
    createStore?: () => ComponentStore<unknown>
): ComponentType<unknown> {
    if (typeof createOrConfig === 'function') {
        return intern({
            id,
            index: typesByIndex.length,
            create: createOrConfig,
            revive,
            createStore
        });
    }

    const config = createOrConfig;
    const existing = typesById.get(id);
    if (existing) {
        if (!existing.schema) {
            throw new Error(`[Titane] Component "${id}" is already registered.`);
        }
        return patchUserComponent(existing, config);
    }

    return intern({
        id,
        index: typesByIndex.length,
        create: () => createFromSchema(config.schema),
        revive: (raw) => reviveFromSchema(config.schema, raw),
        schema: config.schema,
        onStart: config.onStart,
        onUpdate: config.onUpdate,
        onDestroy: config.onDestroy
    });
}

/**
 * Resolves a component handle from its textual identifier.
 * @param id - The identifier used at registration time.
 * @returns The handle, or undefined if no component uses this id.
 */
export const getComponentTypeById = (id: ComponentId): AnyComponentType | undefined =>
    typesById.get(id);

/**
 * Resolves a component handle from its dense slot index.
 * @param index - The slot index assigned at registration time.
 * @returns The handle, or undefined if the slot is unused.
 */
export const getComponentTypeByIndex = (index: number): AnyComponentType | undefined =>
    typesByIndex[index];

/**
 * Exposes every registered component type in registration order.
 * @returns A read-only view of the registry.
 */
export const getRegisteredTypes = (): readonly AnyComponentType[] => typesByIndex;
