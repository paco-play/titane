<template>
  <main class="flex flex-col h-screen">
    <TopbarMain />
    <!-- Editor Layout -->
    <div class="flex justify-between w-full h-full">
      <!-- Hierarchy Sidebar -->
      <USidebar side="left" :rail="true" :ui="{ body: 'p-0' }">
        <template #header>
          <SidebarHierarchyHeader />
        </template>
        <SidebarHierarchy />
      </USidebar>

      <!-- Canvas -->
      <div class="flex flex-col w-full h-full">
        <TopbarCanvas />
        <TopbarScriptErrorBanner
          :error="scriptError"
          @dismiss="clearScriptError"
        />
        <slot />
      </div>
      <!-- Inspector Sidebar -->
      <USidebar side="right" :rail="true">
        <template #header>
          <h2 class="text-xs text-muted">
            Inspector
          </h2>
        </template>
        <Inspector />
      </USidebar>
    </div>
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
