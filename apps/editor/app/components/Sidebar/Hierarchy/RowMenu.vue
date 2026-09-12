<template>
  <UDropdownMenu
    :items="items"
    size="xs"
    :modal="false"
    :content="{ align: 'start', side: 'right', sideOffset: 6, collisionPadding: 8 }"
  >
    <span
      class="inline-flex size-5 shrink-0 items-center justify-center rounded-sm text-muted hover:text-highlighted hover:bg-elevated"
      role="button"
      aria-label="Row actions"
      @click.stop
      @pointerdown.stop
      @dblclick.stop
    >
      <UIcon
        name="i-lucide-ellipsis"
        class="size-3.5"
      />
    </span>

    <template #swatch-leading="{ item }">
      <span
        class="size-3 rounded-full ring ring-inset ring-white/20 shrink-0"
        :style="{ backgroundColor: swatchHex(item) }"
      />
    </template>
  </UDropdownMenu>
</template>

<script setup lang="ts">
import type { HierarchyItem } from '~/composables/sidebar/useHierarchy';

const props = defineProps<{
  item: HierarchyItem;
}>();

const { itemsFor } = useHierarchyRowMenu();

const items = computed(() => itemsFor(props.item));

const swatchHex = (item: { hex?: string }): string => item.hex ?? 'transparent';
</script>
