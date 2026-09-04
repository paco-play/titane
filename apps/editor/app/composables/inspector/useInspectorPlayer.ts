import {
  addComponent,
  createPlayerControlled,
  hasComponent,
  PlayerControlled,
  removeComponent,
} from '@titane/core';
import { useTitane } from '../useTitane';
import { usePersistence } from '../usePersistence';

/**
 * Reads and writes `PlayerControlled` on the selected entity.
 */
export const useInspectorPlayer = () => {
  const { engine, selectedEntityId, inspectTick, notifyInspect, markDirty } = useTitane();
  const { saveToStorage } = usePersistence();

  const isPlayerControlled = computed<boolean>(() => {
    void inspectTick.value;
    if (selectedEntityId.value === null || !engine.value) return false;
    return hasComponent(engine.value.world, selectedEntityId.value, PlayerControlled);
  });

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

  return { isPlayerControlled, setPlayerControlled };
};
