import type { RigidBodyKind } from '@titane/core';

/**
 * A rigid-body kind the Inspector can assign, with its UI label.
 */
export interface RigidBodyOption {
  value: RigidBodyKind;
  label: string;
}

/**
 * Kinds exposed in the Inspector Rigid Body section.
 */
export const RIGID_BODY_OPTIONS = [
  { value: 'dynamic', label: 'Dynamic' },
  { value: 'fixed', label: 'Fixed' }
] as const satisfies readonly RigidBodyOption[];
