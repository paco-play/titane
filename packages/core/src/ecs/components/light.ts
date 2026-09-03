import { defineComponent } from '../kernel/registry';

/**
 * The kind of light emitted by this entity.
 *
 * - `directional` — parallel rays from an infinite distance; uses `Transform.rotation` as direction.
 * - `point` — emits in all directions from `Transform.position`; respects `distance` and `decay`.
 * - `ambient` — flat, directionless fill light that affects all surfaces equally.
 */
export type LightKind = 'directional' | 'point' | 'ambient';

/**
 * Marks an entity as a light source.
 *
 * For `directional` and `point` lights the `Transform` component controls
 * position / direction. `ambient` lights ignore the transform entirely.
 */
export interface LightData {
    kind: LightKind;
    /** CSS hex or named color. Default `#ffffff`. */
    color: string;
    /** Luminous intensity. Default `1`. */
    intensity: number;
    /**
     * Cutoff distance for `point` lights (0 = infinite).
     * Ignored for other kinds.
     */
    distance: number;
}

/**
 * Factory for a LightData component.
 * @param kind - The type of light to create.
 * @param color - CSS hex color string.
 * @param intensity - Luminous intensity.
 * @param distance - Point-light cutoff distance (ignored for other kinds).
 */
export const createLight = (
    kind: LightKind = 'directional',
    color = '#ffffff',
    intensity = 1,
    distance = 0
): LightData => ({ kind, color, intensity, distance });

/**
 * Typed handle for the Light component.
 */
export const Light = defineComponent<LightData>('light', () => createLight());
