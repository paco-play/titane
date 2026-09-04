import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
    addComponent,
    Camera,
    createCamera,
    createEntity,
    createTransform,
    createWorld,
    setParent,
    Transform,
    transformSystem
} from '@titane/core';
import { applySceneCamera } from '../scene-camera';
import { captureEditorCamera, restoreEditorCamera } from '../editor-camera';

describe('applySceneCamera', () => {
    it('does nothing when no camera is current', () => {
        const world = createWorld();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        camera.position.set(9, 9, 9);

        expect(applySceneCamera(world, camera)).toBe(false);
        expect(camera.position.x).toBe(9);
    });

    it('writes world pose and projection from the current camera', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform({ x: 0, y: 2, z: 6 }));
        addComponent(world, entity, Camera, createCamera(60, 0.2, 200));
        transformSystem(world);

        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        expect(applySceneCamera(world, camera)).toBe(true);
        expect(camera.position.y).toBeCloseTo(2);
        expect(camera.position.z).toBeCloseTo(6);
        expect(camera.fov).toBe(60);
        expect(camera.near).toBe(0.2);
        expect(camera.far).toBe(200);
    });

    it('uses the parented world pose, not local TRS', () => {
        const world = createWorld();
        const parent = createEntity(world);
        const child = createEntity(world);
        addComponent(world, parent, Transform, createTransform({ x: 10, y: 0, z: 0 }));
        addComponent(world, child, Transform, createTransform({ x: 0, y: 2, z: 6 }));
        addComponent(world, child, Camera, createCamera());
        setParent(world, child, parent);
        transformSystem(world);

        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        expect(applySceneCamera(world, camera)).toBe(true);
        expect(camera.position.x).toBeCloseTo(10);
        expect(camera.position.y).toBeCloseTo(2);
        expect(camera.position.z).toBeCloseTo(6);
    });
});

describe('editor camera snapshot', () => {
    it('round-trips position, quaternion, projection and orbit target', () => {
        const camera = new THREE.PerspectiveCamera(50, 1, 0.5, 250);
        camera.position.set(1, 2, 3);
        camera.quaternion.set(0, 0.1, 0, 0.995);
        const target = new THREE.Vector3(4, 5, 6);

        const pose = captureEditorCamera(camera, target);
        camera.position.set(0, 0, 0);
        camera.fov = 75;
        target.set(0, 0, 0);
        restoreEditorCamera(camera, target, pose);

        expect(camera.position.x).toBeCloseTo(1);
        expect(camera.fov).toBe(50);
        expect(camera.near).toBe(0.5);
        expect(target.y).toBeCloseTo(5);
    });
});
