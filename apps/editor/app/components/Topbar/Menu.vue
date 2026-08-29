<template>
  <UDropdownMenu :items="dropDownItems" size="xs">
    <UButton
      icon="i-lucide-menu"
      color="neutral"
      variant="outline"
      size="xs"
    />
  </UDropdownMenu>
  <!-- Hidden file input for loading projects -->
  <input
    ref="fileInput"
    type="file"
    accept=".titane"
    class="hidden"
    @change="onFileSelected"
  >
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';

const { saveToDisk, loadFromDisk } = usePersistence();

const fileInput = ref<HTMLInputElement | null>(null);

/**
 * Discards the current scene.
 * A full reload is enough for now, and guarantees a pristine engine state.
 */
const newScene = (): void => {
  if (confirm('Create new scene? All unsaved changes will be lost.')) {
    window.location.reload();
  }
};

const newSceneItem: DropdownMenuItem = {
  label: 'New Scene',
  icon: 'i-lucide-file-plus',
  onSelect: newScene
};

const openItem: DropdownMenuItem = {
  label: 'Open Project...',
  icon: 'i-lucide-folder-open',
  onSelect: () => fileInput.value?.click()
};

const saveItem: DropdownMenuItem = {
  label: 'Save Project',
  icon: 'i-lucide-save',
  shortcuts: ['⌘', 'S'],
  onSelect: () => saveToDisk('my-project.titane')
};

const dropDownItems = computed<DropdownMenuItem[][]>(() => [
  [newSceneItem],
  [openItem, saveItem]
]);

/**
 * Triggered when the user selects a .titane file.
 */
const onFileSelected = async (event: Event): Promise<void> => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  await loadFromDisk(file);

  // Reset the input so the same file can be re-imported if needed
  target.value = '';
};
</script>
