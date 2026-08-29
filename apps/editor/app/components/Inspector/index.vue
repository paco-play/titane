<template>
  <div class="flex flex-col h-full">
    <div v-if="transform" class="space-y-6 overflow-y-auto">
      <InspectorHeader />
      <USeparator />
      <InspectorItem
        :transform="transform"
        @update="setAxis"
        @commit="saveToStorage"
      />
    </div>
    <InspectorNoSelection v-else />
  </div>
</template>

<script setup lang="ts">
import type { Axis, TransformField } from '~/types/inspector';
import { getComponent, updateComponent, Transform } from '@titane/core';

const { engine, selectedEntityId } = useTitane();
const { saveToStorage } = usePersistence();

/** Transform data of the selected entity, if any. */
const transform = computed<Transform | undefined>(() => {
  if (selectedEntityId.value === null || !engine.value) return undefined;
  return getComponent(engine.value.world, selectedEntityId.value, Transform);
});

/**
 * Writes one axis back into the ECS and flags the entity for a matrix rebuild.
 * The dirty flag is what makes the transform system recompute the world matrix.
 */
const setAxis = (field: TransformField, axis: Axis, value: number): void => {
  if (selectedEntityId.value === null || !engine.value) return;

  updateComponent(engine.value.world, selectedEntityId.value, Transform, (data) => {
    data[field][axis] = value;
    data.isDirty = true;
  });
};
</script>
