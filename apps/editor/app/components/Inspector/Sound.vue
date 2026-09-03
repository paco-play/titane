<template>
  <UCollapsible default-open>
    <UButton
      label="Sound"
      color="neutral"
      variant="soft"
      trailing-icon="i-lucide-chevron-down"
      size="sm"
      block
    />

    <template #content>
      <div class="space-y-3 py-2">
        <div class="space-y-2">
          <UiFormLabel label="URL" />
          <UInput
            :model-value="sound.url"
            placeholder="Audio URL"
            size="xs"
            :data-tick="inspectTick"
            @update:model-value="onUrl"
            @change="emit('commit')"
          />
        </div>

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
          @update:model-value="onFlag('updateLoop', $event)"
        />
        <UCheckbox
          :model-value="sound.positional"
          label="Positional"
          @update:model-value="onFlag('updatePositional', $event)"
        />
        <UCheckbox
          :model-value="sound.playing"
          label="Playing"
          @update:model-value="onFlag('updatePlaying', $event)"
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

const onUrl = (value: string | number | undefined): void => {
  const url = typeof value === 'string' ? value.trim() : '';
  emit('updateUrl', url);
};

const onVolume = (raw: string | number): void => {
  const value = typeof raw === 'string' ? parseFloat(raw) : raw;
  if (!Number.isFinite(value)) return;
  emit('updateVolume', Math.min(1, Math.max(0, value)));
};

const onFlag = (
  event: 'updateLoop' | 'updatePositional' | 'updatePlaying',
  value: boolean | 'indeterminate'
): void => {
  if (value === 'indeterminate') return;
  emit(event, value);
  emit('commit');
};
</script>
