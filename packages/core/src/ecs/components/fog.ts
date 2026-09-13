import { defineComponent } from '../kernel/registry';

/** Default linear fog tint. */
export const DEFAULT_FOG_COLOR = '#c5d0dc';

/** Distance at which fog is fully opaque. `Camera.far` stays the clip plane. */
export const DEFAULT_FOG_FADE_DISTANCE = 80;

/**
 * Scene-wide distance fog authored on World.
 * Linear fade from the camera to `fadeDistance`. Does not change `Camera.far`.
 */
export interface FogData {
  /** Fog tint. */
  color: string;
  /** World units until the fog is fully opaque. */
  fadeDistance: number;
}

const asColor = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value.length > 0 ? value : fallback;

const asFinite = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

/**
 * Factory for World fog data.
 */
export const createFog = (
  color = DEFAULT_FOG_COLOR,
  fadeDistance = DEFAULT_FOG_FADE_DISTANCE
): FogData => ({
  color: asColor(color, DEFAULT_FOG_COLOR),
  fadeDistance: Math.max(0.1, asFinite(fadeDistance, DEFAULT_FOG_FADE_DISTANCE))
});

const reviveFog = (raw: unknown): FogData => {
  const source = raw as Partial<FogData>;
  return createFog(source.color, source.fadeDistance);
};

/**
 * Typed handle for the Fog component.
 */
export const Fog = defineComponent<FogData>('fog', () => createFog(), reviveFog);
