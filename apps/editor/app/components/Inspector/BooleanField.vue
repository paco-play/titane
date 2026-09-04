<template>
  <UCheckbox
    :model-value="value"
    :label="label"
    @update:model-value="onToggle"
  />
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  value: boolean;
}>();

const emit = defineEmits<{
  update: [value: boolean];
  commit: [];
}>();

const onToggle = (next: boolean | 'indeterminate'): void => {
  if (next === 'indeterminate') return;
  emit('update', next);
  emit('commit');
};
</script>
