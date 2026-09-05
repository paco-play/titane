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
        <div class="grid grid-cols-[1fr_auto] gap-2 items-end">
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
                variant="ghost"
                :title="option.label"
                :class="mesh.primitive === option.value ? 'text-primary' : undefined"
                @click="onPrimitive(option.value)"
              />
            </div>
          </div>
          <InspectorColorField
            label="Color"
            :value="mesh.color"
            @update="emit('updateColor', $event)"
            @commit="emit('commit')"
          />
        </div>

        <InspectorAssetField
          label="Albedo"
          :value="mesh.albedo"
          accept="texture"
          placeholder="Texture URL"
          :inspect-tick="inspectTick"
          @update="emit('updateAlbedo', $event)"
          @commit="emit('commit')"
        />

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

        <InspectorColorField
          label="Emissive"
          :value="mesh.emissive"
          @update="emit('updateEmissive', $event)"
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
