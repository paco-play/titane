import { cloneEntity, destroyEntity, updateComponent, Transform } from '@titane/core';
import { useTitane } from '../useTitane';

/**
 * Composable handling business logic for the Inspector actions
 * (Deletion, Duplication, etc.)
 */
export const useInspectorActions = () => {
  const { engine, selectedEntityId, syncWorld } = useTitane();

  /**
   * Removes the currently selected entity from the world.
   */
  const deleteSelectedEntity = (): void => {
    if (!engine.value || selectedEntityId.value === null) return;

    destroyEntity(engine.value.world, selectedEntityId.value);

    selectedEntityId.value = null;
    syncWorld();
  };

  /**
   * Clones the selected entity, offsetting the copy so it stays visible.
   */
  const duplicateSelectedEntity = (): void => {
    if (!engine.value || selectedEntityId.value === null) return;

    const world = engine.value.world;
    const cloneId = cloneEntity(world, selectedEntityId.value);

    updateComponent(world, cloneId, Transform, (transform) => {
      transform.position.x += 1;
      transform.isDirty = true;
    });

    selectedEntityId.value = cloneId;
    syncWorld();
  };

  return {
    deleteSelectedEntity,
    duplicateSelectedEntity
  };
};
