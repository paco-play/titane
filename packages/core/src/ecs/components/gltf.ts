import { defineComponent } from '../kernel/registry';
import { getComponent, updateComponent } from '../kernel/component';
import type { World } from '../kernel/world';
import type { Entity } from '../types';

/**
 * Marks an entity as a glTF / GLB model.
 *
 * The renderer loads `url` and draws the scene graph. `Transform` still
 * owns pose: the loaded root is driven by `worldMatrix` each frame.
 * An empty URL is a placeholder and draws nothing.
 *
 * `clip` / `playing` / `loop` / `fade` drive AnimationMixer on the clone.
 * Changing `clip` while playing crossfades when `fade` is greater than 0.
 * An empty `clip` leaves the bind pose. Playback is a renderer side effect.
 */
export interface GltfData {
    /** Absolute or relative URL of a `.gltf` / `.glb` file. */
    url: string;
    /** Animation clip name from the file. Empty means no clip. */
    clip: string;
    /** When true the renderer advances the mixer. */
    playing: boolean;
    /** When true the clip repeats; otherwise it plays once and holds. */
    loop: boolean;
    /**
     * Seconds to blend when `clip` changes while playing.
     * `0` is a hard cut. Older scenes revive with `0`.
     */
    fade: number;
}

const clampFade = (value: number): number =>
    Number.isFinite(value) ? Math.max(0, value) : 0;

/**
 * Factory for a Gltf component.
 * @param url - Path to the model. Empty until the author pastes one.
 * @param clip - Clip name to play. Empty until the author sets one.
 * @param playing - Whether the mixer should run.
 * @param loop - Whether the clip repeats.
 * @param fade - Crossfade duration in seconds when the clip changes.
 */
export const createGltf = (
    url = '',
    clip = '',
    playing = false,
    loop = true,
    fade = 0
): GltfData => ({ url, clip, playing, loop, fade: clampFade(fade) });

/**
 * Fills fields that older scenes omitted.
 */
const reviveGltf = (raw: unknown): GltfData => {
    const source = raw as Partial<GltfData>;
    return createGltf(
        source.url ?? '',
        source.clip ?? '',
        source.playing ?? false,
        source.loop ?? true,
        source.fade ?? 0
    );
};

/**
 * Typed handle for the Gltf component.
 */
export const Gltf = defineComponent<GltfData>('gltf', () => createGltf(), reviveGltf);

/**
 * Starts `clip` on a live `Gltf`. Optional `fade` overrides the stored duration.
 */
export const playGltfClip = (
    world: World,
    entity: Entity,
    clip: string,
    fade?: number
): void => {
    const data = getComponent(world, entity, Gltf);
    if (!data) return;
    updateComponent(world, entity, Gltf, (gltf) => {
        gltf.clip = clip;
        gltf.playing = true;
        if (fade !== undefined) gltf.fade = clampFade(fade);
    });
};
