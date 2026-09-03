import { describe, it, expect } from 'vitest';
import { buildIndexedForest, indexByParent } from '../app/utils/hierarchy-index';

type Node = {
  id: number;
  children?: Node[];
};

const parentOf = (parents: Record<number, number | null>) =>
  (entityId: number): number | null => parents[entityId] ?? null;

describe('indexByParent', () => {
  it('groups siblings under their parent and lists roots under null', () => {
    const index = indexByParent([1, 2, 3], parentOf({ 1: null, 2: 1, 3: 1 }));

    expect(index.get(null)).toEqual([1]);
    expect(index.get(1)).toEqual([2, 3]);
  });

  it('treats an entity whose parent is missing as a root', () => {
    // Dead parent: the engine still draws the orphan, so the tree must too.
    const index = indexByParent([2], parentOf({ 2: 99 }));

    expect(index.get(null)).toEqual([2]);
    expect(index.get(99)).toBeUndefined();
  });

  it('preserves input order among siblings', () => {
    const index = indexByParent([3, 1, 2], parentOf({ 1: null, 2: null, 3: null }));

    expect(index.get(null)).toEqual([3, 1, 2]);
  });
});

describe('buildIndexedForest', () => {
  const createNode = (id: number, children: Node[] | undefined): Node => ({ id, children });

  it('nests children in a single pass', () => {
    const forest = buildIndexedForest(
      [1, 2, 3],
      parentOf({ 1: null, 2: 1, 3: 2 }),
      createNode
    );

    expect(forest).toEqual([
      { id: 1, children: [{ id: 2, children: [{ id: 3 }] }] }
    ]);
  });

  it('lifts orphans to the root so the count and the tree agree', () => {
    const forest = buildIndexedForest(
      [1, 2],
      parentOf({ 1: null, 2: 99 }),
      createNode
    );

    expect(forest).toEqual([
      { id: 1 },
      { id: 2 }
    ]);
  });

  it('returns an empty forest for an empty world', () => {
    expect(buildIndexedForest([], () => null, createNode)).toEqual([]);
  });
});
