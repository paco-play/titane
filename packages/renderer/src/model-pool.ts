import * as THREE from 'three';
import type { Entity, World } from '@titane/core';
import { defineQuery, runQuery, getComponent, Gltf, Transform } from '@titane/core';

const gltfQuery = defineQuery([Gltf]);

/**
 * Loads a glTF scene graph from a URL. Injected so tests can skip network I/O.
 */
export type GltfFactory = (url: string) => Promise<THREE.Group>;

const loadGltf = async (url: string): Promise<THREE.Group> => {
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
    return new Promise((resolve, reject) => {
        new GLTFLoader().load(
            url,
            gltf => resolve(gltf.scene),
            undefined,
            reject
        );
    });
};

/** Shared source graph plus the number of live clones. */
interface PooledTemplate {
    refs: number;
    ready: Promise<THREE.Group>;
}

/** Per-entity runtime state. */
interface ModelEntry {
    url: string;
    root: THREE.Group | null;
    token: number;
}

/**
 * Manages Three.js scene graphs derived from ECS `Gltf` components.
 *
 * One loaded template is shared per URL. Each entity gets a clone so
 * `Transform.worldMatrix` can differ. A token cancels stale loads when
 * the URL changes or the entity is destroyed mid-request.
 */
export class ModelPool {
    private readonly scene: THREE.Scene;
    private readonly load: GltfFactory;
    private readonly templates = new Map<string, PooledTemplate>();
    private readonly tracked = new Map<Entity, ModelEntry>();
    private readonly liveSet = new Set<Entity>();
    private readonly inflight = new Set<Promise<void>>();
    private token = 0;

    constructor(scene: THREE.Scene, load: GltfFactory = loadGltf) {
        this.scene = scene;
        this.load = load;
    }

    /**
     * Resolves when every in-flight load started so far has settled.
     * Exposed for tests.
     */
    public get ready(): Promise<void> {
        return Promise.all(this.inflight).then(() => undefined);
    }

    /** Number of live entity roots currently in the scene. Exposed for tests. */
    public get rootCount(): number {
        let count = 0;
        for (const entry of this.tracked.values()) {
            if (entry.root) count += 1;
        }
        return count;
    }

    /** Number of distinct URLs currently retained. Exposed for tests. */
    public get templateCount(): number {
        return this.templates.size;
    }

    /**
     * Root groups that can be raycast. Children are included by the caller
     * via `recursive: true`.
     */
    public pickables(): THREE.Object3D[] {
        const roots: THREE.Object3D[] = [];
        for (const entry of this.tracked.values()) {
            if (entry.root) roots.push(entry.root);
        }
        return roots;
    }

    /**
     * Maps a raycast object back to its entity when it is a managed root.
     */
    public entityOf(object: THREE.Object3D): Entity | undefined {
        const tagged = object.userData.titaneEntity;
        return typeof tagged === 'number' ? tagged : undefined;
    }

    /**
     * Creates, reloads and poses every live glTF entity for one render frame.
     */
    public sync(world: World): void {
        const liveEntities = runQuery(world, gltfQuery);
        this.liveSet.clear();
        for (const entity of liveEntities) this.liveSet.add(entity);

        for (const [entity, entry] of this.tracked) {
            if (!this.liveSet.has(entity)) this.drop(entity, entry);
        }

        for (const entity of liveEntities) {
            const data = getComponent(world, entity, Gltf);
            if (!data) continue;

            const url = data.url;
            let entry = this.tracked.get(entity);

            if (!entry) {
                entry = { url: '', root: null, token: 0 };
                this.tracked.set(entity, entry);
            }

            if (entry.url !== url) {
                this.detach(entry);
                entry.url = url;
                if (url !== '') this.beginLoad(entity, entry, url);
            }

            this.applyPose(entry, world, entity);
        }
    }

    public dispose(): void {
        for (const [entity, entry] of this.tracked) this.drop(entity, entry);
        this.templates.clear();
        this.inflight.clear();
    }

    private beginLoad(entity: Entity, entry: ModelEntry, url: string): void {
        const token = ++this.token;
        entry.token = token;

        const work = this.retain(url)
            .then(template => {
                if (entry.token !== token) {
                    this.release(url);
                    return;
                }

                const root = template.clone(true);
                root.matrixAutoUpdate = false;
                root.userData.titaneEntity = entity;
                this.scene.add(root);
                entry.root = root;
            })
            .catch(() => {
                this.release(url);
            });

        this.inflight.add(work);
        void work.finally(() => this.inflight.delete(work));
    }

    private retain(url: string): Promise<THREE.Group> {
        const cached = this.templates.get(url);
        if (cached) {
            cached.refs += 1;
            return cached.ready;
        }

        const ready = this.load(url);
        this.templates.set(url, { refs: 1, ready });
        ready.catch(() => {
            this.templates.delete(url);
        });
        return ready;
    }

    private release(url: string): void {
        const pooled = this.templates.get(url);
        if (!pooled) return;

        pooled.refs -= 1;
        if (pooled.refs > 0) return;

        this.templates.delete(url);
        void pooled.ready.then(template => disposeGraph(template)).catch(() => undefined);
    }

    private applyPose(entry: ModelEntry, world: World, entity: Entity): void {
        if (!entry.root) return;
        const transform = getComponent(world, entity, Transform);
        if (!transform) return;
        entry.root.matrix.fromArray(transform.worldMatrix);
    }

    private detach(entry: ModelEntry): void {
        entry.token += 1;
        if (entry.root) {
            this.scene.remove(entry.root);
            entry.root = null;
        }
        if (entry.url !== '') this.release(entry.url);
    }

    private drop(entity: Entity, entry: ModelEntry): void {
        this.detach(entry);
        this.tracked.delete(entity);
    }
}

/**
 * Frees GPU resources owned by a loaded (or cloned) graph.
 * Safe on a template that is no longer referenced.
 */
const disposeGraph = (root: THREE.Object3D): void => {
    root.traverse(child => {
        if (!(child instanceof THREE.Mesh)) return;
        child.geometry.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        for (const material of materials) material.dispose();
    });
};
