import * as THREE from 'three';
import {
    Camera,
    Transform,
    defineQuery,
    runQuery,
    type Entity,
    type World
} from '@titane/core';

const cameraQuery = defineQuery([Transform, Camera]);
const GLYPH_COLOR = '#111111';

const decompose = new THREE.Vector3();
const quat = new THREE.Quaternion();
const scaleScratch = new THREE.Vector3();
const matrix = new THREE.Matrix4();

/**
 * Editor-only camera glyph: a black box body and a pyramid frustum along -Z.
 * Hidden in Play. Pickable so a viewport click selects the camera.
 */
export class CameraOverlay {
    private readonly entries = new Map<Entity, THREE.Group>();
    private readonly material: THREE.MeshBasicMaterial;
    private readonly bodyGeometry: THREE.BoxGeometry;
    private readonly lensGeometry: THREE.ConeGeometry;
    private readonly group = new THREE.Group();

    constructor(scene: THREE.Scene) {
        this.material = new THREE.MeshBasicMaterial({
            color: GLYPH_COLOR,
            depthTest: true,
            depthWrite: true
        });
        this.bodyGeometry = new THREE.BoxGeometry(0.28, 0.2, 0.16);
        this.lensGeometry = new THREE.ConeGeometry(0.12, 0.22, 4);
        this.group.name = 'CameraOverlay';
        scene.add(this.group);
    }

    /**
     * Rebuilds glyphs for every Camera with a Transform.
     */
    public sync(
        world: World,
        options: {
            readonly visible: boolean;
            readonly worldMatrixOf: (entity: Entity) => ArrayLike<number> | null;
        }
    ): void {
        this.group.visible = options.visible;
        if (!options.visible) return;

        const live = new Set<Entity>();
        for (const entity of runQuery(world, cameraQuery)) {
            const worldMatrix = options.worldMatrixOf(entity);
            if (!worldMatrix) continue;
            live.add(entity);
            this.upsert(entity, worldMatrix);
        }

        for (const entity of [...this.entries.keys()]) {
            if (!live.has(entity)) this.remove(entity);
        }
    }

    /**
     * Glyph meshes for viewport picking.
     */
    public pickables(): THREE.Object3D[] {
        if (!this.group.visible) return [];
        return [...this.entries.values()];
    }

    public dispose(): void {
        for (const entity of [...this.entries.keys()]) this.remove(entity);
        this.group.parent?.remove(this.group);
        this.bodyGeometry.dispose();
        this.lensGeometry.dispose();
        this.material.dispose();
    }

    private upsert(entity: Entity, worldMatrix: ArrayLike<number>): void {
        let glyph = this.entries.get(entity);
        if (!glyph) {
            glyph = makeGlyph(entity, this.bodyGeometry, this.lensGeometry, this.material);
            this.group.add(glyph);
            this.entries.set(entity, glyph);
        }
        applyUnscaledPose(glyph, worldMatrix);
    }

    private remove(entity: Entity): void {
        const glyph = this.entries.get(entity);
        if (!glyph) return;
        this.group.remove(glyph);
        this.entries.delete(entity);
    }
}

const makeGlyph = (
    entity: Entity,
    bodyGeometry: THREE.BoxGeometry,
    lensGeometry: THREE.ConeGeometry,
    material: THREE.MeshBasicMaterial
): THREE.Group => {
    const root = new THREE.Group();
    root.userData.titaneEntity = entity;

    const body = new THREE.Mesh(bodyGeometry, material);
    body.position.z = 0.05;
    body.userData.titaneEntity = entity;

    const lens = new THREE.Mesh(lensGeometry, material);
    lens.rotation.x = Math.PI / 2;
    lens.position.z = -0.15;
    lens.userData.titaneEntity = entity;

    root.add(body, lens);
    return root;
};

/**
 * Entity id stamped on a camera glyph, or `undefined` for other objects.
 */
export const entityOfCameraGlyph = (object: { readonly userData: Record<string, unknown> }): Entity | undefined => {
    const id = object.userData.titaneEntity;
    return typeof id === 'number' ? id : undefined;
};

const applyUnscaledPose = (object: THREE.Object3D, worldMatrix: ArrayLike<number>): void => {
    matrix.fromArray(worldMatrix);
    matrix.decompose(decompose, quat, scaleScratch);
    object.position.copy(decompose);
    object.quaternion.copy(quat);
    object.scale.set(1, 1, 1);
};
