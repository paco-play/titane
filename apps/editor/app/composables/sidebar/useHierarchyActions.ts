import {
  addComponent,
  Camera,
  createCamera,
  createEntity,
  createGltf,
  createLight,
  createName,
  createPrimitive,
  createSound,
  createTransform,
  Gltf,
  Light,
  Name,
  Sound,
  setCurrentCamera,
  setParent,
  Transform,
  type LightKind,
  type PrimitiveType,
} from '@titane/core';
import { useTitane } from '../useTitane';
import { nextSpawnPosition } from '~/utils/spawn-position';

/**
 * Hierarchy actions that mutate the world: spawning primitives under the
 * current selection when there is one.
 */
export const useHierarchyActions = () => {
  const { engine, syncWorld, selectedEntityId } = useTitane();

  /**
   * Spawns a primitive entity, parented under the current selection when one exists.
   * New objects are offset so they do not occupy the same point as the selection.
   * @param primitive - The shape to create.
   */
  const addPrimitive = (primitive: PrimitiveType): void => {
    if (!engine.value) return;

    const world = engine.value.world;
    const parentId = selectedEntityId.value;
    const entity = createPrimitive(world, {
      primitive,
      position: nextSpawnPosition(world, parentId)
    });

    if (parentId !== null) {
      setParent(world, entity, parentId);
    }

    selectedEntityId.value = entity;
    syncWorld();
  };

  /**
   * Spawns a named light entity with a `Transform` and a `Light` component.
   * @param kind - The type of light to create.
   */
  const addLight = (kind: LightKind): void => {
    if (!engine.value) return;

    const world = engine.value.world;
    const entity = createEntity(world);
    addComponent(world, entity, Name, createName(kind.charAt(0).toUpperCase() + kind.slice(1) + ' Light'));
    addComponent(world, entity, Transform, createTransform({ x: 5, y: 10, z: 7.5 }));
    addComponent(world, entity, Light, createLight(kind));

    selectedEntityId.value = entity;
    syncWorld();
  };

  /**
   * Spawns a named glTF entity with a `Transform` and an empty `Gltf` URL.
   * The author pastes the model path in the Inspector.
   */
  const addGltf = (): void => {
    if (!engine.value) return;

    const world = engine.value.world;
    const parentId = selectedEntityId.value;
    const entity = createEntity(world);
    addComponent(world, entity, Name, createName('Model'));
    addComponent(world, entity, Transform, createTransform(nextSpawnPosition(world, parentId)));
    addComponent(world, entity, Gltf, createGltf());

    if (parentId !== null) {
      setParent(world, entity, parentId);
    }

    selectedEntityId.value = entity;
    syncWorld();
  };

  /**
   * Spawns a named sound entity with a `Transform` and an empty `Sound` URL.
   */
  const addSound = (): void => {
    if (!engine.value) return;

    const world = engine.value.world;
    const parentId = selectedEntityId.value;
    const entity = createEntity(world);
    addComponent(world, entity, Name, createName('Sound'));
    addComponent(world, entity, Transform, createTransform(nextSpawnPosition(world, parentId)));
    addComponent(world, entity, Sound, createSound());

    if (parentId !== null) {
      setParent(world, entity, parentId);
    }

    selectedEntityId.value = entity;
    syncWorld();
  };

  /**
   * Spawns a scene camera at (0, 2, 6), looking down -Z toward the origin.
   * Becomes the current Play / game view.
   */
  const addCamera = (): void => {
    if (!engine.value) return;

    const world = engine.value.world;
    const entity = createEntity(world);
    addComponent(world, entity, Name, createName('Camera'));
    addComponent(world, entity, Transform, createTransform({ x: 0, y: 2, z: 6 }));
    addComponent(world, entity, Camera, createCamera());
    setCurrentCamera(world, entity);

    selectedEntityId.value = entity;
    syncWorld();
  };

  return { addPrimitive, addLight, addGltf, addSound, addCamera };
};
