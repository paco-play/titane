<template>
  <UDropdownMenu
    v-if="items.length > 0"
    :items="items"
  >
    <UButton
      label="Add Component"
      color="neutral"
      variant="outline"
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
  canAddGltf: boolean;
  canAddSound: boolean;
  canAddLight: boolean;
  canAddVfx: boolean;
  canAddAgent: boolean;
}>();

const emit = defineEmits<{
  add: [type: AnyComponentType];
  addGltf: [];
  addSound: [];
  addLight: [];
  addVfx: [];
  addAgent: [];
}>();

/**
 * Built-ins first, then user scripts — one menu instead of interstitial
 * "Add glTF / Sound / Light" buttons between inspector sections.
 */
const items = computed<DropdownMenuItem[][]>(() => {
  const builtins: DropdownMenuItem[] = [];
  if (props.canAddGltf) {
    builtins.push({
      label: 'glTF',
      icon: 'i-lucide-box',
      onSelect: () => emit('addGltf'),
    });
  }
  if (props.canAddSound) {
    builtins.push({
      label: 'Sound',
      icon: 'i-lucide-volume-2',
      onSelect: () => emit('addSound'),
    });
  }
  if (props.canAddLight) {
    builtins.push({
      label: 'Light',
      icon: 'i-lucide-sun',
      onSelect: () => emit('addLight'),
    });
  }
  if (props.canAddVfx) {
    builtins.push({
      label: 'Vfx',
      icon: 'i-lucide-sparkles',
      onSelect: () => emit('addVfx'),
    });
  }
  if (props.canAddAgent) {
    builtins.push({
      label: 'Agent',
      icon: 'i-lucide-bot',
      onSelect: () => emit('addAgent'),
    });
  }

  const scripts = props.types.map((type) => ({
    label: fieldLabel(type.id),
    onSelect: () => emit('add', type),
  }));

  const groups: DropdownMenuItem[][] = [];
  if (builtins.length > 0) groups.push(builtins);
  if (scripts.length > 0) groups.push(scripts);
  return groups;
});
</script>
