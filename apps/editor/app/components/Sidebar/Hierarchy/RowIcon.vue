<template>
  <UIcon
    :name="icon"
    class="size-3.5 shrink-0"
    :style="color ? { color } : undefined"
  />
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
  color?: string;
}>();
</script>
