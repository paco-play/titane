import * as THREE from 'three';
import type { IRenderer } from '../runtime/renderer-interface';
import type { World } from '../ecs/kernel/world';
import type { Entity } from '../ecs/types';
import { defineQuery, runQuery } from '../ecs/kernel/query';
import { getComponent } from '../ecs/kernel/component';
import { Transform } from '../ecs/components/transform';
import { Mesh } from '../ecs/components/mesh';

const renderableQuery = defineQuery([Transform, Mesh]);

/**
 * Three.js implementation of the Titane Renderer.
 * Handles the mapping between ECS data and Three.js Object3D instances.
 */
export class ThreeRenderer implements IRenderer {
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private renderer!: THREE.WebGLRenderer;
    private gridHelper!: THREE.GridHelper;
    /** Internal cache to link ECS entities to Three.js objects */
    private entityObjectMap = new Map<Entity, THREE.Mesh>();

    /** Entities matched during the current frame, reused to avoid per-frame allocation */
    private liveEntities = new Set<Entity>();

    public init(canvas: HTMLCanvasElement): void {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#0a0a0a');

        this.camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

        // Lights
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 10, 7.5);
        this.scene.add(light);
        this.scene.add(new THREE.AmbientLight(0x404040, 0.8));

        // Grid
        this.gridHelper = new THREE.GridHelper(20, 20, '#444444', '#222222');
        this.scene.add(this.gridHelper);
    }

    public handleResize(): void {
        const canvas = this.renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        if (canvas.width !== width || canvas.height !== height) {
            this.renderer.setSize(width, height, false);
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        }
    }

    public setSize(width: number, height: number): void {
        this.renderer.setSize(width, height, false);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    public setGridVisible(visible: boolean): void {
        this.gridHelper.visible = visible;
    }

    public render(world: World): void {
        const activeEntities = runQuery(world, renderableQuery);

        this.liveEntities.clear();
        for (const entityId of activeEntities) {
            this.liveEntities.add(entityId);
        }

        // 1. Cleanup: release GPU resources of entities that no longer render
        for (const [entityId, threeMesh] of this.entityObjectMap) {
            if (this.liveEntities.has(entityId)) continue;

            this.scene.remove(threeMesh);
            this.disposeMesh(threeMesh);
            this.entityObjectMap.delete(entityId);
        }

        // 2. Update & sync
        for (const entityId of activeEntities) {
            const transform = getComponent(world, entityId, Transform);
            const meshData = getComponent(world, entityId, Mesh);
            if (!transform || !meshData) continue;

            let mesh = this.entityObjectMap.get(entityId);

            if (!mesh) {
                const geometry = new THREE.BoxGeometry(1, 1, 1);
                const material = new THREE.MeshStandardMaterial({ color: meshData.color });
                mesh = new THREE.Mesh(geometry, material);
                mesh.matrixAutoUpdate = false;
                this.scene.add(mesh);
                this.entityObjectMap.set(entityId, mesh);
            }

            // Sync transformations exclusively using the DOD calculated World Matrix
            mesh.matrix.fromArray(transform.worldMatrix);
        }

        // 3. Final draw
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Releases the GPU resources owned by a mesh.
     * @param mesh The mesh to tear down.
     */
    private disposeMesh(mesh: THREE.Mesh): void {
        mesh.geometry.dispose();

        if (Array.isArray(mesh.material)) {
            mesh.material.forEach(material => material.dispose());
        } else {
            mesh.material.dispose();
        }
    }

    public dispose(): void {
        this.renderer.dispose();

        for (const mesh of this.entityObjectMap.values()) {
            this.disposeMesh(mesh);
        }

        this.entityObjectMap.clear();
        this.liveEntities.clear();
    }
}