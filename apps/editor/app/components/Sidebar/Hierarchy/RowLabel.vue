<template>
  <UInput
    v-if="renaming"
    autofocus
    size="xs"
    variant="none"
    class="h-5 px-0.5"
    :model-value="draft"
    @update:model-value="onDraft"
    @keydown.enter.prevent="emit('commit')"
    @keydown.escape.prevent="emit('cancel')"
    @blur="emit('commit')"
    @click.stop
    @pointerdown.stop
    @dblclick.stop
  />
  <span
    v-else
    class="block min-w-0 truncate"
  >
    {{ item.label }}
  </span>
</template>

<script setup lang="ts">
import type { HierarchyItem } from '~/composables/sidebar/useHierarchy';

defineProps<{
  item: HierarchyItem;
  renaming: boolean;
  draft: string;
}>();

const emit = defineEmits<{
  commit: [];
  cancel: [];
  'update:draft': [value: string];
}>();

const onDraft = (value: string): void => {
  emit('update:draft', value);
};
</script>
