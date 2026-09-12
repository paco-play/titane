<template>
  <div
    ref="treeRoot"
    class="h-full overflow-y-auto"
    @dragstart.capture="onDragStart"
    @dragover="onDragOver"
    @drop.prevent="onDrop"
  >
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
        <span
          class="block w-full truncate text-xs"
          :data-hierarchy-key="String(item.value ?? '')"
          :draggable="item.value !== WORLD_HIERARCHY_KEY"
        >
          {{ item.label }}
        </span>
      </template>
    </UTree>
  </div>
</template>

<script setup lang="ts">
import type { HierarchyItem } from '~/composables/sidebar/useHierarchy';
import { WORLD_HIERARCHY_KEY } from '~/utils/hierarchy-reparent';

const { items, selection } = useHierarchy();
const { onDragStart, onDragOver, onDrop, syncRowDraggable } = useHierarchyDrag(items);
const treeRoot = ref<HTMLElement | null>(null);
let rowObserver: MutationObserver | null = null;

const applyRowDraggable = (): void => {
  if (treeRoot.value) syncRowDraggable(treeRoot.value);
};

watch(items, async () => {
  await nextTick();
  applyRowDraggable();
}, { immediate: true, flush: 'post' });

onMounted(() => {
  applyRowDraggable();
  if (!treeRoot.value) return;
  rowObserver = new MutationObserver(applyRowDraggable);
  rowObserver.observe(treeRoot.value, { childList: true, subtree: true });
});

onUnmounted(() => {
  rowObserver?.disconnect();
  rowObserver = null;
});

/**
 * Picks the icon of a tree row: a globe for World, a folder for branches, a box for leaves.
 */
const itemIcon = (item: HierarchyItem, expanded: boolean): string => {
  if (item.value === WORLD_HIERARCHY_KEY) return 'i-lucide-globe';
  if (!item.children) return 'i-lucide-box';
  return expanded ? 'i-lucide-folder-open' : 'i-lucide-folder';
};
</script>
