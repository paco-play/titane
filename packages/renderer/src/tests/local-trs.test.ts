import { describe, it, expect } from 'vitest';
import { Matrix4 } from 'three';
import { worldMatrixToLocalTrs } from '../local-trs';

describe('worldMatrixToLocalTrs', () => {
    it('reads a root translation as local position', () => {
        const world = new Matrix4().makeTranslation(3, 4, 5);
        const trs = worldMatrixToLocalTrs(world, null);

        expect(trs.position.x).toBeCloseTo(3);
        expect(trs.position.y).toBeCloseTo(4);
        expect(trs.position.z).toBeCloseTo(5);
        expect(trs.rotation.x).toBeCloseTo(0);
        expect(trs.rotation.y).toBeCloseTo(0);
        expect(trs.rotation.z).toBeCloseTo(0);
        expect(trs.scale.x).toBeCloseTo(1);
        expect(trs.scale.y).toBeCloseTo(1);
        expect(trs.scale.z).toBeCloseTo(1);
    });

    it('subtracts the parent translation so a child stores a local offset', () => {
        // Parent at x=2, child world at x=5 → local x=3
        const parent = new Float32Array(new Matrix4().makeTranslation(2, 0, 0).elements);
        const childWorld = new Matrix4().makeTranslation(5, 0, 0);
        const trs = worldMatrixToLocalTrs(childWorld, parent);

        expect(trs.position.x).toBeCloseTo(3);
        expect(trs.position.y).toBeCloseTo(0);
        expect(trs.position.z).toBeCloseTo(0);
    });

    it('recovers an XYZ euler rotation that round-trips through a world matrix', () => {
        const world = new Matrix4().makeRotationX(Math.PI / 2);
        const trs = worldMatrixToLocalTrs(world, null);

        expect(trs.rotation.x).toBeCloseTo(Math.PI / 2);
        expect(trs.rotation.y).toBeCloseTo(0);
        expect(trs.rotation.z).toBeCloseTo(0);
    });
});
