<template>
  <span class="text-xxs text-neutral-500 uppercase">{{ label }}</span>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
}>();
</script>