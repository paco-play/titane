import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
    addComponent,
    createEntity,
    createTransform,
    createWorld,
    destroyEntity,
    Transform,
    Vfx
} from '@titane/core';
import { VfxPool } from '../vfx-pool';

const emit = (
    pool: VfxPool,
    world: ReturnType<typeof createWorld>,
    camera: THREE.Camera,
    frames: number,
    dt = 1 / 60
): void => {
    for (let i = 0; i < frames; i++) pool.sync(world, camera, dt);
};

describe('VfxPool', () => {
    it('keeps one mesh per emitter rather than one entity per particle', () => {
        const scene = new THREE.Scene();
        const pool = new VfxPool(scene, () => new THREE.Texture());
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform());
        addComponent(world, entity, Vfx, {
            ...Vfx.create(),
            mode: 'burst',
            rate: 20,
            lifetime: 2
        });

        const camera = new THREE.PerspectiveCamera();
        pool.sync(world, camera, 1 / 60);

        expect(pool.emitterCount).toBe(1);
        expect(pool.particleCount).toBe(20);
        expect(scene.children.filter(child => child instanceof THREE.InstancedMesh)).toHaveLength(1);
    });

    it('emits over time in loop mode', () => {
        const scene = new THREE.Scene();
        const pool = new VfxPool(scene);
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform());
        addComponent(world, entity, Vfx, { ...Vfx.create(), mode: 'loop', rate: 60, lifetime: 2 });

        const camera = new THREE.PerspectiveCamera();
        emit(pool, world, camera, 30);

        expect(pool.particleCount).toBeGreaterThan(10);
        expect(pool.emitterCount).toBe(1);
    });

    it('drops the mesh when the emitter entity is destroyed', () => {
        const scene = new THREE.Scene();
        const pool = new VfxPool(scene);
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform());
        addComponent(world, entity, Vfx, Vfx.create());

        const camera = new THREE.PerspectiveCamera();
        pool.sync(world, camera, 1 / 60);
        destroyEntity(world, entity);
        pool.sync(world, camera, 1 / 60);

        expect(pool.emitterCount).toBe(0);
        expect(pool.particleCount).toBe(0);
        expect(scene.children.filter(child => child instanceof THREE.InstancedMesh)).toHaveLength(0);
    });
});
