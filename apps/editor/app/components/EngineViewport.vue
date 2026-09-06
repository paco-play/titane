<template>
  <div class="w-full h-full relative overflow-hidden">
    <canvas
      ref="canvasReference"
      class="w-full h-full block outline-none transition-opacity duration-700"
      :class="{ 'opacity-0': !canvasReference, 'opacity-100': canvasReference }"
      tabindex="0"
      @click.left="onCanvasClick"
      @dragover="onCanvasDragOver"
      @drop="onCanvasDrop"
    />
  </div>
</template>

<script setup lang="ts">
import { addComponent, createPrimitive, Velocity, createVelocity } from '@titane/core';
import { tryLoadProjectScene } from '~/utils/project-scene';
import { bootEditorWorld } from '~/utils/boot-editor-world';

/** Interval between periodic auto-saves, in milliseconds. */
const AUTOSAVE_INTERVAL_MS = 60_000;

const canvasReference = ref<HTMLCanvasElement | null>(null);
const { initEngine, entities, syncWorld } = useTitane();
const { saveToStorage, saveIfDirty, loadFromStorage } = usePersistence();
const { captureBaseline } = useRuntime();
const { onCanvasClick, onCanvasDrop, onCanvasDragOver, onKeyDown } = useViewport();

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

  const engine = initEngine(canvasReference.value);

  // Persist on every structural change. Registered before the scene exists
  // so the first syncWorld() writes the loaded project, not a leftover cube.
  stopEntityWatch = watch(entities, () => saveToStorage());

  await bootEditorWorld({
    loadProject: () => tryLoadProjectScene(engine),
    loadAutosave: () => loadFromStorage(),
    seedEmpty: () => {
      if (engine.world.entities.active.size > 1) return;
      const demoCube = createPrimitive(engine.world, { name: 'Demo Cube', color: '#4ade80' });
      addComponent(engine.world, demoCube, Velocity, createVelocity(0.4, 0, 0));
    }
  });
  syncWorld();
  captureBaseline();

  autoSaveInterval = window.setInterval(saveIfDirty, AUTOSAVE_INTERVAL_MS);

  window.addEventListener('resize', onResize);
  window.addEventListener('keydown', onKeyDown);
  await engine.start();
});

onBeforeUnmount(() => {
  stopEntityWatch?.();

  if (autoSaveInterval !== undefined) window.clearInterval(autoSaveInterval);
  window.removeEventListener('resize', onResize);
  window.removeEventListener('keydown', onKeyDown);
});
</script>
