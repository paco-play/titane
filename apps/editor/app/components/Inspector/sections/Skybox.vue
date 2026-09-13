<template>
  <InspectorSection
    title="Skybox"
    icon="i-lucide-cloud-sun"
  >
    <div
      class="space-y-3"
      :data-tick="inspectTick"
    >
        <InspectorColorField
          label="Color"
          :value="skybox.color"
          @update="emit('updateColor', $event)"
          @commit="emit('commit')"
        />

        <InspectorAssetField
          label="Cubemap"
          :value="skybox.cubemap"
          accept="texture"
          placeholder="Cube folder or texture URL"
          :inspect-tick="inspectTick"
          @update="emit('updateCubemap', $event)"
          @commit="emit('commit')"
        />

        <UButton
          v-if="authored"
          label="Reset to engine default"
          color="neutral"
          variant="ghost"
          size="xs"
          @click="emit('reset')"
        />
      </div>
  </InspectorSection>
</template>

<script setup lang="ts">
import type { SkyboxData } from '@titane/core';

defineProps<{
  skybox: SkyboxData
  authored: boolean
  inspectTick: number
}>();

const emit = defineEmits<{
  reset: []
  updateColor: [color: string]
  updateCubemap: [cubemap: string]
  commit: []
}>();
</script>
