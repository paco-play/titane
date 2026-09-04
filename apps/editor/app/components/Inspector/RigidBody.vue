<template>
  <UCollapsible default-open>
    <UButton
      label="Rigid Body"
      color="neutral"
      variant="soft"
      trailing-icon="i-lucide-chevron-down"
      size="sm"
      block
    />

    <template #content>
      <div class="space-y-2 py-2">
        <div
          v-if="rigid"
          class="space-y-2"
        >
          <UiFormLabel label="Kind" />
          <div
            class="flex items-center"
            :data-tick="inspectTick"
          >
            <UButton
              v-for="option in RIGID_BODY_OPTIONS"
              :key="option.value"
              :label="option.label"
              color="neutral"
              variant="link"
              size="xs"
              :class="rigid.kind === option.value ? 'text-highlighted' : undefined"
              @click="onKind(option.value)"
            />
          </div>

          <div class="space-y-2">
            <UiFormLabel label="Friction" />
            <UInput
              :model-value="rigid.friction"
              type="number"
              size="xs"
              :min="0"
              :step="0.1"
              @update:model-value="onFriction"
              @change="emit('commit')"
            />
          </div>

          <div class="space-y-2">
            <UiFormLabel label="Restitution" />
            <UInput
              :model-value="rigid.restitution"
              type="number"
              size="xs"
              :min="0"
              :step="0.1"
              @update:model-value="onRestitution"
              @change="emit('commit')"
            />
          </div>

          <UButton
            label="Remove"
            color="neutral"
            variant="ghost"
            size="xs"
            @click="emit('remove')"
          />
        </div>
        <UButton
          v-else
          label="Add Rigid Body"
          color="neutral"
          variant="outline"
          size="xs"
          block
          @click="emit('add')"
        />
      </div>
    </template>
  </UCollapsible>
</template>

<script setup lang="ts">
import type { RigidBodyData, RigidBodyKind } from '@titane/core';
import { RIGID_BODY_OPTIONS } from '~/types/rigid-body';

defineProps<{
  rigid: RigidBodyData | null
  inspectTick: number
}>();

const emit = defineEmits<{
  add: []
  remove: []
  updateKind: [kind: RigidBodyKind]
  updateFriction: [friction: number]
  updateRestitution: [restitution: number]
  commit: []
}>();

const onKind = (kind: RigidBodyKind): void => {
  emit('updateKind', kind);
};

const asNonNegative = (raw: string | number | undefined): number | null => {
  const value = typeof raw === 'string' ? parseFloat(raw) : raw;
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(0, value);
};

const onFriction = (raw: string | number | undefined): void => {
  const value = asNonNegative(raw);
  if (value === null) return;
  emit('updateFriction', value);
};

const onRestitution = (raw: string | number | undefined): void => {
  const value = asNonNegative(raw);
  if (value === null) return;
  emit('updateRestitution', value);
};
</script>
