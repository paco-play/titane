import { describe, it, expect } from 'vitest';
import { fieldLabel } from '../app/utils/field-label';

describe('fieldLabel', () => {
  it('capitalizes a schema key for the Inspector', () => {
    expect(fieldLabel('speed')).toBe('Speed');
    expect(fieldLabel('jumpHeight')).toBe('Jump Height');
    expect(fieldLabel('PlayerController')).toBe('Player Controller');
  });
});
