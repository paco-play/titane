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
      <InspectorMesh
        v-if="mesh"
        :mesh="mesh"
        @update-primitive="setPrimitive"
        @update-color="setColor"
        @commit="saveToStorage"
      />
    </div>
    <InspectorNoSelection v-else />
  </div>
</template>

<script setup lang="ts">
import type { Axis, TransformField } from '~/types/inspector';
import type { MeshData, PrimitiveType } from '@titane/core';
import { getComponent, updateComponent, Transform, Mesh } from '@titane/core';

const { engine, selectedEntityId, inspectTick } = useTitane();
const { saveToStorage } = usePersistence();

/** Transform data of the selected entity, if any. */
const transform = computed<Transform | undefined>(() => {
  void inspectTick.value;
  if (selectedEntityId.value === null || !engine.value) return undefined;
  return getComponent(engine.value.world, selectedEntityId.value, Transform);
});

/** Mesh data of the selected entity, if any. */
const mesh = computed<MeshData | undefined>(() => {
  void inspectTick.value;
  if (selectedEntityId.value === null || !engine.value) return undefined;
  return getComponent(engine.value.world, selectedEntityId.value, Mesh);
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

/**
 * Writes a new primitive type into the selected entity's Mesh.
 */
const setPrimitive = (primitive: PrimitiveType): void => {
  if (selectedEntityId.value === null || !engine.value) return;

  updateComponent(engine.value.world, selectedEntityId.value, Mesh, (data) => {
    data.primitive = primitive;
  });
};

/**
 * Writes a new color into the selected entity's Mesh.
 */
const setColor = (color: string): void => {
  if (selectedEntityId.value === null || !engine.value) return;

  updateComponent(engine.value.world, selectedEntityId.value, Mesh, (data) => {
    data.color = color;
  });
};
</script>
