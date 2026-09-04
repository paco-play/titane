import * as THREE from 'three';
import type { LightData } from '@titane/core';

type ShadowLight = THREE.DirectionalLight | THREE.PointLight | THREE.AmbientLight;

const DIRECTIONAL_SHADOW_EXTENT = 25;
const DIRECTIONAL_SHADOW_FAR = 80;
const DEFAULT_POINT_SHADOW_FAR = 50;

/**
 * Enables or disables shadow maps on a light. Ambient lights never cast.
 * Frustum size is a fixed default — no Inspector for the shadow camera yet.
 */
export const applyShadowCasting = (light: ShadowLight, data: LightData): void => {
    if (light instanceof THREE.AmbientLight) {
        light.castShadow = false;
        return;
    }

    light.castShadow = data.castShadow;
    if (!data.castShadow) return;

    if (light instanceof THREE.DirectionalLight) {
        light.shadow.mapSize.set(1024, 1024);
        light.shadow.bias = -0.0005;
        const cam = light.shadow.camera;
        cam.near = 0.5;
        cam.far = DIRECTIONAL_SHADOW_FAR;
        cam.left = -DIRECTIONAL_SHADOW_EXTENT;
        cam.right = DIRECTIONAL_SHADOW_EXTENT;
        cam.top = DIRECTIONAL_SHADOW_EXTENT;
        cam.bottom = -DIRECTIONAL_SHADOW_EXTENT;
        cam.updateProjectionMatrix();
        return;
    }

    light.shadow.mapSize.set(512, 512);
    light.shadow.bias = -0.001;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = data.distance > 0 ? data.distance : DEFAULT_POINT_SHADOW_FAR;
    light.shadow.camera.updateProjectionMatrix();
};
