<template>
  <div class="space-y-2">
    <UiFormLabel :label="label" />
    <UPopover @update:open="onOpen">
      <UButton
        :label="value"
        color="neutral"
        variant="outline"
        size="xs"
        block
      >
        <template #leading>
          <span
            class="size-3.5 rounded-sm ring ring-inset ring-white/20 shrink-0"
            :style="{ backgroundColor: value }"
          />
        </template>
      </UButton>

      <template #content>
        <UColorPicker
          :model-value="value"
          format="hex"
          size="xs"
          class="p-2"
          @update:model-value="onColor"
        />
      </template>
    </UPopover>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  value: string;
}>();

const emit = defineEmits<{
  update: [value: string];
  commit: [];
}>();

const onColor = (next: string | undefined): void => {
  if (!next) return;
  emit('update', next.toLowerCase());
};

const onOpen = (open: boolean): void => {
  if (!open) emit('commit');
};
</script>
