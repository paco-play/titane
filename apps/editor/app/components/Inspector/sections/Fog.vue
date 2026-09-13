<template>
  <InspectorSection
    title="Fog"
    icon="i-lucide-cloud-fog"
  >
    <div
      class="space-y-3"
      :data-tick="inspectTick"
    >
      <InspectorColorField
        label="Color"
        :value="fog.color"
        @update="emit('updateColor', $event)"
        @commit="emit('commit')"
      />
      <InspectorNumberField
        label="Fade distance"
        :value="fog.fadeDistance"
        :inspect-tick="inspectTick"
        :min="0.1"
        :max="500"
        :step="1"
        @update="emit('updateFadeDistance', $event)"
        @commit="emit('commit')"
      />
      <p class="text-[11px] text-muted">
        Fade is visual fog. Camera far remains the clip plane.
      </p>
      <UButton
        v-if="authored"
        label="Reset fog"
        color="neutral"
        variant="ghost"
        size="xs"
        @click="emit('reset')"
      />
    </div>
  </InspectorSection>
</template>

<script setup lang="ts">
import type { FogData } from '@titane/core';

defineProps<{
  fog: FogData
  authored: boolean
  inspectTick: number
}>();

const emit = defineEmits<{
  reset: []
  updateColor: [color: string]
  updateFadeDistance: [fadeDistance: number]
  commit: []
}>();
</script>
