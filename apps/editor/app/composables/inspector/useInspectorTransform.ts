import {
  getComponent,
  Transform,
  updateComponent,
} from '@titane/core';
import type { Axis, TransformField } from '~/types/inspector';
import { useTitane } from '../useTitane';

/**
 * Reads and writes the selected entity's `Transform`.
 */
export const useInspectorTransform = () => {
  const { engine, selectedEntityId, inspectTick, markDirty } = useTitane();

  const transform = computed<Transform | undefined>(() => {
    void inspectTick.value;
    if (selectedEntityId.value === null || !engine.value) return undefined;
    return getComponent(engine.value.world, selectedEntityId.value, Transform);
  });

  /**
   * Writes one axis and flags the entity so the transform system rebuilds matrices.
   */
  const setAxis = (field: TransformField, axis: Axis, value: number): void => {
    if (selectedEntityId.value === null || !engine.value) return;

    updateComponent(engine.value.world, selectedEntityId.value, Transform, (data) => {
      data[field][axis] = value;
      data.isDirty = true;
    });
    markDirty();
  };

  return { transform, setAxis };
};
