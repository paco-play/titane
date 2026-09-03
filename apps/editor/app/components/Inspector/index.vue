<template>
  <div class="flex flex-col h-full">
    <div v-if="transform" class="space-y-6 overflow-y-auto">
      <InspectorHeader />
      <USeparator />
      <InspectorItem
        :transform="transform"
        :inspect-tick="inspectTick"
        @update="setAxis"
        @commit="saveToStorage"
      />
      <InspectorMesh
        v-if="mesh"
        :mesh="mesh"
        :inspect-tick="inspectTick"
        @update-primitive="setPrimitive"
        @update-color="setColor"
        @commit="saveToStorage"
      />
      <InspectorRigidBody
        :kind="rigidKind"
        :inspect-tick="inspectTick"
        @add="addRigidBody"
        @remove="removeRigidBody"
        @update-kind="setRigidKind"
      />
      <InspectorPlayer
        :controlled="isPlayerControlled"
        @update-controlled="setPlayerControlled"
      />
    </div>
    <InspectorNoSelection v-else />
  </div>
</template>

<script setup lang="ts">
import type { Axis, TransformField } from '~/types/inspector';
import type { MeshData, PrimitiveType, RigidBodyKind } from '@titane/core';
import {
  getComponent,
  updateComponent,
  addComponent,
  removeComponent,
  hasComponent,
  Transform,
  Mesh,
  RigidBody,
  createRigidBody,
  PlayerControlled,
  createPlayerControlled
} from '@titane/core';

const { engine, selectedEntityId, inspectTick, notifyInspect, markDirty } = useTitane();
const { saveToStorage } = usePersistence();

/** Transform data of the selected entity, if any. */
const transform = computed<Transform | undefined>(() => {
  void inspectTick.value;
  if (selectedEntityId.value === null || !engine.value) return undefined;
  return getComponent(engine.value.world, selectedEntityId.value, Transform);
});

/** Mesh data of the selected entity, if any. */
const mesh = computed<MeshData | undefined>(() => {
  void inspectTick.value;
  if (selectedEntityId.value === null || !engine.value) return undefined;
  return getComponent(engine.value.world, selectedEntityId.value, Mesh);
});

/** RigidBody kind of the selection, or null when the component is absent. */
const rigidKind = computed<RigidBodyKind | null>(() => {
  void inspectTick.value;
  if (selectedEntityId.value === null || !engine.value) return null;
  return getComponent(engine.value.world, selectedEntityId.value, RigidBody)?.kind ?? null;
});

const isPlayerControlled = computed<boolean>(() => {
  void inspectTick.value;
  if (selectedEntityId.value === null || !engine.value) return false;
  return hasComponent(engine.value.world, selectedEntityId.value, PlayerControlled);
});

/**
 * Writes one axis back into the ECS and flags the entity for a matrix rebuild.
 * The dirty flag is what makes the transform system recompute the world matrix.
 */
const setAxis = (field: TransformField, axis: Axis, value: number): void => {
  if (selectedEntityId.value === null || !engine.value) return;

  updateComponent(engine.value.world, selectedEntityId.value, Transform, (data) => {
    data[field][axis] = value;
    data.isDirty = true;
  });
  markDirty();
};

/**
 * Writes a new primitive type into the selected entity's Mesh.
 */
const setPrimitive = (primitive: PrimitiveType): void => {
  if (selectedEntityId.value === null || !engine.value) return;

  updateComponent(engine.value.world, selectedEntityId.value, Mesh, (data) => {
    data.primitive = primitive;
  });
  notifyInspect();
  markDirty();
};

/**
 * Writes a new color into the selected entity's Mesh.
 */
const setColor = (color: string): void => {
  if (selectedEntityId.value === null || !engine.value) return;

  updateComponent(engine.value.world, selectedEntityId.value, Mesh, (data) => {
    data.color = color;
  });
  notifyInspect();
  markDirty();
};

const addRigidBody = (): void => {
  if (selectedEntityId.value === null || !engine.value) return;
  addComponent(engine.value.world, selectedEntityId.value, RigidBody, createRigidBody('dynamic'));
  notifyInspect();
  markDirty();
  saveToStorage();
};

const removeRigidBody = (): void => {
  if (selectedEntityId.value === null || !engine.value) return;
  removeComponent(engine.value.world, selectedEntityId.value, RigidBody);
  notifyInspect();
  markDirty();
  saveToStorage();
};

const setRigidKind = (kind: RigidBodyKind): void => {
  if (selectedEntityId.value === null || !engine.value) return;
  updateComponent(engine.value.world, selectedEntityId.value, RigidBody, (data) => {
    data.kind = kind;
  });
  notifyInspect();
  markDirty();
  saveToStorage();
};

const setPlayerControlled = (controlled: boolean): void => {
  if (selectedEntityId.value === null || !engine.value) return;
  const world = engine.value.world;
  const entity = selectedEntityId.value;
  if (controlled) {
    if (!hasComponent(world, entity, PlayerControlled)) {
      addComponent(world, entity, PlayerControlled, createPlayerControlled());
    }
  } else {
    removeComponent(world, entity, PlayerControlled);
  }
  notifyInspect();
  markDirty();
  saveToStorage();
};
</script>
