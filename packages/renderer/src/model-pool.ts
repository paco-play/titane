import * as THREE from 'three';
import type { Entity, World } from '@titane/core';
import { defineQuery, runQuery, getComponent, Gltf, Transform } from '@titane/core';
import { cloneGltfScene, loadGltfAsset, type GltfAsset, type GltfFactory } from './gltf-asset';
import { advanceMixer } from './model-clip';

const gltfQuery = defineQuery([Gltf]);

/** Shared source graph plus the number of live clones. */
interface PooledTemplate {
    refs: number;
    ready: Promise<GltfAsset>;
}

/** Per-entity runtime state. */
interface ModelEntry {
    url: string;
    root: THREE.Group | null;
    mixer: THREE.AnimationMixer | null;
    clips: readonly THREE.AnimationClip[];
    clip: string;
    playing: boolean;
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
    private lastTime = 0;

    constructor(scene: THREE.Scene, load: GltfFactory = loadGltfAsset) {
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
     * Creates, reloads, poses and animates every live glTF entity for one frame.
     * @param world - The ECS world.
     * @param deltaSeconds - Mixer step. Omitted uses wall-clock since last sync.
     */
    public sync(world: World, deltaSeconds?: number): void {
        const dt = deltaSeconds ?? this.measureDt();
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
                entry = this.emptyEntry();
                this.tracked.set(entity, entry);
            }

            if (entry.url !== url) {
                this.detach(entry);
                entry.url = url;
                if (url !== '') this.beginLoad(entity, entry, url);
            }

            this.applyPose(entry, world, entity);
            this.applyClip(entry, data, dt);
        }
    }

    public dispose(): void {
        for (const [entity, entry] of this.tracked) this.drop(entity, entry);
        this.templates.clear();
        this.inflight.clear();
        this.lastTime = 0;
    }

    private emptyEntry(): ModelEntry {
        return {
            url: '',
            root: null,
            mixer: null,
            clips: [],
            clip: '',
            playing: false,
            token: 0
        };
    }

    private measureDt(): number {
        const now = performance.now() / 1000;
        if (this.lastTime === 0) {
            this.lastTime = now;
            return 0;
        }
        const dt = Math.max(0, now - this.lastTime);
        this.lastTime = now;
        return dt;
    }

    private beginLoad(entity: Entity, entry: ModelEntry, url: string): void {
        const token = ++this.token;
        entry.token = token;

        const work = this.retain(url)
            .then(asset => {
                if (entry.token !== token) {
                    this.release(url);
                    return;
                }

                const root = cloneGltfScene(asset.scene);
                root.matrixAutoUpdate = false;
                root.userData.titaneEntity = entity;
                this.scene.add(root);
                entry.root = root;
                entry.clips = asset.animations;
                entry.mixer = new THREE.AnimationMixer(root);
            })
            .catch(() => {
                this.release(url);
            });

        this.inflight.add(work);
        void work.finally(() => this.inflight.delete(work));
    }

    private retain(url: string): Promise<GltfAsset> {
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
        void pooled.ready.then(asset => disposeGraph(asset.scene)).catch(() => undefined);
    }

    private applyPose(entry: ModelEntry, world: World, entity: Entity): void {
        if (!entry.root) return;
        const transform = getComponent(world, entity, Transform);
        if (!transform) return;
        entry.root.matrix.fromArray(transform.worldMatrix);
    }

    private applyClip(
        entry: ModelEntry,
        data: { clip: string; playing: boolean; loop: boolean },
        dt: number
    ): void {
        if (!entry.mixer) return;
        const bound = advanceMixer(
            entry.mixer,
            entry.clips,
            data.clip,
            data.playing,
            data.loop,
            entry.playing,
            entry.clip,
            dt
        );
        entry.clip = bound;
        entry.playing = data.playing && bound !== '';
    }

    private detach(entry: ModelEntry): void {
        entry.token += 1;
        entry.mixer?.stopAllAction();
        entry.mixer = null;
        entry.clips = [];
        entry.clip = '';
        entry.playing = false;
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
