import { defineComponent } from '../kernel/registry';

/**
 * Marks an entity's Rapier collider as a sensor (intersection-only, no contact forces).
 *
 * When a `RigidBody` entity also has `Sensor`, Rapier will report all overlapping
 * bodies through the event queue without generating physical impulses.
 * The physics system records those pairs so game code can query them via
 * `getIntersections(session, entity)`.
 *
 * A `Sensor` entity typically has `kind: 'fixed'` so it stays at a chosen world
 * position, but `dynamic` sensors are equally valid (e.g. a pickup that moves).
 */
export interface SensorData {
    /** Optional tag for identifying this sensor's role in game logic. */
    tag: string;
}

/** Factory for a Sensor component. */
export const createSensor = (tag = ''): SensorData => ({ tag });

/** Typed handle for the Sensor component. */
export const Sensor = defineComponent<SensorData>('sensor', () => createSensor());
