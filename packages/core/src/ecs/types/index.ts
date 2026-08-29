/**
 * An Entity is a unique numeric identifier.
 * It serves as a key to associate different components together.
 */
export type Entity = number;

/**
 * A unique string identifier for a component type (e.g., 'transform', 'mesh').
 * Assigned once through `defineComponent` and used for serialization.
 */
export type ComponentId = string;

/**
 * Basic structure for component data.
 * Components must be Plain Old JavaScript Objects (POJO) for easy serialization.
 */
export type ComponentData = Record<string, unknown>;
