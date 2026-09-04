<template>
  <div class="flex-1 min-h-0 overflow-y-auto p-3">
    <div
      v-if="items.length > 0"
      class="flex flex-wrap gap-2 content-start"
    >
      <ProjectTile
        v-for="item in items"
        :key="item.url"
        :item="item"
        :selected="item.url === selectedUrl"
        @select="emit('select', $event)"
        @open="emit('open', $event)"
      />
    </div>
    <p
      v-else
      class="text-xs text-muted"
    >
      Nothing here. Drop files in {{ hint }}.
    </p>
  </div>
</template>

<script setup lang="ts">
import type { ProjectItem } from '~/types/project';

defineProps<{
  items: readonly ProjectItem[]
  selectedUrl: string | null
  hint: string
}>();

const emit = defineEmits<{
  select: [item: ProjectItem]
  open: [item: ProjectItem]
}>();
</script>
