<template>
  <UHeader title="" class="h-10">
    <template #right>
      <UButton
        :icon="isPlaying ? 'i-lucide-pause' : 'i-lucide-play'"
        color="neutral"
        variant="link"
        size="xs"
        @click="togglePlay"
      />
      <UButton
        :icon="isGridVisible ? 'i-lucide-grid-2x2-x' : 'i-lucide-grid-2x2'"
        color="neutral"
        variant="link"
        size="xs"
        @click="toggleGrid"
      />
    </template>
  </UHeader>
</template>

<script setup lang="ts">
const { isPlaying, togglePlay, isGridVisible, toggleGrid } = useRuntime();
</script>