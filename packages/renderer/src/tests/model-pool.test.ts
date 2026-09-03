import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import {
    createWorld,
    createEntity,
    addComponent,
    updateComponent,
    destroyEntity,
    createGltf,
    createTransform,
    Gltf,
    Transform
} from '@titane/core';
import { ModelPool } from '../model-pool';

const makeTemplate = (): THREE.Group => {
    const root = new THREE.Group();
    root.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial()));
    return root;
};

describe('ModelPool', () => {
    let scene: THREE.Scene;
    let pool: ModelPool;

    beforeEach(() => {
        scene = new THREE.Scene();
        pool = new ModelPool(scene, async () => makeTemplate());
    });

    it('adds a clone to the scene when a URL is set', async () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform());
        addComponent(world, entity, Gltf, createGltf('model.glb'));

        pool.sync(world);
        await pool.ready;

        expect(pool.rootCount).toBe(1);
        expect(pool.templateCount).toBe(1);
        expect(scene.children).toHaveLength(1);
    });

    it('shares one template across entities with the same URL', async () => {
        const world = createWorld();
        const a = createEntity(world);
        const b = createEntity(world);
        addComponent(world, a, Transform, createTransform());
        addComponent(world, b, Transform, createTransform());
        addComponent(world, a, Gltf, createGltf('shared.glb'));
        addComponent(world, b, Gltf, createGltf('shared.glb'));

        pool.sync(world);
        await pool.ready;

        expect(pool.rootCount).toBe(2);
        expect(pool.templateCount).toBe(1);
    });

    it('drops the clone when the entity is destroyed', async () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform());
        addComponent(world, entity, Gltf, createGltf('gone.glb'));

        pool.sync(world);
        await pool.ready;
        expect(pool.rootCount).toBe(1);

        destroyEntity(world, entity);
        pool.sync(world);

        expect(pool.rootCount).toBe(0);
        expect(pool.templateCount).toBe(0);
        expect(scene.children).toHaveLength(0);
    });

    it('reloads when the URL changes', async () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform());
        addComponent(world, entity, Gltf, createGltf('one.glb'));

        pool.sync(world);
        await pool.ready;
        const first = scene.children[0];

        updateComponent(world, entity, Gltf, data => {
            data.url = 'two.glb';
        });
        pool.sync(world);
        await pool.ready;

        expect(pool.rootCount).toBe(1);
        expect(scene.children[0]).not.toBe(first);
        expect(scene.children).toHaveLength(1);
    });

    it('applies the entity world matrix to the root', async () => {
        const world = createWorld();
        const entity = createEntity(world);
        const transform = createTransform({ x: 4, y: 2, z: 0 });
        transform.worldMatrix[12] = 4;
        transform.worldMatrix[13] = 2;
        addComponent(world, entity, Transform, transform);
        addComponent(world, entity, Gltf, createGltf('posed.glb'));

        pool.sync(world);
        await pool.ready;
        pool.sync(world);

        const root = scene.children[0];
        expect(root.matrix.elements[12]).toBe(4);
        expect(root.matrix.elements[13]).toBe(2);
    });

    it('tags the root so picking can walk back to the entity', async () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform());
        addComponent(world, entity, Gltf, createGltf('pick.glb'));

        pool.sync(world);
        await pool.ready;

        const root = pool.pickables()[0];
        expect(pool.entityOf(root)).toBe(entity);
    });

    it('draws nothing while the URL is empty', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform());
        addComponent(world, entity, Gltf, createGltf());

        pool.sync(world);

        expect(pool.rootCount).toBe(0);
        expect(pool.templateCount).toBe(0);
    });
});
