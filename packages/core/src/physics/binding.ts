import RAPIER from './load-rapier';
import type { World } from '../ecs/kernel/world';
import type { Entity } from '../ecs/types';
import type { Transform } from '../ecs/components/transform';
import type { RigidBodyData } from '../ecs/components/rigid-body';
import type { PrimitiveType } from '../ecs/components/mesh';
import { getComponent } from '../ecs/kernel/component';
import { Sensor } from '../ecs/components/sensor';
import type { BodyBinding, PhysicsSession } from './session';
import {
    applyColliderMaterial,
    applyColliderScale,
    asSensorDesc,
    colliderDescFromPrimitive
} from './collider';
import { eulerXyzToQuat } from './rotation';

/**
 * Builds a collider desc that matches mesh, material, and optional sensor flag.
 */
export const colliderDescFor = (
    world: World,
    entity: Entity,
    primitive: PrimitiveType,
    transform: Transform,
    rigid: RigidBodyData
): RAPIER.ColliderDesc => {
    const desc = colliderDescFromPrimitive(primitive, transform.scale);
    applyColliderMaterial(desc, rigid.friction, rigid.restitution);
    return getComponent(world, entity, Sensor) !== undefined ? asSensorDesc(desc) : desc;
};

/**
 * Creates a Rapier body and collider for one ECS rigid body.
 */
export const spawnBinding = (
    session: PhysicsSession,
    world: World,
    entity: Entity,
    transform: Transform,
    rigid: RigidBodyData,
    primitive: PrimitiveType
): BodyBinding => {
    const desc = rigid.kind === 'fixed'
        ? RAPIER.RigidBodyDesc.fixed()
        : RAPIER.RigidBodyDesc.dynamic();

    desc.setTranslation(transform.position.x, transform.position.y, transform.position.z);
    desc.setRotation(eulerXyzToQuat(transform.rotation));

    const body = session.physics.createRigidBody(desc);
    const collider = session.physics.createCollider(
        colliderDescFor(world, entity, primitive, transform, rigid),
        body
    );

    return {
        body,
        collider,
        kind: rigid.kind,
        primitive,
        scaleX: transform.scale.x,
        scaleY: transform.scale.y,
        scaleZ: transform.scale.z
    };
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
    rigid: RigidBodyData
): void => {
    const scaleChanged = binding.scaleX !== transform.scale.x
        || binding.scaleY !== transform.scale.y
        || binding.scaleZ !== transform.scale.z;

    if (binding.primitive !== primitive) {
        session.physics.removeCollider(binding.collider, true);
        binding.collider = session.physics.createCollider(
            colliderDescFor(world, entity, primitive, transform, rigid),
            binding.body
        );
        binding.primitive = primitive;
    } else if (scaleChanged) {
        applyColliderScale(binding.collider, primitive, transform.scale);
    }

    applyColliderMaterial(binding.collider, rigid.friction, rigid.restitution);

    binding.scaleX = transform.scale.x;
    binding.scaleY = transform.scale.y;
    binding.scaleZ = transform.scale.z;
};
