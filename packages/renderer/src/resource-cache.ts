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
    albedo: string;
}

/**
 * A pooled albedo texture plus the number of materials currently using it.
 */
interface PooledTexture {
    texture: THREE.Texture;
    refs: number;
}

/**
 * Builds a GPU texture from a URL. Injected so tests can skip network I/O.
 */
export type TextureFactory = (url: string) => THREE.Texture;

/**
 * Loads an sRGB albedo map. Three.js fills the image asynchronously;
 * the next render frame picks the pixels up automatically.
 */
const loadAlbedo = (url: string): THREE.Texture => {
    const texture = new THREE.TextureLoader().load(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
};

/**
 * Canonical cache key for a CSS color string.
 * @param color Any CSS color string accepted by THREE.Color.
 */
const colorKey = (color: string): string => color.toLowerCase();

/**
 * Canonical cache key for a material: color plus optional albedo URL.
 * A newline cannot appear in a CSS color, so the pair cannot collide.
 */
const materialKey = (color: string, albedo: string): string =>
    `${colorKey(color)}\n${albedo}`;

/**
 * Pool of GPU resources shared across entities.
 *
 * A geometry is fully determined by its primitive type (three of them, kept
 * for the lifetime of the renderer). A material is determined by its color
 * and albedo URL, and is refcounted: the last user to drop a pair disposes
 * it, so dragging a color picker through thousands of values cannot grow
 * the pool without bound. Albedo textures are refcounted the same way.
 */
export class ResourceCache {
    private readonly geometries = new Map<PrimitiveType, THREE.BufferGeometry>();
    private readonly materials = new Map<string, PooledMaterial>();
    private readonly textures = new Map<string, PooledTexture>();

    /**
     * @param createTexture - Optional factory used when an albedo URL is first seen.
     */
    constructor(private readonly createTexture: TextureFactory = loadAlbedo) {}

    /**
     * Number of materials currently retained. Exposed for tests.
     */
    public get materialCount(): number {
        return this.materials.size;
    }

    /**
     * Number of albedo textures currently retained. Exposed for tests.
     */
    public get textureCount(): number {
        return this.textures.size;
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
     * Returns the shared material for a color and optional albedo, creating it on first use.
     * Each call retains the material; pair it with {@link releaseMaterial}.
     * @param color Any CSS color string accepted by THREE.Color.
     * @param albedo Albedo texture URL. Empty string means untextured.
     * @returns A material owned by the cache. Callers must not dispose it.
     */
    public material(color: string, albedo = ''): THREE.MeshStandardMaterial {
        const key = materialKey(color, albedo);
        const cached = this.materials.get(key);
        if (cached) {
            cached.refs += 1;
            return cached.material;
        }

        const map = albedo === '' ? null : this.retainTexture(albedo);
        const material = new THREE.MeshStandardMaterial({ color, map });
        this.materials.set(key, { material, refs: 1, albedo });
        return material;
    }

    /**
     * Drops one retainer of a color / albedo pair. Disposes the material when nothing uses it.
     * @param color The color previously passed to {@link material}.
     * @param albedo The albedo URL previously passed to {@link material}.
     */
    public releaseMaterial(color: string, albedo = ''): void {
        const key = materialKey(color, albedo);
        const pooled = this.materials.get(key);
        if (!pooled) return;

        pooled.refs -= 1;
        if (pooled.refs > 0) return;

        pooled.material.dispose();
        this.materials.delete(key);
        if (pooled.albedo !== '') this.releaseTexture(pooled.albedo);
    }

    /**
     * Releases every pooled resource. Call once, when tearing the renderer down.
     */
    public dispose(): void {
        this.geometries.forEach(geometry => geometry.dispose());
        this.materials.forEach(pooled => pooled.material.dispose());
        this.textures.forEach(pooled => pooled.texture.dispose());

        this.geometries.clear();
        this.materials.clear();
        this.textures.clear();
    }

    /**
     * Retains the shared texture for an albedo URL, creating it on first use.
     */
    private retainTexture(url: string): THREE.Texture {
        const cached = this.textures.get(url);
        if (cached) {
            cached.refs += 1;
            return cached.texture;
        }

        const texture = this.createTexture(url);
        this.textures.set(url, { texture, refs: 1 });
        return texture;
    }

    /**
     * Drops one retainer of an albedo URL. Disposes the texture when nothing uses it.
     */
    private releaseTexture(url: string): void {
        const pooled = this.textures.get(url);
        if (!pooled) return;

        pooled.refs -= 1;
        if (pooled.refs > 0) return;

        pooled.texture.dispose();
        this.textures.delete(url);
    }
}
