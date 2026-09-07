import type { Entity } from '@titane/core';
import type { TreeItem } from '@nuxt/ui';
import { getComponent, Name, Transform } from '@titane/core';
import { buildIndexedForest } from '~/utils/hierarchy-index';
import { isHierarchyVisible } from '~/utils/hierarchy-visible';

/** UTree key for the scene row that opens the World inspector. */
export const WORLD_HIERARCHY_KEY = 'world';

export interface HierarchyItem extends TreeItem {
  id?: Entity;
  children?: HierarchyItem[];
}

/**
 * Transforms the ECS World state into Nuxt UI Navigation items.
 *
 * @returns The hierarchy items, the count of visible entities and the selection bridge.
 */
export const useHierarchy = () => {
  const { engine, entities, selectedEntityId, selectedWorld } = useTitane();

  /**
   * Internal cache used to map Entity IDs to their respective TreeItem objects.
   * This allows the selection logic to retrieve the full object in O(1) time.
   */
  const entityToNodeCache = new Map<Entity, HierarchyItem>();
  let worldNode: HierarchyItem | undefined;

  /**
   * Filters out internal engine entities to only show user-relevant GameObjects.
   */
  const visibleEntities = computed<Entity[]>(() => {
    if (!engine.value) return [];
    const world = engine.value.world;

    return Array.from(entities.value).filter(
      entityId => isHierarchyVisible(world, entityId)
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
   * Reactive tree: a World row, then the entity forest.
   */
  const hierarchyItems = computed<HierarchyItem[]>(() => {
    entityToNodeCache.clear();
    worldNode = {
      label: 'World',
      value: WORLD_HIERARCHY_KEY,
      defaultExpanded: true
    };

    if (!engine.value) return [worldNode];

    const world = engine.value.world;

    const forest = buildIndexedForest(visibleEntities.value, resolveDisplayParent, (entityId, children) => {
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

    return [worldNode, ...forest];
  });

  /**
   * Bridge between engine selection and the UI's object-based selection.
   */
  const selectionBridge = computed<HierarchyItem | undefined>({
    get: () => {
      if (selectedWorld.value) {
        return worldNode ?? { label: 'World', value: WORLD_HIERARCHY_KEY };
      }
      if (selectedEntityId.value === null) return undefined;
      return entityToNodeCache.get(selectedEntityId.value);
    },
    set: (incomingSelection) => {
      if (incomingSelection?.value === WORLD_HIERARCHY_KEY) {
        selectedEntityId.value = null;
        selectedWorld.value = true;
        return;
      }

      selectedWorld.value = false;
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
