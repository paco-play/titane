import { defineComponent } from '../kernel/registry';

/**
 * Marks an entity as a glTF / GLB model.
 *
 * The renderer loads `url` and draws the scene graph. `Transform` still
 * owns pose: the loaded root is driven by `worldMatrix` each frame.
 * An empty URL is a placeholder and draws nothing.
 */
export interface GltfData {
    /** Absolute or relative URL of a `.gltf` / `.glb` file. */
    url: string;
}

/**
 * Factory for a Gltf component.
 * @param url - Path to the model. Empty until the author pastes one.
 */
export const createGltf = (url = ''): GltfData => ({ url });

/**
 * Typed handle for the Gltf component.
 */
export const Gltf = defineComponent<GltfData>('gltf', () => createGltf());
