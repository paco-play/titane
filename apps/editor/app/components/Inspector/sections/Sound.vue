<template>
  <UCollapsible>
    <UButton
      label="Sound"
      color="neutral"
      variant="outline"
      trailing-icon="i-lucide-chevron-down"
      size="xs"
      block
      class="justify-start"
    />

    <template #content>
      <div class="space-y-1.5 py-1.5">
        <InspectorAssetField
          label="URL"
          :value="sound.url"
          accept="audio"
          placeholder="Audio URL"
          :inspect-tick="inspectTick"
          @update="emit('updateUrl', $event)"
          @commit="emit('commit')"
        />

        <div class="space-y-2">
          <UiFormLabel label="Volume" />
          <UInput
            :model-value="sound.volume"
            type="number"
            size="xs"
            :min="0"
            :max="1"
            :step="0.1"
            @update:model-value="onVolume"
            @change="emit('commit')"
          />
        </div>

        <UCheckbox
          :model-value="sound.loop"
          label="Loop"
          @update:model-value="onLoop"
        />
        <UCheckbox
          :model-value="sound.positional"
          label="Positional"
          @update:model-value="onPositional"
        />
        <UCheckbox
          :model-value="sound.playing"
          label="Playing"
          @update:model-value="onPlaying"
        />

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
import type { SoundData } from '@titane/core';

defineProps<{
  sound: SoundData;
  inspectTick: number;
}>();

const emit = defineEmits<{
  updateUrl: [url: string];
  updateVolume: [volume: number];
  updateLoop: [loop: boolean];
  updatePositional: [positional: boolean];
  updatePlaying: [playing: boolean];
  remove: [];
  commit: [];
}>();

const onVolume = (raw: string | number): void => {
  const value = typeof raw === 'string' ? parseFloat(raw) : raw;
  if (!Number.isFinite(value)) return;
  emit('updateVolume', Math.min(1, Math.max(0, value)));
};

const onLoop = (value: boolean | 'indeterminate'): void => {
  if (value === 'indeterminate') return;
  emit('updateLoop', value);
  emit('commit');
};

const onPositional = (value: boolean | 'indeterminate'): void => {
  if (value === 'indeterminate') return;
  emit('updatePositional', value);
  emit('commit');
};

const onPlaying = (value: boolean | 'indeterminate'): void => {
  if (value === 'indeterminate') return;
  emit('updatePlaying', value);
  emit('commit');
};
</script>
