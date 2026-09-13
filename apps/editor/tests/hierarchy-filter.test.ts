import { describe, expect, it } from 'vitest';
import { filterTreeItems, type FilterableTreeItem } from '../app/utils/hierarchy-filter';

const tree: FilterableTreeItem[] = [
  {
    label: 'World',
    children: [
      { label: 'Player', children: [{ label: 'Camera' }] },
      { label: 'Tree_01' },
      { label: 'Rock_02' }
    ]
  }
];

describe('filterTreeItems', () => {
  it('returns a copy when the query is blank', () => {
    expect(filterTreeItems(tree, '  ')).toEqual(tree);
    expect(filterTreeItems(tree, '  ')).not.toBe(tree);
  });

  it('keeps ancestors of a matching leaf', () => {
    const result = filterTreeItems(tree, 'camera');
    expect(result).toEqual([
      {
        label: 'World',
        defaultExpanded: true,
        children: [
          {
            label: 'Player',
            defaultExpanded: true,
            children: [{ label: 'Camera' }]
          }
        ]
      }
    ]);
  });

  it('keeps the full subtree when a parent matches', () => {
    const result = filterTreeItems(tree, 'player');
    expect(result[0]?.children).toEqual([
      { label: 'Player', children: [{ label: 'Camera' }] }
    ]);
  });

  it('drops branches that do not match', () => {
    const result = filterTreeItems(tree, 'rock');
    expect(result[0]?.children?.map(child => child.label)).toEqual(['Rock_02']);
  });
});
