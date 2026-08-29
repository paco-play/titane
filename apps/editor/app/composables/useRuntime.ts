import { useTitane } from './useTitane';

const isPlaying = ref<boolean>(false);
const isGridVisible = ref<boolean>(true);

/**
 * Controls the engine's execution state.
 */
export const useRuntime = () => {
  const { engine, renderer, syncWorld } = useTitane();

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
      // Optionnel : we restore directly to return to the initial state
      engine.value.restoreSnapshot();
      syncWorld();
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
     * Steps the simulation by exactly one frame (useful for debugging).
     */
  const stepFrame = () => {
    if (!engine.value) return;
    isPlaying.value = false;
    engine.value.isPaused = false;
    // Let the loop run once then pause again
    setTimeout(() => {
      if (engine.value) engine.value.isPaused = true;
    }, 16);
  };

  return {
    isPlaying,
    togglePlay,
    isGridVisible,
    toggleGrid,
    stepFrame
  };
}