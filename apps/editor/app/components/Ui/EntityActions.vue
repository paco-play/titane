<template>
  <UDropdownMenu :items="dropdownitems" size="xs">
    <UButton
      icon="i-lucide-ellipsis-vertical"
      color="neutral"
      variant="ghost"
      size="xs"
      square
    />
  </UDropdownMenu>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { deleteSelectedEntity, duplicateSelectedEntity } = useInspectorActions();
const { saveSelectedPrefab } = usePrefabs();

const dropdownitems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: 'Duplicate',
      icon: 'i-lucide-copy',
      color: 'neutral',
      onSelect: duplicateSelectedEntity
    },
    {
      label: 'Save as Prefab',
      icon: 'i-lucide-layout-template',
      color: 'neutral',
      onSelect: saveSelectedPrefab
    },
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      color: 'neutral',
      onSelect: deleteSelectedEntity
    }
  ]
]);
</script>