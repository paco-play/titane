import { describe, expect, it } from 'vitest';
import { createName } from '../../ecs/components/name';

describe('createName', () => {
    it('omits appearance keys until they are set', () => {
        expect(createName('Hero')).toEqual({ value: 'Hero' });
    });

    it('stores optional Hierarchy icon and color', () => {
        expect(createName('Lamp', { icon: 'i-lucide-sun', color: '#facc15' })).toEqual({
            value: 'Lamp',
            icon: 'i-lucide-sun',
            color: '#facc15'
        });
    });
});
