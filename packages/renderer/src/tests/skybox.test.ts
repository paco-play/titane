import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
    addComponent,
    createEntity,
    createSkybox,
    createWorld,
    Skybox,
    updateComponent
} from '@titane/core';
import { SkyboxApplier } from '../skybox';

const fakeTexture = (url: string): THREE.Texture => {
    const texture = new THREE.Texture();
    texture.name = url;
    return texture;
};

describe('SkyboxApplier', () => {
    it('uses the engine default color when no Skybox exists', () => {
        const world = createWorld();
        const scene = new THREE.Scene();
        const applier = new SkyboxApplier(fakeTexture);

        applier.apply(world, scene);

        expect(scene.background).toBeInstanceOf(THREE.Color);
        expect((scene.background as THREE.Color).getHexString()).toBe('0a0a0a');
        applier.dispose();
    });

    it('applies the authored color', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Skybox, createSkybox('#1e293b'));
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
});
