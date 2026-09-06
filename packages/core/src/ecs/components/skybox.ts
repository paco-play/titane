import { defineComponent } from '../kernel/registry';

/** Solid background when no `Skybox` exists, matching the previous renderer hardcode. */
export const DEFAULT_SKYBOX_COLOR = '#0a0a0a';

/**
 * Scene background. Color is the engine default; a non-empty `cubemap` URL
 * is an equirectangular (or 2D) texture used as `scene.background`.
 */
export interface SkyboxData {
    /** CSS hex color. Used when `cubemap` is empty. */
    color: string;
    /** Texture asset URL. Empty string means color only. */
    cubemap: string;
}

const asColor = (value: unknown, fallback: string): string =>
    typeof value === 'string' && value.length > 0 ? value : fallback;

const asUrl = (value: unknown): string =>
    typeof value === 'string' ? value.trim() : '';

/**
 * Factory for a Skybox data object.
 * @param color - Solid background color.
 * @param cubemap - Optional texture URL for an equirectangular sky.
 */
export const createSkybox = (
    color = DEFAULT_SKYBOX_COLOR,
    cubemap = ''
): SkyboxData => ({
    color: asColor(color, DEFAULT_SKYBOX_COLOR),
    cubemap: asUrl(cubemap)
});

/**
 * Fills fields that older scenes omitted.
 */
const reviveSkybox = (raw: unknown): SkyboxData => {
    const source = raw as Partial<SkyboxData>;
    return createSkybox(source.color, source.cubemap);
};

/**
 * Typed handle for the Skybox component.
 */
export const Skybox = defineComponent<SkyboxData>('skybox', () => createSkybox(), reviveSkybox);
