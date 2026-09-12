import { describe, expect, it } from 'vitest';
import { createNav } from '@titane/core';
import { navSignature } from '../nav-overlay';

describe('navSignature', () => {
    it('changes when walkable cells change', () => {
        const a = createNav();
        a.width = 2;
        a.depth = 1;
        a.cells = [1, 0];
        const b = createNav();
        b.width = 2;
        b.depth = 1;
        b.cells = [1, 1];
        expect(navSignature(a)).not.toBe(navSignature(b));
        expect(navSignature(a)).toBe(navSignature({ ...a, cells: [1, 0] }));
    });
});
