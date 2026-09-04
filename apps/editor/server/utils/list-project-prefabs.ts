import { readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import type { ProjectPrefab } from '../../app/types/prefab';

const labelOf = (relativePath: string): string =>
  relativePath.replace(/\.titane$/i, '');

/**
 * Recursively lists `.titane` files under `public/prefabs`.
 * Missing directories yield an empty list.
 */
export const listProjectPrefabs = async (prefabsDirectory: string): Promise<ProjectPrefab[]> => {
  const listedPrefabs: ProjectPrefab[] = [];
  await walkDirectory(prefabsDirectory, prefabsDirectory, listedPrefabs);
  listedPrefabs.sort((left, right) => left.name.localeCompare(right.name));
  return listedPrefabs;
};

const walkDirectory = async (
  directory: string,
  rootDirectory: string,
  listedPrefabs: ProjectPrefab[]
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
      await walkDirectory(fullPath, rootDirectory, listedPrefabs);
      continue;
    }
    if (extname(entry.name).toLowerCase() !== '.titane') continue;
    const relativePath = relative(rootDirectory, fullPath).split('\\').join('/');
    listedPrefabs.push({ url: `/prefabs/${relativePath}`, name: labelOf(relativePath) });
  }
};
