import * as THREE from 'three';

/**
 * Finds a clip by exact name. Missing names are not an error: the mixer stops.
 */
export const findClip = (
    clips: readonly THREE.AnimationClip[],
    name: string
): THREE.AnimationClip | undefined => clips.find(clip => clip.name === name);

const configureLoop = (action: THREE.AnimationAction, loop: boolean): void => {
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    action.clampWhenFinished = !loop;
};

/**
 * Starts, pauses and advances one entity mixer from ECS glTF fields.
 *
 * Rising edge of `playing` (or a clip change) resets and plays. Falling edge
 * pauses so the pose is kept. An empty or unknown clip name stops all actions.
 *
 * @returns The clip name that is now bound, or `''` when nothing is bound.
 */
export const advanceMixer = (
    mixer: THREE.AnimationMixer,
    clips: readonly THREE.AnimationClip[],
    clip: string,
    playing: boolean,
    loop: boolean,
    wasPlaying: boolean,
    previousClip: string,
    dt: number
): string => {
    if (clip === '') {
        mixer.stopAllAction();
        return '';
    }

    const found = findClip(clips, clip);
    if (!found) {
        mixer.stopAllAction();
        return '';
    }

    const action = mixer.clipAction(found);
    configureLoop(action, loop);

    if (!playing) {
        if (wasPlaying) action.paused = true;
        return clip;
    }

    const clipChanged = previousClip !== clip;
    if (!wasPlaying || clipChanged) {
        action.reset();
        action.paused = false;
        action.play();
    }

    mixer.update(dt);
    return clip;
};
