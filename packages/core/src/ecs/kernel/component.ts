import type { World } from './world';
import type { Entity } from '../types';
import type { AnyComponentType, ComponentType } from './component-type';
import type { ComponentStore } from './store';
import { createSparseStore } from './store';

/**
 * Single erasure boundary of the ECS: `World._stores` holds heterogeneous data,
 * so exactly one cast is needed to recover the type carried by the handle.
 * Every accessor below builds on this, and stays cast-free.
 * @param world The world state.
 * @param type The component handle.
 * @returns The typed store, or undefined if this component is unused here.
 */
const getStore = <T>(
    world: World,
    type: ComponentType<T>
): ComponentStore<T> | undefined => world._stores[type.index] as ComponentStore<T> | undefined;

/**
 * Resolves the store of a component type, creating it on first use.
 * @param world The world state.
 * @param type The component handle.
 * @returns The store backing this component type.
 */
const getOrCreateStore = <T>(world: World, type: ComponentType<T>): ComponentStore<T> => {
    const existing = getStore(world, type);
    if (existing) return existing;

    const store = type.createStore ? type.createStore() : createSparseStore<T>();
    world._stores[type.index] = store;
    return store;
};

/**
 * Associates a component data object with an entity.
 * Overwrites existing data if the component is already present.
 * @param world The world state.
 * @param entityId The target entity.
 * @param type The component handle returned by `defineComponent`.
 * @param data The initial data for this component.
 */
export const addComponent = <T>(
    world: World,
    entityId: Entity,
    type: ComponentType<T>,
    data: T
): void => {
    const store = getOrCreateStore(world, type);
    const existed = store.has(entityId);
    store.set(entityId, data);
    if (!existed) world._generation += 1;
};

/**
 * Retrieves a component's data for a specific entity.
 * @param world The world state.
 * @param entityId The target entity.
 * @param type The component handle returned by `defineComponent`.
 * @returns The component data or undefined if not present.
 */
export const getComponent = <T>(
    world: World,
    entityId: Entity,
    type: ComponentType<T>
): T | undefined => getStore(world, type)?.get(entityId);

/**
 * Checks if an entity possesses a specific component.
 * @param world The world state.
 * @param entityId The target entity.
 * @param type The component handle returned by `defineComponent`.
 * @returns True if the component exists for this entity.
 */
export const hasComponent = (
    world: World,
    entityId: Entity,
    type: AnyComponentType
): boolean => world._stores[type.index]?.has(entityId) ?? false;

/**
 * Removes a component of a specific type from an entity.
 * @param world The world state.
 * @param entityId The target entity.
 * @param type The component handle to remove.
 */
export const removeComponent = (
    world: World,
    entityId: Entity,
    type: AnyComponentType
): void => {
    if (world._stores[type.index]?.delete(entityId)) world._generation += 1;
};

/**
 * Safely updates a component's data using a callback function.
 * This is the preferred way for the Editor to mutate state.
 * @param world The world state.
 * @param entityId The target entity.
 * @param type The component handle returned by `defineComponent`.
 * @param updater A function that receives the current data and modifies it.
 */
export const updateComponent = <T>(
    world: World,
    entityId: Entity,
    type: ComponentType<T>,
    updater: (current: T) => void
): void => {
    const data = getComponent(world, entityId, type);
    if (data !== undefined) {
        updater(data);
    }
};
