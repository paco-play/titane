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
        <InspectorAssetField
          label="URL"
          :value="gltf.url"
          accept="model"
          placeholder=".gltf / .glb URL"
          :inspect-tick="inspectTick"
          @update="emit('updateUrl', $event)"
          @commit="emit('commit')"
        />

        <div class="space-y-2">
          <UiFormLabel label="Clip" />
          <UInput
            :model-value="gltf.clip"
            placeholder="Animation clip name"
            size="xs"
            :data-tick="inspectTick"
            @update:model-value="onClip"
            @change="emit('commit')"
          />
        </div>

        <UCheckbox
          :model-value="gltf.playing"
          label="Playing"
          @update:model-value="onPlaying"
        />
        <UCheckbox
          :model-value="gltf.loop"
          label="Loop"
          @update:model-value="onLoop"
        />

        <div class="space-y-2">
          <UiFormLabel label="Fade" />
          <UInput
            :model-value="gltf.fade"
            type="number"
            size="xs"
            :min="0"
            :step="0.05"
            :data-tick="inspectTick"
            @update:model-value="onFade"
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
  updateClip: [clip: string];
  updatePlaying: [playing: boolean];
  updateLoop: [loop: boolean];
  updateFade: [fade: number];
  remove: [];
  commit: [];
}>();

const onClip = (value: string | number | undefined): void => {
  emit('updateClip', typeof value === 'string' ? value.trim() : '');
};

const onPlaying = (value: boolean | 'indeterminate'): void => {
  if (value === 'indeterminate') return;
  emit('updatePlaying', value);
  emit('commit');
};

const onLoop = (value: boolean | 'indeterminate'): void => {
  if (value === 'indeterminate') return;
  emit('updateLoop', value);
  emit('commit');
};

const onFade = (raw: string | number | undefined): void => {
  const value = typeof raw === 'string' ? parseFloat(raw) : raw;
  if (typeof value !== 'number' || !Number.isFinite(value)) return;
  emit('updateFade', value);
};
</script>
