import { describe, it, expect } from 'vitest';
import { createWorld } from '../../ecs/kernel/world';
import { createEntity } from '../../ecs/kernel/entity';
import { addComponent, getComponent } from '../../ecs/kernel/component';
import {
    Camera,
    createCamera,
    DEFAULT_CAMERA_FAR,
    DEFAULT_CAMERA_FOV,
    DEFAULT_CAMERA_NEAR,
    DEFAULT_CAMERA_ORTHO_SIZE
} from '../../ecs/components/camera';
import { pickCurrentCamera, setCurrentCamera } from '../../ecs/kernel/camera-utils';

describe('Camera', () => {
    it('defaults match the Three.js driver', () => {
        expect(createCamera()).toEqual({
            projection: 'perspective',
            fov: DEFAULT_CAMERA_FOV,
            orthoSize: DEFAULT_CAMERA_ORTHO_SIZE,
            near: DEFAULT_CAMERA_NEAR,
            far: DEFAULT_CAMERA_FAR,
            current: true
        });
    });

    it('clamps fov, near and orthoSize on create and revive', () => {
        expect(createCamera(0, 0, 10).fov).toBe(1);
        expect(createCamera(200, 0, 10).fov).toBe(179);
        expect(createCamera(75, -1, 10).near).toBe(0.001);
        expect(createCamera(75, 0.1, 1000, true, 'orthographic', 0).orthoSize).toBe(0.001);

        const revive = Camera.revive;
        expect(revive).toBeDefined();
        if (!revive) return;
        const revived = revive({ fov: 0, near: 0, far: 5 });
        expect(revived.fov).toBe(1);
        expect(revived.current).toBe(true);
        expect(revived.projection).toBe('perspective');
        expect(revived.orthoSize).toBe(DEFAULT_CAMERA_ORTHO_SIZE);
        expect(revive({ projection: 'orthographic', orthoSize: 8 }).projection).toBe('orthographic');
        expect(revive({ projection: 'oblique' }).projection).toBe('perspective');
    });

    it('picks the current camera and clears others', () => {
        const world = createWorld();
        const a = createEntity(world);
        const b = createEntity(world);
        addComponent(world, a, Camera, createCamera());
        addComponent(world, b, Camera, createCamera());

        setCurrentCamera(world, b);
        expect(pickCurrentCamera(world)).toBe(b);
        expect(getComponent(world, a, Camera)?.current).toBe(false);
        expect(getComponent(world, b, Camera)?.current).toBe(true);

        setCurrentCamera(world, null);
        expect(pickCurrentCamera(world)).toBeNull();
    });
});
