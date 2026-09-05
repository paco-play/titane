<template>
  <div class="space-y-1">
    <UiFormLabel :label="label" />
    <div :class="split ? 'grid grid-cols-[1fr_6.75rem] gap-2 items-center' : 'flex flex-col gap-1'">
      <UInput
        :model-value="value"
        :placeholder="placeholder"
        size="xs"
        :data-tick="inspectTick"
        @update:model-value="onInput"
        @change="emit('commit')"
      />
      <USelect
        v-if="items.length > 0"
        :model-value="picked"
        :items="items"
        placeholder="Project assets"
        size="xs"
        @update:model-value="onPick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AssetAccept } from '@titane/core';

const props = defineProps<{
  label: string;
  value: string;
  inspectTick: number;
  accept?: AssetAccept;
  placeholder?: string;
  /** URL and project picker on one row — used in Mesh where vertical stack felt cramped. */
  split?: boolean;
}>();

const emit = defineEmits<{
  update: [value: string];
  commit: [];
}>();

const { assets } = useProjectAssets();

const items = computed(() => {
  const list = props.accept
    ? assets.value.filter((asset) => asset.kind === props.accept)
    : assets.value;
  return list.map((asset) => ({ label: asset.name, value: asset.url }));
});

const picked = computed<string | undefined>(() =>
  items.value.some((item) => item.value === props.value) ? props.value : undefined
);

const onInput = (raw: string | number | undefined): void => {
  emit('update', typeof raw === 'string' ? raw.trim() : '');
};

const onPick = (next: string | undefined): void => {
  if (next === undefined) return;
  emit('update', next);
  emit('commit');
};
</script>
