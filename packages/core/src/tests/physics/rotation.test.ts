import { describe, it, expect } from 'vitest';
import { eulerXyzToQuat, quatToEulerXyz } from '../../physics/rotation';

describe('Euler / quaternion conversion', () => {
    it('round-trips an XYZ rotation', () => {
        const source = { x: 0.3, y: 0.2, z: 0.1 };
        const out = { x: 0, y: 0, z: 0 };
        quatToEulerXyz(eulerXyzToQuat(source), out);

        expect(out.x).toBeCloseTo(source.x, 5);
        expect(out.y).toBeCloseTo(source.y, 5);
        expect(out.z).toBeCloseTo(source.z, 5);
    });
});
