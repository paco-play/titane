import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
    Camera,
    Transform,
    addComponent,
    createCamera,
    createEntity,
    createTransform,
    createWorld,
    getComponent,
    transformSystem
} from '@titane/core';
import { CameraOverlay, entityOfCameraGlyph } from '../camera-overlay';

describe('CameraOverlay', () => {
    it('maps glyph userData back to the camera entity', () => {
        expect(entityOfCameraGlyph({ userData: { titaneEntity: 7 } })).toBe(7);
        expect(entityOfCameraGlyph({ userData: {} })).toBeUndefined();
    });

    it('spawns one glyph per Camera and follows world pose', () => {
        const scene = new THREE.Scene();
        const overlay = new CameraOverlay(scene);
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform({ x: 2, y: 3, z: 4 }));
        addComponent(world, entity, Camera, createCamera());
        transformSystem(world);

        overlay.sync(world, {
            visible: true,
            worldMatrixOf: id => getComponent(world, id, Transform)?.worldMatrix ?? null
        });

        const pickables = overlay.pickables();
        expect(pickables).toHaveLength(1);
        expect(entityOfCameraGlyph(pickables[0])).toBe(entity);
        expect(pickables[0].position.toArray()).toEqual([2, 3, 4]);

        overlay.sync(world, {
            visible: false,
            worldMatrixOf: () => null
        });
        expect(overlay.pickables()).toHaveLength(0);

        overlay.dispose();
    });
});
