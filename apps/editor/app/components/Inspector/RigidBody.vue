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
          v-if="kind"
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
              :class="kind === option.value ? 'text-highlighted' : undefined"
              @click="onKind(option.value)"
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
import type { RigidBodyKind } from '@titane/core';
import { RIGID_BODY_OPTIONS } from '~/types/rigid-body';

defineProps<{
  kind: RigidBodyKind | null
  inspectTick: number
}>();

const emit = defineEmits<{
  add: []
  remove: []
  updateKind: [kind: RigidBodyKind]
}>();

const onKind = (kind: RigidBodyKind): void => {
  emit('updateKind', kind);
};
</script>
