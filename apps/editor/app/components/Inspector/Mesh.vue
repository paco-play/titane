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
          <USelect
            :model-value="mesh.primitive"
            :items="[...PRIMITIVE_OPTIONS]"
            size="xs"
            color="primary"
            class="w-full"
            @update:model-value="onPrimitive"
          />
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
import type { MeshData } from '@titane/core';
import { isPrimitiveType, PRIMITIVE_OPTIONS } from '~/types/mesh';

defineProps<{
  mesh: MeshData;
}>();

const emit = defineEmits<{
  /** The primitive type was changed. The parent owns the mutation. */
  updatePrimitive: [primitive: MeshData['primitive']];
  /** The color was changed. The parent owns the mutation. */
  updateColor: [color: string];
  /** Editing ended, the value can be persisted. */
  commit: [];
}>();

/**
 * Accepts a Select value only when it is a known primitive, then persists.
 */
const onPrimitive = (value: unknown): void => {
  if (!isPrimitiveType(value)) return;

  emit('updatePrimitive', value);
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
