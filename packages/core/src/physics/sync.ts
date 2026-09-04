import RAPIER from './load-rapier';
import type { World } from '../ecs/kernel/world';
import type { Entity } from '../ecs/types';
import type { Transform } from '../ecs/components/transform';
import type { PrimitiveType } from '../ecs/components/mesh';
import { defineQuery, runQuery } from '../ecs/kernel/query';
import { getComponent } from '../ecs/kernel/component';
import { Transform as TransformType } from '../ecs/components/transform';
import { RigidBody } from '../ecs/components/rigid-body';
import { Mesh } from '../ecs/components/mesh';
import { getPhysicsSession } from './session';
import { spawnBinding, syncCollider } from './binding';
import { eulerXyzToQuat, quatToEulerXyz } from './rotation';

const rigidQuery = defineQuery([TransformType, RigidBody]);

const writeTransformToBody = (body: RAPIER.RigidBody, transform: Transform): void => {
    body.setTranslation(transform.position, true);
    body.setRotation(eulerXyzToQuat(transform.rotation), true);
};

const writeBodyToTransform = (body: RAPIER.RigidBody, transform: Transform): void => {
    const translation = body.translation();
    transform.position.x = translation.x;
    transform.position.y = translation.y;
    transform.position.z = translation.z;
    quatToEulerXyz(body.rotation(), transform.rotation);
    transform.isDirty = true;
};

const primitiveOf = (world: World, entity: Entity): PrimitiveType =>
    getComponent(world, entity, Mesh)?.primitive ?? 'box';

/**
 * Creates, steps and tears down Rapier bodies to match the ECS.
 * @param world - Live ECS world.
 * @param dt - Simulation step length, in seconds.
 */
export const stepPhysicsWorld = (world: World, dt: number): void => {
    const session = getPhysicsSession(world);
    if (!session) return;
    session.physics.timestep = dt;

    const live = runQuery(world, rigidQuery);
    const liveSet = new Set(live);

    for (const [entity, binding] of session.bodies) {
        if (liveSet.has(entity)) continue;
        session.physics.removeRigidBody(binding.body);
        session.bodies.delete(entity);
    }

    for (const entity of live) {
        const transform = getComponent(world, entity, TransformType);
        const rigid = getComponent(world, entity, RigidBody);
        if (!transform || !rigid) continue;

        const primitive = primitiveOf(world, entity);
        let binding = session.bodies.get(entity);

        if (!binding || binding.kind !== rigid.kind) {
            if (binding) session.physics.removeRigidBody(binding.body);
            binding = spawnBinding(session, world, entity, transform, rigid, primitive);
            session.bodies.set(entity, binding);
        } else {
            syncCollider(session, world, entity, binding, primitive, transform, rigid);
            if (rigid.kind === 'fixed') writeTransformToBody(binding.body, transform);
        }
    }

    const { eventQueue } = session;
    session.physics.step(eventQueue);

    session.colliderToEntity.clear();
    for (const [entity, binding] of session.bodies) {
        session.colliderToEntity.set(binding.collider.handle, entity);
    }

    eventQueue.drainCollisionEvents((handle1: number, handle2: number, started: boolean): void => {
        const e1 = session.colliderToEntity.get(handle1);
        const e2 = session.colliderToEntity.get(handle2);
        if (e1 === undefined || e2 === undefined) return;

        if (started) {
            if (!session.intersections.has(e1)) session.intersections.set(e1, new Set());
            if (!session.intersections.has(e2)) session.intersections.set(e2, new Set());
            session.intersections.get(e1)!.add(e2);
            session.intersections.get(e2)!.add(e1);
        } else {
            session.intersections.get(e1)?.delete(e2);
            session.intersections.get(e2)?.delete(e1);
        }
    });

    for (const [entity, binding] of session.bodies) {
        if (binding.kind !== 'dynamic') continue;
        const transform = getComponent(world, entity, TransformType);
        if (!transform) continue;
        writeBodyToTransform(binding.body, transform);
    }
};
