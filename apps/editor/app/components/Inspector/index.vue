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
      <InspectorCamera
        :camera="camera"
        :inspect-tick="inspectTick"
        @add="addCamera"
        @remove="removeCamera"
        @update-fov="setCameraFov"
        @update-near="setCameraNear"
        @update-far="setCameraFar"
        @update-current="setCameraCurrent"
        @commit="saveToStorage"
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
      <InspectorCollider
        :collider="collider"
        :inspect-tick="inspectTick"
        @add="addCollider"
        @add-mesh="addMeshCollider"
        @remove="removeCollider"
        @fit="fitColliderToModel"
        @update-kind="setColliderKind"
        @update-center="setColliderCenter"
        @update-size="setColliderSize"
        @update-radius="setColliderRadius"
        @update-height="setColliderHeight"
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
const { inspectTick } = useTitane();
const { saveToStorage } = usePersistence();
const { transform, setAxis } = useInspectorTransform();
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
  camera,
  addCamera,
  removeCamera,
  setCameraFov,
  setCameraNear,
  setCameraFar,
  setCameraCurrent,
} = useInspectorCamera();
const {
  rigid,
  addRigidBody,
  removeRigidBody,
  setRigidKind,
  setRigidFriction,
  setRigidRestitution,
} = useInspectorRigidBody();
const { isPlayerControlled, setPlayerControlled } = useInspectorPlayer();
const {
  collider,
  addCollider,
  addMeshCollider,
  removeCollider,
  setColliderKind,
  setColliderCenter,
  setColliderSize,
  setColliderRadius,
  setColliderHeight,
  fitColliderToModel
} = useInspectorCollider();
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
</script>
