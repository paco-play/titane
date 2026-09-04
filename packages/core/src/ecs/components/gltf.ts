import { defineComponent } from '../kernel/registry';

/**
 * Marks an entity as a glTF / GLB model.
 *
 * The renderer loads `url` and draws the scene graph. `Transform` still
 * owns pose: the loaded root is driven by `worldMatrix` each frame.
 * An empty URL is a placeholder and draws nothing.
 *
 * `clip` / `playing` / `loop` drive AnimationMixer on the clone. An empty
 * `clip` leaves the bind pose. Playback is a renderer side effect.
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
}

/**
 * Factory for a Gltf component.
 * @param url - Path to the model. Empty until the author pastes one.
 * @param clip - Clip name to play. Empty until the author sets one.
 * @param playing - Whether the mixer should run.
 * @param loop - Whether the clip repeats.
 */
export const createGltf = (
    url = '',
    clip = '',
    playing = false,
    loop = true
): GltfData => ({ url, clip, playing, loop });

/**
 * Fills fields that older scenes omitted.
 */
const reviveGltf = (raw: unknown): GltfData => {
    const source = raw as Partial<GltfData>;
    return createGltf(
        source.url ?? '',
        source.clip ?? '',
        source.playing ?? false,
        source.loop ?? true
    );
};

/**
 * Typed handle for the Gltf component.
 */
export const Gltf = defineComponent<GltfData>('gltf', () => createGltf(), reviveGltf);
