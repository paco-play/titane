import type { LightKind } from '@titane/core';

/**
 * Display metadata for each light kind, used by the Inspector and the
 * Hierarchy "Add" menu.
 */
export interface LightOption {
    value: LightKind;
    label: string;
    icon: string;
}

export const LIGHT_KIND_OPTIONS: LightOption[] = [
  { value: 'directional', label: 'Directional', icon: 'i-lucide-sun' },
  { value: 'point', label: 'Point', icon: 'i-lucide-lightbulb' },
  { value: 'ambient', label: 'Ambient', icon: 'i-lucide-circle-dashed' },
];
