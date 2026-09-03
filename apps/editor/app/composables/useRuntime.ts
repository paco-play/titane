import { captureWorldState, restoreWorldState, type World } from '@titane/core';
import { useTitane } from './useTitane';

const isPlaying = ref<boolean>(false);
const isGridVisible = ref<boolean>(true);

/** Scene as it was after the last load or first seed. Independent of play snapshots. */
const editBaseline = shallowRef<World | null>(null);

/**
 * Controls the engine's execution state.
 */
export const useRuntime = () => {
  const { engine, renderer, syncWorld, selectedEntityId, notifyInspect } = useTitane();

  /**
     * Toggles between Simulation mode (Play) and Edit mode (Pause).
     */
  const togglePlay = () => {
    if (!engine.value) return;

    isPlaying.value = !isPlaying.value;

    if (isPlaying.value) {
      // Before launching the simulation, save the "Edit" state
      engine.value.saveSnapshot();
      engine.value.isPaused = false;
    } else {
      engine.value.isPaused = true;
      engine.value.restoreSnapshot();
      syncWorld();
      notifyInspect();
    }
  };

  /**
     * Toggles the visibility of the ground grid.
     */
  const toggleGrid = () => {
    if (!renderer.value) return;

    isGridVisible.value = !isGridVisible.value;
    renderer.value.setGridVisible(isGridVisible.value);
  };

  /**
   * Advances the simulation by one fixed timestep without entering play mode.
   */
  const stepFrame = (): void => {
    if (!engine.value) return;
    isPlaying.value = false;
    engine.value.isPaused = true;
    engine.value.step();
    syncWorld();
    notifyInspect();
  };

  /**
   * Remembers the current world as the scene Reset returns to.
   * Call after a load or after seeding the demo entities.
   */
  const captureBaseline = (): void => {
    if (!engine.value) return;
    editBaseline.value = captureWorldState(engine.value.world);
  };

  /**
   * Restores the world to the last captured baseline without reloading the page.
   */
  const resetScene = (): void => {
    if (!engine.value || !editBaseline.value) return;

    restoreWorldState(engine.value.world, editBaseline.value);
    selectedEntityId.value = null;
    syncWorld();
    notifyInspect();
  };

  return {
    isPlaying,
    togglePlay,
    isGridVisible,
    toggleGrid,
    stepFrame,
    captureBaseline,
    resetScene,
    canReset: computed(() => editBaseline.value !== null)
  };
};
