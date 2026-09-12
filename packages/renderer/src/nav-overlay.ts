import * as THREE from 'three';
import { getComponent, Nav, navCellWorld, navHasGrid, pickNav, type NavData, type World } from '@titane/core';

const OVERLAY_COLOR = '#38bdf8';

/**
 * Editor-only walkable-cell quads. Not pickable. Hidden in Play.
 */
export class NavOverlay {
    private readonly group = new THREE.Group();
    private readonly material: THREE.MeshBasicMaterial;
    private mesh: THREE.InstancedMesh | null = null;
    private signature = '';
    private shown = true;

    constructor(scene: THREE.Scene) {
        this.material = new THREE.MeshBasicMaterial({
            color: OVERLAY_COLOR,
            transparent: true,
            opacity: 0.35,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        this.group.name = 'NavOverlay';
        scene.add(this.group);
    }

    public setVisible(visible: boolean): void {
        this.shown = visible;
        this.group.visible = visible;
    }

    /**
     * Rebuilds the instanced floor when the baked grid changes.
     */
    public sync(world: World, chromeVisible: boolean): void {
        this.group.visible = this.shown && chromeVisible;
        if (!this.group.visible) return;

        const entity = pickNav(world);
        const nav = entity === null ? null : getComponent(world, entity, Nav);
        if (!nav || !navHasGrid(nav)) {
            this.clearMesh();
            this.signature = '';
            return;
        }

        const signature = navSignature(nav);
        if (signature === this.signature && this.mesh) return;
        this.signature = signature;
        this.rebuild(nav);
    }

    public dispose(): void {
        this.clearMesh();
        this.group.parent?.remove(this.group);
        this.material.dispose();
    }

    private rebuild(nav: NavData): void {
        this.clearMesh();
        const centers: { x: number; y: number; z: number }[] = [];
        for (let iz = 0; iz < nav.depth; iz++) {
            for (let ix = 0; ix < nav.width; ix++) {
                if (nav.cells[iz * nav.width + ix] !== 1) continue;
                centers.push(navCellWorld(nav, ix, iz));
            }
        }
        if (centers.length === 0) return;

        const geometry = new THREE.PlaneGeometry(1, 1);
        const mesh = new THREE.InstancedMesh(geometry, this.material, centers.length);
        mesh.frustumCulled = false;
        mesh.renderOrder = 999;
        mesh.raycast = (): void => undefined;
        const matrix = new THREE.Matrix4();
        const quaternion = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(1, 0, 0),
            -Math.PI / 2
        );
        const scale = new THREE.Vector3(nav.cellSize * 0.85, nav.cellSize * 0.85, 1);
        const position = new THREE.Vector3();
        for (let i = 0; i < centers.length; i++) {
            const cell = centers[i];
            position.set(cell.x, cell.y + 0.02, cell.z);
            matrix.compose(position, quaternion, scale);
            mesh.setMatrixAt(i, matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
        this.group.add(mesh);
        this.mesh = mesh;
    }

    private clearMesh(): void {
        if (!this.mesh) return;
        this.group.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh = null;
    }
}

export const navSignature = (nav: {
    readonly cellSize: number;
    readonly originX: number;
    readonly originY: number;
    readonly originZ: number;
    readonly width: number;
    readonly depth: number;
    readonly cells: readonly number[];
}): string => {
    let hash = 0;
    for (let i = 0; i < nav.cells.length; i++) hash = (hash * 31 + nav.cells[i]) | 0;
    return [
        nav.width,
        nav.depth,
        nav.cellSize,
        nav.originX,
        nav.originY,
        nav.originZ,
        hash
    ].join(':');
};
