<template>
  <InspectorSection
    title="Control"
    icon="i-lucide-gamepad-2"
  >
    <UCheckbox
      :model-value="controlled"
      label="Player controlled"
      @update:model-value="onToggle"
    />
  </InspectorSection>
</template>

<script setup lang="ts">
defineProps<{
  controlled: boolean
}>();

const emit = defineEmits<{
  updateControlled: [controlled: boolean]
}>();

const onToggle = (value: boolean | 'indeterminate'): void => {
  if (value === 'indeterminate') return;
  emit('updateControlled', value);
};
</script>
