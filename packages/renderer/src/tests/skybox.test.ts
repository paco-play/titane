import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
    addComponent,
    createEntity,
    createSkybox,
    createWorld,
    DEFAULT_SKYBOX_CUBEMAP,
    Skybox,
    updateComponent
} from '@titane/core';
import { SkyboxApplier } from '../skybox';
import { createSkyGradientTexture } from '../sky-gradient';

const fakeTexture = (url: string): THREE.Texture => {
    const texture = new THREE.Texture();
    texture.name = url;
    return texture;
};

describe('SkyboxApplier', () => {
    it('loads the engine cubemap when no Skybox exists', () => {
        const world = createWorld();
        const scene = new THREE.Scene();
        const applier = new SkyboxApplier(fakeTexture);

        applier.apply(world, scene);

        expect(scene.background).toBeInstanceOf(THREE.Texture);
        expect((scene.background as THREE.Texture).name).toBe(DEFAULT_SKYBOX_CUBEMAP);
        applier.dispose();
    });

    it('applies the authored color when cubemap is empty', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Skybox, createSkybox('#1e293b', ''));
        const scene = new THREE.Scene();
        const applier = new SkyboxApplier(fakeTexture);

        applier.apply(world, scene);

        expect((scene.background as THREE.Color).getHexString()).toBe('1e293b');
        applier.dispose();
    });

    it('loads the cubemap texture when the url is set', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Skybox, createSkybox('#0a0a0a', '/sky.png'));
        const scene = new THREE.Scene();
        const applier = new SkyboxApplier(fakeTexture);

        applier.apply(world, scene);

        expect(scene.background).toBeInstanceOf(THREE.Texture);
        expect((scene.background as THREE.Texture).name).toBe('/sky.png');
        expect((scene.background as THREE.Texture).mapping).toBe(
            THREE.EquirectangularReflectionMapping
        );
        applier.dispose();
    });

    it('keeps cube mapping for a cube-face folder', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Skybox, createSkybox('#0a0a0a', '/engine/sky_118_cubemap_2k'));
        const scene = new THREE.Scene();
        const applier = new SkyboxApplier((url) => {
            const texture = new THREE.CubeTexture();
            texture.name = url;
            return texture;
        });

        applier.apply(world, scene);

        expect(scene.background).toBeInstanceOf(THREE.CubeTexture);
        expect((scene.background as THREE.CubeTexture).mapping).toBe(THREE.CubeReflectionMapping);
        applier.dispose();
    });

    it('falls back to color when the cubemap is cleared', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Skybox, createSkybox('#334155', '/sky.png'));
        const scene = new THREE.Scene();
        const applier = new SkyboxApplier(fakeTexture);

        applier.apply(world, scene);
        updateComponent(world, entity, Skybox, (data) => {
            data.cubemap = '';
        });
        applier.apply(world, scene);

        expect((scene.background as THREE.Color).getHexString()).toBe('334155');
        applier.dispose();
    });

    it('falls back to the tint when the cubemap fails to load', () => {
        const world = createWorld();
        const scene = new THREE.Scene();
        const applier = new SkyboxApplier((url, onError) => {
            const texture = fakeTexture(url);
            onError?.();
            return texture;
        });

        applier.apply(world, scene);

        expect((scene.background as THREE.Color).getHexString()).toBe('6eb6e0');
        applier.dispose();
    });

    it('does not allocate a canvas sky in node', () => {
        expect(createSkyGradientTexture('#6eb6e0')).toBeNull();
    });
});
