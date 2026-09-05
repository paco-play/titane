<template>
  <UCollapsible>
    <UButton
      label="Mesh"
      color="neutral"
      variant="outline"
      trailing-icon="i-lucide-chevron-down"
      size="xs"
      block
      class="justify-start"
    />

    <template #content>
      <div class="flex flex-col gap-3 py-2.5">
        <div class="space-y-1">
          <UiFormLabel label="Primitive" />
          <div
            class="grid grid-cols-3 gap-1"
            :data-tick="inspectTick"
          >
            <UButton
              v-for="option in PRIMITIVE_OPTIONS"
              :key="option.value"
              :icon="option.icon"
              :label="option.label"
              :color="mesh.primitive === option.value ? 'primary' : 'neutral'"
              :variant="mesh.primitive === option.value ? 'soft' : 'ghost'"
              :title="option.label"
              block
              class="px-0"
              @click="onPrimitive(option.value)"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <InspectorColorField
            label="Color"
            :value="mesh.color"
            @update="emit('updateColor', $event)"
            @commit="emit('commit')"
          />
          <InspectorColorField
            label="Emissive"
            :value="mesh.emissive"
            @update="emit('updateEmissive', $event)"
            @commit="emit('commit')"
          />
        </div>

        <InspectorAssetField
          label="Albedo"
          :value="mesh.albedo"
          accept="texture"
          placeholder="Texture URL"
          split
          :inspect-tick="inspectTick"
          @update="emit('updateAlbedo', $event)"
          @commit="emit('commit')"
        />

        <div class="grid grid-cols-2 gap-3">
          <InspectorNumberField
            label="Roughness"
            :value="mesh.roughness"
            :inspect-tick="inspectTick"
            :min="0"
            :max="1"
            :step="0.01"
            @update="onRoughness"
            @commit="emit('commit')"
          />
          <InspectorNumberField
            label="Metalness"
            :value="mesh.metalness"
            :inspect-tick="inspectTick"
            :min="0"
            :max="1"
            :step="0.01"
            @update="onMetalness"
            @commit="emit('commit')"
          />
        </div>

        <div class="flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
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

const onRoughness = (value: number): void => {
  emit('updateRoughness', Math.min(1, Math.max(0, value)));
};

const onMetalness = (value: number): void => {
  emit('updateMetalness', Math.min(1, Math.max(0, value)));
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
