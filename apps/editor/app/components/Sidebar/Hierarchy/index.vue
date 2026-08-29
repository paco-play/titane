<template>
  <div class="h-full overflow-y-auto p-1">
    <UTree
      v-model="selection"
      :items="items"
      :multiple="false"
      :get-key="(item: HierarchyItem) => item.value as string"
      class="w-full"
    >
      <template #item-leading="{ item, expanded }">
        <UIcon
          :name="itemIcon(item, expanded)"
        />
      </template>

      <template #item-label="{ item }">
        <span class="truncate text-xs">{{ item.label }}</span>
      </template>
    </UTree>
  </div>
</template>

<script setup lang="ts">
import type { HierarchyItem } from '~/composables/sidebar/useHierarchy';

const { items, selection } = useHierarchy();

/**
 * Picks the icon of a tree row: a folder for branches, a box for leaves.
 */
const itemIcon = (item: HierarchyItem, expanded: boolean): string => {
  if (!item.children) return 'i-lucide-box';
  return expanded ? 'i-lucide-folder-open' : 'i-lucide-folder';
};
</script>
