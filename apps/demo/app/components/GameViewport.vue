<template>
  <div class="relative w-screen h-screen overflow-hidden bg-neutral-950">
    <canvas
      ref="canvasReference"
      class="w-full h-full block outline-none"
      tabindex="0"
    />
    <GameHud
      :status="status"
      :live="live"
      @restart="restart"
    />
  </div>
</template>

<script setup lang="ts">
const canvasReference = ref<HTMLCanvasElement | null>(null);
const { status, live, boot, restart, dispose, onResize } = useGame();

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
