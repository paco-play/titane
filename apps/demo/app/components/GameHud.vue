<template>
  <div class="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-2">
        <UBadge
          :color="status === 'fallen' ? 'error' : 'success'"
          variant="subtle"
          size="lg"
        >
          {{ status === 'fallen' ? 'Fallen' : 'Playing' }}
        </UBadge>
        <UBadge
          v-if="live"
          color="info"
          variant="subtle"
          size="lg"
        >
          Live from editor
        </UBadge>
      </div>
      <p class="text-sm text-muted">
        WASD / arrows to move, Space to jump. Stay on the slab.
      </p>
    </div>

    <div
      v-if="status === 'fallen'"
      class="pointer-events-auto mx-auto"
    >
      <UCard>
        <template #header>
          <h2 class="text-lg font-medium">
            You fell
          </h2>
        </template>
        <p class="text-sm text-muted mb-4">
          Restore the seeded snapshot and try again.
        </p>
        <UButton
          color="primary"
          @click="emit('restart')"
        >
          Restart
        </UButton>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GameStatus } from '~/types/hud';

defineProps<{
  status: GameStatus
  live?: boolean
}>();

const emit = defineEmits<{
  restart: []
}>();
</script>
