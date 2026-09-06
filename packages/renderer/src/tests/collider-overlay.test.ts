import { describe, it, expect } from 'vitest';
import { createCollider } from '@titane/core';
import {
    colliderVisualFromData,
    shouldDrawCollider
} from '../collider-visual';

describe('colliderVisualFromData', () => {
    const scale = { x: 2, y: 3, z: 4 };

    it('bakes box size and center the same way Rapier does', () => {
        const collider = createCollider('box');
        collider.size = { x: 1, y: 2, z: 0.5 };
        collider.center = { x: 0.25, y: 0, z: -0.5 };

        const visual = colliderVisualFromData(collider, scale);

        expect(visual.kind).toBe('box');
        expect(visual.size).toEqual({ x: 2, y: 6, z: 2 });
        expect(visual.center).toEqual({ x: 0.5, y: 0, z: -2 });
    });

    it('uses the max axis for sphere radius', () => {
        const collider = createCollider('sphere');
        collider.radius = 0.5;
        collider.center = { x: 1, y: 0, z: 0 };

        const visual = colliderVisualFromData(collider, scale);

        expect(visual.kind).toBe('sphere');
        expect(visual.radius).toBe(2);
        expect(visual.center).toEqual({ x: 2, y: 0, z: 0 });
    });

    it('scales capsule radius on XZ and height on Y', () => {
        const collider = createCollider('capsule');
        collider.radius = 0.25;
        collider.height = 2;

        const visual = colliderVisualFromData(collider, scale);

        expect(visual.kind).toBe('capsule');
        expect(visual.radius).toBe(1);
        expect(visual.cylinderHeight).toBe(6);
    });

    it('falls back to a unit AABB when mesh bounds are missing', () => {
        const collider = createCollider('mesh');
        const visual = colliderVisualFromData(collider, { x: 2, y: 2, z: 2 }, null);

        expect(visual.kind).toBe('mesh');
        expect(visual.size).toEqual({ x: 2, y: 2, z: 2 });
        expect(visual.center).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('uses the model AABB for mesh colliders', () => {
        const collider = createCollider('mesh');
        collider.center = { x: 0.5, y: 0, z: 0 };
        const visual = colliderVisualFromData(collider, { x: 2, y: 2, z: 2 }, {
            center: { x: 0.1, y: 0.2, z: 0.3 },
            size: { x: 3, y: 4, z: 5 }
        });

        expect(visual.kind).toBe('mesh');
        expect(visual.size).toEqual({ x: 6, y: 8, z: 10 });
        expect(visual.center).toEqual({ x: 1.2, y: 0.4, z: 0.6 });
    });
});

describe('shouldDrawCollider', () => {
    it('draws only the selection in selected mode', () => {
        expect(shouldDrawCollider('selected', 4, 4)).toBe(true);
        expect(shouldDrawCollider('selected', 4, 7)).toBe(false);
        expect(shouldDrawCollider('selected', null, 4)).toBe(false);
    });

    it('draws every collider in all mode', () => {
        expect(shouldDrawCollider('all', null, 1)).toBe(true);
        expect(shouldDrawCollider('all', 9, 2)).toBe(true);
    });
});
