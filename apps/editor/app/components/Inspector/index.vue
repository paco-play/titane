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
import type { RigidBodyKind, LightData, LightKind } from '@titane/core';
import {
  addComponent,
  createLight,
  createPlayerControlled,
  createRigidBody,
  getComponent,
  hasComponent,
  Light,
  PlayerControlled,
  removeComponent,
  RigidBody,
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
const { gltf, addGltf, removeGltf, setGltfUrl } = useInspectorGltf();
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

/** Transform data of the selected entity, if any. */
const transform = computed<Transform | undefined>(() => {
  void inspectTick.value;
  if (selectedEntityId.value === null || !engine.value) return undefined;
  return getComponent(engine.value.world, selectedEntityId.value, Transform);
});

/** Light data of the selected entity, or undefined when absent. */
const light = computed<LightData | undefined>(() => {
  void inspectTick.value;
  if (selectedEntityId.value === null || !engine.value) return undefined;
  return getComponent(engine.value.world, selectedEntityId.value, Light);
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

const addLight = (): void => {
  if (selectedEntityId.value === null || !engine.value) return;
  addComponent(engine.value.world, selectedEntityId.value, Light, createLight());
  notifyInspect();
  markDirty();
  saveToStorage();
};

const removeLight = (): void => {
  if (selectedEntityId.value === null || !engine.value) return;
  removeComponent(engine.value.world, selectedEntityId.value, Light);
  notifyInspect();
  markDirty();
  saveToStorage();
};

const setLightKind = (kind: LightKind): void => {
  if (selectedEntityId.value === null || !engine.value) return;
  updateComponent(engine.value.world, selectedEntityId.value, Light, (data) => {
    data.kind = kind;
  });
  notifyInspect();
  markDirty();
};

const setLightColor = (color: string): void => {
  if (selectedEntityId.value === null || !engine.value) return;
  updateComponent(engine.value.world, selectedEntityId.value, Light, (data) => {
    data.color = color;
  });
  notifyInspect();
  markDirty();
};

const setLightIntensity = (intensity: number): void => {
  if (selectedEntityId.value === null || !engine.value) return;
  updateComponent(engine.value.world, selectedEntityId.value, Light, (data) => {
    data.intensity = intensity;
  });
  markDirty();
};

const setLightDistance = (distance: number): void => {
  if (selectedEntityId.value === null || !engine.value) return;
  updateComponent(engine.value.world, selectedEntityId.value, Light, (data) => {
    data.distance = distance;
  });
  markDirty();
};

const setLightCastShadow = (castShadow: boolean): void => {
  if (selectedEntityId.value === null || !engine.value) return;
  updateComponent(engine.value.world, selectedEntityId.value, Light, (data) => {
    data.castShadow = castShadow;
  });
  notifyInspect();
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
