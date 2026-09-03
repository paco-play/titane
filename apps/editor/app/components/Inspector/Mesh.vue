<template>
  <UCollapsible default-open>
    <UButton
      label="Mesh"
      color="neutral"
      variant="soft"
      trailing-icon="i-lucide-chevron-down"
      size="sm"
      block
    />

    <template #content>
      <div class="space-y-2 py-2">
        <div class="space-y-2">
          <UiFormLabel label="Primitive" />
          <div
            class="flex items-center"
            :data-tick="inspectTick"
          >
            <UButton
              v-for="option in PRIMITIVE_OPTIONS"
              :key="option.value"
              :icon="option.icon"
              :label="option.label"
              color="neutral"
              variant="link"
              size="xs"
              :title="option.label"
              :class="mesh.primitive === option.value ? 'text-highlighted' : undefined"
              @click="onPrimitive(option.value)"
            />
          </div>
        </div>

        <div class="space-y-2">
          <UiFormLabel label="Color" />
          <UPopover @update:open="onPickerOpen">
            <UButton
              :label="mesh.color"
              color="neutral"
              variant="outline"
              size="xs"
              block
            >
              <template #leading>
                <span
                  class="size-3 rounded-full ring ring-inset ring-accented"
                  :style="{ backgroundColor: mesh.color }"
                />
              </template>
            </UButton>

            <template #content>
              <UColorPicker
                :model-value="mesh.color"
                format="hex"
                size="sm"
                class="p-2"
                @update:model-value="onColor"
              />
            </template>
          </UPopover>
        </div>
      </div>
    </template>
  </UCollapsible>
</template>

<script setup lang="ts">
import type { MeshData, PrimitiveType } from '@titane/core';
import { PRIMITIVE_OPTIONS } from '~/types/mesh';

defineProps<{
  mesh: MeshData;
  /** Bumped when an in-place ECS edit should refresh the highlight. */
  inspectTick: number;
}>();

const emit = defineEmits<{
  /** The primitive type was changed. The parent owns the mutation. */
  updatePrimitive: [primitive: PrimitiveType];
  /** The color was changed. The parent owns the mutation. */
  updateColor: [color: string];
  /** Editing ended, the value can be persisted. */
  commit: [];
}>();

/**
 * Forwards a primitive choice. The click already carries a typed value.
 */
const onPrimitive = (primitive: PrimitiveType): void => {
  emit('updatePrimitive', primitive);
  emit('commit');
};

/**
 * Writes a hex color back. Empty updates from the picker are ignored.
 */
const onColor = (value: string | undefined): void => {
  if (!value) return;

  emit('updateColor', value.toLowerCase());
};

/**
 * Persists when the color popover closes, not on every drag tick.
 */
const onPickerOpen = (open: boolean): void => {
  if (!open) emit('commit');
};
</script>
