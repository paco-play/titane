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
  type Vec3,
  type World
} from '@titane/core';
import { useTitane } from '../useTitane';
import { usePersistence } from '../usePersistence';
import { usePrefabs } from '../usePrefabs';
import { nextSpawnPosition } from '~/utils/spawn-position';
import type { ProjectItem } from '~/types/project';

export interface OpenItemOptions {
  /** World pose. When omitted, uses {@link nextSpawnPosition}. */
  readonly position?: Vec3;
  /** Entity under the pointer. Used for texture drops. */
  readonly pickEntity?: Entity | null;
  /** When false, the new entity is a root even if something is selected. */
  readonly parentToSelection?: boolean;
}

/**
 * Applies a Project tile: spawn a prefab / model / sound, or set Mesh albedo.
 */
export const useProjectOpen = () => {
  const { engine, selectedEntityId, syncWorld, notifyInspect, markDirty } = useTitane();
  const { saveToStorage } = usePersistence();
  const { spawnPrefab } = usePrefabs();

  const spawnNamed = (
    name: string,
    attach: (world: World, entity: Entity) => void,
    options: OpenItemOptions = {}
  ): void => {
    if (!engine.value) return;
    const world = engine.value.world;
    const parentId = options.parentToSelection === false ? null : selectedEntityId.value;
    const pose = options.position ?? nextSpawnPosition(world, parentId);
    const entity = createEntity(world);
    addComponent(world, entity, Name, createName(name));
    addComponent(world, entity, Transform, createTransform(pose));
    attach(world, entity);
    if (parentId !== null) setParent(world, entity, parentId);
    selectedEntityId.value = entity;
    syncWorld();
  };

  const applyTexture = (url: string, entityId: Entity | null): void => {
    if (entityId === null || !engine.value) return;
    if (!getComponent(engine.value.world, entityId, Mesh)) return;
    updateComponent(engine.value.world, entityId, Mesh, (data) => {
      data.albedo = url;
    });
    selectedEntityId.value = entityId;
    notifyInspect();
    markDirty();
    saveToStorage();
  };

  /**
   * Double-click or drop handler. Scenes are browse-only.
   */
  const openItemAt = (item: ProjectItem, options: OpenItemOptions = {}): void => {
    if (item.kind === 'prefab') {
      void spawnPrefab(item.url, options.position, options.parentToSelection !== false);
      return;
    }
    if (item.kind === 'model') {
      spawnNamed(item.label, (world, entity) => {
        addComponent(world, entity, Gltf, createGltf(item.url));
      }, options);
      return;
    }
    if (item.kind === 'audio') {
      spawnNamed(item.label, (world, entity) => {
        addComponent(world, entity, Sound, createSound(item.url));
      }, options);
      return;
    }
    if (item.kind === 'texture') {
      applyTexture(item.url, options.pickEntity ?? selectedEntityId.value);
    }
  };

  /**
   * Double-click handler. Parents under the current selection.
   */
  const openItem = (item: ProjectItem): void => {
    openItemAt(item);
  };

  return { openItem, openItemAt };
};
