import {
  addComponent,
  createEntity,
  createGltf,
  createName,
  createSound,
  createTransform,
  getComponent,
  Gltf,
  Mesh,
  Name,
  setParent,
  Sound,
  Transform,
  updateComponent,
  type Entity,
  type World
} from '@titane/core';
import { useTitane } from '../useTitane';
import { usePersistence } from '../usePersistence';
import { usePrefabs } from '../usePrefabs';
import { nextSpawnPosition } from '~/utils/spawn-position';
import type { ProjectItem } from '~/types/project';

/**
 * Applies a Project tile: spawn a prefab / model / sound, or set Mesh albedo.
 */
export const useProjectOpen = () => {
  const { engine, selectedEntityId, syncWorld, notifyInspect, markDirty } = useTitane();
  const { saveToStorage } = usePersistence();
  const { spawnPrefab } = usePrefabs();

  const spawnNamed = (
    name: string,
    attach: (world: World, entity: Entity) => void
  ): void => {
    if (!engine.value) return;
    const world = engine.value.world;
    const parentId = selectedEntityId.value;
    const entity = createEntity(world);
    addComponent(world, entity, Name, createName(name));
    addComponent(world, entity, Transform, createTransform(nextSpawnPosition(world, parentId)));
    attach(world, entity);
    if (parentId !== null) setParent(world, entity, parentId);
    selectedEntityId.value = entity;
    syncWorld();
  };

  const applyTexture = (url: string): void => {
    if (selectedEntityId.value === null || !engine.value) return;
    if (!getComponent(engine.value.world, selectedEntityId.value, Mesh)) return;
    updateComponent(engine.value.world, selectedEntityId.value, Mesh, (data) => {
      data.albedo = url;
    });
    notifyInspect();
    markDirty();
    saveToStorage();
  };

  /**
   * Double-click handler. Scenes are browse-only (loading would replace the world).
   */
  const openItem = (item: ProjectItem): void => {
    if (item.kind === 'prefab') {
      void spawnPrefab(item.url);
      return;
    }
    if (item.kind === 'model') {
      spawnNamed(item.label, (world, entity) => {
        addComponent(world, entity, Gltf, createGltf(item.url));
      });
      return;
    }
    if (item.kind === 'audio') {
      spawnNamed(item.label, (world, entity) => {
        addComponent(world, entity, Sound, createSound(item.url));
      });
      return;
    }
    if (item.kind === 'texture') applyTexture(item.url);
  };

  return { openItem };
};
