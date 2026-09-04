<template>
  <div class="space-y-3">
    <InspectorNumberField
      v-if="numberValue !== undefined"
      :label="label"
      :value="numberValue"
      :inspect-tick="inspectTick"
      :min="numberMin"
      :max="numberMax"
      :step="numberStep"
      @update="emit('update', $event)"
      @commit="emit('commit')"
    />
    <InspectorBooleanField
      v-else-if="booleanValue !== undefined"
      :label="label"
      :value="booleanValue"
      @update="emit('update', $event)"
      @commit="emit('commit')"
    />
    <InspectorStringField
      v-else-if="field.kind === 'string' && stringValue !== undefined"
      :label="label"
      :value="stringValue"
      :inspect-tick="inspectTick"
      @update="emit('update', $event)"
      @commit="emit('commit')"
    />
    <InspectorColorField
      v-else-if="field.kind === 'color' && stringValue !== undefined"
      :label="label"
      :value="stringValue"
      @update="emit('update', $event)"
      @commit="emit('commit')"
    />
    <InspectorVec3Field
      v-else-if="vec3Value"
      :label="label"
      :value="vec3Value"
      :inspect-tick="inspectTick"
      @update="emit('update', $event)"
      @commit="emit('commit')"
    />
    <InspectorQuatField
      v-else-if="quatValue"
      :label="label"
      :value="quatValue"
      :inspect-tick="inspectTick"
      @update="emit('update', $event)"
      @commit="emit('commit')"
    />
    <InspectorEnumField
      v-else-if="field.kind === 'enum' && stringValue !== undefined"
      :label="label"
      :value="stringValue"
      :options="field.options"
      :inspect-tick="inspectTick"
      @update="emit('update', $event)"
      @commit="emit('commit')"
    />
    <InspectorEntityField
      v-else-if="field.kind === 'entity'"
      :label="label"
      :value="entityValue"
      :options="entityOptions"
      :inspect-tick="inspectTick"
      @update="emit('update', $event)"
      @commit="emit('commit')"
    />
  </div>
</template>

<script setup lang="ts">
import type { AnyFieldDef, Entity, SchemaQuat, SchemaVec3 } from '@titane/core';
import type { EntityOption } from '~/types/inspector';
import { fieldLabel } from '~/utils/field-label';

const props = defineProps<{
  fieldKey: string;
  field: AnyFieldDef;
  value: unknown;
  inspectTick: number;
  entityOptions: readonly EntityOption[];
}>();

const emit = defineEmits<{
  update: [value: unknown];
  commit: [];
}>();

const label = computed<string>(() => fieldLabel(props.fieldKey));

const numberValue = computed<number | undefined>(() =>
  props.field.kind === 'number' && typeof props.value === 'number' ? props.value : undefined
);

const numberMin = computed<number | undefined>(() =>
  props.field.kind === 'number' ? props.field.min : undefined
);

const numberMax = computed<number | undefined>(() =>
  props.field.kind === 'number' ? props.field.max : undefined
);

const numberStep = computed<number | undefined>(() =>
  props.field.kind === 'number' ? props.field.step : undefined
);

const booleanValue = computed<boolean | undefined>(() =>
  props.field.kind === 'boolean' && typeof props.value === 'boolean' ? props.value : undefined
);

const stringValue = computed<string | undefined>(() =>
  typeof props.value === 'string' ? props.value : undefined
);

const isVec3 = (value: unknown): value is SchemaVec3 =>
  typeof value === 'object'
  && value !== null
  && 'x' in value
  && 'y' in value
  && 'z' in value
  && !('w' in value);

const isQuat = (value: unknown): value is SchemaQuat =>
  typeof value === 'object'
  && value !== null
  && 'x' in value
  && 'y' in value
  && 'z' in value
  && 'w' in value;

const vec3Value = computed<SchemaVec3 | undefined>(() =>
  props.field.kind === 'vec3' && isVec3(props.value) ? props.value : undefined
);

const quatValue = computed<SchemaQuat | undefined>(() =>
  props.field.kind === 'quat' && isQuat(props.value) ? props.value : undefined
);

const entityValue = computed<Entity | null>(() => {
  if (props.value === null) return null;
  return typeof props.value === 'number' ? props.value : null;
});
</script>
