import type { ColliderKind } from '@titane/core';

export interface ColliderKindOption {
  readonly value: ColliderKind;
  readonly label: string;
}

export const COLLIDER_KIND_OPTIONS = [
  { value: 'box', label: 'Box' },
  { value: 'sphere', label: 'Sphere' },
  { value: 'capsule', label: 'Capsule' },
  { value: 'mesh', label: 'Mesh' }
] as const satisfies readonly ColliderKindOption[];
