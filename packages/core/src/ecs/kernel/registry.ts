import type { ComponentId } from '../types';
import type { AnyComponentType, ComponentType } from './component-type';
import type { ComponentStore } from './store';

/**
 * Dense list of every registered component type, indexed by `ComponentType.index`.
 * The index is what lets a World resolve a store by array offset.
 */
const typesByIndex: AnyComponentType[] = [];

/** Reverse lookup used when rebuilding a World from serialized data. */
const typesById = new Map<ComponentId, AnyComponentType>();

/**
 * Registers a new component kind and returns its typed handle.
 *
 * The returned handle is the only key accepted by the ECS accessors, which is
 * what makes them fully type-safe: the data type travels with the token.
 *
 * @param id - Stable textual identifier, also used by serialization.
 * @param create - Factory producing a fresh instance with default values.
 * @param revive - Optional rebuilder for components holding non-JSON values.
 * @param createStore - Optional packed store factory for hot numeric components.
 * @returns The typed component handle.
 * @throws If `id` has already been registered.
 */
export const defineComponent = <T>(
    id: ComponentId,
    create: () => T,
    revive?: (raw: unknown) => T,
    createStore?: () => ComponentStore<T>
): ComponentType<T> => {
    if (typesById.has(id)) {
        throw new Error(`[Titane] Component "${id}" is already registered.`);
    }

    const type: ComponentType<T> = {
        id,
        index: typesByIndex.length,
        create,
        revive,
        createStore
    };

    typesByIndex.push(type);
    typesById.set(id, type);

    return type;
};

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
