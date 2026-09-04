<template>
  <button
    type="button"
    class="flex flex-col items-center gap-1 w-24 p-2 rounded-md text-center hover:bg-elevated"
    :class="selected ? 'ring-2 ring-primary bg-elevated' : ''"
    :title="item.name"
    @click="emit('select', item)"
    @dblclick="emit('open', item)"
  >
    <UIcon
      :name="icon"
      class="w-8 h-8 text-muted"
    />
    <span class="text-[11px] leading-tight truncate w-full">
      {{ item.label }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { PROJECT_KIND_ICON, type ProjectItem } from '~/types/project';

const props = defineProps<{
  item: ProjectItem
  selected: boolean
}>();

const emit = defineEmits<{
  select: [item: ProjectItem]
  open: [item: ProjectItem]
}>();

const icon = computed(() => PROJECT_KIND_ICON[props.item.kind]);
</script>
