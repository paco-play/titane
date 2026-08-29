import type { Entity } from '@titane/core';
import type { ShallowRef } from 'vue';
import { TitaneEngine, ThreeRenderer, Phase, createPlayerControlSystem } from '@titane/core';

const engineInstance = shallowRef<TitaneEngine | null>(null);
const isInitialized = ref(false);

/**
 * A reactive list of active entities.
 * We use shallowRef to avoid Vue's deep proxy overhead on the engine state.
 */
const activeEntities = shallowRef<Set<Entity>>(new Set());

const selectedEntityId = ref<Entity | null>(null);

export const useTitane = () => {

  /**
   * Boots the engine on a canvas, or returns the already running instance.
   * @param canvas - The canvas the renderer draws into.
   */
  const initEngine = (canvas: HTMLCanvasElement): TitaneEngine => {
    if (engineInstance.value) return engineInstance.value;

    const engine = new TitaneEngine(new ThreeRenderer(), canvas);

    // Gameplay is opt-in: the engine ships no player controls of its own.
    engine.addSystem(Phase.UPDATE, createPlayerControlSystem());

    engineInstance.value = engine;

    // The engine keeps its World reference for its whole lifetime, so this
    // Set identity is stable: only triggerRef is needed to notify Vue.
    activeEntities.value = engine.world.entities.active;
    isInitialized.value = true;

    return engine;
  };

  /**
   * Notifies Vue that the world state has changed.
   * Call this after adding/removing entities or restoring the world state.
   */
  const syncWorld = (): void => {
    triggerRef(activeEntities);
  };

  return {
    engine: engineInstance,
    isInitialized,
    /** This ref updates only when syncWorld() is called */
    entities: activeEntities as ShallowRef<Set<Entity>>,
    selectedEntityId,
    initEngine,
    syncWorld
  };
};
