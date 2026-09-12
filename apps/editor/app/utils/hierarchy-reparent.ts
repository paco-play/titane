import type { Entity, World } from '@titane/core';
import { canSetParent } from '@titane/core';

/** UTree key for the scene row that opens the World inspector. */
export const WORLD_HIERARCHY_KEY = 'world';

/** HTML5 DnD MIME for a Hierarchy entity row. */
export const HIERARCHY_ENTITY_MIME = 'application/x-titane-hierarchy-entity';

/**
 * Parses an entity id from a drag payload. Rejects anything that is not digits.
 */
export const parseHierarchyEntityId = (raw: string): Entity | null => {
  if (!/^\d+$/.test(raw)) return null;
  return Number.parseInt(raw, 10);
};

export type HierarchyDropParent =
  | { readonly ok: true; readonly parentId: Entity | null }
  | { readonly ok: false };

/**
 * Maps a tree row key to the parent a drop would assign.
 * World unparents. Unknown keys are rejected.
 */
export const parentFromHierarchyKey = (value: string): HierarchyDropParent => {
  if (value === WORLD_HIERARCHY_KEY) return { ok: true, parentId: null };
  const parentId = parseHierarchyEntityId(value);
  if (parentId === null) return { ok: false };
  return { ok: true, parentId };
};

/**
 * True when `childId` can be dropped onto the tree row `targetValue`.
 */
export const canDropHierarchyEntity = (
  world: World,
  childId: Entity,
  targetValue: string
): boolean => {
  const target = parentFromHierarchyKey(targetValue);
  if (!target.ok) return false;
  return canSetParent(world, childId, target.parentId);
};

/**
 * Walks a tree for the row whose `value` matches `key`.
 */
export const findHierarchyItem = <T extends { value?: string; children?: T[] }>(
  items: readonly T[],
  key: string
): T | undefined => {
  for (const item of items) {
    if (item.value === key) return item;
    if (item.children) {
      const nested = findHierarchyItem(item.children, key);
      if (nested) return nested;
    }
  }
  return undefined;
};

/**
 * Reads the hierarchy key from a drag/drop event target.
 */
export const hierarchyKeyFromEvent = (event: Event): string | null => {
  const el = event.target;
  if (!(el instanceof Element)) return null;
  return el.closest('[data-hierarchy-key]')?.getAttribute('data-hierarchy-key')
    ?? el.closest('[role="treeitem"]')?.querySelector('[data-hierarchy-key]')?.getAttribute('data-hierarchy-key')
    ?? null;
};
