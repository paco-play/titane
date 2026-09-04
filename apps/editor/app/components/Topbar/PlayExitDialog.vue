<template>
  <UModal
    :open="open"
    title="Exit Play"
    :dismissible="false"
    @update:open="onOpenChange"
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
          @click="chooseDiscard"
        />
        <UButton
          label="Keep"
          color="primary"
          size="sm"
          @click="chooseKeep"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  open: boolean
}>();

const emit = defineEmits<{
  keep: []
  discard: []
  dismiss: []
}>();

/** True after Keep or Discard so closing the modal does not fire dismiss too. */
const choiceAlreadyMade = ref(false);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) choiceAlreadyMade.value = false;
  }
);

const chooseKeep = (): void => {
  choiceAlreadyMade.value = true;
  emit('keep');
};

const chooseDiscard = (): void => {
  choiceAlreadyMade.value = true;
  emit('discard');
};

const onOpenChange = (nextOpen: boolean): void => {
  if (!nextOpen && !choiceAlreadyMade.value) emit('dismiss');
};
</script>
