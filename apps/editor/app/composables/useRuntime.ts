import { captureWorldState, restoreWorldState, type World } from '@titane/core';
import type { ColliderOverlayMode } from '@titane/renderer';
import { useTitane } from './useTitane';
import { markPersistenceDirty } from '~/utils/persistence-dirty';

const isPlaying = ref<boolean>(false);
const isPaused = ref<boolean>(true);
const isGridVisible = ref<boolean>(true);
const colliderOverlayMode = ref<ColliderOverlayMode>('selected');
const isNavOverlayVisible = ref<boolean>(true);
const pendingExitPlay = ref<boolean>(false);

/** Scene as it was after the last load or first seed. Independent of play snapshots. */
const editBaseline = shallowRef<World | null>(null);

let playHierarchyRaf = 0;

/**
 * Controls the engine's execution state.
 */
export const useRuntime = () => {
  const { engine, renderer, syncWorld, clearSelection, notifyInspect } = useTitane();

  const stopPlayHierarchySync = (): void => {
    if (playHierarchyRaf === 0) return;
    cancelAnimationFrame(playHierarchyRaf);
    playHierarchyRaf = 0;
  };

  const startPlayHierarchySync = (): void => {
    stopPlayHierarchySync();
    if (!engine.value) return;
    let lastSize = engine.value.world.entities.active.size;
    const loop = (): void => {
      if (!isPlaying.value || !engine.value) {
        playHierarchyRaf = 0;
        return;
      }
      const size = engine.value.world.entities.active.size;
      if (size !== lastSize) {
        lastSize = size;
        syncWorld();
      }
      playHierarchyRaf = requestAnimationFrame(loop);
    };
    playHierarchyRaf = requestAnimationFrame(loop);
  };

  const applyPlayChrome = (playing: boolean): void => {
    if (!renderer.value) return;
    renderer.value.setEditorChromeEnabled(!playing);
    if (!playing) {
      renderer.value.setGridVisible(isGridVisible.value);
      renderer.value.setColliderOverlayMode(colliderOverlayMode.value);
      renderer.value.setNavOverlayVisible(isNavOverlayVisible.value);
    }
  };

  const enterPlay = (): void => {
    if (!engine.value) return;
    isPlaying.value = true;
    isPaused.value = false;
    pendingExitPlay.value = false;
    engine.value.saveSnapshot();
    engine.value.isPaused = false;
    applyPlayChrome(true);
    startPlayHierarchySync();
  };

  const finishExitPlay = (): void => {
    stopPlayHierarchySync();
    pendingExitPlay.value = false;
    isPlaying.value = false;
    isPaused.value = true;
    if (engine.value) engine.value.isPaused = true;
    applyPlayChrome(false);
    syncWorld();
    notifyInspect();
  };

  /**
   * Enters Play, or resumes after Pause.
   */
  const play = (): void => {
    if (!engine.value || pendingExitPlay.value) return;
    if (!isPlaying.value) {
      enterPlay();
      return;
    }
    if (!isPaused.value) return;
    isPaused.value = false;
    engine.value.isPaused = false;
  };

  /**
   * Freezes the simulation without leaving Play.
   */
  const pause = (): void => {
    if (!engine.value || !isPlaying.value || isPaused.value || pendingExitPlay.value) return;
    isPaused.value = true;
    engine.value.isPaused = true;
  };

  /**
   * Leaves Play and asks keep/discard for session edits.
   */
  const stop = (): void => {
    if (!engine.value || !isPlaying.value || pendingExitPlay.value) return;
    engine.value.isPaused = true;
    isPaused.value = true;
    pendingExitPlay.value = true;
  };

  const discardPlayChanges = (): void => {
    if (!engine.value || !pendingExitPlay.value) return;
    engine.value.restoreSnapshot();
    finishExitPlay();
  };

  const keepPlayChanges = (): void => {
    if (!engine.value || !pendingExitPlay.value) return;
    engine.value.keepPlayChanges();
    markPersistenceDirty();
    usePersistence().saveToStorage();
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
   * Cycles collider wireframes between the current selection and every collider.
   */
  const toggleColliderOverlay = (): void => {
    if (!renderer.value) return;

    colliderOverlayMode.value = colliderOverlayMode.value === 'selected' ? 'all' : 'selected';
    if (!isPlaying.value) renderer.value.setColliderOverlayMode(colliderOverlayMode.value);
  };

  /**
   * Toggles walkable nav-grid quads in the viewport.
   */
  const toggleNavOverlay = (): void => {
    if (!renderer.value) return;

    isNavOverlayVisible.value = !isNavOverlayVisible.value;
    if (!isPlaying.value) renderer.value.setNavOverlayVisible(isNavOverlayVisible.value);
  };

  /**
   * Advances the simulation by one fixed timestep without entering play mode.
   */
  const stepFrame = (): void => {
    if (!engine.value || (isPlaying.value && !isPaused.value)) return;
    engine.value.isPaused = true;
    engine.value.step();
    syncWorld();
    notifyInspect();
  };

  /**
   * Remembers the current world as the scene Reset returns to.
   * Call after a load or after seeding the default entities.
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
    clearSelection();
    syncWorld();
    notifyInspect();
  };

  return {
    isPlaying,
    isPaused,
    pendingExitPlay,
    play,
    pause,
    stop,
    keepPlayChanges,
    discardPlayChanges,
    dismissPlayExit,
    isGridVisible,
    toggleGrid,
    colliderOverlayMode,
    toggleColliderOverlay,
    isNavOverlayVisible,
    toggleNavOverlay,
    stepFrame,
    captureBaseline,
    resetScene,
    canReset: computed(() => editBaseline.value !== null)
  };
};
