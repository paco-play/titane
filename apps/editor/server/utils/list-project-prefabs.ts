import { readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import type { ProjectPrefab } from '../../app/types/prefab';

const labelOf = (relativePath: string): string =>
  relativePath.replace(/\.titane$/i, '');

/**
 * Recursively lists `.titane` files under `public/prefabs`.
 * Missing directories yield an empty list.
 */
export const listProjectPrefabs = async (prefabsDir: string): Promise<ProjectPrefab[]> => {
  const out: ProjectPrefab[] = [];
  await walk(prefabsDir, prefabsDir, out);
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
};

const walk = async (dir: string, root: string, out: ProjectPrefab[]): Promise<void> => {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, root, out);
      continue;
    }
    if (extname(entry.name).toLowerCase() !== '.titane') continue;
    const rel = relative(root, full).split('\\').join('/');
    out.push({ url: `/prefabs/${rel}`, name: labelOf(rel) });
  }
};
