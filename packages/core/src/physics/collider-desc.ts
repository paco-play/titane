import RAPIER from './load-rapier';
import type { Vec3 } from '../ecs/components/transform';
import type { ColliderData } from '../ecs/components/collider';
import type { MeshColliderGeometry } from '../runtime/renderer-interface';

/** Rapier rejects zero-sized shapes. */
const MIN_EXTENT = 0.001;

const half = (value: number): number => Math.max(MIN_EXTENT, Math.abs(value) * 0.5);

const scaledCenter = (center: Vec3, scale: Vec3): { x: number; y: number; z: number } => ({
    x: center.x * scale.x,
    y: center.y * scale.y,
    z: center.z * scale.z
});

const applyCenter = (desc: RAPIER.ColliderDesc, center: Vec3, scale: Vec3): RAPIER.ColliderDesc =>
    desc.setTranslation(scaledCenter(center, scale).x, scaledCenter(center, scale).y, scaledCenter(center, scale).z);

/**
 * Builds a Rapier collider from an authored {@link ColliderData}.
 * `mesh` needs runtime geometry; returns `null` until that exists.
 */
export const colliderDescFromCollider = (
    collider: ColliderData,
    scale: Vec3,
    meshGeometry: MeshColliderGeometry | null
): RAPIER.ColliderDesc | null => {
    switch (collider.kind) {
        case 'box':
            return applyCenter(
                RAPIER.ColliderDesc.cuboid(
                    half(collider.size.x * scale.x),
                    half(collider.size.y * scale.y),
                    half(collider.size.z * scale.z)
                ),
                collider.center,
                scale
            );
        case 'sphere':
            return applyCenter(
                RAPIER.ColliderDesc.ball(
                    Math.max(
                        MIN_EXTENT,
                        collider.radius * Math.max(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z))
                    )
                ),
                collider.center,
                scale
            );
        case 'capsule': {
            const radius = Math.max(
                MIN_EXTENT,
                collider.radius * Math.max(Math.abs(scale.x), Math.abs(scale.z))
            );
            const halfHeight = Math.max(MIN_EXTENT, half(collider.height * scale.y));
            return applyCenter(RAPIER.ColliderDesc.capsule(halfHeight, radius), collider.center, scale);
        }
        case 'mesh':
            if (!meshGeometry || meshGeometry.vertices.length < 9 || meshGeometry.indices.length < 3) {
                return null;
            }
            return applyCenter(
                RAPIER.ColliderDesc.trimesh(meshGeometry.vertices, meshGeometry.indices),
                collider.center,
                scale
            );
    }
};

/**
 * Rebuild key for a collider + scale + optional mesh payload.
 */
export const colliderShapeSignature = (
    collider: ColliderData | null,
    primitiveFallback: string,
    scale: Vec3,
    meshToken: number
): string => {
    if (!collider) {
        return `fallback:${primitiveFallback}:${scale.x},${scale.y},${scale.z}`;
    }
    return [
        collider.kind,
        collider.center.x,
        collider.center.y,
        collider.center.z,
        collider.size.x,
        collider.size.y,
        collider.size.z,
        collider.radius,
        collider.height,
        scale.x,
        scale.y,
        scale.z,
        meshToken
    ].join(':');
};
