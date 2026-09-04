<template>
  <section class="flex h-52 shrink-0 border-t border-default bg-default">
    <ProjectFolders
      :folders="folders"
      :folder="folder"
      @select="selectFolder"
    />
    <div class="flex flex-col flex-1 min-w-0">
      <ProjectHeader
        :query="query"
        :breadcrumb="breadcrumb"
        @update-query="query = $event"
      />
      <ProjectGrid
        :items="visible"
        :selected-url="selectedUrl"
        :hint="hint"
        @select="selectItem"
        @open="openItem"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { PROJECT_FOLDER_HINT } from '~/types/project';

const {
  folders,
  folder,
  query,
  selectedUrl,
  visible,
  breadcrumb,
  selectFolder,
  selectItem
} = useProjectBrowser();
const { openItem } = useProjectOpen();

const hint = computed(() => PROJECT_FOLDER_HINT[folder.value]);
</script>
