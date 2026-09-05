import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { advanceMixer, findClip } from '../model-clip';

const makeMixer = (): {
    mixer: THREE.AnimationMixer
    bone: THREE.Group
    walk: THREE.AnimationClip
    run: THREE.AnimationClip
} => {
    const root = new THREE.Group();
    const bone = new THREE.Group();
    bone.name = 'Bone';
    root.add(bone);
    const walk = new THREE.AnimationClip('Walk', 1, [
        new THREE.VectorKeyframeTrack('Bone.position', [0, 1], [0, 0, 0, 4, 0, 0])
    ]);
    const run = new THREE.AnimationClip('Run', 1, [
        new THREE.VectorKeyframeTrack('Bone.position', [0, 1], [0, 0, 0, 10, 0, 0])
    ]);
    return { mixer: new THREE.AnimationMixer(root), bone, walk, run };
};

describe('advanceMixer', () => {
    it('finds a clip by name', () => {
        const walk = new THREE.AnimationClip('Walk', 1, []);
        expect(findClip([walk], 'Walk')).toBe(walk);
        expect(findClip([walk], 'Idle')).toBeUndefined();
    });

    it('holds the last pose when playing falls', () => {
        const { mixer, bone, walk } = makeMixer();
        advanceMixer(mixer, [walk], 'Walk', true, true, false, '', 0.5);
        expect(bone.position.x).toBeCloseTo(2, 5);

        advanceMixer(mixer, [walk], 'Walk', false, true, true, 'Walk', 0.5);
        expect(bone.position.x).toBeCloseTo(2, 5);
    });

    it('hard-cuts when fade is 0', () => {
        const { mixer, walk, run } = makeMixer();
        const clips = [walk, run];
        advanceMixer(mixer, clips, 'Walk', true, true, false, '', 0.1, 0);
        advanceMixer(mixer, clips, 'Run', true, true, true, 'Walk', 0.1, 0);

        expect(mixer.clipAction(walk).isRunning()).toBe(false);
        expect(mixer.clipAction(run).isRunning()).toBe(true);
        expect(mixer.clipAction(run).getEffectiveWeight()).toBeCloseTo(1, 5);
    });

    it('crossfades weights when fade is greater than 0', () => {
        const { mixer, walk, run } = makeMixer();
        const clips = [walk, run];
        advanceMixer(mixer, clips, 'Walk', true, true, false, '', 0.1, 0.4);
        advanceMixer(mixer, clips, 'Run', true, true, true, 'Walk', 0.2, 0.4);

        expect(mixer.clipAction(walk).isRunning()).toBe(true);
        expect(mixer.clipAction(run).isRunning()).toBe(true);
        expect(mixer.clipAction(walk).getEffectiveWeight()).toBeCloseTo(0.5, 5);
        expect(mixer.clipAction(run).getEffectiveWeight()).toBeCloseTo(0.5, 5);
    });
});
