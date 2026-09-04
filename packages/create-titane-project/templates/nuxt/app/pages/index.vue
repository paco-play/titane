<template>
  <div class="game-root">
    <canvas
      ref="canvasReference"
      class="game-canvas"
      tabindex="0"
    />
  </div>
</template>

<script setup lang="ts">
const canvasReference = ref<HTMLCanvasElement | null>(null);
const { boot, dispose, onResize } = useGameRuntime();

onMounted(async () => {
  if (!canvasReference.value) return;
  await boot(canvasReference.value);
  canvasReference.value.focus();
  window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  dispose();
});
</script>

<style>
.game-root {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #0a0a0a;
}

.game-canvas {
  width: 100%;
  height: 100%;
  display: block;
  outline: none;
}
</style>
