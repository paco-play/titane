import { describe, expect, it } from 'vitest';
import { WORLD_HIERARCHY_KEY } from '../app/utils/hierarchy-reparent';
import {
  HIERARCHY_ICONS,
  hierarchyIconLabel,
  resolveHierarchyIcon
} from '../app/utils/hierarchy-appearance';
import { applyHierarchyNamePatch, nextHierarchyName } from '../app/utils/hierarchy-name';

describe('hierarchyIconLabel', () => {
  it('title-cases the lucide id', () => {
    expect(hierarchyIconLabel('i-lucide-tree-deciduous')).toBe('Tree Deciduous');
  });
});

describe('resolveHierarchyIcon', () => {
  it('uses World, custom, folder, then box', () => {
    expect(resolveHierarchyIcon({ value: WORLD_HIERARCHY_KEY }, false)).toBe('i-lucide-globe');
    expect(resolveHierarchyIcon({ icon: 'i-lucide-sun', children: [{}] }, true)).toBe('i-lucide-sun');
    expect(resolveHierarchyIcon({ children: [{}] }, true)).toBe('i-lucide-folder-open');
    expect(resolveHierarchyIcon({ children: [{}] }, false)).toBe('i-lucide-folder');
    expect(resolveHierarchyIcon({}, false)).toBe('i-lucide-box');
  });
});

describe('HIERARCHY_ICONS', () => {
  it('is a non-empty lucide set', () => {
    expect(HIERARCHY_ICONS.length).toBeGreaterThan(0);
    expect(HIERARCHY_ICONS.every(icon => icon.startsWith('i-lucide-'))).toBe(true);
  });
});

describe('nextHierarchyName', () => {
  it('keeps the fallback when the draft is blank', () => {
    expect(nextHierarchyName('  Cube  ', 'Box')).toBe('Cube');
    expect(nextHierarchyName('   ', 'Box')).toBe('Box');
  });
});

describe('applyHierarchyNamePatch', () => {
  it('sets and clears optional appearance fields', () => {
    const data: { value: string; icon?: string; color?: string } = { value: 'Lamp' };
    applyHierarchyNamePatch(data, { icon: 'i-lucide-sun', color: '#facc15' });
    expect(data).toEqual({ value: 'Lamp', icon: 'i-lucide-sun', color: '#facc15' });

    applyHierarchyNamePatch(data, { icon: null, color: null, value: 'Spot' });
    expect(data).toEqual({ value: 'Spot' });
    expect('icon' in data).toBe(false);
    expect('color' in data).toBe(false);
  });
});
