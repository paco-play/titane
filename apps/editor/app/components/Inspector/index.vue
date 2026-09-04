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
        @update-albedo="setAlbedo"
        @update-roughness="setRoughness"
        @update-metalness="setMetalness"
        @update-emissive="setEmissive"
        @update-cast-shadow="setCastShadow"
        @update-receive-shadow="setReceiveShadow"
        @commit="saveToStorage"
      />
      <InspectorGltf
        v-if="gltf"
        :gltf="gltf"
        :inspect-tick="inspectTick"
        @update-url="setGltfUrl"
        @update-clip="setGltfClip"
        @update-playing="setGltfPlaying"
        @update-loop="setGltfLoop"
        @remove="removeGltf"
        @commit="saveToStorage"
      />
      <UButton
        v-else
        label="Add glTF"
        color="neutral"
        variant="outline"
        size="xs"
        icon="i-lucide-box"
        block
        @click="addGltf"
      />
      <InspectorSound
        v-if="sound"
        :sound="sound"
        :inspect-tick="inspectTick"
        @update-url="setSoundUrl"
        @update-volume="setSoundVolume"
        @update-loop="setSoundLoop"
        @update-positional="setSoundPositional"
        @update-playing="setSoundPlaying"
        @remove="removeSound"
        @commit="saveToStorage"
      />
      <UButton
        v-else
        label="Add Sound"
        color="neutral"
        variant="outline"
        size="xs"
        icon="i-lucide-volume-2"
        block
        @click="addSound"
      />
      <InspectorLight
        v-if="light"
        :light="light"
        :inspect-tick="inspectTick"
        @update-kind="setLightKind"
        @update-color="setLightColor"
        @update-intensity="setLightIntensity"
        @update-distance="setLightDistance"
        @update-cast-shadow="setLightCastShadow"
        @remove="removeLight"
        @commit="saveToStorage"
      />
      <UButton
        v-else
        label="Add Light"
        color="neutral"
        variant="outline"
        size="xs"
        icon="i-lucide-sun"
        block
        @click="addLight"
      />
      <InspectorRigidBody
        :rigid="rigid"
        :inspect-tick="inspectTick"
        @add="addRigidBody"
        @remove="removeRigidBody"
        @update-kind="setRigidKind"
        @update-friction="setRigidFriction"
        @update-restitution="setRigidRestitution"
        @commit="saveToStorage"
      />
      <InspectorPlayer
        :controlled="isPlayerControlled"
        @update-controlled="setPlayerControlled"
      />
      <InspectorSchemaSection
        v-for="section in attached"
        :key="section.type.id"
        :label="section.label"
        :data="section.data"
        :fields="section.fields"
        :inspect-tick="inspectTick"
        :entity-options="entityOptions"
        @update="(key, value) => setField(section.type, key, value)"
        @remove="dropUserComponent(section.type)"
        @commit="saveToStorage"
      />
      <InspectorMissingScript
        v-for="orphan in orphans"
        :key="orphan.id"
        :component-id="orphan.id"
        @remove="dropOrphan(orphan.id)"
      />
      <InspectorAddComponent
        :types="availableTypes"
        @add="addUserComponent"
      />
    </div>
    <InspectorNoSelection v-else />
  </div>
</template>

<script setup lang="ts">
import type { Axis, TransformField } from '~/types/inspector';
import {
  addComponent,
  createPlayerControlled,
  getComponent,
  hasComponent,
  PlayerControlled,
  removeComponent,
  Transform,
  updateComponent,
} from '@titane/core';

const { engine, selectedEntityId, inspectTick, notifyInspect, markDirty } = useTitane();
const { saveToStorage } = usePersistence();
const {
  mesh,
  setPrimitive,
  setColor,
  setAlbedo,
  setRoughness,
  setMetalness,
  setEmissive,
  setCastShadow,
  setReceiveShadow,
} = useInspectorMesh();
const { gltf, addGltf, removeGltf, setGltfUrl, setGltfClip, setGltfPlaying, setGltfLoop } = useInspectorGltf();
const {
  sound,
  addSound,
  removeSound,
  setSoundUrl,
  setSoundVolume,
  setSoundLoop,
  setSoundPositional,
  setSoundPlaying
} = useInspectorSound();
const {
  light,
  addLight,
  removeLight,
  setLightKind,
  setLightColor,
  setLightIntensity,
  setLightDistance,
  setLightCastShadow,
} = useInspectorLight();
const {
  rigid,
  addRigidBody,
  removeRigidBody,
  setRigidKind,
  setRigidFriction,
  setRigidRestitution,
} = useInspectorRigidBody();
const {
  attached,
  orphans,
  availableTypes,
  entityOptions,
  addUserComponent,
  dropUserComponent,
  setField,
  dropOrphan,
} = useInspectorUser();

/** Transform data of the selected entity, if any. */
const transform = computed<Transform | undefined>(() => {
  void inspectTick.value;
  if (selectedEntityId.value === null || !engine.value) return undefined;
  return getComponent(engine.value.world, selectedEntityId.value, Transform);
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
