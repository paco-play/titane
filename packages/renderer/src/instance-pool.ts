import * as THREE from 'three';
import type { Entity, PrimitiveType } from '@titane/core';
import type { ResourceCache } from './resource-cache';
import { InstanceBatch } from './instance-batch';

const INITIAL_CAPACITY = 8;

/** Identity of one instanced batch: shared geometry and material. */
interface BatchSpec {
    primitive: PrimitiveType;
    color: string;
    albedo: string;
}

const batchKey = (spec: BatchSpec): string =>
    `${spec.primitive}\0${spec.color.toLowerCase()}\0${spec.albedo}`;

/**
 * Groups renderable entities into one InstancedMesh per (primitive, color, albedo).
 */
export class InstancePool {
    private readonly batches = new Map<string, InstanceBatch>();
    private readonly specs = new Map<string, BatchSpec>();
    private readonly entityKey = new Map<Entity, string>();
    private readonly scratch = new THREE.Matrix4();

    constructor(
        private readonly scene: THREE.Scene,
        private readonly resources: ResourceCache
    ) {}

    public trackedEntities(): IterableIterator<Entity> {
        return this.entityKey.keys();
    }

    public get batchCount(): number {
        return this.batches.size;
    }

    /**
     * Places an entity in the batch matching its mesh, updating its instance matrix.
     */
    public sync(
        entityId: Entity,
        primitive: PrimitiveType,
        color: string,
        worldMatrix: ArrayLike<number>,
        albedo = ''
    ): void {
        const spec: BatchSpec = { primitive, color, albedo };
        const key = batchKey(spec);
        const previous = this.entityKey.get(entityId);
        if (previous !== undefined && previous !== key) this.remove(entityId);

        this.scratch.fromArray(worldMatrix);
        const batch = this.batches.get(key) ?? this.spawnBatch(key, spec);
        batch.add(entityId, this.scratch);
        this.entityKey.set(entityId, key);
    }

    /**
     * Drops an entity from whichever batch currently owns it.
     */
    public remove(entityId: Entity): void {
        const key = this.entityKey.get(entityId);
        if (key === undefined) return;

        const batch = this.batches.get(key);
        batch?.remove(entityId);
        this.entityKey.delete(entityId);

        if (batch && batch.entities.length === 0) this.disposeBatch(key, batch);
    }

    /**
     * Instanced meshes to raycast against.
     */
    public pickables(): THREE.Object3D[] {
        const meshes: THREE.Object3D[] = [];
        for (const batch of this.batches.values()) meshes.push(batch.mesh);
        return meshes;
    }

    /**
     * Maps a raycast hit on an instanced mesh back to an entity.
     */
    public entityOf(object: THREE.Object3D, instanceId: number | undefined): Entity | undefined {
        for (const batch of this.batches.values()) {
            if (batch.mesh !== object) continue;
            if (instanceId === undefined) return undefined;
            return batch.entityAt(instanceId);
        }
        return undefined;
    }

    public dispose(): void {
        for (const [key, batch] of [...this.batches]) this.disposeBatch(key, batch);
        this.entityKey.clear();
    }

    private spawnBatch(key: string, spec: BatchSpec): InstanceBatch {
        const geometry = this.resources.geometry(spec.primitive);
        const material = this.resources.material(spec.color, spec.albedo);
        const batch = new InstanceBatch(geometry, material, INITIAL_CAPACITY);
        this.scene.add(batch.mesh);
        this.batches.set(key, batch);
        this.specs.set(key, spec);
        return batch;
    }

    private disposeBatch(key: string, batch: InstanceBatch): void {
        this.scene.remove(batch.mesh);
        batch.mesh.dispose();
        const spec = this.specs.get(key);
        if (spec) this.resources.releaseMaterial(spec.color, spec.albedo);
        this.batches.delete(key);
        this.specs.delete(key);
    }
}
