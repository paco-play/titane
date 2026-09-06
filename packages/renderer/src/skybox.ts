import * as THREE from 'three';
import type { World } from '@titane/core';
import {
    DEFAULT_SKYBOX_COLOR,
    DEFAULT_SKYBOX_CUBEMAP,
    Skybox,
    getComponent,
    pickSkybox
} from '@titane/core';
import { createSkyGradientTexture } from './sky-gradient';

/** Builds the GPU texture for a sky URL. Injected so tests can skip network I/O. */
export type SkyTextureFactory = (url: string, onError?: () => void) => THREE.Texture;

const RASTER_SKY = /\.(png|jpe?g|webp|gif|hdr)$/i;
const CUBE_FACES = ['px', 'nx', 'py', 'ny', 'pz', 'nz'] as const;

const loadEquirect = (url: string, onError?: () => void): THREE.Texture => {
    const texture = new THREE.TextureLoader().load(url, undefined, undefined, onError);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
};

const loadCube = (directory: string, onError?: () => void): THREE.CubeTexture => {
    const base = directory.replace(/\/+$/, '');
    const texture = new THREE.CubeTextureLoader().load(
        CUBE_FACES.map(face => `${base}/${face}.png`),
        undefined,
        undefined,
        onError
    );
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
};

const loadSky = (url: string, onError?: () => void): THREE.Texture =>
    RASTER_SKY.test(url) ? loadEquirect(url, onError) : loadCube(url, onError);

/**
 * Writes the authored `Skybox` onto `scene.background`.
 * No component → engine cubemap. Empty `cubemap` (or a failed load) → tinted gradient.
 */
export class SkyboxApplier {
    private readonly color = new THREE.Color(DEFAULT_SKYBOX_COLOR);
    private url = '';
    private failedUrl = '';
    private cubemap: THREE.Texture | undefined;
    private gradientKey = '';
    private gradient: THREE.Texture | undefined;

    constructor(private readonly createTexture: SkyTextureFactory = loadSky) {}

    /**
     * Syncs the Three.js scene background with the ECS skybox, if any.
     */
    public apply(world: World, scene: THREE.Scene): void {
        const entity = pickSkybox(world);
        const sky = entity !== null ? getComponent(world, entity, Skybox) : undefined;
        const cubemapUrl = sky ? sky.cubemap : DEFAULT_SKYBOX_CUBEMAP;
        const tint = sky?.color ?? DEFAULT_SKYBOX_COLOR;
        if (!cubemapUrl) this.failedUrl = '';

        if (cubemapUrl && this.failedUrl !== cubemapUrl) {
            this.releaseGradient();
            this.applyCubemap(scene, cubemapUrl);
            if (this.failedUrl !== cubemapUrl) return;
        }

        this.releaseCubemap();
        this.applyTintedSky(scene, tint);
    }

    public dispose(): void {
        this.releaseCubemap();
        this.releaseGradient();
    }

    private applyCubemap(scene: THREE.Scene, cubemapUrl: string): void {
        if (this.url !== cubemapUrl) {
            this.releaseCubemap();
            this.url = cubemapUrl;
            this.cubemap = this.createTexture(cubemapUrl, () => {
                this.failedUrl = cubemapUrl;
                this.releaseCubemap();
            });
            if (this.failedUrl === cubemapUrl || !this.cubemap) return;
            this.cubemap.colorSpace = THREE.SRGBColorSpace;
            if (!(this.cubemap instanceof THREE.CubeTexture)) {
                this.cubemap.mapping = THREE.EquirectangularReflectionMapping;
            }
        }
        if (this.failedUrl === cubemapUrl) return;
        scene.background = this.cubemap ?? this.color;
    }

    private applyTintedSky(scene: THREE.Scene, tint: string): void {
        if (this.gradientKey !== tint) {
            this.releaseGradient();
            this.gradientKey = tint;
            this.gradient = createSkyGradientTexture(tint) ?? undefined;
        }
        if (this.gradient) {
            scene.background = this.gradient;
            return;
        }
        this.color.set(tint);
        scene.background = this.color;
    }

    private releaseCubemap(): void {
        this.cubemap?.dispose();
        this.cubemap = undefined;
        this.url = '';
    }

    private releaseGradient(): void {
        this.gradient?.dispose();
        this.gradient = undefined;
        this.gradientKey = '';
    }
}
