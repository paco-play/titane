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
import { isSaveShortcut } from '~/utils/save-shortcut';

const { saveToProject, loadFromDisk } = usePersistence();

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
  onSelect: () => { void saveToProject(); }
};

const dropDownItems = computed<DropdownMenuItem[][]>(() => [
  [newSceneItem],
  [openItem, saveItem]
]);

/**
 * Writes `scenes/main.titane` and stops the browser from saving the HTML page.
 */
const onSaveKey = (event: KeyboardEvent): void => {
  if (!isSaveShortcut(event)) return;
  event.preventDefault();
  void saveToProject();
};

onMounted(() => {
  window.addEventListener('keydown', onSaveKey);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onSaveKey);
});

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
