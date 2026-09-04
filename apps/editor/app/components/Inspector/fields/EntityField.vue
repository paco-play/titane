<template>
  <div class="space-y-2">
    <UiFormLabel :label="label" />
    <USelect
      :model-value="selected"
      :items="items"
      size="xs"
      :data-tick="inspectTick"
      @update:model-value="onSelect"
    />
  </div>
</template>

<script setup lang="ts">
import type { Entity } from '@titane/core';
import type { EntityOption } from '~/types/inspector';

const props = defineProps<{
  label: string;
  value: Entity | null;
  options: readonly EntityOption[];
  inspectTick: number;
}>();

const emit = defineEmits<{
  update: [value: Entity | null];
  commit: [];
}>();

const NONE = '';

const selected = computed<string>(() => (props.value === null ? NONE : String(props.value)));

const items = computed(() => [
  { label: 'None', value: NONE },
  ...props.options.map((option) => ({
    label: option.label,
    value: String(option.id),
  })),
]);

const onSelect = (next: string | undefined): void => {
  if (next === undefined) return;
  emit('update', next === NONE ? null : Number(next));
  emit('commit');
};
</script>
