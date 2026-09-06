import * as THREE from 'three';
import {
    Collider,
    Transform,
    defineQuery,
    getComponent,
    runQuery,
    type Entity,
    type World
} from '@titane/core';
import type { LocalAabb } from './model-bounds';
import {
    colliderVisualFromData,
    shouldDrawCollider,
    type ColliderOverlayMode,
    type ColliderVisual
} from './collider-visual';

const colliderQuery = defineQuery([Transform, Collider]);
const OVERLAY_COLOR = '#4ade80';

const decompose = new THREE.Vector3();
const quat = new THREE.Quaternion();
const scaleScratch = new THREE.Vector3();
const matrix = new THREE.Matrix4();
const offset = new THREE.Vector3();

type OverlayEntry = {
    readonly lines: THREE.LineSegments;
    signature: string;
};

/**
 * Editor-only wireframes for authored `Collider` shapes. Not pickable.
 */
export class ColliderOverlay {
    private readonly entries = new Map<Entity, OverlayEntry>();
    private readonly material: THREE.LineBasicMaterial;
    private readonly group = new THREE.Group();
    private mode: ColliderOverlayMode = 'selected';

    constructor(
        scene: THREE.Scene,
        private readonly aabbOf: (entity: Entity) => LocalAabb | null
    ) {
        this.material = new THREE.LineBasicMaterial({
            color: OVERLAY_COLOR,
            depthTest: false,
            depthWrite: false,
            transparent: true
        });
        this.group.name = 'ColliderOverlay';
        scene.add(this.group);
    }

    public setMode(mode: ColliderOverlayMode): void {
        this.mode = mode;
    }

    /**
     * Rebuilds wireframes for the current selection / show-all mode.
     */
    public sync(
        world: World,
        options: {
            readonly selected: Entity | null;
            readonly visible: boolean;
            readonly worldMatrixOf: (entity: Entity) => ArrayLike<number> | null;
        }
    ): void {
        this.group.visible = options.visible;
        if (!options.visible) return;

        const live = new Set<Entity>();
        for (const entity of runQuery(world, colliderQuery)) {
            if (!shouldDrawCollider(this.mode, options.selected, entity)) continue;
            const transform = getComponent(world, entity, Transform);
            const collider = getComponent(world, entity, Collider);
            const worldMatrix = options.worldMatrixOf(entity);
            if (!transform || !collider || !worldMatrix) continue;

            live.add(entity);
            const visual = colliderVisualFromData(
                collider,
                transform.scale,
                collider.kind === 'mesh' ? this.aabbOf(entity) : null
            );
            this.upsert(entity, visual, worldMatrix);
        }

        for (const entity of [...this.entries.keys()]) {
            if (!live.has(entity)) this.remove(entity);
        }
    }

    public dispose(): void {
        this.clear();
        this.group.parent?.remove(this.group);
        this.material.dispose();
    }

    private upsert(
        entity: Entity,
        visual: ColliderVisual,
        worldMatrix: ArrayLike<number>
    ): void {
        const signature = visualSignature(visual);
        let entry = this.entries.get(entity);
        if (!entry) {
            const lines = new THREE.LineSegments(geometryFor(visual), this.material);
            lines.frustumCulled = false;
            lines.renderOrder = 1000;
            lines.raycast = (): void => undefined;
            this.group.add(lines);
            entry = { lines, signature };
            this.entries.set(entity, entry);
        } else if (entry.signature !== signature) {
            entry.lines.geometry.dispose();
            entry.lines.geometry = geometryFor(visual);
            entry.signature = signature;
        }

        applyWorldPose(entry.lines, worldMatrix, visual.center);
    }

    private remove(entity: Entity): void {
        const entry = this.entries.get(entity);
        if (!entry) return;
        this.group.remove(entry.lines);
        entry.lines.geometry.dispose();
        this.entries.delete(entity);
    }

    private clear(): void {
        for (const entity of [...this.entries.keys()]) this.remove(entity);
    }
}

const visualSignature = (visual: ColliderVisual): string =>
    [
        visual.kind,
        visual.size.x,
        visual.size.y,
        visual.size.z,
        visual.radius,
        visual.cylinderHeight
    ].join(':');

const wireframeFrom = (source: THREE.BufferGeometry): THREE.BufferGeometry => {
    const wire = new THREE.WireframeGeometry(source);
    source.dispose();
    return wire;
};

const geometryFor = (visual: ColliderVisual): THREE.BufferGeometry => {
    if (visual.kind === 'sphere') {
        return wireframeFrom(new THREE.SphereGeometry(visual.radius, 16, 12));
    }
    if (visual.kind === 'capsule') {
        return wireframeFrom(new THREE.CapsuleGeometry(visual.radius, visual.cylinderHeight, 4, 12));
    }
    const box = new THREE.BoxGeometry(visual.size.x, visual.size.y, visual.size.z);
    const edges = new THREE.EdgesGeometry(box);
    box.dispose();
    return edges;
};

const applyWorldPose = (
    object: THREE.Object3D,
    worldMatrix: ArrayLike<number>,
    center: { x: number; y: number; z: number }
): void => {
    matrix.fromArray(worldMatrix);
    matrix.decompose(decompose, quat, scaleScratch);
    offset.set(center.x, center.y, center.z).applyQuaternion(quat);
    object.position.copy(decompose).add(offset);
    object.quaternion.copy(quat);
    object.scale.set(1, 1, 1);
};
