import {
  addComponent,
  Collider,
  createCollider,
  createRigidBody,
  getComponent,
  hasComponent,
  RigidBody,
  removeComponent,
  updateComponent,
  type ColliderData,
  type ColliderKind,
  type Vec3
} from '@titane/core';
import { useTitane } from '../useTitane';
import { usePersistence } from '../usePersistence';

const cloneVec3 = (value: Vec3): Vec3 => ({ x: value.x, y: value.y, z: value.z });

/**
 * Reads and writes the selected entity's `Collider` component.
 */
export const useInspectorCollider = () => {
  const { engine, renderer, selectedEntityId, inspectTick, notifyInspect, markDirty } = useTitane();
  const { saveToStorage } = usePersistence();

  const collider = computed<ColliderData | null>(() => {
    void inspectTick.value;
    if (selectedEntityId.value === null || !engine.value) return null;
    return getComponent(engine.value.world, selectedEntityId.value, Collider) ?? null;
  });

  const ensureFixedRigidBody = (): void => {
    if (selectedEntityId.value === null || !engine.value) return;
    const world = engine.value.world;
    const entity = selectedEntityId.value;
    if (!hasComponent(world, entity, RigidBody)) {
      addComponent(world, entity, RigidBody, createRigidBody('fixed'));
      return;
    }
    updateComponent(world, entity, RigidBody, (data) => {
      data.kind = 'fixed';
    });
  };

  const asColliderKind = (kind: ColliderKind | unknown): ColliderKind =>
    kind === 'sphere' || kind === 'capsule' || kind === 'mesh' || kind === 'box' ? kind : 'box';

  const addCollider = (kind: ColliderKind | unknown = 'box'): void => {
    const resolvedKind = asColliderKind(kind);
    if (selectedEntityId.value === null || !engine.value) return;
    ensureFixedRigidBody();
    if (!hasComponent(engine.value.world, selectedEntityId.value, Collider)) {
      addComponent(engine.value.world, selectedEntityId.value, Collider, createCollider(resolvedKind));
    } else {
      updateComponent(engine.value.world, selectedEntityId.value, Collider, (data) => {
        data.kind = resolvedKind;
      });
    }
    if (resolvedKind === 'mesh') ensureFixedRigidBody();
    notifyInspect();
    markDirty();
    saveToStorage();
  };

  const removeCollider = (): void => {
    if (selectedEntityId.value === null || !engine.value) return;
    removeComponent(engine.value.world, selectedEntityId.value, Collider);
    notifyInspect();
    markDirty();
    saveToStorage();
  };

  const patchCollider = (write: (data: ColliderData) => void): void => {
    if (selectedEntityId.value === null || !engine.value) return;
    updateComponent(engine.value.world, selectedEntityId.value, Collider, write);
    notifyInspect();
    markDirty();
  };

  const setColliderKind = (kind: ColliderKind): void => {
    patchCollider((data) => {
      data.kind = kind;
    });
    if (kind === 'mesh') ensureFixedRigidBody();
    saveToStorage();
  };

  const setColliderCenter = (center: Vec3): void => {
    patchCollider((data) => {
      data.center = cloneVec3(center);
    });
  };

  const setColliderSize = (size: Vec3): void => {
    patchCollider((data) => {
      data.size = cloneVec3(size);
    });
  };

  const setColliderRadius = (radius: number): void => {
    patchCollider((data) => {
      data.radius = Math.max(0.001, radius);
    });
  };

  const setColliderHeight = (height: number): void => {
    patchCollider((data) => {
      data.height = Math.max(0.001, height);
    });
  };

  const fitColliderToModel = (): void => {
    if (selectedEntityId.value === null || !renderer.value) return;
    const aabb = renderer.value.localAabb(selectedEntityId.value);
    if (!aabb) return;
    const kind = collider.value?.kind ?? 'box';
    patchCollider((data) => {
      data.center = cloneVec3(aabb.center);
      if (kind === 'box' || kind === 'mesh') {
        data.size = cloneVec3(aabb.size);
      }
      if (kind === 'sphere') {
        data.radius = Math.max(0.001, Math.max(aabb.size.x, aabb.size.y, aabb.size.z) * 0.5);
      }
      if (kind === 'capsule') {
        data.radius = Math.max(0.001, Math.max(aabb.size.x, aabb.size.z) * 0.5);
        data.height = Math.max(0.001, aabb.size.y);
      }
    });
    saveToStorage();
  };

  return {
    collider,
    addCollider,
    addMeshCollider: () => addCollider('mesh'),
    removeCollider,
    setColliderKind,
    setColliderCenter,
    setColliderSize,
    setColliderRadius,
    setColliderHeight,
    fitColliderToModel
  };
};
