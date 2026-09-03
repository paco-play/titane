<template>
  <UCollapsible default-open>
    <UButton
      label="Control"
      color="neutral"
      variant="soft"
      trailing-icon="i-lucide-chevron-down"
      size="sm"
      block
    />

    <template #content>
      <div class="py-2">
        <UCheckbox
          :model-value="controlled"
          label="Player controlled"
          @update:model-value="onToggle"
        />
      </div>
    </template>
  </UCollapsible>
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
