import * as THREE from 'three';
import type { IRenderer, World, Entity } from '@titane/core';
import { defineQuery, runQuery, getComponent, Transform, Mesh } from '@titane/core';
import { ResourceCache } from './resource-cache';
import { pointerToNdc, entityFromHits } from './picking';
import { createOrbitControls } from './orbit';
import { InstancePool } from './instance-pool';
import { GizmoController, type GizmoTransformHandler } from './gizmo-controller';
import type { GizmoMode } from './gizmo';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
    applyCameraPose,
    resolveRendererMode,
    usesEditorChrome,
    type CameraPose,
    type RendererMode,
    type ThreeRendererOptions
} from './renderer-mode';

export type { GizmoTransformHandler, CameraPose, RendererMode, ThreeRendererOptions };

const renderableQuery = defineQuery([Transform, Mesh]);

/**
 * Three.js implementation of the Titane renderer contract.
 * Maps ECS data onto instanced meshes. Editor chrome (orbit, gizmos, grid)
 * is installed only in `editor` mode.
 */
export class ThreeRenderer implements IRenderer {
    /** Resolved construction mode. Exposed so hosts can branch without peeking at internals. */
    public readonly mode: RendererMode;

    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private renderer!: THREE.WebGLRenderer;
    private gridHelper: THREE.GridHelper | undefined;
    private orbit: OrbitControls | undefined;
    private pool: InstancePool | undefined;

    private readonly resources = new ResourceCache();
    private readonly liveEntities = new Set<Entity>();
    private readonly gizmos = new GizmoController();

    /**
     * @param options - `mode` defaults to `editor` so `new ThreeRenderer()` stays the viewport.
     */
    constructor(options: ThreeRendererOptions = {}) {
        this.mode = resolveRendererMode(options);
    }

    /**
     * Whether this instance installed orbit, gizmos and the ground grid.
     */
    public get usesEditorChrome(): boolean {
        return usesEditorChrome(this.mode);
    }

    /**
     * Editor writes local TRS back into the ECS through this hook.
     */
    public get onGizmoTransform(): GizmoTransformHandler | null {
        return this.gizmos.onTransform;
    }

    public set onGizmoTransform(handler: GizmoTransformHandler | null) {
        this.gizmos.onTransform = handler;
    }

    public init(canvas: HTMLCanvasElement): void {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#0a0a0a');

        this.camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 10, 7.5);
        this.scene.add(light);
        this.scene.add(new THREE.AmbientLight(0x404040, 0.8));

        this.pool = new InstancePool(this.scene, this.resources);

        if (!this.usesEditorChrome) return;

        this.gridHelper = new THREE.GridHelper(20, 20, '#444444', '#222222');
        this.scene.add(this.gridHelper);
        this.orbit = createOrbitControls(this.camera, canvas);
        this.gizmos.attach(this.camera, canvas, this.scene, this.orbit);
    }

    /**
     * Places the perspective camera. Game hosts call this instead of orbit.
     * No-op until `init` has run.
     */
    public setCamera(pose: CameraPose): void {
        if (!this.camera) return;
        applyCameraPose(this.camera, pose);
    }

    public handleResize(): void {
        const canvas = this.renderer.domElement;
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
            this.setSize(canvas.clientWidth, canvas.clientHeight);
        }
    }

    public setSize(width: number, height: number): void {
        this.renderer.setSize(width, height, false);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    /**
     * Toggles the ground grid. Editor chrome, deliberately absent from `IRenderer`.
     * @param visible Whether the grid should be drawn.
     */
    public setGridVisible(visible: boolean): void {
        if (this.gridHelper) this.gridHelper.visible = visible;
    }

    /**
     * Number of live InstancedMesh batches. Exposed for tests.
     */
    public get instanceBatchCount(): number {
        return this.pool?.batchCount ?? 0;
    }

    public render(world: World): void {
        this.gizmos.bindWorld(world);
        const activeEntities = runQuery(world, renderableQuery);
        if (!this.pool) return;

        this.liveEntities.clear();
        for (const entityId of activeEntities) this.liveEntities.add(entityId);

        for (const entityId of [...this.pool.trackedEntities()]) {
            if (!this.liveEntities.has(entityId)) this.pool.remove(entityId);
        }

        for (const entityId of activeEntities) {
            const transform = getComponent(world, entityId, Transform);
            const meshData = getComponent(world, entityId, Mesh);
            if (!transform || !meshData) continue;

            const matrix = this.gizmos.dragging && entityId === this.gizmos.entity
                ? this.gizmos.draggedMatrix()
                : transform.worldMatrix;

            this.pool.sync(entityId, meshData.primitive, meshData.color, matrix);

            if (entityId === this.gizmos.entity && !this.gizmos.dragging) {
                this.gizmos.syncProxy(transform.worldMatrix);
            }
        }

        this.gizmos.apply();
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Raycasts against instanced batches and returns the nearest entity.
     */
    public pick(clientX: number, clientY: number): Entity | null {
        if (!this.pool) return null;
        const rect = this.renderer.domElement.getBoundingClientRect();
        const ndc = pointerToNdc(clientX, clientY, rect);
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), this.camera);

        return entityFromHits(raycaster.intersectObjects(this.pool.pickables(), false), (object, instanceId) =>
            this.pool?.entityOf(object, instanceId)
        );
    }

    public consumeGizmoPick(): boolean {
        return this.gizmos.consumePick();
    }

    public setGizmoTarget(entityId: Entity | null): void {
        this.gizmos.setTarget(entityId);
    }

    public setGizmoMode(mode: GizmoMode): void {
        this.gizmos.setMode(mode);
    }

    public setGizmoVisible(visible: boolean): void {
        this.gizmos.setAllowed(visible);
    }

    public focus(entityId: Entity): void {
        this.gizmos.focus(entityId);
    }

    public dispose(): void {
        this.gizmos.dispose();
        this.orbit?.dispose();
        this.pool?.dispose();
        this.liveEntities.clear();
        this.resources.dispose();
        this.renderer.dispose();
    }
}
