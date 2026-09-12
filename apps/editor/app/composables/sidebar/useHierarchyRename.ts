import type { Entity } from '@titane/core';
import { nextHierarchyName } from '~/utils/hierarchy-name';

/**
 * Shared inline-rename state for Hierarchy rows (menu + double-click).
 */
export const useHierarchyRename = () => {
  const renamingId = useState<Entity | null>('titane-hierarchy-renaming-id', () => null);
  const draft = useState<string>('titane-hierarchy-rename-draft', () => '');
  const { nameOf, patchName } = useHierarchyName();

  const isRenaming = (entityId: Entity | undefined): boolean =>
    entityId !== undefined && renamingId.value === entityId;

  const beginRename = (entityId: Entity, currentLabel: string): void => {
    renamingId.value = entityId;
    draft.value = nameOf(entityId)?.value ?? currentLabel;
  };

  const cancelRename = (): void => {
    renamingId.value = null;
    draft.value = '';
  };

  const commitRename = (): void => {
    const entityId = renamingId.value;
    if (entityId === null) return;

    const fallback = nameOf(entityId)?.value ?? 'GameObject';
    const next = nextHierarchyName(draft.value, fallback);
    renamingId.value = null;
    draft.value = '';
    if (next !== fallback) patchName(entityId, { value: next });
  };

  return {
    renamingId,
    draft,
    isRenaming,
    beginRename,
    cancelRename,
    commitRename
  };
};
