import { canSetParent, setParent } from '@titane/core';
import {
  HIERARCHY_ENTITY_MIME,
  WORLD_HIERARCHY_KEY,
  findHierarchyItem,
  hierarchyKeyFromEvent,
  parentFromHierarchyKey,
  parseHierarchyEntityId
} from '~/utils/hierarchy-reparent';
import type { HierarchyItem } from './useHierarchy';

/**
 * Native drag-and-drop reparenting for Hierarchy rows.
 */
export const useHierarchyDrag = (items: Ref<HierarchyItem[]>) => {
  const { engine, syncWorld, markDirty } = useTitane();
  const { saveToStorage } = usePersistence();

  const itemFromEvent = (event: Event): HierarchyItem | undefined => {
    const key = hierarchyKeyFromEvent(event);
    return key ? findHierarchyItem(items.value, key) : undefined;
  };

  const onDragStart = (event: DragEvent): void => {
    if (event.target instanceof Element && event.target.closest('input')) {
      event.preventDefault();
      return;
    }
    const item = itemFromEvent(event);
    if (!item || item.value === WORLD_HIERARCHY_KEY || item.id === undefined) {
      event.preventDefault();
      return;
    }
    if (!event.dataTransfer) return;
    event.dataTransfer.setData(HIERARCHY_ENTITY_MIME, String(item.id));
    event.dataTransfer.setData('text/plain', String(item.id));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (event: DragEvent): void => {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (event: DragEvent): void => {
    event.preventDefault();
    if (!engine.value || !event.dataTransfer) return;

    const raw = event.dataTransfer.getData(HIERARCHY_ENTITY_MIME)
      || event.dataTransfer.getData('text/plain');
    const childId = parseHierarchyEntityId(raw);
    if (childId === null) return;

    const item = itemFromEvent(event);
    if (!item) return;
    const target = parentFromHierarchyKey(String(item.value ?? ''));
    if (!target.ok) return;
    if (!canSetParent(engine.value.world, childId, target.parentId)) return;

    setParent(engine.value.world, childId, target.parentId);
    syncWorld();
    markDirty();
    saveToStorage();
  };

  const syncRowDraggable = (root: HTMLElement): void => {
    for (const itemEl of root.querySelectorAll<HTMLElement>('[role="treeitem"]')) {
      const key = itemEl.querySelector('[data-hierarchy-key]')?.getAttribute('data-hierarchy-key');
      itemEl.draggable = key !== null && key !== WORLD_HIERARCHY_KEY;
    }
  };

  return { onDragStart, onDragOver, onDrop, syncRowDraggable };
};
