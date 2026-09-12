import { defineComponent } from '../kernel/registry';

/** Neutral tint — no color shift. */
export const DEFAULT_POST_FX_TINT = '#ffffff';

/**
 * Scene-wide post filters authored on World.
 * Applied by the renderer composer. Custom shaders are out of scope.
 */
export interface PostFxData {
    /** Unreal bloom strength. `0` disables the pass. */
    bloom: number;
    /** Linear exposure multiplier. `1` is ungraded. */
    exposure: number;
    /** Contrast around mid-grey. `1` is ungraded. */
    contrast: number;
    /** Color saturation. `1` is ungraded. */
    saturation: number;
    /** Multiply tint after grading. */
    tint: string;
    /** Edge darkening in `[0, 1]`. */
    vignette: number;
}

const asColor = (value: unknown, fallback: string): string =>
    typeof value === 'string' && value.length > 0 ? value : fallback;

const asFinite = (value: unknown, fallback: number): number =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const clamp = (value: number, min: number, max: number): number =>
    Math.min(max, Math.max(min, value));

/**
 * Factory for World post-filter data.
 */
export const createPostFx = (
    bloom = 0,
    exposure = 1,
    contrast = 1,
    saturation = 1,
    tint = DEFAULT_POST_FX_TINT,
    vignette = 0
): PostFxData => ({
    bloom: clamp(asFinite(bloom, 0), 0, 3),
    exposure: clamp(asFinite(exposure, 1), 0.1, 4),
    contrast: clamp(asFinite(contrast, 1), 0, 3),
    saturation: clamp(asFinite(saturation, 1), 0, 3),
    tint: asColor(tint, DEFAULT_POST_FX_TINT),
    vignette: clamp(asFinite(vignette, 0), 0, 1)
});

/**
 * True when the composer would look identical to a raw present.
 */
export const postFxIsIdentity = (data: PostFxData): boolean =>
    data.bloom <= 0
    && data.exposure === 1
    && data.contrast === 1
    && data.saturation === 1
    && data.vignette <= 0
    && data.tint.replace('#', '').toLowerCase() === 'ffffff';

const revivePostFx = (raw: unknown): PostFxData => {
    const source = raw as Partial<PostFxData>;
    return createPostFx(
        source.bloom,
        source.exposure,
        source.contrast,
        source.saturation,
        source.tint,
        source.vignette
    );
};

/**
 * Typed handle for the PostFx component.
 */
export const PostFx = defineComponent<PostFxData>('post-fx', () => createPostFx(), revivePostFx);
