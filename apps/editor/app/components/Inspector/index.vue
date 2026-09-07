<template>
  <InspectorWorld v-if="selectedWorld" />
  <InspectorEntity v-else-if="selectedEntityId !== null" />
</template>

<script setup lang="ts">
const { selectedEntityId, selectedWorld } = useTitane();
</script>
