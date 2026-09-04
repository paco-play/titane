<template>
  <UModal
    :open="open"
    title="Exit Play"
    :dismissible="false"
    @update:open="onOpen"
  >
    <template #body>
      <p class="text-sm text-muted">
        Keep Play edits in the scene, or discard them and restore the state from when you pressed Play.
      </p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          label="Discard"
          color="neutral"
          variant="outline"
          size="sm"
          @click="emit('discard')"
        />
        <UButton
          label="Keep"
          color="primary"
          size="sm"
          @click="emit('keep')"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  keep: [];
  discard: [];
  dismiss: [];
}>();

const onOpen = (next: boolean): void => {
  if (!next) emit('dismiss');
};
</script>
