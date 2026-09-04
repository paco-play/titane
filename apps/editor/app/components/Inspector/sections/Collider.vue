<template>
  <UCollapsible default-open>
    <UButton
      label="Collider"
      color="neutral"
      variant="soft"
      trailing-icon="i-lucide-chevron-down"
      size="sm"
      block
    />

    <template #content>
      <div class="space-y-2 py-2">
        <div
          v-if="collider"
          class="space-y-3"
        >
          <UiFormLabel label="Kind" />
          <div
            class="flex flex-wrap items-center"
            :data-tick="inspectTick"
          >
            <UButton
              v-for="option in COLLIDER_KIND_OPTIONS"
              :key="option.value"
              :label="option.label"
              color="neutral"
              variant="link"
              size="xs"
              :class="collider.kind === option.value ? 'text-highlighted' : undefined"
              @click="emit('updateKind', option.value)"
            />
          </div>

          <InspectorVec3Field
            label="Center"
            :value="collider.center"
            :inspect-tick="inspectTick"
            @update="emit('updateCenter', $event)"
            @commit="emit('commit')"
          />

          <InspectorVec3Field
            v-if="collider.kind === 'box'"
            label="Size"
            :value="collider.size"
            :inspect-tick="inspectTick"
            @update="emit('updateSize', $event)"
            @commit="emit('commit')"
          />

          <div
            v-if="collider.kind === 'sphere' || collider.kind === 'capsule'"
            class="space-y-2"
          >
            <UiFormLabel label="Radius" />
            <UInput
              :model-value="collider.radius"
              type="number"
              size="xs"
              :min="0.001"
              :step="0.1"
              @update:model-value="onRadius"
              @change="emit('commit')"
            />
          </div>

          <div
            v-if="collider.kind === 'capsule'"
            class="space-y-2"
          >
            <UiFormLabel label="Height" />
            <UInput
              :model-value="collider.height"
              type="number"
              size="xs"
              :min="0.001"
              :step="0.1"
              @update:model-value="onHeight"
              @change="emit('commit')"
            />
          </div>

          <UButton
            label="Fit to model"
            color="neutral"
            variant="outline"
            size="xs"
            block
            @click="emit('fit')"
          />

          <UButton
            label="Remove"
            color="neutral"
            variant="ghost"
            size="xs"
            @click="emit('remove')"
          />
        </div>
        <div
          v-else
          class="space-y-2"
        >
          <UButton
            label="Add Collider"
            color="neutral"
            variant="outline"
            size="xs"
            block
            @click="emit('add')"
          />
          <UButton
            label="Add Mesh Collider"
            color="neutral"
            variant="outline"
            size="xs"
            block
            @click="emit('addMesh')"
          />
        </div>
      </div>
    </template>
  </UCollapsible>
</template>

<script setup lang="ts">
import type { ColliderData, ColliderKind, Vec3 } from '@titane/core';
import { COLLIDER_KIND_OPTIONS } from '~/types/collider';

defineProps<{
  collider: ColliderData | null
  inspectTick: number
}>();

const emit = defineEmits<{
  add: []
  addMesh: []
  remove: []
  fit: []
  updateKind: [kind: ColliderKind]
  updateCenter: [center: Vec3]
  updateSize: [size: Vec3]
  updateRadius: [radius: number]
  updateHeight: [height: number]
  commit: []
}>();

const asPositive = (raw: string | number | undefined): number | null => {
  const value = typeof raw === 'string' ? parseFloat(raw) : raw;
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(0.001, value);
};

const onRadius = (raw: string | number | undefined): void => {
  const value = asPositive(raw);
  if (value === null) return;
  emit('updateRadius', value);
};

const onHeight = (raw: string | number | undefined): void => {
  const value = asPositive(raw);
  if (value === null) return;
  emit('updateHeight', value);
};
</script>
