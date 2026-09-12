import type { Name } from '@titane/core';

/** Partial Name write from the Hierarchy row menu or inline rename. */
export type HierarchyNamePatch = {
  value?: string;
  icon?: string | null;
  color?: string | null;
};

/**
 * Applies a Hierarchy name/appearance patch in place.
 * `null` clears an optional field so older scenes stay `{ value }` shaped.
 */
export const applyHierarchyNamePatch = (data: Name, patch: HierarchyNamePatch): void => {
  if (patch.value !== undefined) data.value = patch.value;

  if (patch.icon === null) delete data.icon;
  else if (patch.icon !== undefined) data.icon = patch.icon;

  if (patch.color === null) delete data.color;
  else if (patch.color !== undefined) data.color = patch.color;
};

/**
 * Commits an inline rename. Empty or whitespace drafts keep `fallback`.
 */
export const nextHierarchyName = (draft: string, fallback: string): string => {
  const trimmed = draft.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};
