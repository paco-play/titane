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

const startAction = (action: THREE.AnimationAction, loop: boolean): void => {
    configureLoop(action, loop);
    action.reset();
    action.enabled = true;
    action.paused = false;
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(1);
    action.play();
};

/**
 * Starts, pauses, crossfades and advances one entity mixer from ECS glTF fields.
 *
 * Rising edge of `playing` resets and plays. A clip change while playing
 * crossfades when `fade` is greater than 0; `fade === 0` is a hard cut.
 * Falling edge pauses so the pose is kept. An empty or unknown clip name
 * stops all actions.
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
    dt: number,
    fade = 0
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

    const incoming = mixer.clipAction(found);
    configureLoop(incoming, loop);

    if (!playing) {
        if (wasPlaying) incoming.paused = true;
        return clip;
    }

    const fadeSeconds = Number.isFinite(fade) ? Math.max(0, fade) : 0;
    const clipChanged = previousClip !== clip;

    if (!wasPlaying) {
        mixer.stopAllAction();
        startAction(incoming, loop);
    } else if (clipChanged) {
        const outgoingSource = findClip(clips, previousClip);
        const outgoing = outgoingSource ? mixer.clipAction(outgoingSource) : undefined;
        startAction(incoming, loop);
        if (outgoing && outgoing !== incoming && fadeSeconds > 0) {
            outgoing.enabled = true;
            outgoing.paused = false;
            outgoing.crossFadeTo(incoming, fadeSeconds, false);
        } else {
            outgoing?.stop();
        }
    }

    mixer.update(dt);
    return clip;
};
