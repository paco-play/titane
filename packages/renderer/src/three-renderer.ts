import * as THREE from 'three';
import type { IRenderer, World, Entity } from '@titane/core';
import { defineQuery, runQuery, getComponent, Transform, Mesh } from '@titane/core';
import { ResourceCache } from './resource-cache';
import { LightPool } from './light-pool';
import { ModelPool } from './model-pool';
import { AudioPool } from './audio-pool';
import { createBrowserAudioPool } from './audio-browser';
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
    private lights: LightPool | undefined;
    private models: ModelPool | undefined;
    private audio: AudioPool | undefined;
    private resumeAudio: (() => void) | undefined;
    private disposeAudioListener: (() => void) | undefined;

    /**
     * Fallback lights added when no `Light` component entities exist in the world.
     * Kept as an array so we can add/remove them as a group in one call.
     */
    private readonly fallbackLights: THREE.Light[] = [];

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

        // Fallback lights are shown only when no Light entities exist in the world.
        const fallbackDir = new THREE.DirectionalLight(0xffffff, 1);
        fallbackDir.position.set(5, 10, 7.5);
        const fallbackAmb = new THREE.AmbientLight(0x404040, 0.8);
        this.fallbackLights.push(fallbackDir, fallbackAmb);
        this.scene.add(fallbackDir, fallbackAmb);

        this.lights = new LightPool(this.scene);
        this.models = new ModelPool(this.scene);
        this.pool = new InstancePool(this.scene, this.resources);

        const audio = createBrowserAudioPool(this.scene, this.camera);
        this.audio = audio.pool;
        this.resumeAudio = audio.resume;
        this.disposeAudioListener = audio.disposeListener;
        canvas.addEventListener('pointerdown', this.resumeAudio);

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

        // Sync ECS-driven lights. Toggle fallbacks based on whether any exist.
        if (this.lights) {
            this.lights.sync(world);
            const useFallback = this.lights.isEmpty;
            for (const l of this.fallbackLights) l.visible = useFallback;
        }

        this.models?.sync(world);
        this.audio?.sync(world);

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

            this.pool.sync(entityId, meshData, matrix);
        }

        if (this.gizmos.entity !== null && !this.gizmos.dragging) {
            const selected = getComponent(world, this.gizmos.entity, Transform);
            if (selected) this.gizmos.syncProxy(selected.worldMatrix);
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

        const targets = [
            ...this.pool.pickables(),
            ...(this.models?.pickables() ?? [])
        ];

        return entityFromHits(raycaster.intersectObjects(targets, true), (object, instanceId) =>
            this.pool?.entityOf(object, instanceId) ?? this.models?.entityOf(object)
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
        this.lights?.dispose();
        this.models?.dispose();
        if (this.resumeAudio) {
            this.renderer.domElement.removeEventListener('pointerdown', this.resumeAudio);
        }
        this.audio?.dispose();
        this.disposeAudioListener?.();
        this.pool?.dispose();
        this.liveEntities.clear();
        this.resources.dispose();
        this.renderer.dispose();
    }
}
