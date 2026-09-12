<template>
  <div
    ref="treeRoot"
    class="h-full overflow-y-auto"
    @dragstart.capture="onDragStart"
    @dragover="onDragOver"
    @drop.prevent="onDrop"
    @dblclick.capture="onTreeDblClick"
  >
    <UTree
      v-model="selection"
      :items="items"
      :multiple="false"
      :get-key="(item: HierarchyItem) => item.value as string"
      :ui="{
        link: 'justify-start',
        linkLabel: 'flex-1 min-w-0 text-left',
        linkTrailing: 'ms-auto shrink-0'
      }"
      class="w-full"
    >
      <template #item-leading="{ item, expanded }">
        <SidebarHierarchyRowIcon
          :icon="resolveHierarchyIcon(item, expanded)"
          :color="item.color"
        />
      </template>

      <template #item-label="{ item }">
        <span
          class="block min-w-0 truncate text-xs"
          :data-hierarchy-key="String(item.value ?? '')"
          :draggable="canDrag(item)"
        >
          <SidebarHierarchyRowLabel
            :item="item"
            :renaming="isRenaming(item.id)"
            :draft="draft"
            @commit="commitRename"
            @cancel="cancelRename"
            @update:draft="onDraft"
          />
        </span>
      </template>

      <template #item-trailing="{ item }">
        <SidebarHierarchyRowMenu
          v-if="item.id !== undefined"
          :item="item"
        />
      </template>
    </UTree>
  </div>
</template>

<script setup lang="ts">
import type { HierarchyItem } from '~/composables/sidebar/useHierarchy';
import { WORLD_HIERARCHY_KEY, findHierarchyItem } from '~/utils/hierarchy-reparent';
import { resolveHierarchyIcon } from '~/utils/hierarchy-appearance';

const { items, selection } = useHierarchy();
const { onDragStart, onDragOver, onDrop, syncRowDraggable } = useHierarchyDrag(items);
const { isRenaming, draft, beginRename, commitRename, cancelRename } = useHierarchyRename();
const treeRoot = ref<HTMLElement | null>(null);
let rowObserver: MutationObserver | null = null;

const canDrag = (item: HierarchyItem): boolean =>
  item.value !== WORLD_HIERARCHY_KEY && !isRenaming(item.id);

/** Double-click a tree row (not World, not the kebab) to rename in place. */
const onTreeDblClick = (event: MouseEvent): void => {
  if (!(event.target instanceof Element)) return;
  if (event.target.closest('input, [aria-label="Row actions"]')) return;

  const row = event.target.closest('[role="treeitem"]');
  const key = row?.querySelector('[data-hierarchy-key]')?.getAttribute('data-hierarchy-key');
  if (!key || key === WORLD_HIERARCHY_KEY) return;

  const item = findHierarchyItem(items.value, key);
  if (item?.id === undefined) return;

  event.preventDefault();
  beginRename(item.id, item.label ?? '');
};

const onDraft = (value: string): void => {
  draft.value = value;
};

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
</script>
