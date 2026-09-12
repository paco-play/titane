import { describe, expect, it } from 'vitest';
import { DEFAULT_ORBIT_OFFSET, panOrbitToFocus } from '../frame-orbit';

describe('panOrbitToFocus', () => {
    it('keeps the camera-to-target offset while centering on the focus', () => {
        const framed = panOrbitToFocus(
            { x: 0, y: 5, z: 10 },
            { x: 0, y: 0, z: 0 },
            { x: 4, y: 1, z: -2 }
        );

        expect(framed.target).toEqual({ x: 4, y: 1, z: -2 });
        expect(framed.camera).toEqual({ x: 4, y: 6, z: 8 });
    });

    it('uses a default offset when the camera is on the target', () => {
        const origin = { x: 1, y: 2, z: 3 };
        const framed = panOrbitToFocus(origin, origin, { x: 0, y: 0, z: 0 });

        expect(framed.camera).toEqual(DEFAULT_ORBIT_OFFSET);
        expect(framed.target).toEqual({ x: 0, y: 0, z: 0 });
    });
});
