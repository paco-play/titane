<template>
  <UCollapsible>
    <UButton
      label="Control"
      color="neutral"
      variant="outline"
      trailing-icon="i-lucide-chevron-down"
      size="xs"
      block
      class="justify-start"
    />

    <template #content>
      <div class="py-1.5">
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
