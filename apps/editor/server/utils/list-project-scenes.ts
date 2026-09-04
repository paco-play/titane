import { readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import type { ProjectItem } from '../../app/types/project';

const labelOf = (relativePath: string): string =>
  relativePath.replace(/\.titane$/i, '');

/**
 * Recursively lists `.titane` files under `scenes/`.
 * Missing directories yield an empty list.
 */
export const listProjectScenes = async (scenesDirectory: string): Promise<ProjectItem[]> => {
  const listedScenes: ProjectItem[] = [];
  await walkDirectory(scenesDirectory, scenesDirectory, listedScenes);
  listedScenes.sort((left, right) => left.label.localeCompare(right.label));
  return listedScenes;
};

const walkDirectory = async (
  directory: string,
  rootDirectory: string,
  listedScenes: ProjectItem[]
): Promise<void> => {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      await walkDirectory(fullPath, rootDirectory, listedScenes);
      continue;
    }
    if (extname(entry.name).toLowerCase() !== '.titane') continue;
    const relativePath = relative(rootDirectory, fullPath).split('\\').join('/');
    listedScenes.push({
      kind: 'scene',
      name: relativePath,
      url: `/scenes/${relativePath}`,
      label: labelOf(relativePath)
    });
  }
};
