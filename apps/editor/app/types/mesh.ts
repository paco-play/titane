import type { PrimitiveType } from '@titane/core';

/**
 * A primitive shape the editor can spawn or assign, with its UI label and icon.
 */
export interface PrimitiveOption {
  value: PrimitiveType;
  label: string;
  icon: string;
}

/**
 * Shapes exposed in the Hierarchy create menu and the Inspector selector.
 */
export const PRIMITIVE_OPTIONS = [
  { value: 'box', label: 'Box', icon: 'i-lucide-box' },
  { value: 'sphere', label: 'Sphere', icon: 'i-lucide-circle' },
  { value: 'plane', label: 'Plane', icon: 'i-lucide-square' }
] as const satisfies readonly PrimitiveOption[];

/**
 * Narrows an unknown select value to a known primitive.
 * @param value - The raw value emitted by a Nuxt UI Select.
 */
export const isPrimitiveType = (value: unknown): value is PrimitiveType =>
  PRIMITIVE_OPTIONS.some(option => option.value === value);
