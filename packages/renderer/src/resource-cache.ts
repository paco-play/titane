import * as THREE from 'three';
import type { PrimitiveType } from '@titane/core';

/**
 * Builds the geometry backing a primitive type.
 *
 * Every shape is authored to fit a 1x1x1 box, so `Transform.scale` behaves
 * identically whatever the primitive.
 *
 * The switch is deliberately exhaustive rather than falling back to a box:
 * adding a member to `PrimitiveType` must break the build here instead of
 * silently rendering the wrong shape.
 *
 * @param primitive The requested shape.
 * @returns A freshly allocated geometry.
 */
const createGeometry = (primitive: PrimitiveType): THREE.BufferGeometry => {
    switch (primitive) {
        case 'sphere':
            return new THREE.SphereGeometry(0.5, 32, 16);
        case 'plane':
            return new THREE.PlaneGeometry(1, 1);
        case 'box':
            return new THREE.BoxGeometry(1, 1, 1);
    }
};

/**
 * Pool of GPU resources shared across entities.
 *
 * A geometry is fully determined by its primitive type, and a material by its
 * color, so one instance of each can serve every entity asking for it. An
 * entity therefore costs a single `Object3D` instead of its own geometry and
 * material pair, and disposal only happens when the renderer shuts down.
 */
export class ResourceCache {
    private readonly geometries = new Map<PrimitiveType, THREE.BufferGeometry>();
    private readonly materials = new Map<string, THREE.MeshStandardMaterial>();

    /**
     * Returns the shared geometry for a primitive, creating it on first use.
     * @param primitive The requested shape.
     * @returns A geometry owned by the cache. Callers must not dispose it.
     */
    public geometry(primitive: PrimitiveType): THREE.BufferGeometry {
        const cached = this.geometries.get(primitive);
        if (cached) return cached;

        const geometry = createGeometry(primitive);
        this.geometries.set(primitive, geometry);
        return geometry;
    }

    /**
     * Returns the shared material for a color, creating it on first use.
     * @param color Any CSS color string accepted by THREE.Color.
     * @returns A material owned by the cache. Callers must not dispose it.
     */
    public material(color: string): THREE.MeshStandardMaterial {
        const cached = this.materials.get(color);
        if (cached) return cached;

        const material = new THREE.MeshStandardMaterial({ color });
        this.materials.set(color, material);
        return material;
    }

    /**
     * Releases every pooled resource. Call once, when tearing the renderer down.
     */
    public dispose(): void {
        this.geometries.forEach(geometry => geometry.dispose());
        this.materials.forEach(material => material.dispose());

        this.geometries.clear();
        this.materials.clear();
    }
}
