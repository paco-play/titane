import * as THREE from 'three';
import type { IRenderer, World, Entity } from '@titane/core';
import { defineQuery, runQuery, getComponent, Transform, Mesh } from '@titane/core';
import { ResourceCache } from './resource-cache';
import { pointerToNdc, entityFromHits } from './picking';
import { worldMatrixToLocalTrs, type LocalTrs } from './local-trs';
import { createOrbitControls } from './orbit';
import { createTransformGizmo, type GizmoMode, type TransformGizmo } from './gizmo';
import { InstancePool } from './instance-pool';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const renderableQuery = defineQuery([Transform, Mesh]);

/** Called when the gizmo writes a new local TRS for an entity. */
export type GizmoTransformHandler = (entity: Entity, trs: LocalTrs) => void;

/**
 * Three.js implementation of the Titane renderer contract.
 * Maps ECS data onto instanced meshes and owns editor viewport helpers.
 */
export class ThreeRenderer implements IRenderer {
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private renderer!: THREE.WebGLRenderer;
    private gridHelper!: THREE.GridHelper;
    private orbit: OrbitControls | undefined;
    private gizmo: TransformGizmo | undefined;
    private pool: InstancePool | undefined;
    private world: World | undefined;
    private gizmoConsumedPick = false;
    private gizmoEntity: Entity | null = null;
    private gizmoAllowed = true;
    /** True between TransformControls `dragging-changed` start and end. */
    private gizmoDragging = false;

    private readonly resources = new ResourceCache();
    private readonly liveEntities = new Set<Entity>();
    private readonly focusPoint = new THREE.Vector3();
    private readonly scratchFocus = new THREE.Matrix4();
    /** TransformControls needs an Object3D; instances have none per entity. */
    private readonly gizmoProxy = new THREE.Object3D();

    /** Editor writes local TRS back into the ECS through this hook. */
    public onGizmoTransform: GizmoTransformHandler | null = null;

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

        this.gridHelper = new THREE.GridHelper(20, 20, '#444444', '#222222');
        this.scene.add(this.gridHelper);

        this.pool = new InstancePool(this.scene, this.resources);
        this.gizmoProxy.matrixAutoUpdate = true;
        this.scene.add(this.gizmoProxy);

        this.orbit = createOrbitControls(this.camera, canvas);
        this.gizmo = createTransformGizmo(this.camera, canvas, this.scene);
        this.gizmo.setVisible(false);

        this.gizmo.controls.addEventListener('mouseDown', () => {
            this.gizmoConsumedPick = true;
        });
        this.gizmo.controls.addEventListener('dragging-changed', (event) => {
            this.gizmoDragging = event.value === true;
            if (this.orbit) this.orbit.enabled = !this.gizmoDragging;
        });
        this.gizmo.controls.addEventListener('objectChange', () => this.commitGizmo());
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
        this.gridHelper.visible = visible;
    }

    /**
     * Number of live InstancedMesh batches. Exposed for tests.
     */
    public get instanceBatchCount(): number {
        return this.pool?.batchCount ?? 0;
    }

    public render(world: World): void {
        this.world = world;
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

            const matrix = this.gizmoDragging && entityId === this.gizmoEntity
                ? this.draggedMatrix()
                : transform.worldMatrix;

            this.pool.sync(entityId, meshData.primitive, meshData.color, matrix);

            if (entityId === this.gizmoEntity && !this.gizmoDragging) {
                this.gizmoProxy.matrix.fromArray(transform.worldMatrix);
                this.gizmoProxy.matrix.decompose(
                    this.gizmoProxy.position,
                    this.gizmoProxy.quaternion,
                    this.gizmoProxy.scale
                );
            }
        }

        this.applyGizmo();
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
        const consumed = this.gizmoConsumedPick;
        this.gizmoConsumedPick = false;
        return consumed;
    }

    public setGizmoTarget(entityId: Entity | null): void {
        this.gizmoEntity = entityId;
        this.applyGizmo();
        if (entityId !== null) this.focus(entityId);
    }

    public setGizmoMode(mode: GizmoMode): void {
        if (this.gizmo) this.gizmo.controls.mode = mode;
    }

    public setGizmoVisible(visible: boolean): void {
        this.gizmoAllowed = visible;
        this.applyGizmo();
    }

    public focus(entityId: Entity): void {
        if (!this.world || !this.orbit) return;
        const transform = getComponent(this.world, entityId, Transform);
        if (!transform) return;

        this.focusPoint.setFromMatrixPosition(this.scratchFocus.fromArray(transform.worldMatrix));
        this.orbit.target.copy(this.focusPoint);
    }

    public dispose(): void {
        this.gizmo?.dispose();
        this.orbit?.dispose();
        this.pool?.dispose();
        this.liveEntities.clear();
        this.resources.dispose();
        this.renderer.dispose();
    }

    private draggedMatrix(): ArrayLike<number> {
        this.gizmoProxy.updateMatrix();
        return this.gizmoProxy.matrix.elements;
    }

    private applyGizmo(): void {
        if (!this.gizmo) return;

        if (!this.gizmoAllowed || this.gizmoEntity === null) {
            this.gizmo.controls.detach();
            this.gizmo.setVisible(false);
            return;
        }

        if (this.gizmo.controls.object !== this.gizmoProxy) {
            this.gizmo.controls.attach(this.gizmoProxy);
        }

        this.gizmo.setVisible(true);
    }

    private commitGizmo(): void {
        const world = this.world;
        if (!world || !this.onGizmoTransform || this.gizmoEntity === null) return;

        this.gizmoProxy.updateMatrix();
        this.gizmoProxy.updateMatrixWorld();

        const transform = getComponent(world, this.gizmoEntity, Transform);
        const parentWorld = transform?.parent !== undefined && transform.parent !== null
            ? getComponent(world, transform.parent, Transform)?.worldMatrix ?? null
            : null;

        this.onGizmoTransform(
            this.gizmoEntity,
            worldMatrixToLocalTrs(this.gizmoProxy.matrixWorld, parentWorld)
        );
    }
}
