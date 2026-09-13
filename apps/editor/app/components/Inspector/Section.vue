<template>
  <UCard
    variant="subtle"
    :ui="CARD_UI"
  >
    <template #header>
      <div class="flex items-center gap-1.5 min-w-0">
        <UIcon
          :name="icon"
          class="size-3.5 shrink-0 text-muted"
        />
        <span class="text-xs font-medium truncate">
          {{ title }}
        </span>
        <div
          v-if="$slots.actions"
          class="ms-auto shrink-0"
        >
          <slot name="actions" />
        </div>
      </div>
    </template>
    <slot />
  </UCard>
</template>

<script setup lang="ts">
const CARD_UI = {
  header: 'px-(--chrome-pad) py-(--chrome-pad-tight) sm:px-(--chrome-pad) sm:py-(--chrome-pad-tight)',
  body: 'px-(--chrome-pad) py-(--chrome-pad) sm:px-(--chrome-pad) sm:py-(--chrome-pad)'
} as const;

defineProps<{
  /** Section label shown next to the leading icon. */
  title: string;
  /** Lucide id, e.g. `i-lucide-move-3d`. */
  icon: string;
}>();
</script>
