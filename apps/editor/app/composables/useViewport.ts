import type { Entity } from '@titane/core';
import { updateComponent, Transform } from '@titane/core';
import type { GizmoMode, LocalTrs } from '@titane/renderer';

const gizmoMode = ref<GizmoMode>('translate');

/**
 * Wires viewport picking and the transform gizmo to the shared engine state.
 */
export const useViewport = () => {
  const { engine, renderer, selectedEntityId, notifyInspect, markDirty } = useTitane();
  const { isPlaying } = useRuntime();
  const { saveToStorage } = usePersistence();

  /**
   * Writes a gizmo edit into the ECS and refreshes the Inspector.
   */
  const applyGizmoTransform = (entity: Entity, trs: LocalTrs): void => {
    if (!engine.value) return;

    updateComponent(engine.value.world, entity, Transform, (transform) => {
      transform.position.x = trs.position.x;
      transform.position.y = trs.position.y;
      transform.position.z = trs.position.z;
      transform.rotation.x = trs.rotation.x;
      transform.rotation.y = trs.rotation.y;
      transform.rotation.z = trs.rotation.z;
      transform.scale.x = trs.scale.x;
      transform.scale.y = trs.scale.y;
      transform.scale.z = trs.scale.z;
      transform.isDirty = true;
    });

    notifyInspect();
    markDirty();
  };

  watch(renderer, (driver) => {
    if (driver) driver.onGizmoTransform = applyGizmoTransform;
  }, { immediate: true });

  watch([selectedEntityId, isPlaying], () => {
    if (!renderer.value) return;

    renderer.value.setGizmoVisible(!isPlaying.value);
    renderer.value.setGizmoTarget(selectedEntityId.value);
  });

  watch(gizmoMode, (mode) => {
    renderer.value?.setGizmoMode(mode);
  });

  /**
   * Selects the mesh under a left click, or clears the selection on a miss.
   * Right clicks never reach this handler (`click.left` on the canvas).
   */
  const onCanvasClick = (event: MouseEvent): void => {
    if (!renderer.value || isPlaying.value) return;
    if (renderer.value.consumeGizmoPick()) {
      saveToStorage();
      return;
    }

    selectedEntityId.value = renderer.value.pick(event.clientX, event.clientY);
  };

  /**
   * W / E / R switch gizmo mode while the simulation is paused.
   */
  const onKeyDown = (event: KeyboardEvent): void => {
    if (isPlaying.value) return;
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

    if (event.code === 'KeyW') gizmoMode.value = 'translate';
    else if (event.code === 'KeyE') gizmoMode.value = 'rotate';
    else if (event.code === 'KeyR') gizmoMode.value = 'scale';
  };

  /**
   * Sets the gizmo mode from the toolbar. Kept as a method so the template
   * does not assign through an unwrapped ref.
   */
  const setGizmoMode = (mode: GizmoMode): void => {
    gizmoMode.value = mode;
  };

  return {
    gizmoMode,
    setGizmoMode,
    onCanvasClick,
    onKeyDown
  };
};
