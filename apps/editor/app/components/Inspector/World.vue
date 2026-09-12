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
      <InspectorFilters
        :post-fx="postFx"
        :authored="filtersAuthored"
        :inspect-tick="inspectTick"
        @update-bloom="setBloom"
        @update-exposure="setExposure"
        @update-contrast="setContrast"
        @update-saturation="setSaturation"
        @update-tint="setTint"
        @update-vignette="setVignette"
        @reset="resetPostFx"
        @commit="saveToStorage"
      />
      <InspectorNavigation
        :nav="nav"
        :authored="navAuthored"
        :inspect-tick="inspectTick"
        @update-cell-size="setCellSize"
        @update-agent-radius="setAgentRadius"
        @update-agent-height="setAgentHeight"
        @bake="bakeNav"
        @clear="clearNavGrid"
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
const {
  postFx,
  authored: filtersAuthored,
  setBloom,
  setExposure,
  setContrast,
  setSaturation,
  setTint,
  setVignette,
  resetPostFx
} = useInspectorWorldPostFx();
const {
  nav,
  authored: navAuthored,
  bake: bakeNav,
  clear: clearNavGrid,
  setCellSize,
  setAgentRadius,
  setAgentHeight
} = useInspectorWorldNav();
</script>
