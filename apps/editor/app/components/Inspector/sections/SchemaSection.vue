<template>
  <UCollapsible>
    <UButton
      :label="label"
      color="neutral"
      variant="outline"
      trailing-icon="i-lucide-chevron-down"
      size="xs"
      block
      class="justify-start"
    />

    <template #content>
      <div class="space-y-1.5 py-1.5">
        <InspectorSchemaField
          v-for="entry in fields"
          :key="entry.key"
          :field-key="entry.key"
          :field="entry.field"
          :value="data[entry.key]"
          :inspect-tick="inspectTick"
          :entity-options="entityOptions"
          @update="onField(entry.key, $event)"
          @commit="emit('commit')"
        />
        <UButton
          label="Remove"
          color="neutral"
          variant="ghost"
          size="xs"
          @click="emit('remove')"
        />
      </div>
    </template>
  </UCollapsible>
</template>

<script setup lang="ts">
import type { AnyFieldDef } from '@titane/core';
import type { EntityOption } from '~/types/inspector';

defineProps<{
  label: string;
  data: Record<string, unknown>;
  fields: readonly { readonly key: string; readonly field: AnyFieldDef }[];
  inspectTick: number;
  entityOptions: readonly EntityOption[];
}>();

const emit = defineEmits<{
  update: [key: string, value: unknown];
  remove: [];
  commit: [];
}>();

const onField = (key: string, value: unknown): void => {
  emit('update', key, value);
};
</script>
