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
import type { GltfAsset } from '../gltf-asset';

const makeTemplate = (): THREE.Group => {
    const root = new THREE.Group();
    root.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial()));
    return root;
};

const makeAsset = (animations: THREE.AnimationClip[] = []): GltfAsset => ({
    scene: makeTemplate(),
    animations
});

const makeWalkAsset = (): GltfAsset => {
    const scene = new THREE.Group();
    const bone = new THREE.Group();
    bone.name = 'Bone';
    scene.add(bone);
    const clip = new THREE.AnimationClip('Walk', 1, [
        new THREE.VectorKeyframeTrack('Bone.position', [0, 1], [0, 0, 0, 4, 0, 0])
    ]);
    return { scene, animations: [clip] };
};

const boneX = (root: THREE.Object3D): number => {
    const bone = root.getObjectByName('Bone');
    return bone?.position.x ?? NaN;
};

describe('ModelPool', () => {
    let scene: THREE.Scene;
    let pool: ModelPool;

    beforeEach(() => {
        scene = new THREE.Scene();
        pool = new ModelPool(scene, async () => makeAsset());
    });

    it('adds a clone to the scene when a URL is set', async () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform());
        addComponent(world, entity, Gltf, createGltf('model.glb'));

        pool.sync(world, 0);
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

        pool.sync(world, 0);
        await pool.ready;

        expect(pool.rootCount).toBe(2);
        expect(pool.templateCount).toBe(1);
    });

    it('drops the clone when the entity is destroyed', async () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform());
        addComponent(world, entity, Gltf, createGltf('gone.glb'));

        pool.sync(world, 0);
        await pool.ready;
        expect(pool.rootCount).toBe(1);

        destroyEntity(world, entity);
        pool.sync(world, 0);

        expect(pool.rootCount).toBe(0);
        expect(pool.templateCount).toBe(0);
        expect(scene.children).toHaveLength(0);
    });

    it('reloads when the URL changes', async () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform());
        addComponent(world, entity, Gltf, createGltf('one.glb'));

        pool.sync(world, 0);
        await pool.ready;
        const first = scene.children[0];

        updateComponent(world, entity, Gltf, data => {
            data.url = 'two.glb';
        });
        pool.sync(world, 0);
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

        pool.sync(world, 0);
        await pool.ready;
        pool.sync(world, 0);

        const root = scene.children[0];
        expect(root.matrix.elements[12]).toBe(4);
        expect(root.matrix.elements[13]).toBe(2);
    });

    it('tags the root so picking can walk back to the entity', async () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform());
        addComponent(world, entity, Gltf, createGltf('pick.glb'));

        pool.sync(world, 0);
        await pool.ready;

        const root = pool.pickables()[0];
        expect(pool.entityOf(root)).toBe(entity);
    });

    it('draws nothing while the URL is empty', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform());
        addComponent(world, entity, Gltf, createGltf());

        pool.sync(world, 0);

        expect(pool.rootCount).toBe(0);
        expect(pool.templateCount).toBe(0);
    });
});

describe('ModelPool animation', () => {
    let scene: THREE.Scene;
    let pool: ModelPool;

    beforeEach(() => {
        scene = new THREE.Scene();
        pool = new ModelPool(scene, async () => makeWalkAsset());
    });

    it('advances a named clip while playing', async () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform());
        addComponent(world, entity, Gltf, createGltf('hero.glb', 'Walk', true, true));

        pool.sync(world, 0);
        await pool.ready;
        pool.sync(world, 0.5);

        expect(boneX(scene.children[0])).toBeCloseTo(2, 5);
    });

    it('does not advance while playing is false', async () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform());
        addComponent(world, entity, Gltf, createGltf('hero.glb', 'Walk', false, true));

        pool.sync(world, 0);
        await pool.ready;
        pool.sync(world, 0.5);

        expect(boneX(scene.children[0])).toBe(0);
    });

    it('ignores an unknown clip name without throwing', async () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform());
        addComponent(world, entity, Gltf, createGltf('hero.glb', 'Missing', true, true));

        pool.sync(world, 0);
        await pool.ready;
        expect(() => pool.sync(world, 0.5)).not.toThrow();
        expect(boneX(scene.children[0])).toBe(0);
    });

    it('restarts from the start on a playing rising edge', async () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform());
        addComponent(world, entity, Gltf, createGltf('hero.glb', 'Walk', true, true));

        pool.sync(world, 0);
        await pool.ready;
        pool.sync(world, 0.5);
        expect(boneX(scene.children[0])).toBeCloseTo(2, 5);

        updateComponent(world, entity, Gltf, data => {
            data.playing = false;
        });
        pool.sync(world, 0);

        updateComponent(world, entity, Gltf, data => {
            data.playing = true;
        });
        pool.sync(world, 0.25);

        expect(boneX(scene.children[0])).toBeCloseTo(1, 5);
    });
});
