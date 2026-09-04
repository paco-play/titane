import { World } from '../ecs/kernel/world';
import type { Entity } from '../ecs/types';

/**
 * Packed triangle mesh in the entity's local space, used to build a Rapier trimesh.
 * Vertices are `x,y,z` floats. Not stored in `.titane`.
 */
export interface MeshColliderGeometry {
    readonly vertices: Float32Array;
    readonly indices: Uint32Array;
}

/**
 * Optional host callback that supplies runtime mesh-collider geometry.
 */
export type MeshColliderGeometryProvider = (
    world: World,
    entity: Entity
) => MeshColliderGeometry | null;

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

    /**
     * Triangle mesh for a `Collider` of kind `mesh`. Optional: headless
     * drivers omit it. Return `null` while the model is still loading.
     */
    meshColliderGeometry?(world: World, entity: Entity): MeshColliderGeometry | null;
}