import { describe, expect, it } from 'vitest';
import { degToRad, radToDeg } from '../app/utils/euler-degrees';

describe('euler-degrees', () => {
  it('round-trips a right angle', () => {
    expect(radToDeg(Math.PI / 2)).toBeCloseTo(90, 10);
    expect(degToRad(90)).toBeCloseTo(Math.PI / 2, 10);
    expect(radToDeg(degToRad(45))).toBeCloseTo(45, 10);
  });

  it('maps zero to zero', () => {
    expect(radToDeg(0)).toBe(0);
    expect(degToRad(0)).toBe(0);
  });
});
