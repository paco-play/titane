<template>
  <InspectorSection
    :title="`Missing script: ${componentId}`"
    icon="i-lucide-triangle-alert"
  >
    <div class="space-y-1.5">
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
  </InspectorSection>
</template>

<script setup lang="ts">
defineProps<{
  componentId: string;
}>();

const emit = defineEmits<{
  remove: [];
}>();
</script>
