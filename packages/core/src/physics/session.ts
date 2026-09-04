import RAPIER from './load-rapier';
import type { World } from '../ecs/kernel/world';
import type { Entity } from '../ecs/types';
import type { RigidBodyKind } from '../ecs/components/rigid-body';
import type { PrimitiveType } from '../ecs/components/mesh';
import type { ColliderKind } from '../ecs/components/collider';
import type { MeshColliderGeometryProvider } from '../runtime/renderer-interface';

const GRAVITY = { x: 0, y: -9.81, z: 0 };

/**
 * One Rapier body plus the ECS facts used to decide when to rebuild it.
 */
export interface BodyBinding {
    body: RAPIER.RigidBody;
    collider: RAPIER.Collider;
    kind: RigidBodyKind;
    primitive: PrimitiveType;
    scaleX: number;
    scaleY: number;
    scaleZ: number;
    /** Present when the entity has a `Collider` component. */
    colliderKind: ColliderKind | null;
    sizeY: number;
    radius: number;
    height: number;
    centerY: number;
    shapeSignature: string;
}

/**
 * Live intersection pairs for sensor colliders.
 * Key: sensor entity. Value: set of entities currently overlapping it.
 */
export type IntersectionMap = Map<Entity, Set<Entity>>;

/**
 * Rapier world paired with the ECS world that owns it.
 */
export interface PhysicsSession {
    physics: RAPIER.World;
    /** Per-step event accumulator; passed to `world.step()`. */
    eventQueue: RAPIER.EventQueue;
    bodies: Map<Entity, BodyBinding>;
    /** Reverse map: collider handle → ECS entity. Rebuilt each step. */
    colliderToEntity: Map<number, Entity>;
    /** Active sensor intersections, refreshed every physics step. */
    intersections: IntersectionMap;
}

/**
 * Returns the entities currently inside the given sensor entity.
 * Returns an empty set when the entity has no sensor or no intersections.
 */
export const getIntersections = (session: PhysicsSession, entity: Entity): ReadonlySet<Entity> =>
    session.intersections.get(entity) ?? new Set();

const sessions = new WeakMap<World, PhysicsSession>();
const meshProviders = new WeakMap<World, MeshColliderGeometryProvider>();

/**
 * Registers a per-world source of glTF triangle meshes for `Collider.kind = mesh`.
 * Survives {@link resetPhysicsSession}.
 */
export const setMeshColliderGeometryProvider = (
    world: World,
    provider: MeshColliderGeometryProvider | null
): void => {
    if (provider) meshProviders.set(world, provider);
    else meshProviders.delete(world);
};

/**
 * Runtime mesh geometry for one entity, or `null` while the model is loading.
 */
export const meshColliderGeometryOf = (
    world: World,
    entity: Entity
): ReturnType<MeshColliderGeometryProvider> => {
    const provider = meshProviders.get(world);
    return provider ? provider(world, entity) : null;
};

let ready: Promise<void> | undefined;
let initialized = false;

/**
 * Loads the Rapier WASM module. Safe to call more than once.
 * Must resolve before any physics step.
 */
export const initPhysics = (): Promise<void> => {
    if (!ready) {
        ready = RAPIER.init().then(() => {
            initialized = true;
        });
    }
    return ready;
};

/**
 * Whether {@link initPhysics} has finished.
 */
export const isPhysicsReady = (): boolean => initialized;

/**
 * Returns the Rapier session for an ECS world, creating it on first use.
 * @returns The session, or null when WASM is not ready yet.
 */
export const getPhysicsSession = (world: World): PhysicsSession | null => {
    if (!initialized) return null;

    const existing = sessions.get(world);
    if (existing) return existing;

    const session: PhysicsSession = {
        physics: new RAPIER.World(GRAVITY),
        eventQueue: new RAPIER.EventQueue(true),
        bodies: new Map(),
        colliderToEntity: new Map(),
        intersections: new Map()
    };
    sessions.set(world, session);
    return session;
};

/**
 * Drops the Rapier world so the next step rebuilds bodies from ECS poses.
 * Call after a snapshot restore or scene load.
 */
export const resetPhysicsSession = (world: World): void => {
    const session = sessions.get(world);
    if (!session) return;
    session.eventQueue.free();
    session.physics.free();
    sessions.delete(world);
};
