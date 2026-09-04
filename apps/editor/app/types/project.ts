import type { AssetAccept } from '@titane/core';

/** Kind of file shown in the Project panel. */
export type ProjectKind = AssetAccept | 'scene' | 'prefab';

/**
 * One browseable project file: a scene, prefab, or `public/assets` entry.
 */
export interface ProjectItem {
  readonly kind: ProjectKind;
  readonly name: string;
  readonly url: string;
  readonly label: string;
}

/**
 * A sidebar folder in the Project panel.
 */
export interface ProjectFolder {
  readonly id: ProjectKind;
  readonly label: string;
  readonly icon: string;
}

/**
 * Folders that map to real files. Scripts and materials are not file assets.
 */
export const PROJECT_FOLDERS = [
  { id: 'scene', label: 'Scenes', icon: 'i-lucide-map' },
  { id: 'prefab', label: 'Prefabs', icon: 'i-lucide-layout-template' },
  { id: 'model', label: 'Models', icon: 'i-lucide-box' },
  { id: 'texture', label: 'Textures', icon: 'i-lucide-image' },
  { id: 'audio', label: 'Audio', icon: 'i-lucide-volume-2' }
] as const satisfies readonly ProjectFolder[];

/** Icon for a grid tile, keyed by kind. */
export const PROJECT_KIND_ICON: Record<ProjectKind, string> = {
  scene: 'i-lucide-map',
  prefab: 'i-lucide-layout-template',
  model: 'i-lucide-box',
  texture: 'i-lucide-image',
  audio: 'i-lucide-volume-2'
};

/** Where authors drop files for this folder. */
export const PROJECT_FOLDER_HINT: Record<ProjectKind, string> = {
  scene: 'scenes/',
  prefab: 'public/prefabs',
  model: 'public/assets',
  texture: 'public/assets',
  audio: 'public/assets'
};
