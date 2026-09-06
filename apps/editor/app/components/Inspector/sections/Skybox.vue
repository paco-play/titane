<template>
  <UCollapsible>
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
      <div class="space-y-1.5 py-1.5">
        <div
          v-if="skybox"
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
            placeholder="Equirectangular texture URL"
            :inspect-tick="inspectTick"
            @update="emit('updateCubemap', $event)"
            @commit="emit('commit')"
          />

          <UButton
            label="Remove"
            color="neutral"
            variant="ghost"
            size="xs"
            @click="emit('remove')"
          />
        </div>
        <UButton
          v-else
          label="Add Skybox"
          color="neutral"
          variant="outline"
          size="xs"
          icon="i-lucide-sun"
          block
          @click="emit('add')"
        />
      </div>
    </template>
  </UCollapsible>
</template>

<script setup lang="ts">
import type { SkyboxData } from '@titane/core';

defineProps<{
  skybox: SkyboxData | null
  inspectTick: number
}>();

const emit = defineEmits<{
  add: []
  remove: []
  updateColor: [color: string]
  updateCubemap: [cubemap: string]
  commit: []
}>();
</script>
