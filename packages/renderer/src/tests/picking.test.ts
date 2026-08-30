import { describe, it, expect } from 'vitest';
import { Object3D } from 'three';
import { pointerToNdc, entityFromHits } from '../picking';

describe('pointerToNdc', () => {
    const rect = { left: 10, top: 20, width: 100, height: 50 };

    it('maps the canvas centre to the origin', () => {
        expect(pointerToNdc(60, 45, rect)).toEqual({ x: 0, y: 0 });
    });

    it('maps the top-left corner to (-1, 1)', () => {
        expect(pointerToNdc(10, 20, rect)).toEqual({ x: -1, y: 1 });
    });

    it('maps the bottom-right corner to (1, -1)', () => {
        expect(pointerToNdc(110, 70, rect)).toEqual({ x: 1, y: -1 });
    });
});

describe('entityFromHits', () => {
    it('returns the nearest object that maps to an entity', () => {
        const near = new Object3D();
        const far = new Object3D();
        const hits = [{ object: near }, { object: far }];

        expect(entityFromHits(hits, object => object === far ? 7 : undefined)).toBe(7);
        expect(entityFromHits(hits, object => object === near ? 3 : undefined)).toBe(3);
    });

    it('walks up to a mapped parent so gizmo children still resolve', () => {
        const parent = new Object3D();
        const child = new Object3D();
        parent.add(child);

        expect(entityFromHits([{ object: child }], object => object === parent ? 11 : undefined)).toBe(11);
    });

    it('returns null when nothing in the hit list is mapped', () => {
        expect(entityFromHits([{ object: new Object3D() }], () => undefined)).toBeNull();
        expect(entityFromHits([], () => 1)).toBeNull();
    });
});
