import { WORLD_HIERARCHY_KEY } from './hierarchy-reparent';

/** Curated Lucide glyphs for Hierarchy rows. */
export const HIERARCHY_ICONS = [
  'i-lucide-box',
  'i-lucide-boxes',
  'i-lucide-cuboid',
  'i-lucide-circle',
  'i-lucide-cylinder',
  'i-lucide-pyramid',
  'i-lucide-camera',
  'i-lucide-sun',
  'i-lucide-lamp',
  'i-lucide-volume-2',
  'i-lucide-user',
  'i-lucide-car',
  'i-lucide-flag',
  'i-lucide-star',
  'i-lucide-heart',
  'i-lucide-zap',
  'i-lucide-tree-deciduous',
  'i-lucide-mountain'
] as const;

export type HierarchyIconName = (typeof HIERARCHY_ICONS)[number];

/** Named tints for Hierarchy glyphs. */
export const HIERARCHY_COLORS = [
  { label: 'Red', hex: '#f87171' },
  { label: 'Orange', hex: '#fb923c' },
  { label: 'Yellow', hex: '#facc15' },
  { label: 'Green', hex: '#4ade80' },
  { label: 'Cyan', hex: '#22d3ee' },
  { label: 'Blue', hex: '#60a5fa' },
  { label: 'Violet', hex: '#a78bfa' },
  { label: 'Pink', hex: '#f472b6' },
  { label: 'Gray', hex: '#94a3b8' }
] as const;

export type HierarchyColorSwatch = (typeof HIERARCHY_COLORS)[number];

/**
 * Human label from a Lucide icon id (`i-lucide-tree-deciduous` → `Tree Deciduous`).
 */
export const hierarchyIconLabel = (icon: string): string =>
  icon
    .replace(/^i-lucide-/, '')
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export type HierarchyIconSource = {
  value?: string;
  icon?: string;
  children?: unknown[];
};

/**
 * Icon shown on a Hierarchy row: World globe, then a custom glyph, then folder/box.
 */
export const resolveHierarchyIcon = (item: HierarchyIconSource, expanded: boolean): string => {
  if (item.value === WORLD_HIERARCHY_KEY) return 'i-lucide-globe';
  if (item.icon) return item.icon;
  if (!item.children) return 'i-lucide-box';
  return expanded ? 'i-lucide-folder-open' : 'i-lucide-folder';
};
