<template>
  <main class="flex flex-col h-screen overflow-hidden">
    <TopbarMain />
    <div class="flex justify-between w-full flex-1 min-h-0">
      <USidebar
        side="left"
        :rail="true"
        :ui="{ body: 'p-0' }"
      >
        <template #header>
          <SidebarHierarchyHeader />
        </template>
        <SidebarHierarchy />
      </USidebar>

      <div class="flex flex-col flex-1 min-w-0 min-h-0">
        <TopbarCanvas />
        <TopbarScriptErrorBanner
          :error="scriptError"
          @dismiss="clearScriptError"
        />
        <div class="flex-1 min-h-0">
          <slot />
        </div>
      </div>
      <USidebar
        side="right"
        :rail="true"
      >
        <template #header>
          <h2 class="text-xs text-muted">
            Inspector
          </h2>
        </template>
        <Inspector />
      </USidebar>
    </div>
    <Project />
    <TopbarPlayExitDialog
      :open="pendingExitPlay"
      @keep="keepPlayChanges"
      @discard="discardPlayChanges"
      @dismiss="dismissPlayExit"
    />
  </main>
</template>

<script setup lang="ts">
const { scriptError, clearScriptError } = useTitane();
const { pendingExitPlay, keepPlayChanges, discardPlayChanges, dismissPlayExit } = useRuntime();
</script>
