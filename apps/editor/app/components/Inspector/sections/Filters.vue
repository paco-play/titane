<template>
  <InspectorSection
    title="Filters"
    icon="i-lucide-blend"
  >
    <div
      class="space-y-3"
      :data-tick="inspectTick"
    >
        <InspectorNumberField
          label="Bloom"
          :value="postFx.bloom"
          :inspect-tick="inspectTick"
          :min="0"
          :max="3"
          :step="0.05"
          @update="emit('updateBloom', $event)"
          @commit="emit('commit')"
        />
        <InspectorNumberField
          label="Exposure"
          :value="postFx.exposure"
          :inspect-tick="inspectTick"
          :min="0.1"
          :max="4"
          :step="0.05"
          @update="emit('updateExposure', $event)"
          @commit="emit('commit')"
        />
        <InspectorNumberField
          label="Contrast"
          :value="postFx.contrast"
          :inspect-tick="inspectTick"
          :min="0"
          :max="3"
          :step="0.05"
          @update="emit('updateContrast', $event)"
          @commit="emit('commit')"
        />
        <InspectorNumberField
          label="Saturation"
          :value="postFx.saturation"
          :inspect-tick="inspectTick"
          :min="0"
          :max="3"
          :step="0.05"
          @update="emit('updateSaturation', $event)"
          @commit="emit('commit')"
        />
        <InspectorColorField
          label="Tint"
          :value="postFx.tint"
          @update="emit('updateTint', $event)"
          @commit="emit('commit')"
        />
        <InspectorNumberField
          label="Vignette"
          :value="postFx.vignette"
          :inspect-tick="inspectTick"
          :min="0"
          :max="1"
          :step="0.05"
          @update="emit('updateVignette', $event)"
          @commit="emit('commit')"
        />
        <UButton
          v-if="authored"
          label="Reset filters"
          color="neutral"
          variant="ghost"
          size="xs"
          @click="emit('reset')"
        />
      </div>
  </InspectorSection>
</template>

<script setup lang="ts">
import type { PostFxData } from '@titane/core';

defineProps<{
  postFx: PostFxData
  authored: boolean
  inspectTick: number
}>();

const emit = defineEmits<{
  reset: []
  updateBloom: [value: number]
  updateExposure: [value: number]
  updateContrast: [value: number]
  updateSaturation: [value: number]
  updateTint: [tint: string]
  updateVignette: [value: number]
  commit: []
}>();
</script>
