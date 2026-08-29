import { World } from '../ecs/kernel/world';

/**
 * Interface defining the contract for any Renderer Driver.
 * This allows the Core Engine to remain agnostic of the underlying graphics API.
 */
export interface IRenderer {
    /**
     * Initializes the rendering context (Scene, Camera, Renderer).
     * @param canvas The HTML5 canvas element to render into.
     */
    init(canvas: HTMLCanvasElement): void;

    /**
     * Synchronizes ECS data and performs the render pass.
     * @param world The current ECS World state.
     */
    render(world: World): void;

    /**
     * Updates the projection and viewport size.
     */
    setSize(width: number, height: number): void;

    /**
     * Allows the renderer to check if the canvas size has changed and update its internal camera.
     */
    handleResize(): void;

    /**
     * Cleans up all GPU resources.
     */
    dispose(): void;
}