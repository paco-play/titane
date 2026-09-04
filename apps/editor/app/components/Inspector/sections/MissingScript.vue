<template>
  <UCollapsible default-open>
    <UButton
      :label="`Missing script: ${componentId}`"
      color="warning"
      variant="soft"
      trailing-icon="i-lucide-chevron-down"
      size="sm"
      block
    />

    <template #content>
      <div class="space-y-2 py-2">
        <p class="text-xs text-muted">
          The component is not registered in this session. Authored values are kept.
        </p>
        <UButton
          label="Remove"
          color="neutral"
          variant="ghost"
          size="xs"
          @click="emit('remove')"
        />
      </div>
    </template>
  </UCollapsible>
</template>

<script setup lang="ts">
defineProps<{
  componentId: string;
}>();

const emit = defineEmits<{
  remove: [];
}>();
</script>
