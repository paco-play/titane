import { defineComponent } from '../kernel/registry';

/** Zenith tint when the cubemap is empty. */
export const DEFAULT_SKYBOX_COLOR = '#6eb6e0';

/** Engine default sky: 6-face cube under `apps/editor/public/engine`. */
export const DEFAULT_SKYBOX_CUBEMAP = '/engine/sky_118_cubemap_2k';

/**
 * Scene background. A non-empty `cubemap` is a raster URL or a cube-face folder
 * used as `scene.background`. Empty `cubemap` is a gradient tinted by `color`.
 */
export interface SkyboxData {
    /** Zenith tint of the default gradient. Ignored when `cubemap` is set. */
    color: string;
    /** Raster URL or cube folder (`px`/`nx`/… `.png`). Empty = gradient. */
    cubemap: string;
}

const asColor = (value: unknown, fallback: string): string =>
    typeof value === 'string' && value.length > 0 ? value : fallback;

const asUrl = (value: unknown, fallback = ''): string => {
    if (typeof value !== 'string') return fallback;
    return value.trim();
};

/**
 * Factory for a Skybox data object.
 * @param color - Zenith tint when `cubemap` is empty.
 * @param cubemap - Texture URL or cube folder. Defaults to the engine sky.
 */
export const createSkybox = (
    color = DEFAULT_SKYBOX_COLOR,
    cubemap = DEFAULT_SKYBOX_CUBEMAP
): SkyboxData => ({
    color: asColor(color, DEFAULT_SKYBOX_COLOR),
    cubemap: asUrl(cubemap, DEFAULT_SKYBOX_CUBEMAP)
});

/**
 * Fills fields that older scenes omitted.
 */
const reviveSkybox = (raw: unknown): SkyboxData => {
    const source = raw as Partial<SkyboxData>;
    return createSkybox(source.color, source.cubemap ?? DEFAULT_SKYBOX_CUBEMAP);
};

/**
 * Typed handle for the Skybox component.
 */
export const Skybox = defineComponent<SkyboxData>('skybox', () => createSkybox(), reviveSkybox);
