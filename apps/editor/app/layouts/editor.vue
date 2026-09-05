<template>
  <main class="relative h-screen overflow-hidden">
    <div class="absolute inset-0 z-0">
      <slot />
    </div>

    <div class="absolute inset-0 z-10 flex flex-col pointer-events-none">
      <div class="pointer-events-auto px-2 pt-2">
        <TopbarMain />
      </div>

      <div class="flex flex-1 min-h-0 px-2 py-1.5 gap-1.5">
        <USidebar
          class="pointer-events-auto"
          side="left"
          variant="floating"
          collapsible="none"
        >
          <template #header>
            <SidebarHierarchyHeader />
          </template>
          <SidebarHierarchy />
        </USidebar>

        <div class="relative flex-1 min-w-0">
          <div class="absolute top-0 inset-x-0 flex flex-col items-center gap-2 pointer-events-none">
            <div class="pointer-events-auto">
              <TopbarCanvas />
            </div>
            <div class="pointer-events-auto w-full max-w-xl px-4">
              <TopbarScriptErrorBanner
                :error="scriptError"
                @dismiss="clearScriptError"
              />
            </div>
          </div>
        </div>

        <USidebar
          class="pointer-events-auto"
          side="right"
          variant="floating"
          collapsible="none"
        >
          <template #header>
            <h2 class="text-xs text-muted">
              Inspector
            </h2>
          </template>
          <Inspector />
        </USidebar>
      </div>

      <div class="pointer-events-auto px-2 pb-2">
        <Project />
      </div>
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
