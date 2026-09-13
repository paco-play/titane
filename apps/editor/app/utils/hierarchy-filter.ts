/**
 * Label-matching filter for nested tree rows (Hierarchy search).
 *
 * A node is kept when its label matches, or when a descendant matches.
 * Matching parents keep their full children so the subtree stays readable.
 */

export type FilterableTreeItem = {
  label?: string;
  children?: FilterableTreeItem[];
  defaultExpanded?: boolean;
};

/**
 * Returns the subset of `items` that match `query` (case-insensitive).
 * An empty query returns the original array.
 */
export const filterTreeItems = <T extends FilterableTreeItem>(
  items: readonly T[],
  query: string
): T[] => {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...items];

  const visit = (item: T): T | null => {
    const selfMatches = (item.label ?? '').toLowerCase().includes(needle);
    if (selfMatches) return item;

    const nextChildren = (item.children ?? [])
      .map(child => visit(child as T))
      .filter((child): child is T => child !== null);

    if (nextChildren.length === 0) return null;

    return {
      ...item,
      children: nextChildren,
      defaultExpanded: true
    };
  };

  return items.map(visit).filter((item): item is T => item !== null);
};
