<template>
  <label class="text-xxs text-muted uppercase block mb-0.5">{{ label }}</label>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
}>();
</script>