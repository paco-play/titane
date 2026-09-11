<template>
  <div class="flex flex-col h-full min-h-0">
    <div
      v-if="transform"
      class="flex-1 min-h-0 space-y-2 overflow-y-auto"
    >
      <InspectorHeader />
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
        @update-fade="setGltfFade"
        @remove="removeGltf"
        @commit="saveToStorage"
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
      <InspectorCamera
        :camera="camera"
        :inspect-tick="inspectTick"
        @add="addCamera"
        @remove="removeCamera"
        @update-fov="setCameraFov"
        @update-ortho-size="setCameraOrthoSize"
        @update-projection="setCameraProjection"
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
    </div>
    <div
      v-if="transform"
      class="shrink-0 pt-2"
    >
      <InspectorAddComponent
        :types="availableTypes"
        :can-add-gltf="!gltf"
        :can-add-sound="!sound"
        :can-add-light="!light"
        @add="addUserComponent"
        @add-gltf="addGltf"
        @add-sound="addSound"
        @add-light="addLight"
      />
    </div>
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
const { gltf, addGltf, removeGltf, setGltfUrl, setGltfClip, setGltfPlaying, setGltfLoop, setGltfFade } = useInspectorGltf();
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
  setCameraOrthoSize,
  setCameraProjection,
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
