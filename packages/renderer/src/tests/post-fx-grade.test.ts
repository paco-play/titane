import { describe, expect, it } from 'vitest';
import { createPostFx } from '@titane/core';
import { applyPostFxGrade } from '../post-fx-grade';

describe('applyPostFxGrade', () => {
    it('writes exposure, contrast, saturation, tint and vignette', () => {
        const uniforms = {
            exposure: { value: 1 },
            contrast: { value: 1 },
            saturation: { value: 1 },
            tint: { value: { x: 1, y: 1, z: 1 } },
            vignette: { value: 0 }
        };

        applyPostFxGrade(uniforms, createPostFx(0, 1.5, 1.2, 0.5, '#ff0000', 0.4));

        expect(uniforms.exposure.value).toBe(1.5);
        expect(uniforms.contrast.value).toBe(1.2);
        expect(uniforms.saturation.value).toBe(0.5);
        expect(uniforms.tint.value).toEqual({ x: 1, y: 0, z: 0 });
        expect(uniforms.vignette.value).toBe(0.4);
    });
});
