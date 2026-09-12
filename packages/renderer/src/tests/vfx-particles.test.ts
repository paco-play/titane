import { describe, expect, it } from 'vitest';
import {
    createParticleBuffer,
    rgbFromHex,
    spawnParticle,
    stepParticles,
    VFX_PARTICLE_CAP
} from '../vfx-particles';

describe('vfx particles', () => {
    it('parses hex color into 0-1 RGB', () => {
        expect(rgbFromHex('#ff8000')).toEqual([1, 128 / 255, 0]);
    });

    it('spawns into the SoA buffer and expires after lifetime', () => {
        const buffer = createParticleBuffer(4);
        expect(spawnParticle(buffer, [0, 1, 0], [1, 0, 0], 0.2, 0.5)).toBe(true);
        expect(buffer.count).toBe(1);

        stepParticles(buffer, 0.4);
        expect(buffer.count).toBe(1);
        expect(buffer.y[0]).toBeGreaterThan(1);

        stepParticles(buffer, 0.2);
        expect(buffer.count).toBe(0);
    });

    it('refuses to spawn past the cap', () => {
        const buffer = createParticleBuffer(2);
        expect(spawnParticle(buffer, [0, 0, 0], [1, 1, 1], 0.1, 1)).toBe(true);
        expect(spawnParticle(buffer, [0, 0, 0], [1, 1, 1], 0.1, 1)).toBe(true);
        expect(spawnParticle(buffer, [0, 0, 0], [1, 1, 1], 0.1, 1)).toBe(false);
        expect(buffer.count).toBe(2);
        expect(VFX_PARTICLE_CAP).toBeGreaterThan(2);
    });
});
