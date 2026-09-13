import type { Entity, ScriptError } from '@titane/core';
import type { ShallowRef } from 'vue';
import {
  TitaneEngine,
  Phase,
  applyTitaneConfig,
  createPlayerControlSystem,
  createPhysicsPlayerControlSystem
} from '@titane/core';
import { ThreeRenderer } from '@titane/renderer';
import { markPersistenceDirty } from '~/utils/persistence-dirty';
import { titaneConfig } from '~~/titane.config';

const EDITOR_GAMEPLAY_PLUGIN = 'editor-gameplay';

const engineInstance = shallowRef<TitaneEngine | null>(null);

/**
 * The concrete driver, kept alongside the engine.
 *
 * `engine.renderer` is typed as `IRenderer`, which intentionally knows nothing
 * about editor chrome. Holding the implementation is what gives the UI access
 * to viewport helpers such as the grid.
 */
const rendererInstance = shallowRef<ThreeRenderer | null>(null);

const isInitialized = ref(false);

/**
 * A reactive list of active entities.
 * We use shallowRef to avoid Vue's deep proxy overhead on the engine state.
 */
const activeEntities = shallowRef<Set<Entity>>(new Set());

const selectedEntityId = ref<Entity | null>(null);

/**
 * Hierarchy "World" row. Independent of `selectedEntityId` so a canvas miss
 * can close the Inspector without inspecting the scene by default.
 */
const selectedWorld = ref(false);

watch(selectedEntityId, (entityId) => {
  if (entityId !== null) selectedWorld.value = false;
});

/**
 * Bumped whenever an in-place component edit should refresh the Inspector.
 * Structural changes already go through `syncWorld`; this covers gizmo drags
 * that mutate the same Transform object Vue is already holding.
 */
const inspectTick = ref(0);

const scriptError = shallowRef<ScriptError | null>(null);

export const useTitane = () => {

  /**
   * Boots the engine on a canvas, or returns the already running instance.
   * @param canvas - The canvas the renderer draws into.
   */
  const initEngine = (canvas: HTMLCanvasElement): TitaneEngine => {
    if (engineInstance.value) return engineInstance.value;

    const renderer = new ThreeRenderer();
    const engine = new TitaneEngine(renderer, canvas);

    // Gameplay is opt-in: the engine ships no player controls of its own.
    engine.addSystem(Phase.UPDATE, createPlayerControlSystem());
    engine.addSystem(Phase.UPDATE, createPhysicsPlayerControlSystem());
    applyTitaneConfig(engine, titaneConfig);

    engine.onScriptErrorChange = (error) => {
      scriptError.value = error;
    };
    engine.onUserComponentPatch = () => {
      inspectTick.value += 1;
    };

    if (import.meta.hot && titaneConfig.plugins.some(plugin => plugin.name === EDITOR_GAMEPLAY_PLUGIN)) {
      void import('./useGameplayHotReload').then(({ wireGameplayHotReload }) => {
        wireGameplayHotReload();
      });
    }

    rendererInstance.value = renderer;
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

  const notifyInspect = (): void => {
    inspectTick.value += 1;
  };

  const clearSelection = (): void => {
    selectedWorld.value = false;
    selectedEntityId.value = null;
  };

  /**
   * Flags in-place component edits for the deferred auto-save timer.
   * Structural changes already persist through `syncWorld` + the entity watcher.
   */
  const markDirty = (): void => {
    markPersistenceDirty();
  };

  const clearScriptError = (): void => {
    engineInstance.value?.clearScriptError();
    scriptError.value = null;
  };

  /**
   * Stops the loop and drops the singleton so the next canvas can boot a
   * fresh engine. Needed when the viewport remounts (HMR) onto a new DOM node.
   */
  const disposeEngine = (): void => {
    engineInstance.value?.dispose();
    rendererInstance.value?.dispose();
    engineInstance.value = null;
    rendererInstance.value = null;
    isInitialized.value = false;
    activeEntities.value = new Set();
    clearSelection();
  };

  return {
    engine: engineInstance,
    renderer: rendererInstance,
    isInitialized,
    /** This ref updates only when syncWorld() is called */
    entities: activeEntities as ShallowRef<Set<Entity>>,
    selectedEntityId,
    selectedWorld,
    inspectTick,
    scriptError,
    initEngine,
    disposeEngine,
    syncWorld,
    notifyInspect,
    clearSelection,
    markDirty,
    clearScriptError
  };
};
