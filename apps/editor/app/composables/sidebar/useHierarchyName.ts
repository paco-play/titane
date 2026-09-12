import type { Entity, Name as NameData } from '@titane/core';
import {
  addComponent,
  createName,
  getComponent,
  hasComponent,
  Name,
  updateComponent
} from '@titane/core';
import {
  applyHierarchyNamePatch,
  type HierarchyNamePatch
} from '~/utils/hierarchy-name';

/**
 * Writes Name (label, icon, color) from Hierarchy actions and persists.
 */
export const useHierarchyName = () => {
  const { engine, syncWorld, markDirty, notifyInspect } = useTitane();
  const { saveToStorage } = usePersistence();

  const patchName = (entityId: Entity, patch: HierarchyNamePatch): void => {
    if (!engine.value) return;
    const world = engine.value.world;

    if (!hasComponent(world, entityId, Name)) {
      addComponent(world, entityId, Name, createName(patch.value ?? 'GameObject'));
    }

    updateComponent(world, entityId, Name, (data) => {
      applyHierarchyNamePatch(data, patch);
    });

    syncWorld();
    notifyInspect();
    markDirty();
    saveToStorage();
  };

  const nameOf = (entityId: Entity): NameData | undefined => {
    if (!engine.value) return undefined;
    return getComponent(engine.value.world, entityId, Name);
  };

  return { patchName, nameOf };
};
