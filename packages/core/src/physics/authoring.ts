import type { World } from '../ecs/kernel/world';
import type { Entity } from '../ecs/types';
import type { ColliderKind } from '../ecs/components/collider';
import type { RigidBodyKind } from '../ecs/components/rigid-body';
import { addComponent, getComponent, updateComponent } from '../ecs/kernel/component';
import { RigidBody, createRigidBody } from '../ecs/components/rigid-body';

/**
 * Kind to author when attaching a Collider.
 *
 * Mesh colliders are Rapier trimeshes and must be fixed.
 * Analytic shapes keep the existing kind, or spawn `dynamic` so Play simulates.
 */
export const rigidKindForCollider = (
    colliderKind: ColliderKind,
    existingKind: RigidBodyKind | null
): RigidBodyKind => (colliderKind === 'mesh' ? 'fixed' : (existingKind ?? 'dynamic'));

/**
 * Ensures a RigidBody exists for an authored Collider without freezing dynamics.
 * Mesh still forces `fixed`. Box / sphere / capsule never overwrite an existing kind.
 */
export const ensureRigidBodyForCollider = (
    world: World,
    entity: Entity,
    colliderKind: ColliderKind
): void => {
    const existing = getComponent(world, entity, RigidBody);
    const kind = rigidKindForCollider(colliderKind, existing?.kind ?? null);
    if (!existing) {
        addComponent(world, entity, RigidBody, createRigidBody(kind));
        return;
    }
    if (existing.kind === kind) return;
    updateComponent(world, entity, RigidBody, (data) => {
        data.kind = kind;
    });
};
