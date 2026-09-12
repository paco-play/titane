import { describe, expect, it } from 'vitest';
import { canSetParent, createPrimitive, createWorld, setParent } from '@titane/core';
import {
  WORLD_HIERARCHY_KEY,
  canDropHierarchyEntity,
  findHierarchyItem,
  parentFromHierarchyKey,
  parseHierarchyEntityId
} from '../app/utils/hierarchy-reparent';

describe('parseHierarchyEntityId', () => {
  it('accepts digit strings and rejects everything else', () => {
    expect(parseHierarchyEntityId('12')).toBe(12);
    expect(parseHierarchyEntityId('')).toBeNull();
    expect(parseHierarchyEntityId('world')).toBeNull();
    expect(parseHierarchyEntityId('1.5')).toBeNull();
  });
});

describe('parentFromHierarchyKey', () => {
  it('unparents on the World row and parents onto an entity key', () => {
    expect(parentFromHierarchyKey(WORLD_HIERARCHY_KEY)).toEqual({ ok: true, parentId: null });
    expect(parentFromHierarchyKey('7')).toEqual({ ok: true, parentId: 7 });
    expect(parentFromHierarchyKey('nope')).toEqual({ ok: false });
  });
});

describe('canDropHierarchyEntity', () => {
  it('allows dropping onto World or another entity, not onto self or a descendant', () => {
    const world = createWorld();
    const parent = createPrimitive(world, { name: 'Parent' });
    const child = createPrimitive(world, { name: 'Child' });
    setParent(world, child, parent);

    expect(canDropHierarchyEntity(world, child, WORLD_HIERARCHY_KEY)).toBe(true);
    expect(canSetParent(world, child, null)).toBe(true);
    expect(canDropHierarchyEntity(world, parent, String(child))).toBe(false);
    expect(canDropHierarchyEntity(world, parent, String(parent))).toBe(false);
  });
});

describe('findHierarchyItem', () => {
  it('finds a nested row by value', () => {
    const items = [
      { value: 'world' },
      { value: '1', children: [{ value: '2' }] }
    ];
    expect(findHierarchyItem(items, '2')?.value).toBe('2');
    expect(findHierarchyItem(items, 'missing')).toBeUndefined();
  });
});
