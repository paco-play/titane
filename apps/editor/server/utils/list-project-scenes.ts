import { readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import type { ProjectItem } from '../../app/types/project';

const labelOf = (relativePath: string): string =>
  relativePath.replace(/\.titane$/i, '');

/**
 * Recursively lists `.titane` files under `scenes/`.
 * Missing directories yield an empty list.
 */
export const listProjectScenes = async (scenesDir: string): Promise<ProjectItem[]> => {
  const out: ProjectItem[] = [];
  await walk(scenesDir, scenesDir, out);
  out.sort((a, b) => a.label.localeCompare(b.label));
  return out;
};

const walk = async (dir: string, root: string, out: ProjectItem[]): Promise<void> => {
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
    out.push({
      kind: 'scene',
      name: rel,
      url: `/scenes/${rel}`,
      label: labelOf(rel)
    });
  }
};
