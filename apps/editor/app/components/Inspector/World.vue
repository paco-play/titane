<template>
  <div class="flex flex-col h-full min-h-0">
    <div class="flex-1 min-h-0 space-y-2 overflow-y-auto">
      <div class="flex items-center gap-1">
        <UAvatar
          size="3xs"
          icon="i-lucide-globe"
        />
        <p class="text-xs font-medium">
          World
        </p>
      </div>
      <InspectorSkybox
        :skybox="skybox"
        :authored="authored"
        :inspect-tick="inspectTick"
        @update-color="setSkyboxColor"
        @update-cubemap="setSkyboxCubemap"
        @reset="resetSkybox"
        @commit="saveToStorage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const { inspectTick } = useTitane();
const { saveToStorage } = usePersistence();
const {
  skybox,
  authored,
  setSkyboxColor,
  setSkyboxCubemap,
  resetSkybox
} = useInspectorWorldSkybox();
</script>
