import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createLight } from '@titane/core';
import { applyShadowCasting } from '../light-shadow';

describe('applyShadowCasting', () => {
    it('enables a shadow map on a directional light', () => {
        const light = new THREE.DirectionalLight();
        applyShadowCasting(light, createLight('directional', '#ffffff', 1, 0, true));

        expect(light.castShadow).toBe(true);
        expect(light.shadow.mapSize.x).toBe(1024);
    });

    it('never lets an ambient light cast', () => {
        const light = new THREE.AmbientLight();
        applyShadowCasting(light, createLight('ambient', '#ffffff', 1, 0, true));

        expect(light.castShadow).toBe(false);
    });

    it('turns shadows off when the flag drops', () => {
        const light = new THREE.DirectionalLight();
        applyShadowCasting(light, createLight('directional', '#ffffff', 1, 0, true));
        applyShadowCasting(light, createLight('directional', '#ffffff', 1, 0, false));

        expect(light.castShadow).toBe(false);
    });

    it('keeps the point shadow far in sync with distance', () => {
        const light = new THREE.PointLight();
        applyShadowCasting(light, createLight('point', '#ffffff', 1, 10, true));
        expect(light.shadow.camera.far).toBe(10);

        applyShadowCasting(light, createLight('point', '#ffffff', 1, 40, true));
        expect(light.shadow.camera.far).toBe(40);
    });
});
