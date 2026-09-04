import { readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import type { AssetAccept } from '@titane/core';
import type { ProjectAsset } from '../../app/types/asset';

const EXTENSIONS: Record<AssetAccept, readonly string[]> = {
  texture: ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.hdr'],
  model: ['.gltf', '.glb'],
  audio: ['.ogg', '.mp3', '.wav', '.m4a']
};

/**
 * Maps a file extension to an asset kind, or `undefined` when ignored.
 */
export const kindFromExtension = (ext: string): AssetAccept | undefined => {
  const lower = ext.toLowerCase();
  for (const kind of Object.keys(EXTENSIONS) as AssetAccept[]) {
    if (EXTENSIONS[kind].includes(lower)) return kind;
  }
  return undefined;
};

const walk = async (dir: string, root: string, out: ProjectAsset[]): Promise<void> => {
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
    const kind = kindFromExtension(extname(entry.name));
    if (!kind) continue;
    const name = relative(root, full).split('\\').join('/');
    out.push({ url: `/assets/${name}`, name, kind });
  }
};

/**
 * Recursively lists known textures, models and audio under `public/assets`.
 * Missing directories yield an empty list.
 */
export const listProjectAssets = async (assetsDir: string): Promise<ProjectAsset[]> => {
  const out: ProjectAsset[] = [];
  await walk(assetsDir, assetsDir, out);
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
};
