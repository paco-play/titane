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
    <UDropdownMenu
      :items="createItems"
      size="xs"
    >
      <UButton
        icon="i-lucide-plus"
        variant="ghost"
        color="neutral"
        size="xs"
        :title="selectedEntityId === null ? 'Add primitive' : 'Add as child of selection'"
      />
    </UDropdownMenu>
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';
import { PRIMITIVE_OPTIONS } from '~/types/mesh';

const { selectedEntityId } = useTitane();
const { count } = useHierarchy();
const { addPrimitive } = useHierarchyActions();

const createItems: DropdownMenuItem[][] = [
  PRIMITIVE_OPTIONS.map(option => ({
    label: option.label,
    icon: option.icon,
    onSelect: () => addPrimitive(option.value)
  }))
];
</script>
