<template>
  <span class="text-xxs text-muted uppercase">{{ label }}</span>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
}>();
</script>