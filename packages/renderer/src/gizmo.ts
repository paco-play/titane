import type { Camera, Scene } from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

/** Gizmo transform modes, matching TransformControls. */
export type GizmoMode = 'translate' | 'rotate' | 'scale';

/**
 * Handle returned by `createTransformGizmo`.
 */
export interface TransformGizmo {
    readonly controls: TransformControls;
    /** Adds or removes the helper from the scene. */
    setVisible: (visible: boolean) => void;
    dispose: () => void;
}

/**
 * Builds a transform gizmo whose helper is added to the scene immediately.
 *
 * The helper is not an ECS entity: picking must ignore it by intersecting
 * only mapped meshes, not the whole scene graph.
 *
 * @param camera The camera the handles are projected through.
 * @param canvas The element that receives pointer events.
 * @param scene The scene the helper is added to.
 * @returns The controls plus a disposer that also detaches the helper.
 */
export const createTransformGizmo = (
    camera: Camera,
    canvas: HTMLElement,
    scene: Scene
): TransformGizmo => {
    const controls = new TransformControls(camera, canvas);
    const helper = controls.getHelper();
    scene.add(helper);

    return {
        controls,
        setVisible: (visible: boolean): void => {
            helper.visible = visible;
            controls.enabled = visible;
        },
        dispose: (): void => {
            controls.detach();
            scene.remove(helper);
            controls.dispose();
        }
    };
};
