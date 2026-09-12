<template>
  <UCollapsible :default-open="true">
    <UButton
      label="Navigation"
      color="neutral"
      variant="outline"
      trailing-icon="i-lucide-chevron-down"
      size="xs"
      block
      class="justify-start"
    />

    <template #content>
      <div
        class="space-y-3 py-1.5"
        :data-tick="inspectTick"
      >
        <InspectorNumberField
          label="Cell size"
          :value="nav.cellSize"
          :inspect-tick="inspectTick"
          :min="0.1"
          :max="4"
          :step="0.05"
          @update="emit('updateCellSize', $event)"
          @commit="emit('commit')"
        />
        <InspectorNumberField
          label="Agent radius"
          :value="nav.agentRadius"
          :inspect-tick="inspectTick"
          :min="0.05"
          :max="2"
          :step="0.05"
          @update="emit('updateAgentRadius', $event)"
          @commit="emit('commit')"
        />
        <InspectorNumberField
          label="Agent height"
          :value="nav.agentHeight"
          :inspect-tick="inspectTick"
          :min="0.2"
          :max="4"
          :step="0.1"
          @update="emit('updateAgentHeight', $event)"
          @commit="emit('commit')"
        />
        <p class="text-[11px] text-muted">
          {{ bakedLabel }}
        </p>
        <UButton
          label="Bake"
          color="neutral"
          variant="outline"
          size="xs"
          block
          @click="emit('bake')"
        />
        <UButton
          v-if="authored"
          label="Clear nav"
          color="neutral"
          variant="ghost"
          size="xs"
          @click="emit('clear')"
        />
      </div>
    </template>
  </UCollapsible>
</template>

<script setup lang="ts">
import { navHasGrid, type NavData } from '@titane/core';

const props = defineProps<{
  nav: NavData
  authored: boolean
  inspectTick: number
}>();

const emit = defineEmits<{
  bake: []
  clear: []
  updateCellSize: [value: number]
  updateAgentRadius: [value: number]
  updateAgentHeight: [value: number]
  commit: []
}>();

const bakedLabel = computed<string>(() => {
  if (!navHasGrid(props.nav)) return 'No bake. Mark colliders Walkable, then Bake.';
  return `${props.nav.width}×${props.nav.depth} cells`;
});
</script>
