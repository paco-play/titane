import * as THREE from 'three';
import type { IRenderer, World, Entity, MeshData, PrimitiveType } from '@titane/core';
import { defineQuery, runQuery, getComponent, Transform, Mesh } from '@titane/core';
import { ResourceCache } from './resource-cache';
import { pointerToNdc, entityFromHits } from './picking';
import { worldMatrixToLocalTrs, type LocalTrs } from './local-trs';
import { createOrbitControls } from './orbit';
import { createTransformGizmo, type GizmoMode, type TransformGizmo } from './gizmo';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const renderableQuery = defineQuery([Transform, Mesh]);

/**
 * What an entity's object was last built from.
 *
 * Comparing these fields against the live component is how the driver notices
 * an inspector edit, without the ECS having to emit a single event.
 */
interface RenderedEntity {
    object: THREE.Mesh;
    primitive: PrimitiveType;
    color: string;
}

/** Called when the gizmo writes a new local TRS for an entity. */
export type GizmoTransformHandler = (entity: Entity, trs: LocalTrs) => void;

/**
 * Three.js implementation of the Titane renderer contract.
 * Maps ECS data onto Three.js objects and owns editor viewport helpers.
 */
export class ThreeRenderer implements IRenderer {
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private renderer!: THREE.WebGLRenderer;
    private gridHelper!: THREE.GridHelper;
    private orbit: OrbitControls | undefined;
    private gizmo: TransformGizmo | undefined;
    private world: World | undefined;
    private gizmoConsumedPick = false;
    private gizmoEntity: Entity | null = null;
    private gizmoAllowed = true;
    /** True between TransformControls `dragging-changed` start and end. */
    private gizmoDragging = false;

    private readonly resources = new ResourceCache();
    private readonly renderedEntities = new Map<Entity, RenderedEntity>();
    private readonly liveEntities = new Set<Entity>();
    private readonly focusPoint = new THREE.Vector3();

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

    public render(world: World): void {
        this.world = world;
        const activeEntities = runQuery(world, renderableQuery);
        const attached = this.gizmo?.controls.object;

        this.liveEntities.clear();
        for (const entityId of activeEntities) this.liveEntities.add(entityId);

        for (const [entityId, rendered] of this.renderedEntities) {
            if (this.liveEntities.has(entityId)) continue;
            this.unspawn(entityId, rendered);
        }

        for (const entityId of activeEntities) {
            const transform = getComponent(world, entityId, Transform);
            const meshData = getComponent(world, entityId, Mesh);
            if (!transform || !meshData) continue;

            const rendered = this.renderedEntities.get(entityId) ?? this.spawn(entityId, meshData);

            if (rendered.primitive !== meshData.primitive) {
                rendered.object.geometry = this.resources.geometry(meshData.primitive);
                rendered.primitive = meshData.primitive;
            }

            if (rendered.color !== meshData.color) {
                // Attach the new material before dropping the old one, so the
                // mesh never holds a disposed GPU resource.
                const next = this.resources.material(meshData.color);
                rendered.object.material = next;
                this.resources.releaseMaterial(rendered.color);
                rendered.color = meshData.color;
            }

            // TransformControls writes position/quaternion/scale. Meshes keep
            // matrixAutoUpdate false so the ECS remains the source of truth,
            // which means we must compose the matrix ourselves during a drag
            // or the handles move and the object stays put.
            if (this.gizmoDragging && rendered.object === attached) {
                rendered.object.updateMatrix();
                continue;
            }

            rendered.object.matrix.fromArray(transform.worldMatrix);
            rendered.object.matrix.decompose(
                rendered.object.position,
                rendered.object.quaternion,
                rendered.object.scale
            );
        }

        this.applyGizmo();
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Raycasts against mapped meshes and returns the nearest entity.
     * @param clientX Pointer X in viewport coordinates.
     * @param clientY Pointer Y in viewport coordinates.
     * @returns The hit entity, or null when the click missed.
     */
    public pick(clientX: number, clientY: number): Entity | null {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const ndc = pointerToNdc(clientX, clientY, rect);
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), this.camera);

        const meshes: THREE.Object3D[] = [];
        for (const rendered of this.renderedEntities.values()) meshes.push(rendered.object);

        return entityFromHits(raycaster.intersectObjects(meshes, false), (object) => {
            const entityId = object.userData.entityId;
            return typeof entityId === 'number' ? entityId : undefined;
        });
    }

    /**
     * True when the gizmo captured the current left-click, so picking must stand down.
     * Consumes the flag: a later click on empty space is free to deselect.
     */
    public consumeGizmoPick(): boolean {
        const consumed = this.gizmoConsumedPick;
        this.gizmoConsumedPick = false;
        return consumed;
    }

    /**
     * Attaches the gizmo to an entity, or hides it when `entityId` is null.
     * @param entityId The selection, or null to detach.
     */
    public setGizmoTarget(entityId: Entity | null): void {
        this.gizmoEntity = entityId;
        this.applyGizmo();
        if (entityId !== null) this.focus(entityId);
    }

    /**
     * Switches the gizmo between translate, rotate and scale.
     * @param mode The requested mode.
     */
    public setGizmoMode(mode: GizmoMode): void {
        if (this.gizmo) this.gizmo.controls.mode = mode;
    }

    /**
     * Allows or suppresses the gizmo without dropping the selection.
     * Used to hide handles while the simulation is running.
     * @param visible Whether the handles should be drawn.
     */
    public setGizmoVisible(visible: boolean): void {
        this.gizmoAllowed = visible;
        this.applyGizmo();
    }

    /**
     * Aims the orbit target at an entity's world position.
     * @param entityId The entity to frame.
     */
    public focus(entityId: Entity): void {
        const rendered = this.renderedEntities.get(entityId);
        if (!rendered || !this.orbit) return;

        this.focusPoint.setFromMatrixPosition(rendered.object.matrix);
        this.orbit.target.copy(this.focusPoint);
    }

    public dispose(): void {
        this.gizmo?.dispose();
        this.orbit?.dispose();

        for (const [entityId, rendered] of [...this.renderedEntities]) {
            this.unspawn(entityId, rendered);
        }

        this.liveEntities.clear();
        this.resources.dispose();
        this.renderer.dispose();
    }

    private spawn(entityId: Entity, meshData: MeshData): RenderedEntity {
        const object = new THREE.Mesh(
            this.resources.geometry(meshData.primitive),
            this.resources.material(meshData.color)
        );

        object.matrixAutoUpdate = false;
        object.userData.entityId = entityId;
        this.scene.add(object);

        const rendered: RenderedEntity = {
            object,
            primitive: meshData.primitive,
            color: meshData.color
        };

        this.renderedEntities.set(entityId, rendered);
        return rendered;
    }

    /**
     * Removes an entity's object from the scene and drops its material retainer.
     */
    private unspawn(entityId: Entity, rendered: RenderedEntity): void {
        this.scene.remove(rendered.object);
        this.resources.releaseMaterial(rendered.color);
        this.renderedEntities.delete(entityId);
    }

    /**
     * Attaches the gizmo to the current selection once its mesh exists.
     * Creation and picking can select an entity before the next render spawns it.
     */
    private applyGizmo(): void {
        if (!this.gizmo) return;

        if (!this.gizmoAllowed || this.gizmoEntity === null) {
            this.gizmo.controls.detach();
            this.gizmo.setVisible(false);
            return;
        }

        const rendered = this.renderedEntities.get(this.gizmoEntity);
        if (!rendered) {
            this.gizmo.controls.detach();
            this.gizmo.setVisible(false);
            return;
        }

        if (this.gizmo.controls.object !== rendered.object) {
            this.gizmo.controls.attach(rendered.object);
        }

        this.gizmo.setVisible(true);
    }

    /**
     * Pushes the gizmo's world-space edit back to the ECS as local TRS.
     */
    private commitGizmo(): void {
        const object = this.gizmo?.controls.object;
        const world = this.world;
        if (!object || !world || !this.onGizmoTransform) return;

        const entityId = object.userData.entityId;
        if (typeof entityId !== 'number') return;

        object.updateMatrix();
        object.updateMatrixWorld();

        const transform = getComponent(world, entityId, Transform);
        const parentWorld = transform?.parent !== undefined && transform.parent !== null
            ? getComponent(world, transform.parent, Transform)?.worldMatrix ?? null
            : null;

        this.onGizmoTransform(entityId, worldMatrixToLocalTrs(object.matrixWorld, parentWorld));
    }
}
