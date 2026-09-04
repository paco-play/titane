<template>
  <div class="space-y-2">
    <UiFormLabel :label="label" />
    <USelect
      :model-value="value"
      :items="items"
      size="xs"
      :data-tick="inspectTick"
      @update:model-value="onSelect"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string;
  value: string;
  options: readonly string[];
  inspectTick: number;
}>();

const emit = defineEmits<{
  update: [value: string];
  commit: [];
}>();

const items = computed(() => props.options.map((option) => ({
  label: option,
  value: option,
})));

const onSelect = (next: string | undefined): void => {
  if (next === undefined) return;
  emit('update', next);
  emit('commit');
};
</script>
