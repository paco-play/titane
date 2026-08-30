import { MOUSE, type Camera } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Builds orbit controls that leave both left and right clicks free.
 *
 * Middle-drag orbits, shift+middle pans, the wheel zooms. Left-click is
 * selection, right-click is unused: a click in empty space deselects,
 * without the camera stealing the gesture.
 *
 * @param camera The camera to orbit.
 * @param canvas The element that receives pointer events.
 * @returns Configured controls. Call `dispose()` when tearing the renderer down.
 */
export const createOrbitControls = (camera: Camera, canvas: HTMLElement): OrbitControls => {
    const controls = new OrbitControls(camera, canvas);

    controls.enableDamping = false;
    // -1 is not a MOUSE action: OrbitControls falls through to STATE.NONE.
    const buttons = controls.mouseButtons as { LEFT: number, RIGHT: number };
    buttons.LEFT = -1;
    buttons.RIGHT = -1;
    controls.mouseButtons.MIDDLE = MOUSE.ROTATE;

    return controls;
};
