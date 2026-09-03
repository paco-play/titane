import { describe, it, expect } from 'vitest';
import { FIXED_DT, MAX_FIXED_STEPS, FixedStep } from '../../utils/fixed-step';

describe('FixedStep', () => {
    it('emits no steps until a full timestep has accumulated', () => {
        const clock = new FixedStep();
        expect(clock.consume(FIXED_DT * 0.4)).toBe(0);
        expect(clock.consume(FIXED_DT * 0.4)).toBe(0);
        expect(clock.consume(FIXED_DT * 0.4)).toBe(1);
    });

    it('emits one step for a regular 60 Hz frame', () => {
        const clock = new FixedStep();
        expect(clock.consume(FIXED_DT)).toBe(1);
    });

    it('caps the number of steps after a hitch', () => {
        const clock = new FixedStep();
        expect(clock.consume(FIXED_DT * 100)).toBe(MAX_FIXED_STEPS);
        expect(clock.consume(FIXED_DT)).toBe(1);
    });

    it('drops leftover time on reset', () => {
        const clock = new FixedStep();
        clock.consume(FIXED_DT * 0.9);
        clock.reset();
        expect(clock.consume(FIXED_DT * 0.2)).toBe(0);
    });
});
