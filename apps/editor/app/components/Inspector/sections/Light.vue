<template>
  <UCollapsible default-open>
    <UButton
      label="Light"
      color="neutral"
      variant="soft"
      trailing-icon="i-lucide-chevron-down"
      size="sm"
      block
    />

    <template #content>
      <div class="space-y-3 py-2">

        <!-- Kind selector -->
        <div class="space-y-2">
          <UiFormLabel label="Kind" />
          <div class="flex items-center" :data-tick="inspectTick">
            <UButton
              v-for="option in LIGHT_KIND_OPTIONS"
              :key="option.value"
              :icon="option.icon"
              :label="option.label"
              color="neutral"
              variant="link"
              size="xs"
              :title="option.label"
              :class="light.kind === option.value ? 'text-highlighted' : undefined"
              @click="onKind(option.value)"
            />
          </div>
        </div>

        <!-- Color picker -->
        <InspectorColorField
          label="Color"
          :value="light.color"
          @update="emit('updateColor', $event)"
          @commit="emit('commit')"
        />

        <!-- Intensity -->
        <div class="space-y-2">
          <UiFormLabel label="Intensity" />
          <UInput
            :model-value="light.intensity"
            type="number"
            size="xs"
            :min="0"
            :step="0.1"
            @update:model-value="onIntensity"
            @change="emit('commit')"
          />
        </div>

        <!-- Distance (point light only) -->
        <div v-if="light.kind === 'point'" class="space-y-2">
          <UiFormLabel label="Distance" />
          <UInput
            :model-value="light.distance"
            type="number"
            size="xs"
            :min="0"
            :step="1"
            @update:model-value="onDistance"
            @change="emit('commit')"
          />
        </div>

        <UCheckbox
          v-if="light.kind !== 'ambient'"
          :model-value="light.castShadow"
          label="Cast shadow"
          @update:model-value="onCastShadow"
        />

        <!-- Remove button -->
        <UButton
          label="Remove"
          color="neutral"
          variant="ghost"
          size="xs"
          @click="emit('remove')"
        />
      </div>
    </template>
  </UCollapsible>
</template>

<script setup lang="ts">
import type { LightData, LightKind } from '@titane/core';
import { LIGHT_KIND_OPTIONS } from '~/types/light';

defineProps<{
  light: LightData;
  /** Bumped when an in-place ECS mutation should re-highlight the selection. */
  inspectTick: number;
}>();

const emit = defineEmits<{
  updateKind: [kind: LightKind];
  updateColor: [color: string];
  updateIntensity: [intensity: number];
  updateDistance: [distance: number];
  updateCastShadow: [castShadow: boolean];
  remove: [];
  commit: [];
}>();

const onKind = (kind: LightKind): void => {
  emit('updateKind', kind);
  emit('commit');
};

const onIntensity = (raw: string | number): void => {
  const value = typeof raw === 'string' ? parseFloat(raw) : raw;
  if (!Number.isFinite(value)) return;
  emit('updateIntensity', Math.max(0, value));
};

const onDistance = (raw: string | number): void => {
  const value = typeof raw === 'string' ? parseFloat(raw) : raw;
  if (!Number.isFinite(value)) return;
  emit('updateDistance', Math.max(0, value));
};

const onCastShadow = (value: boolean | 'indeterminate'): void => {
  if (value === 'indeterminate') return;
  emit('updateCastShadow', value);
  emit('commit');
};
</script>
