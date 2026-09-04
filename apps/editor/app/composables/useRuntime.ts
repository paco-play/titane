import { captureWorldState, restoreWorldState, type World } from '@titane/core';
import { useTitane } from './useTitane';
import { markPersistenceDirty } from '~/utils/persistence-dirty';

const isPlaying = ref<boolean>(false);
const isGridVisible = ref<boolean>(true);
const pendingExitPlay = ref<boolean>(false);

/** Scene as it was after the last load or first seed. Independent of play snapshots. */
const editBaseline = shallowRef<World | null>(null);

/**
 * Controls the engine's execution state.
 */
export const useRuntime = () => {
  const { engine, renderer, syncWorld, selectedEntityId, notifyInspect } = useTitane();
  const { saveToStorage } = usePersistence();

  const applyPlayChrome = (playing: boolean): void => {
    if (!renderer.value) return;
    renderer.value.setEditorChromeEnabled(!playing);
    if (!playing) renderer.value.setGridVisible(isGridVisible.value);
  };

  const enterPlay = (): void => {
    if (!engine.value) return;
    isPlaying.value = true;
    pendingExitPlay.value = false;
    engine.value.saveSnapshot();
    engine.value.isPaused = false;
    applyPlayChrome(true);
  };

  const finishExitPlay = (): void => {
    pendingExitPlay.value = false;
    isPlaying.value = false;
    if (engine.value) engine.value.isPaused = true;
    applyPlayChrome(false);
    syncWorld();
    notifyInspect();
  };

  /**
   * Starts Play, or asks keep/discard when leaving Play.
   */
  const togglePlay = (): void => {
    if (!engine.value) return;
    if (pendingExitPlay.value) return;

    if (!isPlaying.value) {
      enterPlay();
      return;
    }

    engine.value.isPaused = true;
    pendingExitPlay.value = true;
  };

  const discardPlayChanges = (): void => {
    if (!engine.value) return;
    engine.value.restoreSnapshot();
    finishExitPlay();
  };

  const keepPlayChanges = (): void => {
    if (!engine.value) return;
    engine.value.keepPlayChanges();
    markPersistenceDirty();
    saveToStorage();
    captureBaseline();
    finishExitPlay();
  };

  /**
   * Closing the exit dialog without an explicit Keep is Discard.
   */
  const dismissPlayExit = (): void => {
    if (!pendingExitPlay.value) return;
    discardPlayChanges();
  };

  /**
   * Toggles the visibility of the ground grid.
   */
  const toggleGrid = (): void => {
    if (!renderer.value) return;

    isGridVisible.value = !isGridVisible.value;
    if (!isPlaying.value) renderer.value.setGridVisible(isGridVisible.value);
  };

  /**
   * Advances the simulation by one fixed timestep without entering play mode.
   */
  const stepFrame = (): void => {
    if (!engine.value || isPlaying.value) return;
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
    if (!engine.value || !editBaseline.value || isPlaying.value) return;

    restoreWorldState(engine.value.world, editBaseline.value);
    selectedEntityId.value = null;
    syncWorld();
    notifyInspect();
  };

  return {
    isPlaying,
    pendingExitPlay,
    togglePlay,
    keepPlayChanges,
    discardPlayChanges,
    dismissPlayExit,
    isGridVisible,
    toggleGrid,
    stepFrame,
    captureBaseline,
    resetScene,
    canReset: computed(() => editBaseline.value !== null)
  };
};
