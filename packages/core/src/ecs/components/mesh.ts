import { defineComponent } from '../kernel/registry';

/**
 * Primitive shapes the engine can spawn. The union is derived from this list
 * so the editor and the renderer cannot drift from each other.
 */
export const PRIMITIVE_TYPES = ['box', 'sphere', 'plane'] as const;

/**
 * Types of primitive shapes supported by the engine.
 */
export type PrimitiveType = (typeof PRIMITIVE_TYPES)[number];

/** Three.js MeshStandardMaterial default roughness. */
export const DEFAULT_ROUGHNESS = 1;

/** Three.js MeshStandardMaterial default metalness. */
export const DEFAULT_METALNESS = 0;

/** Three.js MeshStandardMaterial default emissive (no glow). */
export const DEFAULT_EMISSIVE = '#000000';

/**
 * Data structure representing a 3D mesh.
 */
export interface MeshData {
    primitive: PrimitiveType;
    color: string;
    /**
     * Albedo texture URL. Empty string means the mesh is untextured.
     * The color still tints the surface when a texture is present.
     */
    albedo: string;
    /** Microfacet roughness in `[0, 1]`. */
    roughness: number;
    /** Metalness in `[0, 1]`. */
    metalness: number;
    /** Emissive color. `#000000` means no glow. */
    emissive: string;
    /** Whether this mesh writes into shadow maps. Default `true`. */
    castShadow: boolean;
    /** Whether this mesh receives shadows. Default `true`. */
    receiveShadow: boolean;
}

/**
 * Factory function to create a new Mesh data object.
 * @param primitive The shape of the mesh.
 * @param color The hex color string.
 * @param albedo Albedo texture URL. Empty for an untextured mesh.
 * @param roughness Microfacet roughness in `[0, 1]`.
 * @param metalness Metalness in `[0, 1]`.
 * @param emissive Emissive hex color.
 * @param castShadow Whether the mesh writes into shadow maps.
 * @param receiveShadow Whether the mesh receives shadows.
 * @returns A clean MeshData object.
 */
export const createMesh = (
    primitive: PrimitiveType = 'box',
    color = '#ff0000',
    albedo = '',
    roughness = DEFAULT_ROUGHNESS,
    metalness = DEFAULT_METALNESS,
    emissive = DEFAULT_EMISSIVE,
    castShadow = true,
    receiveShadow = true
): MeshData => ({
    primitive,
    color,
    albedo,
    roughness,
    metalness,
    emissive,
    castShadow,
    receiveShadow
});

/**
 * Fills fields that older scenes omitted so every live Mesh has a complete shape.
 */
const reviveMesh = (raw: unknown): MeshData => {
    const source = raw as Partial<MeshData>;
    return createMesh(
        source.primitive,
        source.color,
        source.albedo ?? '',
        source.roughness ?? DEFAULT_ROUGHNESS,
        source.metalness ?? DEFAULT_METALNESS,
        source.emissive ?? DEFAULT_EMISSIVE,
        source.castShadow ?? true,
        source.receiveShadow ?? true
    );
};

/**
 * Typed handle for the Mesh component.
 */
export const Mesh = defineComponent<MeshData>('mesh', createMesh, reviveMesh);
