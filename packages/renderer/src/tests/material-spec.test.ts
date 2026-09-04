import { describe, it, expect } from 'vitest';
import { materialKey, normalizeMaterialSpec } from '../material-spec';

describe('normalizeMaterialSpec', () => {
    it('fills Three.js defaults for omitted fields', () => {
        expect(normalizeMaterialSpec({ color: '#FF0000' })).toEqual({
            color: '#ff0000',
            albedo: '',
            roughness: 1,
            metalness: 0,
            emissive: '#000000'
        });
    });

    it('clamps roughness and metalness to [0, 1]', () => {
        expect(normalizeMaterialSpec({
            color: '#ffffff',
            roughness: 1.5,
            metalness: -0.2
        })).toMatchObject({
            roughness: 1,
            metalness: 0
        });
    });

    it('builds distinct keys when any field differs', () => {
        const base = normalizeMaterialSpec({ color: '#ffffff' });
        const rough = normalizeMaterialSpec({ color: '#ffffff', roughness: 0 });
        const metal = normalizeMaterialSpec({ color: '#ffffff', metalness: 1 });
        const glow = normalizeMaterialSpec({ color: '#ffffff', emissive: '#111111' });

        expect(materialKey(base)).not.toBe(materialKey(rough));
        expect(materialKey(base)).not.toBe(materialKey(metal));
        expect(materialKey(base)).not.toBe(materialKey(glow));
    });
});
