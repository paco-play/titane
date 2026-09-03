import * as THREE from 'three';
import { AudioPool, type AudioVoice } from './audio-pool';

const loadAudioBuffer = (url: string): Promise<AudioBuffer> =>
    new Promise((resolve, reject) => {
        new THREE.AudioLoader().load(url, resolve, undefined, reject);
    });

/**
 * Builds a Three.js voice attached to the camera's listener.
 */
export const createThreeVoice = (
    listener: THREE.AudioListener,
    scene: THREE.Scene,
    buffer: AudioBuffer,
    positional: boolean
): AudioVoice => {
    const node = positional
        ? new THREE.PositionalAudio(listener)
        : new THREE.Audio(listener);
    node.setBuffer(buffer);
    if (positional) scene.add(node);

    return {
        setVolume: volume => { node.setVolume(volume); },
        setLoop: loop => { node.setLoop(loop); },
        setPosition: (x, y, z) => {
            node.position.set(x, y, z);
            node.updateMatrixWorld();
        },
        play: () => { if (!node.isPlaying) node.play(); },
        pause: () => { if (node.isPlaying) node.pause(); },
        dispose: () => {
            if (node.isPlaying) node.stop();
            scene.remove(node);
            node.disconnect();
        }
    };
};

/**
 * Browser wiring: listener on the camera, Three.js loader and voices.
 */
export const createBrowserAudioPool = (scene: THREE.Scene, camera: THREE.Object3D): {
    pool: AudioPool;
    resume: () => void;
    disposeListener: () => void;
} => {
    const listener = new THREE.AudioListener();
    camera.add(listener);

    const pool = new AudioPool(
        loadAudioBuffer,
        (buffer, positional) => createThreeVoice(listener, scene, buffer as AudioBuffer, positional)
    );

    return {
        pool,
        resume: () => { void listener.context.resume(); },
        disposeListener: () => { camera.remove(listener); }
    };
};
