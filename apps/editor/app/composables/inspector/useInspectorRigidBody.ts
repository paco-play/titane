import {
  addComponent,
  createRigidBody,
  getComponent,
  removeComponent,
  RigidBody,
  updateComponent,
  type RigidBodyData,
  type RigidBodyKind,
} from '@titane/core';
import { useTitane } from '../useTitane';
import { usePersistence } from '../usePersistence';

/**
 * Reads and writes the selected entity's `RigidBody` component.
 */
export const useInspectorRigidBody = () => {
  const { engine, selectedEntityId, inspectTick, notifyInspect, markDirty } = useTitane();
  const { saveToStorage } = usePersistence();

  const rigid = computed<RigidBodyData | null>(() => {
    void inspectTick.value;
    if (selectedEntityId.value === null || !engine.value) return null;
    return getComponent(engine.value.world, selectedEntityId.value, RigidBody) ?? null;
  });

  const addRigidBody = (): void => {
    if (selectedEntityId.value === null || !engine.value) return;
    addComponent(engine.value.world, selectedEntityId.value, RigidBody, createRigidBody('dynamic'));
    notifyInspect();
    markDirty();
    saveToStorage();
  };

  const removeRigidBody = (): void => {
    if (selectedEntityId.value === null || !engine.value) return;
    removeComponent(engine.value.world, selectedEntityId.value, RigidBody);
    notifyInspect();
    markDirty();
    saveToStorage();
  };

  const patchRigid = (write: (data: RigidBodyData) => void): void => {
    if (selectedEntityId.value === null || !engine.value) return;
    updateComponent(engine.value.world, selectedEntityId.value, RigidBody, write);
    notifyInspect();
    markDirty();
  };

  const setRigidKind = (kind: RigidBodyKind): void => {
    patchRigid((data) => {
      data.kind = kind;
    });
    saveToStorage();
  };

  const setRigidFriction = (friction: number): void => {
    patchRigid((data) => {
      data.friction = friction;
    });
  };

  const setRigidRestitution = (restitution: number): void => {
    patchRigid((data) => {
      data.restitution = restitution;
    });
  };

  return {
    rigid,
    addRigidBody,
    removeRigidBody,
    setRigidKind,
    setRigidFriction,
    setRigidRestitution,
  };
};
