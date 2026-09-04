import * as THREE from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

/**
 * What {@link GltfFactory} must return: the scene graph plus its clips.
 * Clips stay on the shared template; each entity mixer runs on a clone.
 */
export interface GltfAsset {
    readonly scene: THREE.Group;
    readonly animations: readonly THREE.AnimationClip[];
}

/**
 * Loads a glTF asset from a URL. Injected so tests can skip network I/O.
 */
export type GltfFactory = (url: string) => Promise<GltfAsset>;

/**
 * Loads a `.gltf` / `.glb` via Three.js. Dynamic import keeps the loader
 * out of the renderer's cold path until a model is actually requested.
 */
export const loadGltfAsset = async (url: string): Promise<GltfAsset> => {
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
    return new Promise((resolve, reject) => {
        new GLTFLoader().load(
            url,
            gltf => resolve({ scene: gltf.scene, animations: gltf.animations }),
            undefined,
            reject
        );
    });
};

/**
 * Clones a template graph, including skinned meshes and skeletons.
 */
export const cloneGltfScene = (scene: THREE.Group): THREE.Group => clone(scene) as THREE.Group;
