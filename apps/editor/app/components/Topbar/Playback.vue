<template>
  <div class="flex items-center gap-0.5">
    <UButton
      icon="i-lucide-play"
      :color="isPlaying && !isPaused ? 'primary' : 'neutral'"
      :variant="isPlaying && !isPaused ? 'soft' : 'ghost'"
      square
      title="Play"
      :disabled="pendingExitPlay || (isPlaying && !isPaused)"
      @click="play"
    />
    <UButton
      icon="i-lucide-pause"
      :color="isPlaying && isPaused ? 'primary' : 'neutral'"
      :variant="isPlaying && isPaused ? 'soft' : 'ghost'"
      square
      title="Pause"
      :disabled="!isPlaying || isPaused || pendingExitPlay"
      @click="pause"
    />
    <UButton
      icon="i-lucide-square"
      color="neutral"
      variant="ghost"
      square
      title="Stop"
      :disabled="!isPlaying || pendingExitPlay"
      @click="stop"
    />
    <UButton
      icon="i-lucide-skip-forward"
      color="neutral"
      variant="ghost"
      square
      title="Step one frame"
      :disabled="(isPlaying && !isPaused) || pendingExitPlay"
      @click="stepFrame"
    />
  </div>
</template>

<script setup lang="ts">
const {
  isPlaying,
  isPaused,
  pendingExitPlay,
  play,
  pause,
  stop,
  stepFrame
} = useRuntime();
</script>
