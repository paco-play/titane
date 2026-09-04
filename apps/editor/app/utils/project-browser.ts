import { PROJECT_FOLDERS, type ProjectItem, type ProjectKind } from '../types/project';

/**
 * Keeps items in the selected folder whose label or path matches `query`.
 */
export const filterProjectItems = (
  items: readonly ProjectItem[],
  folder: ProjectKind,
  query: string
): ProjectItem[] => {
  const needle = query.trim().toLowerCase();
  return items.filter((item) => {
    if (item.kind !== folder) return false;
    if (needle === '') return true;
    return item.label.toLowerCase().includes(needle)
      || item.name.toLowerCase().includes(needle);
  });
};

/**
 * Label of the folder sidebar entry, used in the breadcrumb.
 */
export const folderLabel = (folder: ProjectKind): string =>
  PROJECT_FOLDERS.find((entry) => entry.id === folder)?.label ?? folder;
