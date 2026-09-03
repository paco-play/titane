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
        // Every primitive used to render as a box, so a sphere or a plane was
        // silently drawn with the wrong shape.
        expect(cache.geometry('box')).toBeInstanceOf(THREE.BoxGeometry);
        expect(cache.geometry('sphere')).toBeInstanceOf(THREE.SphereGeometry);
        expect(cache.geometry('plane')).toBeInstanceOf(THREE.PlaneGeometry);
    });

    it('fits every primitive inside the same unit box', () => {
        // Transform.scale must mean the same thing whatever the shape
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
        expect(cache.material('#ff0000')).toBe(cache.material('#ff0000'));
        expect(cache.material('#ff0000')).not.toBe(cache.material('#00ff00'));
    });

    it('treats color keys as case-insensitive', () => {
        expect(cache.material('#FF0000')).toBe(cache.material('#ff0000'));
    });

    it('evicts a material when its last user releases it', () => {
        const material = cache.material('#ff0000');
        let disposed = false;
        material.addEventListener('dispose', () => { disposed = true; });

        cache.releaseMaterial('#ff0000');

        expect(disposed).toBe(true);
        expect(cache.materialCount).toBe(0);
        expect(cache.material('#ff0000')).not.toBe(material);
    });

    it('keeps a shared material until the last user releases it', () => {
        const material = cache.material('#00ff00');
        cache.material('#00ff00');

        let disposed = false;
        material.addEventListener('dispose', () => { disposed = true; });

        cache.releaseMaterial('#00ff00');
        expect(disposed).toBe(false);
        expect(cache.materialCount).toBe(1);

        cache.releaseMaterial('#00ff00');
        expect(disposed).toBe(true);
        expect(cache.materialCount).toBe(0);
    });

    it('does not grow while unique colors are acquired and released in sequence', () => {
        for (let i = 0; i < 256; i++) {
            const color = `#${i.toString(16).padStart(6, '0')}`;
            cache.material(color);
            cache.releaseMaterial(color);
        }

        expect(cache.materialCount).toBe(0);
    });

    it('applies the requested color to the material', () => {
        const material = cache.material('#4ade80');
        expect(material.color.getHexString()).toBe('4ade80');
    });

    it('releases every pooled resource on dispose', () => {
        const geometry = cache.geometry('sphere');
        const material = cache.material('#123456');

        let disposedGeometry = false;
        let disposedMaterial = false;
        geometry.addEventListener('dispose', () => { disposedGeometry = true; });
        material.addEventListener('dispose', () => { disposedMaterial = true; });

        cache.dispose();

        expect(disposedGeometry).toBe(true);
        expect(disposedMaterial).toBe(true);

        // A cache reused after disposal must rebuild rather than hand back
        // resources whose GPU buffers are already gone
        expect(cache.geometry('sphere')).not.toBe(geometry);
    });
});
