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

/**
 * Data structure representing a 3D mesh.
 */
export interface MeshData {
    primitive: PrimitiveType;
    color: string;
}

/**
 * Factory function to create a new Mesh data object.
 * @param primitive The shape of the mesh.
 * @param color The hex color string.
 * @returns A clean MeshData object.
 */
export const createMesh = (
    primitive: PrimitiveType = 'box',
    color = '#ff0000'
): MeshData => ({ primitive, color });

/**
 * Typed handle for the Mesh component.
 */
export const Mesh = defineComponent<MeshData>('mesh', createMesh);
