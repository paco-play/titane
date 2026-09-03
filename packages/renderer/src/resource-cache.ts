import * as THREE from 'three';
import type { PrimitiveType } from '@titane/core';
import {
    materialKey,
    normalizeMaterialSpec,
    type MaterialSpec,
    type NormalizedMaterialSpec
} from './material-spec';

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
    spec: NormalizedMaterialSpec;
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
 * Pool of GPU resources shared across entities.
 *
 * A geometry is fully determined by its primitive type. A material is
 * determined by color, albedo, roughness, metalness and emissive, and is
 * refcounted so a dragged picker cannot grow the pool without bound.
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
     * Returns the shared material for a spec, creating it on first use.
     * Each call retains the material; pair it with {@link releaseMaterial}.
     */
    public material(spec: MaterialSpec): THREE.MeshStandardMaterial {
        const normalized = normalizeMaterialSpec(spec);
        const key = materialKey(normalized);
        const cached = this.materials.get(key);
        if (cached) {
            cached.refs += 1;
            return cached.material;
        }

        const map = normalized.albedo === '' ? null : this.retainTexture(normalized.albedo);
        const material = new THREE.MeshStandardMaterial({
            color: normalized.color,
            map,
            roughness: normalized.roughness,
            metalness: normalized.metalness,
            emissive: normalized.emissive
        });
        this.materials.set(key, { material, refs: 1, spec: normalized });
        return material;
    }

    /**
     * Drops one retainer of a spec. Disposes the material when nothing uses it.
     */
    public releaseMaterial(spec: MaterialSpec): void {
        const normalized = normalizeMaterialSpec(spec);
        const pooled = this.materials.get(materialKey(normalized));
        if (!pooled) return;

        pooled.refs -= 1;
        if (pooled.refs > 0) return;

        pooled.material.dispose();
        this.materials.delete(materialKey(normalized));
        if (pooled.spec.albedo !== '') this.releaseTexture(pooled.spec.albedo);
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
