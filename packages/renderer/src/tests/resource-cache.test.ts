import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { PRIMITIVE_TYPES } from '@titane/core';
import { ResourceCache } from '../resource-cache';

describe('ResourceCache', () => {
    let cache: ResourceCache;

    beforeEach(() => {
        cache = new ResourceCache();
    });

    it('builds the geometry matching each primitive type', () => {
        expect(cache.geometry('box')).toBeInstanceOf(THREE.BoxGeometry);
        expect(cache.geometry('sphere')).toBeInstanceOf(THREE.SphereGeometry);
        expect(cache.geometry('plane')).toBeInstanceOf(THREE.PlaneGeometry);
    });

    it('fits every primitive inside the same unit box', () => {
        for (const primitive of PRIMITIVE_TYPES) {
            const geometry = cache.geometry(primitive);
            geometry.computeBoundingBox();

            const size = new THREE.Vector3();
            geometry.boundingBox?.getSize(size);

            expect(size.x).toBeCloseTo(1, 5);
            expect(size.y).toBeCloseTo(1, 5);
        }
    });

    it('shares one geometry instance per primitive', () => {
        expect(cache.geometry('box')).toBe(cache.geometry('box'));
        expect(cache.geometry('box')).not.toBe(cache.geometry('sphere'));
    });

    it('shares one material instance per color', () => {
        expect(cache.material({ color: '#ff0000' })).toBe(cache.material({ color: '#ff0000' }));
        expect(cache.material({ color: '#ff0000' })).not.toBe(cache.material({ color: '#00ff00' }));
    });

    it('treats color keys as case-insensitive', () => {
        expect(cache.material({ color: '#FF0000' })).toBe(cache.material({ color: '#ff0000' }));
    });

    it('evicts a material when its last user releases it', () => {
        const material = cache.material({ color: '#ff0000' });
        let disposed = false;
        material.addEventListener('dispose', () => { disposed = true; });

        cache.releaseMaterial({ color: '#ff0000' });

        expect(disposed).toBe(true);
        expect(cache.materialCount).toBe(0);
        expect(cache.material({ color: '#ff0000' })).not.toBe(material);
    });

    it('keeps a shared material until the last user releases it', () => {
        const material = cache.material({ color: '#00ff00' });
        cache.material({ color: '#00ff00' });

        let disposed = false;
        material.addEventListener('dispose', () => { disposed = true; });

        cache.releaseMaterial({ color: '#00ff00' });
        expect(disposed).toBe(false);
        expect(cache.materialCount).toBe(1);

        cache.releaseMaterial({ color: '#00ff00' });
        expect(disposed).toBe(true);
        expect(cache.materialCount).toBe(0);
    });

    it('does not grow while unique colors are acquired and released in sequence', () => {
        for (let i = 0; i < 256; i++) {
            const color = `#${i.toString(16).padStart(6, '0')}`;
            cache.material({ color });
            cache.releaseMaterial({ color });
        }

        expect(cache.materialCount).toBe(0);
    });

    it('applies the requested color to the material', () => {
        const material = cache.material({ color: '#4ade80' });
        expect(material.color.getHexString()).toBe('4ade80');
    });

    it('applies roughness, metalness and emissive', () => {
        const material = cache.material({
            color: '#ffffff',
            roughness: 0.2,
            metalness: 0.8,
            emissive: '#112233'
        });

        expect(material.roughness).toBe(0.2);
        expect(material.metalness).toBe(0.8);
        expect(material.emissive.getHexString()).toBe('112233');
    });

    it('treats the same color with different roughness as distinct materials', () => {
        const matte = cache.material({ color: '#ffffff', roughness: 1 });
        const glossy = cache.material({ color: '#ffffff', roughness: 0 });

        expect(matte).not.toBe(glossy);
        expect(cache.materialCount).toBe(2);
    });

    it('treats the same color with different albedo as distinct materials', () => {
        const cacheWithTextures = new ResourceCache(() => new THREE.Texture());
        const plain = cacheWithTextures.material({ color: '#ff0000' });
        const mapped = cacheWithTextures.material({
            color: '#ff0000',
            albedo: 'https://example.com/a.png'
        });

        expect(plain).not.toBe(mapped);
        expect(plain.map).toBeNull();
        expect(mapped.map).toBeInstanceOf(THREE.Texture);
        expect(cacheWithTextures.materialCount).toBe(2);
        expect(cacheWithTextures.textureCount).toBe(1);
    });

    it('shares one texture across materials that use the same albedo URL', () => {
        const cacheWithTextures = new ResourceCache(() => new THREE.Texture());
        const red = cacheWithTextures.material({ color: '#ff0000', albedo: 'tex.png' });
        const blue = cacheWithTextures.material({ color: '#0000ff', albedo: 'tex.png' });

        expect(red.map).toBe(blue.map);
        expect(cacheWithTextures.textureCount).toBe(1);
    });

    it('disposes a texture when its last material is released', () => {
        const cacheWithTextures = new ResourceCache(() => new THREE.Texture());
        const first = cacheWithTextures.material({ color: '#ffffff', albedo: 'wall.png' });
        cacheWithTextures.material({ color: '#cccccc', albedo: 'wall.png' });

        let disposed = false;
        first.map?.addEventListener('dispose', () => { disposed = true; });

        cacheWithTextures.releaseMaterial({ color: '#ffffff', albedo: 'wall.png' });
        expect(disposed).toBe(false);
        expect(cacheWithTextures.textureCount).toBe(1);

        cacheWithTextures.releaseMaterial({ color: '#cccccc', albedo: 'wall.png' });
        expect(disposed).toBe(true);
        expect(cacheWithTextures.textureCount).toBe(0);
    });

    it('releases every pooled resource on dispose', () => {
        const geometry = cache.geometry('sphere');
        const material = cache.material({ color: '#123456' });

        let disposedGeometry = false;
        let disposedMaterial = false;
        geometry.addEventListener('dispose', () => { disposedGeometry = true; });
        material.addEventListener('dispose', () => { disposedMaterial = true; });

        cache.dispose();

        expect(disposedGeometry).toBe(true);
        expect(disposedMaterial).toBe(true);
        expect(cache.geometry('sphere')).not.toBe(geometry);
    });
});
