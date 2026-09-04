<template>
  <div class="space-y-2">
    <UiFormLabel :label="label" />
    <UInput
      :model-value="value"
      size="xs"
      :data-tick="inspectTick"
      @update:model-value="onInput"
      @change="emit('commit')"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  value: string;
  inspectTick: number;
}>();

const emit = defineEmits<{
  update: [value: string];
  commit: [];
}>();

const onInput = (raw: string | undefined): void => {
  emit('update', raw ?? '');
};
</script>
