import type { PostFxData } from '@titane/core';
import * as THREE from 'three';
import { rgbFromHex } from './vfx-particles';

type GradeUniformMap = {
    exposure: { value: number };
    contrast: { value: number };
    saturation: { value: number };
    tint: { value: THREE.Vector3 | { x: number; y: number; z: number } };
    vignette: { value: number };
};

/**
 * Color grade + vignette. Bloom is a separate Unreal pass.
 */
export const POST_FX_GRADE_SHADER = {
    uniforms: {
        tDiffuse: { value: null },
        exposure: { value: 1 },
        contrast: { value: 1 },
        saturation: { value: 1 },
        tint: { value: new THREE.Vector3(1, 1, 1) },
        vignette: { value: 0 }
    },
    vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse;
        uniform float exposure;
        uniform float contrast;
        uniform float saturation;
        uniform vec3 tint;
        uniform float vignette;
        varying vec2 vUv;

        void main() {
            vec3 color = texture2D(tDiffuse, vUv).rgb;
            color *= exposure;
            color = (color - 0.5) * contrast + 0.5;
            float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
            color = mix(vec3(luma), color, saturation);
            color *= tint;
            float edge = distance(vUv, vec2(0.5));
            color *= 1.0 - vignette * smoothstep(0.25, 0.95, edge);
            gl_FragColor = vec4(color, 1.0);
        }
    `
};

/** Writes authored PostFx into the grade shader uniforms. */
export const applyPostFxGrade = (uniforms: GradeUniformMap, data: PostFxData): void => {
    uniforms.exposure.value = data.exposure;
    uniforms.contrast.value = data.contrast;
    uniforms.saturation.value = data.saturation;
    const rgb = rgbFromHex(data.tint);
    uniforms.tint.value.x = rgb[0];
    uniforms.tint.value.y = rgb[1];
    uniforms.tint.value.z = rgb[2];
    uniforms.vignette.value = data.vignette;
};
