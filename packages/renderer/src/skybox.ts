import * as THREE from 'three';
import type { World } from '@titane/core';
import {
    DEFAULT_SKYBOX_COLOR,
    Skybox,
    getComponent,
    pickSkybox
} from '@titane/core';

/** Builds the GPU texture for a sky URL. Injected so tests can skip network I/O. */
export type SkyTextureFactory = (url: string) => THREE.Texture;

const loadEquirect = (url: string): THREE.Texture => {
    const texture = new THREE.TextureLoader().load(url);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
};

/**
 * Writes the authored `Skybox` onto `scene.background`.
 * No component → engine default color. Empty `cubemap` → solid color.
 */
export class SkyboxApplier {
    private readonly color = new THREE.Color(DEFAULT_SKYBOX_COLOR);
    private url = '';
    private texture: THREE.Texture | undefined;

    constructor(private readonly createTexture: SkyTextureFactory = loadEquirect) {}

    /**
     * Syncs the Three.js scene background with the ECS skybox, if any.
     */
    public apply(world: World, scene: THREE.Scene): void {
        const entity = pickSkybox(world);
        const sky = entity !== null ? getComponent(world, entity, Skybox) : null;
        const cubemap = sky?.cubemap ?? '';

        if (!cubemap) {
            this.release();
            this.color.set(sky?.color ?? DEFAULT_SKYBOX_COLOR);
            scene.background = this.color;
            return;
        }

        if (this.url !== cubemap) {
            this.release();
            this.url = cubemap;
            this.texture = this.createTexture(cubemap);
            this.texture.mapping = THREE.EquirectangularReflectionMapping;
            this.texture.colorSpace = THREE.SRGBColorSpace;
        }

        scene.background = this.texture ?? this.color;
    }

    public dispose(): void {
        this.release();
    }

    private release(): void {
        this.texture?.dispose();
        this.texture = undefined;
        this.url = '';
    }
}
