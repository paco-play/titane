import * as THREE from 'three';
import type { Entity } from '@titane/core';

/**
 * One InstancedMesh plus the entity occupying each instance slot.
 */
export class InstanceBatch {
    public mesh: THREE.InstancedMesh;
    public readonly entities: Entity[] = [];
    private readonly indexOf = new Map<Entity, number>();

    constructor(
        geometry: THREE.BufferGeometry,
        material: THREE.Material,
        capacity: number
    ) {
        this.mesh = new THREE.InstancedMesh(geometry, material, capacity);
        this.mesh.count = 0;
        this.mesh.frustumCulled = false;
        this.mesh.matrixAutoUpdate = false;
    }

    public has(entityId: Entity): boolean {
        return this.indexOf.has(entityId);
    }

    public add(entityId: Entity, matrix: THREE.Matrix4): void {
        if (this.indexOf.has(entityId)) {
            this.setMatrix(entityId, matrix);
            return;
        }

        this.ensureCapacity(this.entities.length + 1);
        const index = this.entities.length;
        this.entities.push(entityId);
        this.indexOf.set(entityId, index);
        this.mesh.setMatrixAt(index, matrix);
        this.mesh.count = this.entities.length;
        this.mesh.instanceMatrix.needsUpdate = true;
    }

    public remove(entityId: Entity): boolean {
        const index = this.indexOf.get(entityId);
        if (index === undefined) return false;

        const last = this.entities.length - 1;
        const lastEntity = this.entities[last];

        if (index !== last) {
            const scratch = new THREE.Matrix4();
            this.mesh.getMatrixAt(last, scratch);
            this.mesh.setMatrixAt(index, scratch);
            this.entities[index] = lastEntity;
            this.indexOf.set(lastEntity, index);
        }

        this.entities.pop();
        this.indexOf.delete(entityId);
        this.mesh.count = this.entities.length;
        this.mesh.instanceMatrix.needsUpdate = true;
        return true;
    }

    public setMatrix(entityId: Entity, matrix: THREE.Matrix4): void {
        const index = this.indexOf.get(entityId);
        if (index === undefined) return;
        this.mesh.setMatrixAt(index, matrix);
        this.mesh.instanceMatrix.needsUpdate = true;
    }

    public entityAt(instanceId: number): Entity | undefined {
        return this.entities[instanceId];
    }

    private ensureCapacity(needed: number): void {
        const capacity = this.mesh.instanceMatrix.count;
        if (needed <= capacity) return;

        const next = Math.max(needed, capacity * 2);
        const grown = new THREE.InstancedMesh(this.mesh.geometry, this.mesh.material, next);
        grown.frustumCulled = false;
        grown.matrixAutoUpdate = false;
        grown.castShadow = this.mesh.castShadow;
        grown.receiveShadow = this.mesh.receiveShadow;
        const scratch = new THREE.Matrix4();
        for (let i = 0; i < this.entities.length; i++) {
            this.mesh.getMatrixAt(i, scratch);
            grown.setMatrixAt(i, scratch);
        }
        grown.count = this.entities.length;

        const parent = this.mesh.parent;
        parent?.remove(this.mesh);
        this.mesh.dispose();
        this.mesh = grown;
        parent?.add(grown);
    }
}
