<template>
  <div class="w-full h-full relative overflow-hidden">
    <canvas
      ref="canvasReference"
      class="w-full h-full block outline-none transition-opacity duration-700"
      :class="{ 'opacity-0': !canvasReference, 'opacity-100': canvasReference }"
      tabindex="0"
      @click.left="onCanvasClick"
    />
  </div>
</template>

<script setup lang="ts">
import { addComponent, createPrimitive, Velocity, createVelocity, initPhysics } from '@titane/core';

/** Interval between periodic auto-saves, in milliseconds. */
const AUTOSAVE_INTERVAL_MS = 60_000;

const canvasReference = ref<HTMLCanvasElement | null>(null);
const { initEngine, entities, syncWorld } = useTitane();
const { saveToStorage, saveIfDirty, loadFromStorage } = usePersistence();
const { captureBaseline } = useRuntime();
const { onCanvasClick, onKeyDown } = useViewport();

let autoSaveInterval: number | undefined;
let stopEntityWatch: (() => void) | undefined;

/**
 * Forwards the resize command to the shared engine instance.
 */
const onResize = (): void => {
  const { engine } = useTitane();
  engine.value?.renderer.handleResize();
};

onMounted(async () => {
  if (!canvasReference.value) return;

  await initPhysics();
  const engine = initEngine(canvasReference.value);

  // 1. Persist on every structural change. Registered before the scene exists
  // so the demo cube is saved through the same path as any later edit: it used
  // to be created after the watch and never synced, so a reload before the
  // periodic save re-created it and the scene accumulated duplicates.
  stopEntityWatch = watch(entities, () => saveToStorage());

  // 2. Attempt to recover the previous session
  const hasRecovered = loadFromStorage();

  // 3. Spawn a demo cube only on a truly fresh start.
  // active.size starts at 1 because the engine owns the global input entity.
  if (!hasRecovered && engine.world.entities.active.size <= 1) {
    const demoCube = createPrimitive(engine.world, { name: 'Demo Cube', color: '#4ade80' });
    addComponent(engine.world, demoCube, Velocity, createVelocity(0.4, 0, 0));
    syncWorld();
  }

  captureBaseline();

  // 4. Periodic auto-save for in-place component edits the Set watcher misses.
  autoSaveInterval = window.setInterval(saveIfDirty, AUTOSAVE_INTERVAL_MS);

  // 5. Start simulation and listen for resize
  window.addEventListener('resize', onResize);
  window.addEventListener('keydown', onKeyDown);
  engine.start();
});

onBeforeUnmount(() => {
  stopEntityWatch?.();

  if (autoSaveInterval !== undefined) window.clearInterval(autoSaveInterval);
  window.removeEventListener('resize', onResize);
  window.removeEventListener('keydown', onKeyDown);
});
</script>
