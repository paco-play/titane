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
 * A pooled material plus the number of rendered entities currently using it.
 */
interface PooledMaterial {
    material: THREE.MeshStandardMaterial;
    refs: number;
}

/**
 * Canonical cache key for a CSS color string.
 * @param color Any CSS color string accepted by THREE.Color.
 */
const colorKey = (color: string): string => color.toLowerCase();

/**
 * Pool of GPU resources shared across entities.
 *
 * A geometry is fully determined by its primitive type (three of them, kept
 * for the lifetime of the renderer). A material is determined by its color,
 * and is refcounted: the last user to drop a color disposes it, so dragging
 * a color picker through thousands of values cannot grow the pool without bound.
 */
export class ResourceCache {
    private readonly geometries = new Map<PrimitiveType, THREE.BufferGeometry>();
    private readonly materials = new Map<string, PooledMaterial>();

    /**
     * Number of materials currently retained. Exposed for tests.
     */
    public get materialCount(): number {
        return this.materials.size;
    }

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
     * Each call retains the material; pair it with {@link releaseMaterial}.
     * @param color Any CSS color string accepted by THREE.Color.
     * @returns A material owned by the cache. Callers must not dispose it.
     */
    public material(color: string): THREE.MeshStandardMaterial {
        const key = colorKey(color);
        const cached = this.materials.get(key);
        if (cached) {
            cached.refs += 1;
            return cached.material;
        }

        const material = new THREE.MeshStandardMaterial({ color });
        this.materials.set(key, { material, refs: 1 });
        return material;
    }

    /**
     * Drops one retainer of a color. Disposes the material when nothing uses it.
     * @param color The color previously passed to {@link material}.
     */
    public releaseMaterial(color: string): void {
        const key = colorKey(color);
        const pooled = this.materials.get(key);
        if (!pooled) return;

        pooled.refs -= 1;
        if (pooled.refs > 0) return;

        pooled.material.dispose();
        this.materials.delete(key);
    }

    /**
     * Releases every pooled resource. Call once, when tearing the renderer down.
     */
    public dispose(): void {
        this.geometries.forEach(geometry => geometry.dispose());
        this.materials.forEach(pooled => pooled.material.dispose());

        this.geometries.clear();
        this.materials.clear();
    }
}
