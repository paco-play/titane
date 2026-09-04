<template>
  <div
    v-if="error"
    class="flex items-start gap-2 px-3 py-2 bg-error/10 text-error text-xs"
  >
    <span class="flex-1">
      {{ error.componentId }} {{ error.hook }} on entity {{ error.entity }}: {{ error.message }}
    </span>
    <UButton
      label="Dismiss"
      color="neutral"
      variant="ghost"
      size="xs"
      @click="emit('dismiss')"
    />
  </div>
</template>

<script setup lang="ts">
import type { ScriptError } from '@titane/core';

defineProps<{
  error: ScriptError | null;
}>();

const emit = defineEmits<{
  dismiss: [];
}>();
</script>
