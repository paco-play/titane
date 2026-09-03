import type { Entity } from '@titane/core';

/**
 * Groups entities by the parent they should be displayed under.
 *
 * Built once per tree recomputation so walking the tree is O(n) instead of
 * re-filtering the full list at every depth.
 *
 * @param entityIds - Visible entity IDs, in display order.
 * @param resolveParent - Returns the display parent, or null for a root.
 * @returns Parent ID (or null for roots) → children, in `entityIds` order.
 *   A parent that is not itself in `entityIds` is treated as missing, so the
 *   child is listed as a root instead of disappearing from the tree.
 */
export const indexByParent = (
  entityIds: readonly Entity[],
  resolveParent: (entityId: Entity) => Entity | null
): Map<Entity | null, Entity[]> => {
  const visible = new Set(entityIds);
  const index = new Map<Entity | null, Entity[]>();

  for (const entityId of entityIds) {
    const parentId = resolveParent(entityId);
    const displayParent = parentId !== null && visible.has(parentId) ? parentId : null;
    const siblings = index.get(displayParent);

    if (siblings) siblings.push(entityId);
    else index.set(displayParent, [entityId]);
  }

  return index;
};

/**
 * Builds a forest from a flat entity list using a single parent index.
 *
 * @param entityIds - Visible entity IDs, in display order.
 * @param resolveParent - Returns the display parent, or null for a root.
 * @param createNode - Builds a node given the entity and its child nodes.
 */
export const buildIndexedForest = <T>(
  entityIds: readonly Entity[],
  resolveParent: (entityId: Entity) => Entity | null,
  createNode: (entityId: Entity, children: T[] | undefined) => T
): T[] => {
  const childrenOf = indexByParent(entityIds, resolveParent);

  const buildNode = (entityId: Entity): T => {
    const childIds = childrenOf.get(entityId);
    const children = childIds?.map(buildNode);
    return createNode(entityId, children && children.length > 0 ? children : undefined);
  };

  return (childrenOf.get(null) ?? []).map(buildNode);
};
