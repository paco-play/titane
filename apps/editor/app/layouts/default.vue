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
  </main>
</template>
