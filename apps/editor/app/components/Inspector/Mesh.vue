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
          <UiFormLabel label="Albedo" />
          <UInput
            :model-value="mesh.albedo"
            placeholder="Texture URL"
            size="xs"
            :data-tick="inspectTick"
            @update:model-value="onAlbedo"
            @change="emit('commit')"
          />
        </div>

        <div class="space-y-2">
          <UiFormLabel label="Roughness" />
          <UInput
            :model-value="mesh.roughness"
            type="number"
            size="xs"
            :min="0"
            :max="1"
            :step="0.1"
            @update:model-value="onRoughness"
            @change="emit('commit')"
          />
        </div>

        <div class="space-y-2">
          <UiFormLabel label="Metalness" />
          <UInput
            :model-value="mesh.metalness"
            type="number"
            size="xs"
            :min="0"
            :max="1"
            :step="0.1"
            @update:model-value="onMetalness"
            @change="emit('commit')"
          />
        </div>

        <div class="space-y-2">
          <UiFormLabel label="Emissive" />
          <UPopover @update:open="onPickerOpen">
            <UButton
              :label="mesh.emissive"
              color="neutral"
              variant="outline"
              size="xs"
              block
            >
              <template #leading>
                <span
                  class="size-3 rounded-full ring ring-inset ring-accented"
                  :style="{ backgroundColor: mesh.emissive }"
                />
              </template>
            </UButton>

            <template #content>
              <UColorPicker
                :model-value="mesh.emissive"
                format="hex"
                size="sm"
                class="p-2"
                @update:model-value="onEmissive"
              />
            </template>
          </UPopover>
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
  updatePrimitive: [primitive: PrimitiveType];
  updateColor: [color: string];
  updateAlbedo: [albedo: string];
  updateRoughness: [roughness: number];
  updateMetalness: [metalness: number];
  updateEmissive: [emissive: string];
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
 * Writes a texture URL back. Whitespace-only values clear the map.
 */
const onAlbedo = (value: string | number | undefined): void => {
  const url = typeof value === 'string' ? value.trim() : '';
  emit('updateAlbedo', url);
};

const parseUnit = (raw: string | number | undefined): number | undefined => {
  if (raw === undefined) return undefined;
  const value = typeof raw === 'string' ? parseFloat(raw) : raw;
  if (!Number.isFinite(value)) return undefined;
  return Math.min(1, Math.max(0, value));
};

const onRoughness = (raw: string | number | undefined): void => {
  const value = parseUnit(raw);
  if (value === undefined) return;
  emit('updateRoughness', value);
};

const onMetalness = (raw: string | number | undefined): void => {
  const value = parseUnit(raw);
  if (value === undefined) return;
  emit('updateMetalness', value);
};

const onEmissive = (value: string | undefined): void => {
  if (!value) return;
  emit('updateEmissive', value.toLowerCase());
};

/**
 * Persists when the color popover closes, not on every drag tick.
 */
const onPickerOpen = (open: boolean): void => {
  if (!open) emit('commit');
};
</script>
