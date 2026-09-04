import { describe, it, expect } from 'vitest';
import { f } from '../../ecs/schema/fields';
import { createFromSchema, reviveFromSchema, applySchemaInPlace } from '../../ecs/schema/values';
import type { InferSchema } from '../../ecs/schema/infer';

const movementSchema = {
    speed: f.number({ min: 0, max: 20, step: 0.1, default: 5 }),
    enabled: f.boolean({ default: true }),
    label: f.string({ default: 'hero' }),
    tint: f.color({ default: '#4ade80' }),
    offset: f.vec3({ default: { x: 1, y: 2, z: 3 } }),
    spin: f.quat(),
    target: f.entity(),
    stance: f.enum(['idle', 'run'] as const, { default: 'idle' })
};

type MovementData = InferSchema<typeof movementSchema>;

describe('schema DSL', () => {
    it('fills cloned defaults on create', () => {
        const first = createFromSchema(movementSchema);
        const second = createFromSchema(movementSchema);

        expect(first).toEqual({
            speed: 5,
            enabled: true,
            label: 'hero',
            tint: '#4ade80',
            offset: { x: 1, y: 2, z: 3 },
            spin: { x: 0, y: 0, z: 0, w: 1 },
            target: null,
            stance: 'idle'
        } satisfies MovementData);

        first.offset.x = 99;
        expect(second.offset.x).toBe(1);
    });

    it('revives valid fields and keeps defaults for invalid ones', () => {
        const revived = reviveFromSchema(movementSchema, {
            speed: 12.5,
            enabled: 'yes',
            label: 3,
            tint: '#112233',
            offset: { x: 0, y: 1, z: 2 },
            spin: { x: 0, y: 0, z: 0, w: 0.5 },
            target: 7,
            stance: 'walk',
            extra: true
        });

        expect(revived.speed).toBe(12.5);
        expect(revived.enabled).toBe(true);
        expect(revived.label).toBe('hero');
        expect(revived.tint).toBe('#112233');
        expect(revived.offset).toEqual({ x: 0, y: 1, z: 2 });
        expect(revived.spin).toEqual({ x: 0, y: 0, z: 0, w: 0.5 });
        expect(revived.target).toBe(7);
        expect(revived.stance).toBe('idle');
        expect('extra' in revived).toBe(false);
    });

    it('clamps numbers to min and max on revive', () => {
        expect(reviveFromSchema(movementSchema, { speed: 50 }).speed).toBe(20);
        expect(reviveFromSchema(movementSchema, { speed: -4 }).speed).toBe(0);
    });

    it('falls back to a full default object when the payload is not an object', () => {
        expect(reviveFromSchema(movementSchema, null).speed).toBe(5);
        expect(reviveFromSchema(movementSchema, 1).speed).toBe(5);
    });

    it('rebakes live data in place when the schema gains a field', () => {
        const data: Record<string, unknown> = { speed: 9 };
        applySchemaInPlace(movementSchema, data);
        expect(data.speed).toBe(9);
        expect(data.enabled).toBe(true);
        expect(data.stance).toBe('idle');
    });

    it('rejects an empty enum', () => {
        expect(() => f.enum([])).toThrow(/at least one option/);
    });
});
