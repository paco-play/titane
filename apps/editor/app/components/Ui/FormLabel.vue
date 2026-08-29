<template>
  <label class="text-xxs text-neutral-500 uppercase block mb-1">{{ label }}</label>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
}>();
</script>