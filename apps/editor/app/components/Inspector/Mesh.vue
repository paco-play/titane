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

        <InspectorColorField
          label="Emissive"
          :value="mesh.emissive"
          @update="emit('updateEmissive', $event)"
          @commit="emit('commit')"
        />
        <InspectorColorField
          label="Color"
          :value="mesh.color"
          @update="emit('updateColor', $event)"
          @commit="emit('commit')"
        />

        <UCheckbox
          :model-value="mesh.castShadow"
          label="Cast shadow"
          @update:model-value="onCastShadow"
        />
        <UCheckbox
          :model-value="mesh.receiveShadow"
          label="Receive shadow"
          @update:model-value="onReceiveShadow"
        />
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
  updateCastShadow: [castShadow: boolean];
  updateReceiveShadow: [receiveShadow: boolean];
  commit: [];
}>();

const onPrimitive = (primitive: PrimitiveType): void => {
  emit('updatePrimitive', primitive);
  emit('commit');
};

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

const onCastShadow = (value: boolean | 'indeterminate'): void => {
  if (value === 'indeterminate') return;
  emit('updateCastShadow', value);
  emit('commit');
};

const onReceiveShadow = (value: boolean | 'indeterminate'): void => {
  if (value === 'indeterminate') return;
  emit('updateReceiveShadow', value);
  emit('commit');
};
</script>
