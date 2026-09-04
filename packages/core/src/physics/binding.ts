import RAPIER from './load-rapier';
import type { World } from '../ecs/kernel/world';
import type { Entity } from '../ecs/types';
import type { Transform } from '../ecs/components/transform';
import type { RigidBodyData, RigidBodyKind } from '../ecs/components/rigid-body';
import type { PrimitiveType } from '../ecs/components/mesh';
import type { ColliderData } from '../ecs/components/collider';
import { getComponent } from '../ecs/kernel/component';
import { Sensor } from '../ecs/components/sensor';
import type { BodyBinding, PhysicsSession } from './session';
import { meshColliderGeometryOf } from './session';
import {
    applyColliderMaterial,
    applyColliderScale,
    asSensorDesc,
    colliderDescFromPrimitive
} from './collider';
import { colliderDescFromCollider, colliderShapeSignature } from './collider-desc';
import { eulerXyzToQuat } from './rotation';

const effectiveBodyKind = (rigid: RigidBodyData, collider: ColliderData | null): RigidBodyKind =>
    collider?.kind === 'mesh' ? 'fixed' : rigid.kind;

const meshTokenOf = (world: World, entity: Entity, collider: ColliderData | null): number => {
    if (collider?.kind !== 'mesh') return 0;
    const geometry = meshColliderGeometryOf(world, entity);
    return geometry ? geometry.vertices.length : 0;
};

const decorateDesc = (
    world: World,
    entity: Entity,
    rigid: RigidBodyData,
    desc: RAPIER.ColliderDesc
): RAPIER.ColliderDesc => {
    applyColliderMaterial(desc, rigid.friction, rigid.restitution);
    return getComponent(world, entity, Sensor) !== undefined ? asSensorDesc(desc) : desc;
};

/**
 * Builds a collider desc that matches mesh, authored Collider, material, and sensor.
 * `null` means the mesh collider is not ready yet.
 */
export const colliderDescFor = (
    world: World,
    entity: Entity,
    primitive: PrimitiveType,
    transform: Transform,
    rigid: RigidBodyData,
    collider: ColliderData | null
): RAPIER.ColliderDesc | null => {
    if (collider) {
        const geometry = collider.kind === 'mesh' ? meshColliderGeometryOf(world, entity) : null;
        const desc = colliderDescFromCollider(collider, transform.scale, geometry);
        return desc ? decorateDesc(world, entity, rigid, desc) : null;
    }
    return decorateDesc(world, entity, rigid, colliderDescFromPrimitive(primitive, transform.scale));
};

const bindingFrom = (
    body: RAPIER.RigidBody,
    collider: RAPIER.Collider,
    rigid: RigidBodyData,
    primitive: PrimitiveType,
    transform: Transform,
    authored: ColliderData | null,
    signature: string
): BodyBinding => ({
    body,
    collider,
    kind: effectiveBodyKind(rigid, authored),
    primitive,
    scaleX: transform.scale.x,
    scaleY: transform.scale.y,
    scaleZ: transform.scale.z,
    colliderKind: authored?.kind ?? null,
    sizeY: authored?.size.y ?? 1,
    radius: authored?.radius ?? 0.5,
    height: authored?.height ?? 1,
    centerY: authored?.center.y ?? 0,
    shapeSignature: signature
});

/**
 * Creates a Rapier body and collider for one ECS rigid body.
 * Returns `null` when a mesh collider is waiting on geometry.
 */
export const spawnBinding = (
    session: PhysicsSession,
    world: World,
    entity: Entity,
    transform: Transform,
    rigid: RigidBodyData,
    primitive: PrimitiveType,
    collider: ColliderData | null
): BodyBinding | null => {
    const desc = colliderDescFor(world, entity, primitive, transform, rigid, collider);
    if (!desc) return null;

    const bodyKind = effectiveBodyKind(rigid, collider);
    const bodyDesc = bodyKind === 'fixed'
        ? RAPIER.RigidBodyDesc.fixed()
        : RAPIER.RigidBodyDesc.dynamic();

    bodyDesc.setTranslation(transform.position.x, transform.position.y, transform.position.z);
    bodyDesc.setRotation(eulerXyzToQuat(transform.rotation));

    const body = session.physics.createRigidBody(bodyDesc);
    const rapierCollider = session.physics.createCollider(desc, body);
    const signature = colliderShapeSignature(
        collider,
        primitive,
        transform.scale,
        meshTokenOf(world, entity, collider)
    );

    return bindingFrom(body, rapierCollider, rigid, primitive, transform, collider, signature);
};

/**
 * Rebuilds or rescales the collider, then writes live material values.
 */
export const syncCollider = (
    session: PhysicsSession,
    world: World,
    entity: Entity,
    binding: BodyBinding,
    primitive: PrimitiveType,
    transform: Transform,
    rigid: RigidBodyData,
    collider: ColliderData | null
): void => {
    const signature = colliderShapeSignature(
        collider,
        primitive,
        transform.scale,
        meshTokenOf(world, entity, collider)
    );

    if (binding.shapeSignature !== signature) {
        const desc = colliderDescFor(world, entity, primitive, transform, rigid, collider);
        if (!desc) return;
        session.physics.removeCollider(binding.collider, true);
        binding.collider = session.physics.createCollider(desc, binding.body);
        binding.shapeSignature = signature;
        binding.primitive = primitive;
        binding.colliderKind = collider?.kind ?? null;
        binding.sizeY = collider?.size.y ?? 1;
        binding.radius = collider?.radius ?? 0.5;
        binding.height = collider?.height ?? 1;
        binding.centerY = collider?.center.y ?? 0;
    } else if (!collider) {
        const scaleChanged = binding.scaleX !== transform.scale.x
            || binding.scaleY !== transform.scale.y
            || binding.scaleZ !== transform.scale.z;
        if (scaleChanged) applyColliderScale(binding.collider, primitive, transform.scale);
    }

    applyColliderMaterial(binding.collider, rigid.friction, rigid.restitution);

    binding.scaleX = transform.scale.x;
    binding.scaleY = transform.scale.y;
    binding.scaleZ = transform.scale.z;
};
