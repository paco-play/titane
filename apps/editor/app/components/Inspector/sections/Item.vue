<template>
  <InspectorSection
    title="Transform"
    icon="i-lucide-move-3d"
  >
    <div
      class="space-y-1.5"
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
            :model-value="axisValue(field.key, axis)"
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
  </InspectorSection>
</template>

<script setup lang="ts">
import type { Transform } from '@titane/core';
import type { Axis, TransformField } from '~/types/inspector';
import { degToRad, radToDeg } from '~/utils/euler-degrees';

const props = defineProps<{
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
  { key: 'rotation', label: 'Rotation', step: '1' },
  { key: 'scale', label: 'Scale', step: '0.1' }
] as const satisfies readonly { key: TransformField, label: string, step: string }[];

const axisValue = (field: TransformField, axis: Axis): number => {
  const raw = props.transform[field][axis];
  if (field !== 'rotation') return raw;
  return Math.round(radToDeg(raw) * 1000) / 1000;
};

/**
 * Normalizes the raw input value before handing the change to the parent.
 * Rotation is typed in degrees and stored as radians.
 */
const onAxisInput = (field: TransformField, axis: Axis, value: unknown): void => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return;

  emit('update', field, axis, field === 'rotation' ? degToRad(parsed) : parsed);
};
</script>
