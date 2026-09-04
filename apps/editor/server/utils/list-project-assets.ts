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

const walkDirectory = async (
  directory: string,
  rootDirectory: string,
  listedAssets: ProjectAsset[]
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
      await walkDirectory(fullPath, rootDirectory, listedAssets);
      continue;
    }
    const kind = kindFromExtension(extname(entry.name));
    if (!kind) continue;
    const relativePath = relative(rootDirectory, fullPath).split('\\').join('/');
    listedAssets.push({ url: `/assets/${relativePath}`, name: relativePath, kind });
  }
};

/**
 * Recursively lists known textures, models and audio under `public/assets`.
 * Missing directories yield an empty list.
 */
export const listProjectAssets = async (assetsDirectory: string): Promise<ProjectAsset[]> => {
  const listedAssets: ProjectAsset[] = [];
  await walkDirectory(assetsDirectory, assetsDirectory, listedAssets);
  listedAssets.sort((left, right) => left.name.localeCompare(right.name));
  return listedAssets;
};
