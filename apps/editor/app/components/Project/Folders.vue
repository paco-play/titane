<template>
  <nav class="w-40 shrink-0 border-r border-default p-2 space-y-1 overflow-y-auto">
    <p class="px-2 py-1 text-xs text-muted">
      Assets
    </p>
    <UButton
      v-for="entry in folders"
      :key="entry.id"
      :label="entry.label"
      :icon="entry.icon"
      color="neutral"
      :variant="folder === entry.id ? 'soft' : 'ghost'"
      size="xs"
      block
      class="justify-start"
      @click="emit('select', entry.id)"
    />
  </nav>
</template>

<script setup lang="ts">
import type { ProjectFolder, ProjectKind } from '~/types/project';

defineProps<{
  folders: readonly ProjectFolder[]
  folder: ProjectKind
}>();

const emit = defineEmits<{
  select: [folder: ProjectKind]
}>();
</script>
