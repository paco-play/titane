<template>
  <div v-if="hasName">
    <UInput
      v-model="entityName"
      variant="soft"
      placeholder="GameObject Name..."
      size="sm"
      :ui="{ base: 'text-sm' }"
    />
  </div>
</template>

<script setup lang="ts">
import { getComponent, updateComponent, Name } from '@titane/core';

const { engine, selectedEntityId, syncWorld } = useTitane();

/** Name component of the selected entity, if any. */
const nameComponent = computed(() => {
  if (selectedEntityId.value === null || !engine.value) return undefined;
  return getComponent(engine.value.world, selectedEntityId.value, Name);
});

const hasName = computed(() => nameComponent.value !== undefined);

/**
 * Computed proxy for v-model.
 * The setter goes through the engine's safe mutation API.
 */
const entityName = computed<string>({
  get: () => nameComponent.value?.value ?? '',
  set: (newValue) => {
    if (selectedEntityId.value === null || !engine.value) return;

    updateComponent(engine.value.world, selectedEntityId.value, Name, (data) => {
      data.value = newValue;
    });

    // Refresh the hierarchy labels
    syncWorld();
  }
});
</script>
