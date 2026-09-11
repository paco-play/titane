import type { CameraProjection } from '@titane/core';

export interface CameraProjectionOption {
  value: CameraProjection;
  label: string;
}

export const CAMERA_PROJECTION_OPTIONS = [
  { value: 'perspective', label: 'Perspective' },
  { value: 'orthographic', label: 'Orthographic' }
] as const satisfies readonly CameraProjectionOption[];
