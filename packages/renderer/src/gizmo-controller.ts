import * as THREE from 'three';
import type { World, Entity } from '@titane/core';
import { getComponent, Transform } from '@titane/core';
import { worldMatrixToLocalTrs, type LocalTrs } from './local-trs';
import { createTransformGizmo, type GizmoMode, type TransformGizmo } from './gizmo';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/** Called when the gizmo writes a new local TRS for an entity. */
export type GizmoTransformHandler = (entity: Entity, trs: LocalTrs) => void;

/**
 * Owns the TransformControls proxy, pick consumption and orbit locking.
 *
 * Instanced meshes have no per-entity Object3D, so the gizmo is attached to a
 * proxy whose world pose is copied from (and written back to) the ECS.
 */
export class GizmoController {
    public onTransform: GizmoTransformHandler | null = null;
    public entity: Entity | null = null;
    /** True between TransformControls `dragging-changed` start and end. */
    public dragging = false;

    private gizmo: TransformGizmo | undefined;
    private orbit: OrbitControls | undefined;
    private world: World | undefined;
    private allowed = true;
    private consumedPick = false;

    public readonly proxy = new THREE.Object3D();
    private readonly focusPoint = new THREE.Vector3();
    private readonly scratchFocus = new THREE.Matrix4();

    /**
     * Builds the controls and wires pick / orbit side effects.
     */
    public attach(
        camera: THREE.Camera,
        canvas: HTMLElement,
        scene: THREE.Scene,
        orbit: OrbitControls
    ): void {
        this.orbit = orbit;
        this.proxy.matrixAutoUpdate = true;
        scene.add(this.proxy);

        this.gizmo = createTransformGizmo(camera, canvas, scene);
        this.gizmo.setVisible(false);

        this.gizmo.controls.addEventListener('mouseDown', () => {
            this.consumedPick = true;
        });
        this.gizmo.controls.addEventListener('dragging-changed', (event) => {
            this.dragging = event.value === true;
            if (this.orbit) this.orbit.enabled = !this.dragging;
        });
        this.gizmo.controls.addEventListener('objectChange', () => this.commit());
    }

    public consumePick(): boolean {
        const consumed = this.consumedPick;
        this.consumedPick = false;
        return consumed;
    }

    public setTarget(entityId: Entity | null): void {
        this.entity = entityId;
        this.apply();
        if (entityId !== null) this.focus(entityId);
    }

    public setMode(mode: GizmoMode): void {
        if (this.gizmo) this.gizmo.controls.mode = mode;
    }

    public setAllowed(visible: boolean): void {
        this.allowed = visible;
        this.apply();
    }

    public bindWorld(world: World): void {
        this.world = world;
    }

    public focus(entityId: Entity): void {
        if (!this.world || !this.orbit) return;
        const transform = getComponent(this.world, entityId, Transform);
        if (!transform) return;

        this.focusPoint.setFromMatrixPosition(this.scratchFocus.fromArray(transform.worldMatrix));
        this.orbit.target.copy(this.focusPoint);
    }

    /**
     * Copies an ECS world matrix onto the proxy so the handles track the entity.
     */
    public syncProxy(worldMatrix: ArrayLike<number>): void {
        this.proxy.matrix.fromArray(worldMatrix);
        this.proxy.matrix.decompose(this.proxy.position, this.proxy.quaternion, this.proxy.scale);
    }

    public draggedMatrix(): ArrayLike<number> {
        this.proxy.updateMatrix();
        return this.proxy.matrix.elements;
    }

    public apply(): void {
        if (!this.gizmo) return;

        if (!this.allowed || this.entity === null) {
            this.gizmo.controls.detach();
            this.gizmo.setVisible(false);
            return;
        }

        if (this.gizmo.controls.object !== this.proxy) {
            this.gizmo.controls.attach(this.proxy);
        }

        this.gizmo.setVisible(true);
    }

    public dispose(): void {
        this.gizmo?.dispose();
        this.entity = null;
        this.dragging = false;
    }

    private commit(): void {
        const world = this.world;
        if (!world || !this.onTransform || this.entity === null) return;

        this.proxy.updateMatrix();
        this.proxy.updateMatrixWorld();

        const transform = getComponent(world, this.entity, Transform);
        const parentWorld = transform?.parent !== undefined && transform.parent !== null
            ? getComponent(world, transform.parent, Transform)?.worldMatrix ?? null
            : null;

        this.onTransform(
            this.entity,
            worldMatrixToLocalTrs(this.proxy.matrixWorld, parentWorld)
        );
    }
}
