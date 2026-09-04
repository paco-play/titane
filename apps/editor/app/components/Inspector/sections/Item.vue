<template>
  <UCollapsible default-open>
    <UButton
      label="Transform"
      color="neutral"
      variant="soft"
      trailing-icon="i-lucide-chevron-down"
      size="sm"
      block
    />

    <template #content>
      <div
        class="space-y-2 py-2"
        :data-tick="inspectTick"
      >
        <div
          v-for="field in fields"
          :key="field.key"
          class="space-y-2"
        >
          <UiFormLabel :label="field.label" />
          <div class="grid grid-cols-3 gap-2">
            <UInput
              v-for="axis in AXES"
              :key="`${field.key}-${axis}`"
              :model-value="transform[field.key][axis]"
              type="number"
              :step="field.step"
              size="xs"
              color="primary"
              @update:model-value="onAxisInput(field.key, axis, $event)"
              @change="emit('commit')"
            >
              <template #leading>
                <UiInputLeading :label="axis" />
              </template>
            </UInput>
          </div>
        </div>
      </div>
    </template>
  </UCollapsible>
</template>

<script setup lang="ts">
import type { Transform } from '@titane/core';
import type { Axis, TransformField } from '~/types/inspector';

defineProps<{
  transform: Transform;
  /** Bumped when an in-place ECS edit should refresh the fields. */
  inspectTick: number;
}>();

const emit = defineEmits<{
  /** A single axis was edited. The parent owns the mutation. */
  update: [field: TransformField, axis: Axis, value: number];
  /** Editing ended, the value can be persisted. */
  commit: [];
}>();

const AXES = ['x', 'y', 'z'] as const satisfies readonly Axis[];

const fields = [
  { key: 'position', label: 'Position', step: '0.1' },
  { key: 'rotation', label: 'Rotation', step: '0.01' },
  { key: 'scale', label: 'Scale', step: '0.1' }
] as const satisfies readonly { key: TransformField, label: string, step: string }[];

/**
 * Normalizes the raw input value before handing the change to the parent.
 * Empty or malformed input is ignored rather than writing NaN into the ECS.
 */
const onAxisInput = (field: TransformField, axis: Axis, value: unknown): void => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return;

  emit('update', field, axis, parsed);
};
</script>
