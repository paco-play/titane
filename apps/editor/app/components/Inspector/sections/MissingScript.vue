<template>
  <UCollapsible>
    <UButton
      :label="`Missing script: ${componentId}`"
      color="warning"
      variant="outline"
      trailing-icon="i-lucide-chevron-down"
      size="xs"
      block
      class="justify-start"
    />

    <template #content>
      <div class="space-y-1.5 py-1.5">
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
