<template>
  <UCollapsible default-open>
    <UButton
      label="glTF"
      color="neutral"
      variant="soft"
      trailing-icon="i-lucide-chevron-down"
      size="sm"
      block
    />

    <template #content>
      <div class="space-y-3 py-2">
        <div class="space-y-2">
          <UiFormLabel label="URL" />
          <UInput
            :model-value="gltf.url"
            placeholder=".gltf / .glb URL"
            size="xs"
            :data-tick="inspectTick"
            @update:model-value="onUrl"
            @change="emit('commit')"
          />
        </div>

        <UButton
          label="Remove"
          color="neutral"
          variant="ghost"
          size="xs"
          @click="emit('remove')"
        />
      </div>
    </template>
  </UCollapsible>
</template>

<script setup lang="ts">
import type { GltfData } from '@titane/core';

defineProps<{
  gltf: GltfData;
  /** Bumped when an in-place ECS mutation should refresh the field. */
  inspectTick: number;
}>();

const emit = defineEmits<{
  updateUrl: [url: string];
  remove: [];
  commit: [];
}>();

/**
 * Writes a model URL back. Whitespace-only values clear the load.
 */
const onUrl = (value: string | number | undefined): void => {
  const url = typeof value === 'string' ? value.trim() : '';
  emit('updateUrl', url);
};
</script>
