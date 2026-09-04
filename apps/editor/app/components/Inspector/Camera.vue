<template>
  <UCollapsible default-open>
    <UButton
      label="Camera"
      color="neutral"
      variant="soft"
      trailing-icon="i-lucide-chevron-down"
      size="sm"
      block
    />

    <template #content>
      <div class="space-y-2 py-2">
        <div
          v-if="camera"
          class="space-y-3"
          :data-tick="inspectTick"
        >
          <div class="space-y-2">
            <UiFormLabel label="Fov" />
            <UInput
              :model-value="camera.fov"
              type="number"
              size="xs"
              :min="1"
              :max="179"
              :step="1"
              @update:model-value="onFov"
              @change="emit('commit')"
            />
          </div>

          <div class="space-y-2">
            <UiFormLabel label="Near" />
            <UInput
              :model-value="camera.near"
              type="number"
              size="xs"
              :min="0.001"
              :step="0.01"
              @update:model-value="onNear"
              @change="emit('commit')"
            />
          </div>

          <div class="space-y-2">
            <UiFormLabel label="Far" />
            <UInput
              :model-value="camera.far"
              type="number"
              size="xs"
              :min="0.002"
              :step="1"
              @update:model-value="onFar"
              @change="emit('commit')"
            />
          </div>

          <UCheckbox
            :model-value="camera.current"
            label="Current"
            @update:model-value="onCurrent"
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
          label="Add Camera"
          color="neutral"
          variant="outline"
          size="xs"
          icon="i-lucide-video"
          block
          @click="emit('add')"
        />
      </div>
    </template>
  </UCollapsible>
</template>

<script setup lang="ts">
import type { CameraData } from '@titane/core';

defineProps<{
  camera: CameraData | null
  /** Bumped when an in-place ECS mutation should re-highlight the selection. */
  inspectTick: number
}>();

const emit = defineEmits<{
  add: []
  remove: []
  updateFov: [fov: number]
  updateNear: [near: number]
  updateFar: [far: number]
  updateCurrent: [current: boolean]
  commit: []
}>();

const asFinite = (raw: string | number | undefined): number | null => {
  const value = typeof raw === 'string' ? parseFloat(raw) : raw;
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value;
};

const onFov = (raw: string | number | undefined): void => {
  const value = asFinite(raw);
  if (value === null) return;
  emit('updateFov', value);
};

const onNear = (raw: string | number | undefined): void => {
  const value = asFinite(raw);
  if (value === null) return;
  emit('updateNear', value);
};

const onFar = (raw: string | number | undefined): void => {
  const value = asFinite(raw);
  if (value === null) return;
  emit('updateFar', value);
};

const onCurrent = (value: boolean | 'indeterminate'): void => {
  if (value === 'indeterminate') return;
  emit('updateCurrent', value);
  emit('commit');
};
</script>
