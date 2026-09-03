import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { InstancePool } from '../instance-pool';
import { ResourceCache } from '../resource-cache';
import { entityFromHits } from '../picking';

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
        pool.sync(1, 'box', '#ff0000', identity.elements);
        pool.sync(2, 'box', '#ff0000', identity.elements);
        pool.sync(3, 'box', '#00ff00', identity.elements);

        expect(pool.batchCount).toBe(2);
    });

    it('moves an entity when its color changes', () => {
        const identity = new THREE.Matrix4();
        pool.sync(1, 'box', '#ff0000', identity.elements);
        pool.sync(1, 'box', '#00ff00', identity.elements);

        expect(pool.batchCount).toBe(1);
        expect(cache.materialCount).toBe(1);
    });

    it('drops an empty batch and releases its material', () => {
        const identity = new THREE.Matrix4();
        pool.sync(1, 'sphere', '#abcdef', identity.elements);
        expect(cache.materialCount).toBe(1);

        pool.remove(1);
        expect(pool.batchCount).toBe(0);
        expect(cache.materialCount).toBe(0);
    });

    it('splits batches when albedo URLs differ', () => {
        const textured = new ResourceCache(() => new THREE.Texture());
        const texturedPool = new InstancePool(scene, textured);
        const identity = new THREE.Matrix4();
        texturedPool.sync(1, 'box', '#ff0000', identity.elements, 'a.png');
        texturedPool.sync(2, 'box', '#ff0000', identity.elements, 'b.png');
        texturedPool.sync(3, 'box', '#ff0000', identity.elements, 'a.png');

        expect(texturedPool.batchCount).toBe(2);
    });

    it('releases an albedo material when its batch empties', () => {
        const textured = new ResourceCache(() => new THREE.Texture());
        const texturedPool = new InstancePool(scene, textured);
        const identity = new THREE.Matrix4();

        texturedPool.sync(1, 'box', '#ffffff', identity.elements, 'floor.png');
        expect(textured.materialCount).toBe(1);
        expect(textured.textureCount).toBe(1);

        texturedPool.remove(1);
        expect(textured.materialCount).toBe(0);
        expect(textured.textureCount).toBe(0);
    });

    it('maps an instance slot back to its entity', () => {
        const identity = new THREE.Matrix4();
        pool.sync(7, 'plane', '#ffffff', identity.elements);
        const mesh = pool.pickables()[0];

        expect(pool.entityOf(mesh, 0)).toBe(7);
        expect(entityFromHits([{ object: mesh, instanceId: 0 }], (object, instanceId) =>
            pool.entityOf(object, instanceId)
        )).toBe(7);
    });
});
