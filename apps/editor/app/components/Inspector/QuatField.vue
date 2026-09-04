<template>
  <div class="space-y-2">
    <UiFormLabel :label="label" />
    <div
      class="grid grid-cols-4 gap-2"
      :data-tick="inspectTick"
    >
      <UInput
        v-for="axis in AXES"
        :key="axis"
        :model-value="value[axis]"
        type="number"
        step="0.1"
        size="xs"
        @update:model-value="onAxis(axis, $event)"
        @change="emit('commit')"
      >
        <template #leading>
          <UiInputLeading :label="axis" />
        </template>
      </UInput>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SchemaQuat } from '@titane/core';

const props = defineProps<{
  label: string;
  value: SchemaQuat;
  inspectTick: number;
}>();

const emit = defineEmits<{
  update: [value: SchemaQuat];
  commit: [];
}>();

const AXES = ['x', 'y', 'z', 'w'] as const;

const onAxis = (axis: (typeof AXES)[number], raw: unknown): void => {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return;
  emit('update', { ...props.value, [axis]: parsed });
};
</script>
