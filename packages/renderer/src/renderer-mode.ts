/**
 * How `ThreeRenderer` treats the canvas.
 *
 * - `editor` — orbit, gizmos and the ground grid (current viewport).
 * - `game` — a bare perspective camera; no editor chrome.
 */
export type RendererMode = 'editor' | 'game';

/**
 * Construction options for {@link ThreeRenderer}.
 * Omitted fields keep the editor-compatible defaults.
 */
export interface ThreeRendererOptions {
    mode?: RendererMode;
}

/**
 * A look-from / look-at pair in world space.
 * Kept off `IRenderer` so the engine contract stays driver-agnostic.
 */
export interface CameraPose {
    position: { x: number; y: number; z: number };
    lookAt: { x: number; y: number; z: number };
}

/**
 * Resolves the renderer mode, defaulting to editor so existing callers
 * (`new ThreeRenderer()`) keep orbit, gizmos and the grid.
 */
export const resolveRendererMode = (options?: ThreeRendererOptions): RendererMode =>
    options?.mode ?? 'editor';

/**
 * Whether this mode installs orbit controls, gizmos and a ground grid.
 */
export const usesEditorChrome = (mode: RendererMode): boolean => mode === 'editor';

/**
 * Writes a look-from / look-at pair onto a perspective camera.
 * @param camera - Any object with Three.js-shaped `position.set` and `lookAt`.
 * @param pose - World-space camera pose.
 */
export const applyCameraPose = (
    camera: {
        position: { set: (x: number, y: number, z: number) => void };
        lookAt: (x: number, y: number, z: number) => void;
    },
    pose: CameraPose
): void => {
    camera.position.set(pose.position.x, pose.position.y, pose.position.z);
    camera.lookAt(pose.lookAt.x, pose.lookAt.y, pose.lookAt.z);
};
