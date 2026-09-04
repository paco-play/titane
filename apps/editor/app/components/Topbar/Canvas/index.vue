<template>
  <UHeader title="" class="h-10">
    <template #right>
      <TopbarCanvasGizmoModes
        :model-value="gizmoMode"
        :disabled="isPlaying"
        :modes="GIZMO_MODES"
        @update:model-value="setGizmoMode"
      />
      <UBadge
        v-if="isPlaying"
        label="Playing"
        color="success"
        variant="subtle"
        size="xs"
      />
      <UButton
        icon="i-lucide-rotate-ccw"
        color="neutral"
        variant="link"
        size="xs"
        title="Reset scene"
        :disabled="!canReset || isPlaying"
        @click="resetScene"
      />
      <UButton
        :icon="isPlaying ? 'i-lucide-pause' : 'i-lucide-play'"
        color="neutral"
        variant="link"
        size="xs"
        :title="isPlaying ? 'Pause' : 'Play'"
        @click="togglePlay"
      />
      <UButton
        icon="i-lucide-skip-forward"
        color="neutral"
        variant="link"
        size="xs"
        title="Step one frame"
        :disabled="isPlaying"
        @click="stepFrame"
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
import type { GizmoModeOption } from './GizmoModes.vue';

const { isPlaying, togglePlay, isGridVisible, toggleGrid, resetScene, canReset, stepFrame } = useRuntime();
const { gizmoMode, setGizmoMode } = useViewport();

const GIZMO_MODES = [
  { id: 'translate', icon: 'i-lucide-move', title: 'Translate (W)' },
  { id: 'rotate', icon: 'i-lucide-rotate-3d', title: 'Rotate (E)' },
  { id: 'scale', icon: 'i-lucide-maximize-2', title: 'Scale (R)' }
] as const satisfies readonly GizmoModeOption[];
</script>
