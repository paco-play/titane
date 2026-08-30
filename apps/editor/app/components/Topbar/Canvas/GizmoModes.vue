<template>
  <div class="flex items-center">
    <UButton
      v-for="mode in modes"
      :key="mode.id"
      :icon="mode.icon"
      color="neutral"
      variant="link"
      size="xs"
      :title="mode.title"
      :disabled="disabled"
      :class="modelValue === mode.id ? 'text-highlighted' : undefined"
      @click="emit('update:modelValue', mode.id)"
    />
  </div>
</template>

<script setup lang="ts">
import type { GizmoMode } from '@titane/renderer';

export interface GizmoModeOption {
  id: GizmoMode;
  icon: string;
  title: string;
}

defineProps<{
  modelValue: GizmoMode;
  disabled: boolean;
  modes: readonly GizmoModeOption[];
}>();

const emit = defineEmits<{
  'update:modelValue': [mode: GizmoMode];
}>();
</script>
