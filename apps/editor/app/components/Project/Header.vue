<template>
  <div class="flex items-center gap-3 px-3 py-2 border-b border-default">
    <p class="text-xs font-medium shrink-0">
      Project
    </p>
    <UInput
      :model-value="query"
      icon="i-lucide-search"
      placeholder="Search"
      size="xs"
      class="max-w-56"
      @update:model-value="onQuery"
    />
    <p class="text-xs text-muted truncate">
      {{ breadcrumb }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  query: string
  breadcrumb: string
}>();

const emit = defineEmits<{
  updateQuery: [query: string]
}>();

const onQuery = (raw: string | number | undefined): void => {
  emit('updateQuery', typeof raw === 'string' ? raw : '');
};
</script>
