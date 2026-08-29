<template>
  <div class="flex items-center justify-between gap-2 w-full">
    <div class="flex items-center gap-2">
      <h2 class="text-xs text-muted">Hierarchy</h2>
      <UBadge
        :label="String(count)"
        variant="subtle"
        size="xs"
        color="neutral"
      />
    </div>
    <UButton
      icon="i-lucide-plus"
      variant="ghost"
      color="neutral"
      size="xs"
      :title="selectedEntityId === null ? 'Add box' : 'Add box as child of selection'"
      @click="createBox"
    />
  </div>
</template>

<script setup lang="ts">
import { createPrimitive, setParent } from '@titane/core';

const { engine, syncWorld, selectedEntityId } = useTitane();
const { count } = useHierarchy();

/**
 * Creates a box entity, parented under the current selection when there is one,
 * then synchronizes the world state.
 */
const createBox = (): void => {
  if (!engine.value) return;

  const entity = createPrimitive(engine.value.world, { primitive: 'box' });

  if (selectedEntityId.value !== null) {
    setParent(engine.value.world, entity, selectedEntityId.value);
  }

  selectedEntityId.value = entity;
  syncWorld();
};
</script>
