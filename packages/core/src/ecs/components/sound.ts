import { defineComponent } from '../kernel/registry';

/**
 * Marks an entity as a sound source.
 *
 * Playback is a renderer side effect. `playing` is the author's intent;
 * an empty `url` stays silent. Positional sources take their place from
 * `Transform.worldMatrix`. Non-positional sources ignore the transform.
 */
export interface SoundData {
    /** Absolute or relative URL of an audio file. Empty means silent. */
    url: string;
    /** Gain in `[0, 1]`. */
    volume: number;
    /** When true the clip repeats until `playing` is cleared. */
    loop: boolean;
    /** When true the listener hears the sound from the entity's world position. */
    positional: boolean;
    /** When true the renderer starts (or keeps) playback. */
    playing: boolean;
}

/**
 * Factory for a Sound component.
 * @param url - Path to the clip. Empty until the author pastes one.
 */
export const createSound = (
    url = '',
    volume = 1,
    loop = false,
    positional = true,
    playing = false
): SoundData => ({ url, volume, loop, positional, playing });

/**
 * Typed handle for the Sound component.
 */
export const Sound = defineComponent<SoundData>('sound', () => createSound());
