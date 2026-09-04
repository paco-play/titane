<template>
  <div class="space-y-2">
    <UiFormLabel :label="label" />
    <div
      class="flex items-center gap-2"
      :data-tick="inspectTick"
    >
      <button
        v-if="!hasRange"
        type="button"
        class="cursor-ew-resize select-none text-xxs text-muted shrink-0"
        @pointerdown="onDragStart"
      >
        Drag
      </button>
      <USlider
        v-if="hasRange"
        class="flex-1"
        :model-value="value"
        :min="min"
        :max="max"
        :step="step"
        size="xs"
        @update:model-value="onNumber"
        @change="emit('commit')"
      />
      <UInput
        class="w-20 shrink-0"
        :model-value="value"
        type="number"
        size="xs"
        :min="min"
        :max="max"
        :step="step"
        @update:model-value="onInput"
        @change="emit('commit')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string;
  value: number;
  inspectTick: number;
  min?: number;
  max?: number;
  step?: number;
}>();

const emit = defineEmits<{
  update: [value: number];
  commit: [];
}>();

const hasRange = computed<boolean>(
  () => props.min !== undefined && props.max !== undefined
);

const step = computed<number>(() => props.step ?? (hasRange.value ? 0.1 : 1));

const onNumber = (next: number | number[] | undefined): void => {
  if (typeof next !== 'number' || !Number.isFinite(next)) return;
  emit('update', next);
};

const onInput = (raw: unknown): void => {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return;
  emit('update', parsed);
};

const onDragStart = (event: PointerEvent): void => {
  const originX = event.clientX;
  const originValue = props.value;
  const baseStep = step.value;
  const target = event.currentTarget;
  if (!(target instanceof HTMLElement)) return;

  target.setPointerCapture(event.pointerId);

  const onMove = (move: PointerEvent): void => {
    let scale = 1;
    if (move.shiftKey) scale = 0.1;
    if (move.ctrlKey || move.metaKey) scale = 10;
    const next = originValue + (move.clientX - originX) * baseStep * scale;
    emit('update', next);
  };

  const onUp = (): void => {
    target.removeEventListener('pointermove', onMove);
    target.removeEventListener('pointerup', onUp);
    emit('commit');
  };

  target.addEventListener('pointermove', onMove);
  target.addEventListener('pointerup', onUp);
};
</script>
