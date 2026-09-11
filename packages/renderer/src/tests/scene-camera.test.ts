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
import { applyOrthographicSize, applySceneCamera } from '../scene-camera';
import { captureEditorCamera, restoreEditorCamera } from '../editor-camera';

const viewCameras = (): {
    perspective: THREE.PerspectiveCamera;
    orthographic: THREE.OrthographicCamera;
} => ({
    perspective: new THREE.PerspectiveCamera(75, 1, 0.1, 1000),
    orthographic: new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000)
});

describe('applySceneCamera', () => {
    it('does nothing when no camera is current', () => {
        const world = createWorld();
        const cameras = viewCameras();
        cameras.perspective.position.set(9, 9, 9);

        expect(applySceneCamera(world, cameras, 1)).toBeNull();
        expect(cameras.perspective.position.x).toBe(9);
    });

    it('writes world pose and projection from the current camera', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform({ x: 0, y: 2, z: 6 }));
        addComponent(world, entity, Camera, createCamera(60, 0.2, 200));
        transformSystem(world);

        const cameras = viewCameras();
        const applied = applySceneCamera(world, cameras, 1);
        expect(applied).toBe(cameras.perspective);
        expect(cameras.perspective.position.y).toBeCloseTo(2);
        expect(cameras.perspective.position.z).toBeCloseTo(6);
        expect(cameras.perspective.fov).toBe(60);
        expect(cameras.perspective.near).toBe(0.2);
        expect(cameras.perspective.far).toBe(200);
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

        const cameras = viewCameras();
        expect(applySceneCamera(world, cameras, 1)).toBe(cameras.perspective);
        expect(cameras.perspective.position.x).toBeCloseTo(10);
        expect(cameras.perspective.position.y).toBeCloseTo(2);
        expect(cameras.perspective.position.z).toBeCloseTo(6);
    });

    it('writes an orthographic frustum from orthoSize', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform({ x: 1, y: 2, z: 3 }));
        addComponent(world, entity, Camera, createCamera(75, 0.5, 250, true, 'orthographic', 8));
        transformSystem(world);

        const cameras = viewCameras();
        const applied = applySceneCamera(world, cameras, 2);
        expect(applied).toBe(cameras.orthographic);
        expect(cameras.orthographic.position.x).toBeCloseTo(1);
        expect(cameras.orthographic.near).toBe(0.5);
        expect(cameras.orthographic.far).toBe(250);
        expect(cameras.orthographic.top).toBe(8);
        expect(cameras.orthographic.bottom).toBe(-8);
        expect(cameras.orthographic.right).toBe(16);
        expect(cameras.orthographic.left).toBe(-16);
    });
});

describe('applyOrthographicSize', () => {
    it('keeps a minimum height and aspect', () => {
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
        applyOrthographicSize(camera, 0, 0);
        expect(camera.top).toBe(0.001);
        expect(camera.right).toBeCloseTo(0.001 * 0.001);
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
