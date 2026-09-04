import { defineComponent } from '../kernel/registry';

/**
 * How Rapier treats the body.
 *
 * - `dynamic` — simulated: gravity, contacts, and forces move it.
 * - `fixed` — static collider; Transform is the source of pose.
 */
export type RigidBodyKind = 'dynamic' | 'fixed';

/** Rapier default. Older scenes that omit the field keep this feel. */
const DEFAULT_FRICTION = 0.5;

/** Rapier default. Older scenes that omit the field keep this feel. */
const DEFAULT_RESTITUTION = 0;

/**
 * Marks an entity as a Rapier rigid body.
 *
 * Collider shape comes from a `Collider` component when present, otherwise
 * from `Mesh.primitive` and `Transform.scale` (primitives are unit-boxed).
 * Parenting is ignored: simulate roots.
 *
 * `friction` and `restitution` are written onto the Rapier collider.
 * Combine rules stay Rapier defaults (Average).
 */
export interface RigidBodyData {
    kind: RigidBodyKind;
    /** Coulomb friction coefficient. Must be `>= 0`. */
    friction: number;
    /** Bounciness. `0` is inelastic; `1` is a perfect bounce. Must be `>= 0`. */
    restitution: number;
}

/**
 * Clamps a material coefficient so Rapier never sees a negative or non-finite value.
 */
const clampMaterial = (value: number, fallback: number): number =>
    Number.isFinite(value) ? Math.max(0, value) : fallback;

/**
 * Factory for a RigidBody component.
 * @param kind - Dynamic (simulated) or fixed (static collider).
 * @param friction - Collider friction. Defaults to Rapier's `0.5`.
 * @param restitution - Collider restitution. Defaults to Rapier's `0`.
 */
export const createRigidBody = (
    kind: RigidBodyKind = 'dynamic',
    friction = DEFAULT_FRICTION,
    restitution = DEFAULT_RESTITUTION
): RigidBodyData => ({
    kind,
    friction: clampMaterial(friction, DEFAULT_FRICTION),
    restitution: clampMaterial(restitution, DEFAULT_RESTITUTION)
});

const asKind = (value: unknown): RigidBodyKind => (value === 'fixed' ? 'fixed' : 'dynamic');

const asMaterial = (value: unknown, fallback: number): number =>
    typeof value === 'number' ? clampMaterial(value, fallback) : fallback;

/**
 * Fills fields that older scenes omitted.
 */
const reviveRigidBody = (raw: unknown): RigidBodyData => {
    const source = raw as Partial<RigidBodyData>;
    return createRigidBody(
        asKind(source.kind),
        asMaterial(source.friction, DEFAULT_FRICTION),
        asMaterial(source.restitution, DEFAULT_RESTITUTION)
    );
};

/**
 * Typed handle for the RigidBody component.
 */
export const RigidBody = defineComponent<RigidBodyData>(
    'rigid-body',
    () => createRigidBody(),
    reviveRigidBody
);
