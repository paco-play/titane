import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { createMesh, type MeshData, type PrimitiveType } from '@titane/core';
import { InstancePool } from '../instance-pool';
import { ResourceCache } from '../resource-cache';
import { entityFromHits } from '../picking';

const meshOf = (
    primitive: PrimitiveType,
    color: string,
    albedo = ''
): MeshData => createMesh(primitive, color, albedo);

describe('InstancePool', () => {
    let scene: THREE.Scene;
    let cache: ResourceCache;
    let pool: InstancePool;

    beforeEach(() => {
        scene = new THREE.Scene();
        cache = new ResourceCache();
        pool = new InstancePool(scene, cache);
    });

    it('batches entities that share a primitive and color', () => {
        const identity = new THREE.Matrix4();
        pool.sync(1, meshOf('box', '#ff0000'), identity.elements);
        pool.sync(2, meshOf('box', '#ff0000'), identity.elements);
        pool.sync(3, meshOf('box', '#00ff00'), identity.elements);

        expect(pool.batchCount).toBe(2);
    });

    it('moves an entity when its color changes', () => {
        const identity = new THREE.Matrix4();
        pool.sync(1, meshOf('box', '#ff0000'), identity.elements);
        pool.sync(1, meshOf('box', '#00ff00'), identity.elements);

        expect(pool.batchCount).toBe(1);
        expect(cache.materialCount).toBe(1);
    });

    it('drops an empty batch and releases its material', () => {
        const identity = new THREE.Matrix4();
        pool.sync(1, meshOf('sphere', '#abcdef'), identity.elements);
        expect(cache.materialCount).toBe(1);

        pool.remove(1);
        expect(pool.batchCount).toBe(0);
        expect(cache.materialCount).toBe(0);
    });

    it('splits batches when albedo URLs differ', () => {
        const textured = new ResourceCache(() => new THREE.Texture());
        const texturedPool = new InstancePool(scene, textured);
        const identity = new THREE.Matrix4();
        texturedPool.sync(1, meshOf('box', '#ff0000', 'a.png'), identity.elements);
        texturedPool.sync(2, meshOf('box', '#ff0000', 'b.png'), identity.elements);
        texturedPool.sync(3, meshOf('box', '#ff0000', 'a.png'), identity.elements);

        expect(texturedPool.batchCount).toBe(2);
    });

    it('splits batches when roughness differs', () => {
        const identity = new THREE.Matrix4();
        const matte = createMesh('box', '#ffffff', '', 1, 0);
        const glossy = createMesh('box', '#ffffff', '', 0, 0);
        pool.sync(1, matte, identity.elements);
        pool.sync(2, glossy, identity.elements);

        expect(pool.batchCount).toBe(2);
    });

    it('splits batches when castShadow differs', () => {
        const identity = new THREE.Matrix4();
        const caster = createMesh('box', '#ffffff');
        const silent = createMesh('box', '#ffffff', '', 1, 0, '#000000', false, true);
        pool.sync(1, caster, identity.elements);
        pool.sync(2, silent, identity.elements);

        expect(pool.batchCount).toBe(2);
        expect(pool.pickables()[0].castShadow).not.toBe(pool.pickables()[1].castShadow);
    });

    it('releases an albedo material when its batch empties', () => {
        const textured = new ResourceCache(() => new THREE.Texture());
        const texturedPool = new InstancePool(scene, textured);
        const identity = new THREE.Matrix4();

        texturedPool.sync(1, meshOf('box', '#ffffff', 'floor.png'), identity.elements);
        expect(textured.materialCount).toBe(1);
        expect(textured.textureCount).toBe(1);

        texturedPool.remove(1);
        expect(textured.materialCount).toBe(0);
        expect(textured.textureCount).toBe(0);
    });

    it('maps an instance slot back to its entity', () => {
        const identity = new THREE.Matrix4();
        pool.sync(7, meshOf('plane', '#ffffff'), identity.elements);
        const mesh = pool.pickables()[0];

        expect(pool.entityOf(mesh, 0)).toBe(7);
        expect(entityFromHits([{ object: mesh, instanceId: 0 }], (object, instanceId) =>
            pool.entityOf(object, instanceId)
        )).toBe(7);
    });
});
