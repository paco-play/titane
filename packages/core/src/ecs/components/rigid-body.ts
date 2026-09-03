import { defineComponent } from '../kernel/registry';

/**
 * How Rapier treats the body.
 *
 * - `dynamic` — simulated: gravity, contacts, and forces move it.
 * - `fixed` — static collider; Transform is the source of pose.
 */
export type RigidBodyKind = 'dynamic' | 'fixed';

/**
 * Marks an entity as a Rapier rigid body.
 *
 * Collider shape comes from `Mesh.primitive` and `Transform.scale`
 * (primitives are unit-boxed). Parenting is ignored: simulate roots.
 */
export interface RigidBodyData {
    kind: RigidBodyKind;
}

/**
 * Factory for a RigidBody component.
 * @param kind - Dynamic (simulated) or fixed (static collider).
 */
export const createRigidBody = (kind: RigidBodyKind = 'dynamic'): RigidBodyData => ({ kind });

/**
 * Typed handle for the RigidBody component.
 */
export const RigidBody = defineComponent<RigidBodyData>(
    'rigid-body',
    () => createRigidBody()
);
