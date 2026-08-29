import * as THREE from 'three';
import type { IRenderer, World, Entity, MeshData, PrimitiveType } from '@titane/core';
import { defineQuery, runQuery, getComponent, Transform, Mesh } from '@titane/core';
import { ResourceCache } from './resource-cache';

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

/**
 * Three.js implementation of the Titane renderer contract.
 * Maps ECS data onto Three.js objects and owns nothing else.
 */
export class ThreeRenderer implements IRenderer {
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private renderer!: THREE.WebGLRenderer;
    private gridHelper!: THREE.GridHelper;

    private readonly resources = new ResourceCache();

    /** Links ECS entities to the objects drawing them. */
    private readonly renderedEntities = new Map<Entity, RenderedEntity>();

    /** Entities matched during the current frame, reused to avoid per-frame allocation. */
    private readonly liveEntities = new Set<Entity>();

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
            this.setSize(width, height);
        }
    }

    public setSize(width: number, height: number): void {
        this.renderer.setSize(width, height, false);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    /**
     * Toggles the ground grid.
     *
     * Editor-only helper, deliberately absent from `IRenderer`: the engine
     * contract has no business describing editor chrome.
     * @param visible Whether the grid should be drawn.
     */
    public setGridVisible(visible: boolean): void {
        this.gridHelper.visible = visible;
    }

    public render(world: World): void {
        const activeEntities = runQuery(world, renderableQuery);

        this.liveEntities.clear();
        for (const entityId of activeEntities) {
            this.liveEntities.add(entityId);
        }

        // 1. Drop objects of entities that stopped rendering. Geometries and
        // materials are pooled, so only the Object3D is released here.
        for (const [entityId, rendered] of this.renderedEntities) {
            if (this.liveEntities.has(entityId)) continue;

            this.scene.remove(rendered.object);
            this.renderedEntities.delete(entityId);
        }

        // 2. Spawn, refresh, then sync placement
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
                rendered.object.material = this.resources.material(meshData.color);
                rendered.color = meshData.color;
            }

            // Placement comes exclusively from the world matrix computed by the ECS
            rendered.object.matrix.fromArray(transform.worldMatrix);
        }

        // 3. Final draw
        this.renderer.render(this.scene, this.camera);
    }

    public dispose(): void {
        for (const rendered of this.renderedEntities.values()) {
            this.scene.remove(rendered.object);
        }

        this.renderedEntities.clear();
        this.liveEntities.clear();

        this.resources.dispose();
        this.renderer.dispose();
    }

    /**
     * Creates and registers the object drawing an entity.
     * @param entityId The entity to draw.
     * @param meshData The mesh component describing it.
     * @returns The freshly tracked render record.
     */
    private spawn(entityId: Entity, meshData: MeshData): RenderedEntity {
        const object = new THREE.Mesh(
            this.resources.geometry(meshData.primitive),
            this.resources.material(meshData.color)
        );

        // The ECS owns spatial data: Three.js must never recompute this matrix
        object.matrixAutoUpdate = false;
        this.scene.add(object);

        const rendered: RenderedEntity = {
            object,
            primitive: meshData.primitive,
            color: meshData.color
        };

        this.renderedEntities.set(entityId, rendered);
        return rendered;
    }
}
