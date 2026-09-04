import {
    DEFAULT_EMISSIVE,
    DEFAULT_METALNESS,
    DEFAULT_ROUGHNESS
} from '@titane/core';

/**
 * Fields that decide whether two meshes can share a GPU material.
 */
export interface MaterialSpec {
    color: string;
    albedo?: string;
    roughness?: number;
    metalness?: number;
    emissive?: string;
}

/** MaterialSpec with every optional field filled. */
export interface NormalizedMaterialSpec {
    color: string;
    albedo: string;
    roughness: number;
    metalness: number;
    emissive: string;
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * Canonical material identity. Missing fields match Three.js defaults
 * so older callers that only pass a color stay visually unchanged.
 */
export const normalizeMaterialSpec = (spec: MaterialSpec): NormalizedMaterialSpec => ({
    color: spec.color.toLowerCase(),
    albedo: spec.albedo ?? '',
    roughness: clamp01(spec.roughness ?? DEFAULT_ROUGHNESS),
    metalness: clamp01(spec.metalness ?? DEFAULT_METALNESS),
    emissive: (spec.emissive ?? DEFAULT_EMISSIVE).toLowerCase()
});

/**
 * Cache key for a normalized spec. Newlines cannot appear in a CSS color,
 * so the tuple cannot collide.
 */
export const materialKey = (spec: NormalizedMaterialSpec): string =>
    `${spec.color}\n${spec.albedo}\n${spec.roughness}\n${spec.metalness}\n${spec.emissive}`;
