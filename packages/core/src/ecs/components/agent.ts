import { defineComponent } from '../kernel/registry';
import { field } from '../schema/fields';

/**
 * Pathfollows baked `Nav` toward `destination` at `speed`.
 * Movement is XZ; Y stays on Transform / Rapier.
 */
export const Agent = defineComponent('agent', {
    schema: {
        destination: field.vec3(),
        speed: field.number({ min: 0, max: 20, step: 0.1, default: 3 })
    }
});

/** Inferred authoring data for {@link Agent}. */
export type AgentData = ReturnType<typeof Agent.create>;
