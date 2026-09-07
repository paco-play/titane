<template>
  <UCollapsible :default-open="true">
    <UButton
      label="Skybox"
      color="neutral"
      variant="outline"
      trailing-icon="i-lucide-chevron-down"
      size="xs"
      block
      class="justify-start"
    />

    <template #content>
      <div
        class="space-y-3 py-1.5"
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
    </template>
  </UCollapsible>
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
