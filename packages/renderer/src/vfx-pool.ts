import * as THREE from 'three';
import type { Entity, World } from '@titane/core';
import { defineQuery, getComponent, runQuery, Transform, Vfx } from '@titane/core';
import type { VfxData } from '@titane/core';
import type { TextureFactory } from './resource-cache';
import {
    createParticleBuffer,
    rgbFromHex,
    spawnParticle,
    stepParticles,
    type ParticleBuffer
} from './vfx-particles';

const vfxQuery = defineQuery([Vfx, Transform]);
const INITIAL_CAPACITY = 64;

export type { TextureFactory };

/** Per-emitter GPU mesh plus CPU particles. */
interface EmitterEntry {
    texture: string;
    acc: number;
    burstDone: boolean;
    particles: ParticleBuffer;
    mesh: THREE.InstancedMesh;
    material: THREE.MeshBasicMaterial;
}

/**
 * Draws `Vfx` emitters as CPU quads. One InstancedMesh per emitter,
 * never one Entity per particle.
 */
export class VfxPool {
    private readonly scene: THREE.Scene;
    private readonly createTexture: TextureFactory;
    private readonly geometry = new THREE.PlaneGeometry(1, 1);
    private readonly tracked = new Map<Entity, EmitterEntry>();
    private readonly live = new Set<Entity>();
    private readonly scratch = new THREE.Matrix4();
    private readonly translation = new THREE.Matrix4();
    private readonly scale = new THREE.Matrix4();
    private readonly color = new THREE.Color();

    constructor(scene: THREE.Scene, createTexture: TextureFactory = url => {
        const texture = new THREE.TextureLoader().load(url);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }) {
        this.scene = scene;
        this.createTexture = createTexture;
    }

    /** Live emitter meshes. Exposed for tests. */
    public get emitterCount(): number {
        return this.tracked.size;
    }

    /** Sum of live CPU particles. Exposed for tests. */
    public get particleCount(): number {
        let count = 0;
        for (const entry of this.tracked.values()) count += entry.particles.count;
        return count;
    }

    /**
     * Spawns, ages and uploads every emitter for one frame.
     */
    public sync(world: World, camera: THREE.Camera, dt: number): void {
        const step = Math.min(Math.max(dt, 0), 0.05);
        const liveEntities = runQuery(world, vfxQuery);
        this.live.clear();
        for (const entity of liveEntities) this.live.add(entity);

        for (const [entity, entry] of this.tracked) {
            if (!this.live.has(entity)) this.drop(entity, entry);
        }

        for (const entity of liveEntities) {
            const data = getComponent(world, entity, Vfx);
            const transform = getComponent(world, entity, Transform);
            if (!data || !transform) continue;

            const entry = this.tracked.get(entity) ?? this.spawn(entity, data);
            if (entry.texture !== data.texture) this.retarget(entry, data.texture);

            this.emit(entry, data, transform.worldMatrix, step);
            stepParticles(entry.particles, step);
            this.upload(entry, camera);
        }
    }

    public dispose(): void {
        for (const [entity, entry] of this.tracked) this.drop(entity, entry);
        this.geometry.dispose();
    }

    private spawn(entity: Entity, data: VfxData): EmitterEntry {
        const material = this.makeMaterial(data.texture);
        const mesh = new THREE.InstancedMesh(this.geometry, material, INITIAL_CAPACITY);
        mesh.count = 0;
        mesh.frustumCulled = false;
        mesh.matrixAutoUpdate = false;
        this.scene.add(mesh);

        const entry: EmitterEntry = {
            texture: data.texture,
            acc: 0,
            burstDone: false,
            particles: createParticleBuffer(),
            mesh,
            material
        };
        this.tracked.set(entity, entry);
        return entry;
    }

    private emit(
        entry: EmitterEntry,
        data: VfxData,
        worldMatrix: ArrayLike<number>,
        dt: number
    ): void {
        const origin: [number, number, number] = [
            worldMatrix[12] ?? 0,
            worldMatrix[13] ?? 0,
            worldMatrix[14] ?? 0
        ];
        const color = rgbFromHex(data.color);
        const count = Math.max(0, Math.round(data.rate));

        if (data.mode === 'burst') {
            if (entry.burstDone) return;
            for (let i = 0; i < count; i++) {
                spawnParticle(entry.particles, origin, color, data.size, data.lifetime);
            }
            entry.burstDone = true;
            return;
        }

        entry.burstDone = false;
        entry.acc += data.rate * dt;
        while (entry.acc >= 1) {
            spawnParticle(entry.particles, origin, color, data.size, data.lifetime);
            entry.acc -= 1;
        }
    }

    private upload(entry: EmitterEntry, camera: THREE.Camera): void {
        this.ensureCapacity(entry, entry.particles.count);
        const { particles, mesh } = entry;
        mesh.count = particles.count;

        for (let i = 0; i < particles.count; i++) {
            this.translation.makeTranslation(particles.x[i], particles.y[i], particles.z[i]);
            this.scale.makeScale(particles.size[i], particles.size[i], particles.size[i]);
            this.scratch.makeRotationFromQuaternion(camera.quaternion);
            this.scratch.premultiply(this.translation).multiply(this.scale);
            mesh.setMatrixAt(i, this.scratch);
            this.color.setRGB(particles.r[i], particles.g[i], particles.b[i]);
            mesh.setColorAt(i, this.color);
        }

        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }

    private ensureCapacity(entry: EmitterEntry, needed: number): void {
        const capacity = entry.mesh.instanceMatrix.count;
        if (needed <= capacity) return;

        const next = Math.max(needed, capacity * 2);
        const grown = new THREE.InstancedMesh(this.geometry, entry.material, next);
        grown.frustumCulled = false;
        grown.matrixAutoUpdate = false;
        this.scene.remove(entry.mesh);
        entry.mesh.dispose();
        entry.mesh = grown;
        this.scene.add(grown);
    }

    private retarget(entry: EmitterEntry, url: string): void {
        if (entry.material.map) {
            entry.material.map.dispose();
            entry.material.map = null;
        }
        entry.texture = url;
        entry.material.map = url === '' ? null : this.createTexture(url);
        entry.material.needsUpdate = true;
    }

    private makeMaterial(url: string): THREE.MeshBasicMaterial {
        return new THREE.MeshBasicMaterial({
            color: 0xffffff,
            map: url === '' ? null : this.createTexture(url),
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide
        });
    }

    private drop(entity: Entity, entry: EmitterEntry): void {
        this.scene.remove(entry.mesh);
        entry.mesh.dispose();
        entry.material.map?.dispose();
        entry.material.dispose();
        this.tracked.delete(entity);
    }
}
