import type { Entity } from '@titane/core';
import type { TreeItem } from '@nuxt/ui';
import { getComponent, hasComponent, Name, Input, Transform } from '@titane/core';
import { buildIndexedForest } from '~/utils/hierarchy-index';

export interface HierarchyItem extends TreeItem {
  id: Entity;
  children?: HierarchyItem[];
}

/**
 * Transforms the ECS World state into Nuxt UI Navigation items.
 *
 * @returns The hierarchy items, the count of visible entities and the selection bridge.
 */
export const useHierarchy = () => {
  const { engine, entities, selectedEntityId } = useTitane();

  /**
   * Internal cache used to map Entity IDs to their respective TreeItem objects.
   * This allows the selection logic to retrieve the full object in O(1) time.
   */
  const entityToNodeCache = new Map<Entity, HierarchyItem>();

  /**
   * Filters out internal engine entities to only show user-relevant GameObjects.
   */
  const visibleEntities = computed<Entity[]>(() => {
    if (!engine.value) return [];
    const world = engine.value.world;

    return Array.from(entities.value).filter(
      entityId => !hasComponent(world, entityId, Input)
    );
  });

  /**
   * Resolves the parent an entity is displayed under.
   *
   * An entity pointing at a dead parent is shown as a root, mirroring the
   * engine's transform pass. Without this it would render in the viewport
   * while being unreachable from the tree, and the count would disagree.
   *
   * @param entityId - The entity whose display parent is needed.
   * @returns The parent ID, or null when the entity belongs at the root.
   */
  const resolveDisplayParent = (entityId: Entity): Entity | null => {
    if (!engine.value) return null;

    const parentId = getComponent(engine.value.world, entityId, Transform)?.parent ?? null;
    if (parentId === null) return null;

    return entities.value.has(parentId) ? parentId : null;
  };

  /**
   * Reactive tree structure for the UTree component.
   * Indexes children once, then walks the map so a deep chain is O(n).
   */
  const hierarchyItems = computed<HierarchyItem[]>(() => {
    entityToNodeCache.clear();
    if (!engine.value) return [];

    const world = engine.value.world;

    return buildIndexedForest(visibleEntities.value, resolveDisplayParent, (entityId, children) => {
      const node: HierarchyItem = {
        id: entityId,
        label: getComponent(world, entityId, Name)?.value || `GameObject #${entityId}`,
        children,
        defaultExpanded: true,
        value: entityId.toString()
      };

      entityToNodeCache.set(entityId, node);
      return node;
    });
  });

  /**
   * Bridge between the Engine's numerical ID selection and the UI's object-based selection.
   */
  const selectionBridge = computed<HierarchyItem | undefined>({
    get: () => {
      if (selectedEntityId.value === null) return undefined;
      return entityToNodeCache.get(selectedEntityId.value);
    },
    set: (incomingSelection) => {
      selectedEntityId.value = incomingSelection?.id ?? null;
    }
  });

  return {
    items: hierarchyItems,
    count: computed(() => visibleEntities.value.length),
    selection: selectionBridge,
    selectedEntityId
  };
};
