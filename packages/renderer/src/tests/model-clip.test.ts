import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { advanceMixer, findClip } from '../model-clip';

const makeMixer = (): { mixer: THREE.AnimationMixer; bone: THREE.Group; clip: THREE.AnimationClip } => {
    const root = new THREE.Group();
    const bone = new THREE.Group();
    bone.name = 'Bone';
    root.add(bone);
    const clip = new THREE.AnimationClip('Walk', 1, [
        new THREE.VectorKeyframeTrack('Bone.position', [0, 1], [0, 0, 0, 4, 0, 0])
    ]);
    return { mixer: new THREE.AnimationMixer(root), bone, clip };
};

describe('advanceMixer', () => {
    it('finds a clip by name', () => {
        const walk = new THREE.AnimationClip('Walk', 1, []);
        expect(findClip([walk], 'Walk')).toBe(walk);
        expect(findClip([walk], 'Idle')).toBeUndefined();
    });

    it('holds the last pose when playing falls', () => {
        const { mixer, bone, clip } = makeMixer();
        advanceMixer(mixer, [clip], 'Walk', true, true, false, '', 0.5);
        expect(bone.position.x).toBeCloseTo(2, 5);

        advanceMixer(mixer, [clip], 'Walk', false, true, true, 'Walk', 0.5);
        expect(bone.position.x).toBeCloseTo(2, 5);
    });
});
