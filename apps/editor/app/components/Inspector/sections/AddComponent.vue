<template>
  <UDropdownMenu
    v-if="items.length > 0"
    :items="items"
    size="xs"
  >
    <UButton
      label="Add Component"
      color="neutral"
      variant="outline"
      size="xs"
      icon="i-lucide-plus"
      block
    />
  </UDropdownMenu>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';
import type { AnyComponentType } from '@titane/core';
import { fieldLabel } from '~/utils/field-label';

const props = defineProps<{
  types: readonly AnyComponentType[];
}>();

const emit = defineEmits<{
  add: [type: AnyComponentType];
}>();

const items = computed<DropdownMenuItem[][]>(() => [
  props.types.map((type) => ({
    label: fieldLabel(type.id),
    onSelect: () => emit('add', type),
  })),
]);
</script>
